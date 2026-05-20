import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGuardian, createStudent, findStudentByAadhaar, getStudentById, updateStudent } from '../../api/studentApi';
import { MOCK_DISTRICTS, MOCK_GUARDIANS, MOCK_MANDALS, MOCK_RELATIONSHIPS, MOCK_SCHOOLS, MOCK_STATES, MOCK_VILLAGES } from '../../api/mockData';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { StudentView } from '../../types';

const init = { first_name: '', middle_name: '', last_name: '', email: '', dob: '', gender: '', aadhaar_number: '', caste: '', religion: '', blood_group: '', class_id: '', orphan_status: '', image_url: '', st_id: '1', dist_id: '', mndl_id: '', vil_id: '', sch_id: '', guardian_first: '', guardian_last: '', relation: '1', phone: '', occ: '', addr: '', has_sibling: 'No', sibling_aadhaar: '', sibling_relation: '' };

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(init);
  const [loading, setLoading] = useState(false);
  const [sibling, setSibling] = useState<StudentView | null>(null);
  const [siblingChecked, setSiblingChecked] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    getStudentById(Number(id)).then(s => {
      if (!s) return;
      const [first, ...rest] = s.full_name.split(' ');
      const guardian = MOCK_GUARDIANS.find(g => g.guardian_id === s.guardian_id);
      setForm({ ...init, first_name: first, last_name: rest.pop() ?? '', middle_name: rest.join(' '), email: s.email, dob: s.dob, gender: s.gender, aadhaar_number: s.aadhaar_number, caste: s.caste, religion: s.religion ?? '', blood_group: s.blood_group ?? '', class_id: s.class_id, orphan_status: s.orphan_status ?? '', image_url: s.image_url ?? '', st_id: String(s.st_id), dist_id: String(s.dist_id), mndl_id: String(s.mndl_id), vil_id: String(s.vil_id), sch_id: String(s.sch_id), guardian_first: guardian?.first_name ?? '', guardian_last: guardian?.last_name ?? '', relation: String(guardian?.relation ?? 1), phone: guardian?.phone_number ?? '', occ: guardian?.occ ?? '', addr: guardian?.addr ?? '', has_sibling: 'No', sibling_aadhaar: '', sibling_relation: '' });
    });
  }, [id]);

  const districts = useMemo(() => MOCK_DISTRICTS.filter(d => d.st_id === Number(form.st_id)), [form.st_id]);
  const mandals = useMemo(() => MOCK_MANDALS.filter(m => m.dist_id === Number(form.dist_id)), [form.dist_id]);
  const villages = useMemo(() => MOCK_VILLAGES.filter(v => v.mndl_id === Number(form.mndl_id)), [form.mndl_id]);
  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

  const chooseImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) set('image_url', URL.createObjectURL(file));
  };

  const searchSibling = async () => {
    setSiblingChecked(true);
    setSibling(null);
    if (form.sibling_aadhaar.length !== 12) {
      toast('Enter a valid 12 digit Aadhaar number.', 'error');
      return;
    }
    const found = await findStudentByAadhaar(form.sibling_aadhaar);
    setSibling(found ?? null);
    if (!found) toast('No matching student found.', 'error');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let guardianId = Number(MOCK_GUARDIANS.find(g => g.first_name === form.guardian_first && g.last_name === form.guardian_last)?.guardian_id ?? 0);
      if (!guardianId && !isEdit) {
        const g = await createGuardian({ first_name: form.guardian_first, middle_name: null, last_name: form.guardian_last, phone_number: form.phone, relation: Number(form.relation), occ: form.occ || null, addr: form.addr || null });
        guardianId = g.guardian_id;
      }
      const payload = { first_name: form.first_name, middle_name: form.middle_name || null, last_name: form.last_name, email: form.email, dob: form.dob, gender: form.gender as 'Male' | 'Female' | 'Other', aadhaar_number: form.aadhaar_number, caste: form.caste, religion: form.religion || null, blood_group: form.blood_group || null, sch_id: Number(form.sch_id), class_id: form.class_id, guardian_id: guardianId || 1, orphan_status: form.orphan_status || null, image_url: form.image_url || null };
      if (isEdit) await updateStudent(Number(id), { ...payload, modified_by: user?.username ?? 'admin' });
      else await createStudent({ ...payload, created_by: user?.username ?? 'admin' });
      toast(isEdit ? 'Student updated.' : 'Student registered.', 'success');
      nav('/students');
    } catch {
      toast('Unable to save student.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={submit}><PageHeader title={isEdit ? 'Edit Student' : 'Add Student'} subtitle="Student, sibling, school, and guardian information" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} /><div className="panel"><h3 className="panelTitle">Basic Student Details</h3><div className="formGrid"><Field label="First Name*" value={form.first_name} onChange={v => set('first_name', v)} /><Field label="Middle Name" value={form.middle_name} onChange={v => set('middle_name', v)} /><Field label="Last Name*" value={form.last_name} onChange={v => set('last_name', v)} /><Field label="Email ID*" type="email" value={form.email} onChange={v => set('email', v)} /><Field label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} /><Select label="Gender*" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other']} /><Field label="Aadhaar Number*" value={form.aadhaar_number} onChange={v => set('aadhaar_number', v)} maxLength={12} /><Select label="Blood Group" value={form.blood_group} onChange={v => set('blood_group', v)} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} /><Field label="Religion" value={form.religion} onChange={v => set('religion', v)} /><Field label="Caste*" value={form.caste} onChange={v => set('caste', v)} /><Select label="School*" value={form.sch_id} onChange={v => set('sch_id', v)} options={MOCK_SCHOOLS.map(s => [String(s.sch_id), s.sch_name])} /><Field label="Class*" value={form.class_id} onChange={v => set('class_id', v)} /><Select label="Orphan / Semi Orphan*" value={form.orphan_status} onChange={v => set('orphan_status', v)} options={['Orphan', 'Semi Orphan']} /><label className="field"><span>Student Photo</span><label className="uploadBox">{form.image_url ? <img src={form.image_url} alt="Student" /> : <span>Click to upload photo<br /><small>JPG, PNG</small></span>}<input accept="image/*" type="file" onChange={chooseImage} /></label></label></div><h3 className="sectionTitle">Sibling Information</h3><div className="formGrid"><label className="field"><span>Does the student have any sibling in this foundation?*</span><div className="radioRow"><label><input type="radio" checked={form.has_sibling === 'Yes'} onChange={() => set('has_sibling', 'Yes')} /> Yes</label><label><input type="radio" checked={form.has_sibling === 'No'} onChange={() => set('has_sibling', 'No')} /> No</label></div></label>{form.has_sibling === 'Yes' && <><div className="siblingSearch"><Field label="Search Existing Student by Aadhaar Number*" value={form.sibling_aadhaar} onChange={v => set('sibling_aadhaar', v)} maxLength={12} /><Button type="button" onClick={searchSibling}>Search</Button></div><Select label="Relationship with Student*" value={form.sibling_relation} onChange={v => set('sibling_relation', v)} options={['Brother', 'Sister']} />{sibling ? <div className="foundCard"><Avatar name={sibling.full_name} size="lg" /><div><strong>{sibling.full_name}</strong><Badge variant="success">Student ID: {sibling.student_id}</Badge><div className="sub">Class: {sibling.class_id}</div><div className="sub">School: {sibling.sch_name}</div></div></div> : siblingChecked && <div className="foundCard muted">No existing student selected.</div>}</>}</div><h3 className="sectionTitle">School & Location</h3><div className="formGrid"><Select label="State*" value={form.st_id} onChange={v => setForm(f => ({ ...f, st_id: v, dist_id: '', mndl_id: '', vil_id: '' }))} options={MOCK_STATES.map(s => [String(s.st_id), s.st_name])} /><Select label="District*" value={form.dist_id} onChange={v => setForm(f => ({ ...f, dist_id: v, mndl_id: '', vil_id: '' }))} options={districts.map(d => [String(d.dist_id), d.dist_name])} /><Select label="Mandal*" value={form.mndl_id} onChange={v => setForm(f => ({ ...f, mndl_id: v, vil_id: '' }))} options={mandals.map(m => [String(m.mndl_id), m.mndl_name])} /><Select label="Village*" value={form.vil_id} onChange={v => set('vil_id', v)} options={villages.map(v => [String(v.vil_id), v.vil_name])} /></div><h3 className="sectionTitle">Guardian Details</h3><div className="formGrid"><Field label="Guardian First Name*" value={form.guardian_first} onChange={v => set('guardian_first', v)} /><Field label="Guardian Last Name*" value={form.guardian_last} onChange={v => set('guardian_last', v)} /><Select label="Relation*" value={form.relation} onChange={v => set('relation', v)} options={MOCK_RELATIONSHIPS.map(r => [String(r.relationship_id), r.relationship_name])} /><Field label="Phone Number*" value={form.phone} onChange={v => set('phone', v)} /><Field label="Occupation" value={form.occ} onChange={v => set('occ', v)} /><label className="field"><span>Address</span><textarea className="textarea" value={form.addr} onChange={e => set('addr', e.target.value)} /></label></div><div className="modalFooter" style={{ paddingInline: 0 }}><Button type="button" variant="outline" onClick={() => nav('/students')}>Cancel</Button><Button loading={loading}>{isEdit ? 'Save Changes' : 'Register Student'}</Button></div></div></form>;
}

function Field({ label, value, onChange, type = 'text', maxLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number }) {
  return <label className="field"><span>{label}</span><input required={label.includes('*')} maxLength={maxLength} type={type} className="input" value={value} onChange={e => onChange(e.target.value)} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | [string, string])[] }) {
  return <label className="field"><span>{label}</span><select required={label.includes('*')} className="select" value={value} onChange={e => onChange(e.target.value)}><option value="">Select</option>{options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select></label>;
}
