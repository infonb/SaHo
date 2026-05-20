import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSponsors } from '../../api/sponsorApi';
import { assignSponsor, removeSponsorFromStudent } from '../../api/studentSponsorApi';
import { getStudents } from '../../api/studentApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { SponsorView, StudentView } from '../../types';

const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export default function AssignSponsorPage() {
  const [students, setStudents] = useState<StudentView[]>([]); const [sponsors, setSponsors] = useState<SponsorView[]>([]);
  const [student, setStudent] = useState<StudentView | null>(null); const [selected, setSelected] = useState<number | null>(null);
  const nav = useNavigate(); const { user } = useAuth(); const { toast } = useToast();
  const load = () => { getStudents().then(setStudents); getSponsors().then(setSponsors); };
  useEffect(load, []);
  const confirm = async () => { if (!student) return; if (selected === null) await removeSponsorFromStudent(student.student_id); else await assignSponsor(student.student_id, selected, user?.username ?? 'admin'); toast('Assignment updated.', 'success'); setStudent(null); load(); };
  return <div><PageHeader title="Assign Sponsor to Student" subtitle="Pair active sponsors with student records" actions={<Button variant="outline" onClick={() => nav('/sponsors')}>Back</Button>} /><div className="bottomGrid" style={{ gridTemplateColumns: '1fr 1fr' }}><DataTable columns={[{ key: 's', label: 'Student' }, { key: 'c', label: 'Current Sponsor' }, { key: 'a', label: 'Assign' }]} rows={students.map(s => [<div><strong>{s.full_name}</strong><div className="sub">{s.class_id} / {s.dist_name}</div></div>, <Badge variant={s.sponsor_id ? 'assigned' : 'unassigned'}>{s.sponsor_full_name ?? 'None'}</Badge>, <Button size="sm" variant="success" onClick={() => { setStudent(s); setSelected(s.sponsor_id); }}>Assign</Button>])} /><DataTable columns={[{ key: 's', label: 'Sponsor' }, { key: 't', label: 'Type' }, { key: 'c', label: 'Students' }]} rows={sponsors.map(s => [<div><strong>{s.full_name}</strong><div className="sub">{money(s.contrib_amt)}</div></div>, <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>, s.students_count])} /></div><Modal open={!!student} onClose={() => setStudent(null)} title={`Assign Sponsor - ${student?.full_name}`} width={620} footer={<><Button variant="outline" onClick={() => setStudent(null)}>Cancel</Button><Button onClick={confirm}>Confirm Assignment</Button></>}><button className="quickRow" style={{ width: '100%', background: selected === null ? 'var(--color-primary-light)' : 'var(--color-surface)' }} onClick={() => setSelected(null)}><span><strong>No Sponsor (Unassign)</strong><div className="sub">Remove existing assignment</div></span><span>{selected === null ? 'Yes' : ''}</span></button>{sponsors.map(s => <button key={s.sponsor_id} className="quickRow" style={{ width: '100%', background: selected === s.sponsor_id ? 'var(--color-primary-light)' : 'var(--color-surface)' }} onClick={() => setSelected(s.sponsor_id)}><span><strong>{s.full_name}</strong><div className="sub">{s.type} / {money(s.contrib_amt)}</div></span><span>{selected === s.sponsor_id ? 'Yes' : ''}</span></button>)}</Modal></div>;
}
