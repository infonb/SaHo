import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGuardian, createStudent, findStudentByAadhaar, getStudentById, updateStudent } from '../../api/studentApi';
import { MOCK_DISTRICTS, MOCK_GUARDIANS, MOCK_MANDALS, MOCK_RELATIONSHIPS, MOCK_SCHOOLS, MOCK_STATES, MOCK_VILLAGES } from '../../api/mockData';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { StudentView } from '../../types';
import StudentProfileSections, { type StudentFormState } from './StudentProfileSections';

const init: StudentFormState = { first_name: '', middle_name: '', last_name: '', father_name: '', mother_name: '', guardian_source: 'manual', email: '', dob: '', gender: '', aadhaar_number: '', caste: '', religion: '', blood_group: '', class_id: '', orphan_status: '', image_url: '', st_id: '1', dist_id: '', mndl_id: '', vil_id: '', sch_id: '', guardian_first: '', guardian_middle: '', guardian_last: '', relation: '1', phone: '', occ: '', addr: '', has_sibling: 'No', sibling_aadhaar: '' };

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState<StudentFormState>(init);
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
      setForm({
        ...init,
        first_name: first,
        last_name: rest.pop() ?? '',
        middle_name: rest.join(' '),
        father_name: '',
        mother_name: '',
        guardian_source: 'manual',
        email: s.email,
        dob: s.dob,
        gender: s.gender,
        aadhaar_number: s.aadhaar_number,
        caste: s.caste,
        religion: s.religion ?? '',
        blood_group: s.blood_group ?? '',
        class_id: s.class_id,
        orphan_status: s.orphan_status ?? '',
        image_url: s.image_url ?? '',
        st_id: String(s.st_id),
        dist_id: String(s.dist_id),
        mndl_id: String(s.mndl_id),
        vil_id: String(s.vil_id),
        sch_id: String(s.sch_id),
        guardian_first: guardian?.first_name ?? '',
        guardian_middle: guardian?.middle_name ?? '',
        guardian_last: guardian?.last_name ?? '',
        relation: String(guardian?.relation ?? 1),
        phone: guardian?.phone_number ?? '',
        occ: guardian?.occ ?? '',
        addr: guardian?.addr ?? '',
      });
    });
  }, [id]);

  const districts = useMemo(() => MOCK_DISTRICTS.filter(d => d.st_id === Number(form.st_id)), [form.st_id]);
  const mandals = useMemo(() => MOCK_MANDALS.filter(m => m.dist_id === Number(form.dist_id)), [form.dist_id]);
  const villages = useMemo(() => MOCK_VILLAGES.filter(v => v.mndl_id === Number(form.mndl_id)), [form.mndl_id]);
  const set = (key: keyof StudentFormState, value: string) => {
    setForm(f => {
      if (key === 'st_id') return { ...f, st_id: value, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' };
      if (key === 'dist_id') return { ...f, dist_id: value, mndl_id: '', vil_id: '', sch_id: '' };
      if (key === 'mndl_id') return { ...f, mndl_id: value, vil_id: '', sch_id: '' };
      if (key === 'vil_id') return { ...f, vil_id: value, sch_id: '' };
      return { ...f, [key]: value };
    });
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

  const splitName = (name: string) => {
    const [first = '', ...rest] = name.trim().split(/\s+/).filter(Boolean);
    const last = rest.length > 0 ? rest.pop() ?? '' : '';
    return { first, middle: rest.join(' '), last };
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedParent = form.guardian_source === 'father' ? splitName(form.father_name) : form.guardian_source === 'mother' ? splitName(form.mother_name) : null;
      if (selectedParent && !selectedParent.first) {
        toast(`Enter ${form.guardian_source === 'father' ? 'Father' : 'Mother'} Name before marking as guardian.`, 'error');
        return;
      }
      const selectedRelation = form.guardian_source === 'father'
        ? MOCK_RELATIONSHIPS.find(r => r.relationship_name.toLowerCase() === 'father')?.relationship_id
        : form.guardian_source === 'mother'
          ? MOCK_RELATIONSHIPS.find(r => r.relationship_name.toLowerCase() === 'mother')?.relationship_id
          : undefined;
      const guardianPayload = {
        first_name: selectedParent?.first || form.guardian_first,
        middle_name: selectedParent ? selectedParent.middle || null : form.guardian_middle || null,
        last_name: selectedParent?.last || form.guardian_last,
        phone_number: form.phone,
        relation: selectedRelation ?? Number(form.relation),
        occ: form.occ || null,
        addr: form.addr || null
      };
      let guardianId = Number(MOCK_GUARDIANS.find(g => g.first_name === guardianPayload.first_name && (g.middle_name ?? '') === (guardianPayload.middle_name ?? '') && g.last_name === guardianPayload.last_name)?.guardian_id ?? 0);
      if (!guardianId && !isEdit) {
        const g = await createGuardian(guardianPayload);
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
//----------------MY OLD CODE------------------
  // return (
  //   <form onSubmit={submit}>
  //     <PageHeader title={isEdit ? 'Edit Student' : 'Add Student'} subtitle="Student, sibling, school, and guardian information" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} />
  //     <div className="panel">
  //       <StudentProfileSections
  //         mode={isEdit ? 'edit' : 'create'}
  //         form={form}
  //         set={set}
  //         sibling={sibling}
  //         siblingChecked={siblingChecked}
  //         searchSibling={searchSibling}
  //         schools={MOCK_SCHOOLS.map(s => [String(s.sch_id), s.sch_name])}
  //         states={MOCK_STATES.map(s => [String(s.st_id), s.st_name])}
  //         districts={districts.map(d => [String(d.dist_id), d.dist_name])}
  //         mandals={mandals.map(m => [String(m.mndl_id), m.mndl_name])}
  //         villages={villages.map(v => [String(v.vil_id), v.vil_name])}
  //         relationships={MOCK_RELATIONSHIPS.map(r => [String(r.relationship_id), r.relationship_name])}
  //       />
  //       <div className="modalFooter" style={{ paddingInline: 0 }}>
  //         <Button type="button" variant="outline" onClick={() => nav('/students')}>Cancel</Button>
  //         <Button loading={loading}>{isEdit ? 'Save Changes' : 'Register Student'}</Button>
  //       </div>
  //     </div>
  //   </form>
  // );

  return (
  <form onSubmit={submit} className="formPageShell">
    <PageHeader
      title={isEdit ? 'Edit Student' : 'Add Student'}
      subtitle="Student, sibling, school, and guardian information"
      actions={
        <Button type="button" variant="outline" onClick={() => nav(-1)}>
          Back
        </Button>
      }
    />
    <div className="panel">
      <StudentProfileSections
        mode={isEdit ? 'edit' : 'create'}
        form={form}
        set={set}
        sibling={sibling}
        siblingChecked={siblingChecked}
        searchSibling={searchSibling}
        schools={MOCK_SCHOOLS.map(s => [String(s.sch_id), s.sch_name])}
        states={MOCK_STATES.map(s => [String(s.st_id), s.st_name])}
        districts={districts.map(d => [String(d.dist_id), d.dist_name])}
        mandals={mandals.map(m => [String(m.mndl_id), m.mndl_name])}
        villages={villages.map(v => [String(v.vil_id), v.vil_name])}
        relationships={MOCK_RELATIONSHIPS.map(r => [String(r.relationship_id), r.relationship_name])}
      />
      <div className="formPageFooter">
        <Button type="button" variant="outline" onClick={() => nav('/students')}>
          Cancel
        </Button>
        <Button loading={loading} className="register-btn">
          {isEdit ? 'Save Changes' : 'Register Student'}
        </Button>
      </div>
    </div>
  </form>
);
}
