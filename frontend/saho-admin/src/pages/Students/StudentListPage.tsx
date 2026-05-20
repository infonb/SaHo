import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateStudents, getStudents } from '../../api/studentApi';
import { MOCK_DISTRICTS, MOCK_MANDALS, MOCK_SCHOOLS, MOCK_STATES, MOCK_VILLAGES } from '../../api/mockData';
import { getSponsorById } from '../../api/sponsorApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import type { StudentFilters, StudentView, SponsorView } from '../../types';
import StudentDetailModal from './StudentDetailModal';
import Modal from '../../components/common/Modal';

const defaults: StudentFilters = { search: '', gender: '', class_id: '', dist_id: '', st_id: '', mndl_id: '', vil_id: '', sch_id: '', orphan_status: '', sponsor_status: '', is_active: '' };

export default function StudentListPage() {
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [selected, setSelected] = useState<StudentView | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorDetails, setSponsorDetails] = useState<SponsorView | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const pager = usePagination(students, 5);
  const load = () => { setLoading(true); getStudents(applied).then(data => { setStudents(data); setChecked([]); }).finally(() => setLoading(false)); };
  useEffect(load, [applied]);

  const allClasses = [...new Set(students.map(s => s.class_id))];
  const districts = useMemo(() => MOCK_DISTRICTS.filter(d => !pending.st_id || d.st_id === Number(pending.st_id)), [pending.st_id]);
  const mandals = useMemo(() => MOCK_MANDALS.filter(m => !pending.dist_id || m.dist_id === Number(pending.dist_id)), [pending.dist_id]);
  const villages = useMemo(() => MOCK_VILLAGES.filter(v => !pending.mndl_id || v.mndl_id === Number(pending.mndl_id)), [pending.mndl_id]);
  const schools = useMemo(() => MOCK_SCHOOLS.filter(s => !pending.vil_id || s.vil_id === Number(pending.vil_id)), [pending.vil_id]);
  const filteredStates = MOCK_STATES;
  const pageIds = pager.current.map(s => s.student_id);
  const allPageChecked = pageIds.length > 0 && pageIds.every(id => checked.includes(id));
  const toggle = (id: number) => setChecked(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const togglePage = () => setChecked(ids => allPageChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]);
  const confirmBulkDelete = async () => { await deactivateStudents(checked, user?.username ?? 'admin'); setBulkOpen(false); toast(`${checked.length} students removed.`, 'success'); load(); };

  const confirmSingleDelete = async () => {
    if (!singleDelete) return;
    await deactivateStudents([singleDelete], user?.username ?? 'admin');
    setSingleDelete(null);
    toast(`Student removed.`, 'success');
    load();
  };

  const totalStudents = students.length;
  const totalBoys = students.filter(s => s.gender === 'Male').length;
  const totalGirls = students.filter(s => s.gender === 'Female').length;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const openSponsor = async (id: number) => {
    const sp = await getSponsorById(id);
    if (sp) setSponsorDetails(sp);
    setSponsorOpen(true);
  };

  const rows = pager.current.map(s => {
    const dob = new Date(s.dob);
    const age = new Date().getFullYear() - dob.getFullYear();
    return [
      <input aria-label={`Select ${s.full_name}`} type="checkbox" checked={checked.includes(s.student_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(s.student_id)} />,
      <div className="rowFlex"><Avatar name={s.full_name} size="md" /><div><div className="strong studentNameCell" onClick={() => setSelected(s)}>{s.full_name}</div><div className="sub">{s.gender}</div></div></div>,
      <div>{age}</div>,
      <div><div className="strong">{s.guardian_full_name}</div><div className="sub">{s.guardian_relation_name} - {s.guardian_occ || 'N/A'}</div></div>,
      <div><div className="strong">{s.vil_name}</div><div className="sub">{s.dist_name}</div></div>,
      <div>{s.class_id}</div>,
      <div>
        {s.sponsor_id ? (
          <button className="photoButton" onClick={(e) => { e.stopPropagation(); openSponsor(s.sponsor_id!); }} title={s.sponsor_full_name}>
            <Avatar name={s.sponsor_full_name ?? 'SP'} size="sm" />
          </button>
        ) : (
          <div className="rowFlex" style={{ gap: '10px' }}>
            <Avatar name="SaHo Foundation" size="sm" />
            <span className="sub" style={{ color: 'var(--color-text)', fontWeight: 700 }}>SaHo Foundation</span>
          </div>
        )}
      </div>,
      <div className="actions" onClick={e => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="iconBtn" onClick={() => nav(`/students/edit/${s.student_id}`)} aria-label="Edit student">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        <Button size="sm" variant="danger" className="iconBtn" style={{marginLeft: 8}} onClick={(e) => { e.stopPropagation(); setSingleDelete(s.student_id); }} aria-label={`Delete ${s.full_name}`}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 6h18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    ];
  });

  return <div>
    <PageHeader title="Students" subtitle={`All enrolled single-parent students — ${students.length} total`} actions={<><Button variant="outline">Export CSV</Button><Button onClick={() => nav('/students/add')}>Add Student</Button></>} />
    <div className="statGrid" style={{ marginBottom: '30px' }}>
      <StatCard label="TOTAL STUDENTS" value={totalStudents} note="All enrolled" />
      <StatCard label="TOTAL BOYS" value={totalBoys} note="Percentage of total" />
      <StatCard label="TOTAL GIRLS" value={totalGirls} note="Percentage of total" />
    </div>
    <div className="panel" style={{ marginBottom: '20px' }}>
      <FilterBar onGo={() => { setApplied({ ...pending }); pager.setPage(1); }} onClear={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); }}>
        <div className="filterGroup filterGroupWide">
          <input className="filterSearch" placeholder="Search students" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} />
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.st_id} onChange={e => setPending({ ...pending, st_id: e.target.value, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' })}>
            <option value="">All States</option>
            {filteredStates.map(s => <option value={s.st_id} key={s.st_id}>{s.st_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.dist_id} onChange={e => setPending({ ...pending, dist_id: e.target.value, mndl_id: '', vil_id: '', sch_id: '' })}>
            <option value="">All Districts</option>
            {districts.map(d => <option value={d.dist_id} key={d.dist_id}>{d.dist_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.mndl_id} onChange={e => setPending({ ...pending, mndl_id: e.target.value, vil_id: '', sch_id: '' })}>
            <option value="">All Mandals</option>
            {mandals.map(m => <option value={m.mndl_id} key={m.mndl_id}>{m.mndl_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.vil_id} onChange={e => setPending({ ...pending, vil_id: e.target.value, sch_id: '' })}>
            <option value="">All Villages</option>
            {villages.map(v => <option value={v.vil_id} key={v.vil_id}>{v.vil_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.sch_id} onChange={e => setPending({ ...pending, sch_id: e.target.value })}>
            <option value="">All Schools</option>
            {schools.map(s => <option value={s.sch_id} key={s.sch_id}>{s.sch_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.gender} onChange={e => setPending({ ...pending, gender: e.target.value })}>
            <option value="">All Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.orphan_status} onChange={e => setPending({ ...pending, orphan_status: e.target.value })}>
            <option value="">Orphan / Semi Orphan</option>
            <option>Orphan</option>
            <option>Semi Orphan</option>
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.class_id} onChange={e => setPending({ ...pending, class_id: e.target.value })}>
            <option value="">All Classes</option>
            {allClasses.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </FilterBar>
    </div>
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
        <h3 className="panelTitle">Student Records <span style={{ fontSize: '13px', color: 'var(--color-text3)', fontWeight: 500, marginLeft: '10px' }}>{students.length} results</span></h3>
      </div>

      <div className="selectHeaderRow" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="checkbox" checked={allPageChecked} onChange={togglePage} /> <span style={{ fontWeight: 800, color: 'var(--color-text2)' }}>Select all on this page</span></label>
          <div className="selectedCount" style={{ marginLeft: 8, color: 'var(--color-text3)', fontWeight: 800 }}>Selected {checked.length} of {students.length}</div>
        </div>
        <div>
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)} disabled={checked.length === 0} style={{ borderColor: checked.length ? 'var(--green-border)' : 'var(--color-border)', color: checked.length ? 'var(--green)' : 'var(--color-text3)' }}>Delete selected</Button>
        </div>
      </div>

      <DataTable loading={loading} columns={[{ key: 'select', label: '', width: '44px' }, { key: 'student', label: 'STUDENT' }, { key: 'age', label: 'AGE' }, { key: 'guardian', label: 'GUARDIAN' }, { key: 'location', label: 'LOCATION' }, { key: 'grade', label: 'GRADE' }, { key: 'sponsor', label: 'SPONSOR' }, { key: 'actions', label: 'ACTIONS' }]} rows={rows} />
      <Pagination total={students.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} />
    </div>
    <StudentDetailModal student={selected} onClose={() => setSelected(null)} />
    <Modal open={sponsorOpen} onClose={() => setSponsorOpen(false)} title={sponsorDetails?.full_name ?? 'Sponsor'} width={560} footer={<><Button variant="outline" onClick={() => setSponsorOpen(false)}>Close</Button></>}>
      {sponsorDetails ? <div>
        <h3 style={{ marginTop: 0 }}>{sponsorDetails.full_name}</h3>
        <div className="sub">{sponsorDetails.type} • {sponsorDetails.nationality}</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800 }}>{sponsorDetails.email}</div>
          <div className="sub">{sponsorDetails.ph_no}</div>
          <div className="sub" style={{ marginTop: 8 }}>{sponsorDetails.loc}</div>
          <div style={{ marginTop: 12 }}><strong>Contribution:</strong> <div className="sub" style={{ marginTop: 6 }}>{sponsorDetails.contrib_amt}</div></div>
          <div style={{ marginTop: 12 }}><strong>Students Sponsored:</strong> <span className="strong">{sponsorDetails.students_count}</span></div>
        </div>
      </div> : <div>No sponsor information available</div>}
    </Modal>
    <ConfirmModal open={singleDelete !== null} onClose={() => setSingleDelete(null)} onConfirm={confirmSingleDelete} title="Delete Student" message={`Delete selected student?`} />
    <ConfirmModal open={bulkOpen} onClose={() => setBulkOpen(false)} onConfirm={confirmBulkDelete} title="Delete Selected Students" message={`Delete ${checked.length} selected students?`} />
  </div>;
}
