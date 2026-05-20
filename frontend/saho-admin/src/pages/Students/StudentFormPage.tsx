import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGuardian, createStudent, getStudentById, updateStudent } from '../../api/studentApi';
import { MOCK_DISTRICTS, MOCK_GUARDIANS, MOCK_MANDALS, MOCK_RELATIONSHIPS, MOCK_SCHOOLS, MOCK_STATES, MOCK_VILLAGES } from '../../api/mockData';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const init = { first_name: '', middle_name: '', last_name: '', dob: '', gender: 'Female', aadhaar_number: '', caste: '', religion: '', blood_group: '', class_id: '', orphan_status: '', st_id: '1', dist_id: '', mndl_id: '', vil_id: '', sch_id: '', guardian_first: '', guardian_last: '', relation: '1', phone: '', occ: '', addr: '' };

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(init);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  useEffect(() => { if (id) getStudentById(Number(id)).then(s => { if (!s) return; const [first, ...rest] = s.full_name.split(' '); const guardian = MOCK_GUARDIANS.find(g => g.guardian_id === s.guardian_id); setForm({ ...init, first_name: first, last_name: rest.pop() ?? '', middle_name: rest.join(' '), dob: s.dob, gender: s.gender, aadhaar_number: s.aadhaar_number, caste: s.caste, religion: s.religion ?? '', blood_group: s.blood_group ?? '', class_id: s.class_id, orphan_status: s.orphan_status ?? '', st_id: String(s.st_id), dist_id: String(s.dist_id), mndl_id: String(s.mndl_id), vil_id: String(s.vil_id), sch_id: String(s.sch_id), guardian_first: guardian?.first_name ?? '', guardian_last: guardian?.last_name ?? '', relation: String(guardian?.relation ?? 1), phone: guardian?.phone_number ?? '', occ: guardian?.occ ?? '', addr: guardian?.addr ?? '' }); }); }, [id]);
  const districts = useMemo(() => MOCK_DISTRICTS.filter(d => d.st_id === Number(form.st_id)), [form.st_id]);
  const mandals = useMemo(() => MOCK_MANDALS.filter(m => m.dist_id === Number(form.dist_id)), [form.dist_id]);
  const villages = useMemo(() => MOCK_VILLAGES.filter(v => v.mndl_id === Number(form.mndl_id)), [form.mndl_id]);
  const schools = useMemo(() => MOCK_SCHOOLS.filter(s => s.vil_id === Number(form.vil_id)), [form.vil_id]);
  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      let guardianId = Number(MOCK_GUARDIANS.find(g => g.first_name === form.guardian_first && g.last_name === form.guardian_last)?.guardian_id ?? 0);
      if (!guardianId && !isEdit) {
        const g = await createGuardian({ first_name: form.guardian_first, middle_name: null, last_name: form.guardian_last, phone_number: form.phone, relation: Number(form.relation), occ: form.occ || null, addr: form.addr || null });
        guardianId = g.guardian_id;
      }
      const payload = { first_name: form.first_name, middle_name: form.middle_name || null, last_name: form.last_name, dob: form.dob, gender: form.gender as 'Male' | 'Female' | 'Other', aadhaar_number: form.aadhaar_number, caste: form.caste, religion: form.religion || null, blood_group: form.blood_group || null, sch_id: Number(form.sch_id), class_id: form.class_id, guardian_id: guardianId || 1, orphan_status: form.orphan_status || null };
      if (isEdit) await updateStudent(Number(id), { ...payload, modified_by: user?.username ?? 'admin' });
      else await createStudent({ ...payload, created_by: user?.username ?? 'admin' });
      toast(isEdit ? 'Student updated.' : 'Student registered.', 'success'); nav('/students');
    } catch { toast('Unable to save student.', 'error'); } finally { setLoading(false); }
  };
  return <form onSubmit={submit}><PageHeader title={isEdit ? 'Edit Student' : 'Add Student'} subtitle="Student, school, and guardian information" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} /><div className="panel"><h3 className="panelTitle">Student Information</h3><div className="formGrid"><Field label="First Name*" value={form.first_name} onChange={v => set('first_name', v)} /><Field label="Last Name*" value={form.last_name} onChange={v => set('last_name', v)} /><Field label="Middle Name" value={form.middle_name} onChange={v => set('middle_name', v)} /><Field label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} /><Select label="Gender*" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other']} /><Field label="Class / Grade*" value={form.class_id} onChange={v => set('class_id', v)} /><Field label="Aadhaar Number*" value={form.aadhaar_number} onChange={v => set('aadhaar_number', v)} /><Select label="Blood Group" value={form.blood_group} onChange={v => set('blood_group', v)} options={['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} /><Field label="Caste*" value={form.caste} onChange={v => set('caste', v)} /><Field label="Religion" value={form.religion} onChange={v => set('religion', v)} /><Field label="Orphan Status" value={form.orphan_status} onChange={v => set('orphan_status', v)} /></div><h3 className="sectionTitle">School & Location</h3><div className="formGrid"><Select label="State*" value={form.st_id} onChange={v => setForm(f => ({ ...f, st_id: v, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' }))} options={MOCK_STATES.map(s => [String(s.st_id), s.st_name])} /><Select label="District*" value={form.dist_id} onChange={v => setForm(f => ({ ...f, dist_id: v, mndl_id: '', vil_id: '', sch_id: '' }))} options={districts.map(d => [String(d.dist_id), d.dist_name])} /><Select label="Mandal*" value={form.mndl_id} onChange={v => setForm(f => ({ ...f, mndl_id: v, vil_id: '', sch_id: '' }))} options={mandals.map(m => [String(m.mndl_id), m.mndl_name])} /><Select label="Village*" value={form.vil_id} onChange={v => setForm(f => ({ ...f, vil_id: v, sch_id: '' }))} options={villages.map(v => [String(v.vil_id), v.vil_name])} /><Select label="School*" value={form.sch_id} onChange={v => set('sch_id', v)} options={schools.map(s => [String(s.sch_id), s.sch_name])} /></div><h3 className="sectionTitle">Guardian Details</h3><div className="formGrid"><Field label="Guardian First Name*" value={form.guardian_first} onChange={v => set('guardian_first', v)} /><Field label="Guardian Last Name*" value={form.guardian_last} onChange={v => set('guardian_last', v)} /><Select label="Relation*" value={form.relation} onChange={v => set('relation', v)} options={MOCK_RELATIONSHIPS.map(r => [String(r.relationship_id), r.relationship_name])} /><Field label="Phone Number*" value={form.phone} onChange={v => set('phone', v)} /><Field label="Occupation" value={form.occ} onChange={v => set('occ', v)} /><label className="field"><span>Address</span><textarea className="textarea" value={form.addr} onChange={e => set('addr', e.target.value)} /></label></div><div className="modalFooter" style={{ paddingInline: 0 }}><Button type="button" variant="outline" onClick={() => nav('/students')}>Cancel</Button><Button loading={loading}>{isEdit ? 'Save Changes' : 'Register Student'}</Button></div></div></form>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) { return <label className="field"><span>{label}</span><input required={label.includes('*')} type={type} className="input" value={value} onChange={e => onChange(e.target.value)} /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | [string, string])[] }) { return <label className="field"><span>{label}</span><select required={label.includes('*')} className="select" value={value} onChange={e => onChange(e.target.value)}><option value="">Select</option>{options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o || 'None'}</option>)}</select></label>; }
