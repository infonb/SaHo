import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateStudent, getStudents } from '../../api/studentApi';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import type { StudentFilters, StudentView } from '../../types';
import StudentDetailModal from './StudentDetailModal';

const defaults: StudentFilters = { search: '', gender: '', class_id: '', dist_id: '', st_id: '', sponsor_status: '', is_active: '' };
export default function StudentListPage() {
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [selected, setSelected] = useState<StudentView | null>(null);
  const [remove, setRemove] = useState<StudentView | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const pager = usePagination(students, 5);
  const load = () => { setLoading(true); getStudents(applied).then(setStudents).finally(() => setLoading(false)); };
  useEffect(load, [applied]);
  const allClasses = [...new Set(students.map(s => s.class_id))];
  const allDistricts = [...new Map(students.map(s => [s.dist_id, s.dist_name])).entries()];
  const stop = (e: MouseEvent) => e.stopPropagation();
  const confirmDelete = async () => { if (!remove) return; await deactivateStudent(remove.student_id, user?.username ?? 'admin'); setRemove(null); toast('Student removed.', 'success'); load(); };
  const rows = pager.current.map(s => [<div className="rowFlex"><Avatar name={s.full_name} /><div><div className="strong">{s.full_name}</div><div className="sub">{s.gender} / {s.dob}</div></div></div>, <div><div className="strong">{s.guardian_full_name}</div><div className="sub">{s.guardian_relation_name} / {s.guardian_occ}</div></div>, <div><div className="strong">{s.sch_name}</div><div className="sub">{s.dist_name} / {s.st_name}</div></div>, <Badge variant="assigned">{s.class_id}</Badge>, <Badge variant={s.is_active ? 'active' : 'inactive'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>, <Badge variant={s.sponsor_id ? 'assigned' : 'unassigned'}>{s.sponsor_full_name ?? 'None'}</Badge>, <div className="actions" onClick={stop}><Button size="sm" variant="outline" onClick={() => nav(`/students/edit/${s.student_id}`)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setRemove(s)}>Delete</Button></div>]);
  return <div><PageHeader title="Students" subtitle={`All enrolled single-parent students - ${students.length} total`} actions={<><Button variant="outline">Export CSV</Button><Button onClick={() => nav('/students/add')}>Add Student</Button></>} /><div className="statGrid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 14 }}><StatCard label="Total" value={students.length} /><StatCard label="Active" value={students.filter(s => s.is_active).length} accentColor="var(--green)" /><StatCard label="Sponsored" value={students.filter(s => s.sponsor_id).length} accentColor="var(--blue)" /><StatCard label="Pending" value={0} accentColor="var(--amber)" /></div><FilterBar onGo={() => { setApplied({ ...pending }); pager.setPage(1); }} onClear={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); }}><input className="input" placeholder="Search" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} /><select className="select" value={pending.gender} onChange={e => setPending({ ...pending, gender: e.target.value })}><option value="">All Gender</option><option>Male</option><option>Female</option><option>Other</option></select><select className="select" value={pending.class_id} onChange={e => setPending({ ...pending, class_id: e.target.value })}><option value="">All Classes</option>{allClasses.map(c => <option key={c}>{c}</option>)}</select><select className="select" value={pending.dist_id} onChange={e => setPending({ ...pending, dist_id: e.target.value })}><option value="">All Districts</option>{allDistricts.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select><select className="select" value={pending.sponsor_status} onChange={e => setPending({ ...pending, sponsor_status: e.target.value as StudentFilters['sponsor_status'] })}><option value="">All Sponsor</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option></select></FilterBar><DataTable loading={loading} columns={[{ key: 'student', label: 'Student' }, { key: 'guardian', label: 'Guardian' }, { key: 'school', label: 'School' }, { key: 'class', label: 'Class' }, { key: 'status', label: 'Status' }, { key: 'sponsor', label: 'Sponsor' }, { key: 'actions', label: 'Actions' }]} rows={rows} onRowClick={(i) => setSelected(pager.current[i])} /><Pagination total={students.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} /><StudentDetailModal student={selected} onClose={() => setSelected(null)} /><ConfirmModal open={!!remove} onClose={() => setRemove(null)} onConfirm={confirmDelete} title="Remove Student" message={`Deactivate ${remove?.full_name}?`} /></div>;
}
