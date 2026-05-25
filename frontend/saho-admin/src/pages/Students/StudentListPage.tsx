import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateStudents, getStudents, getStudentById } from '../../api/studentApi';
import { getStates, getDistricts, getMandals, getVillages, getSchools } from '../../api/locationApi';
import { getSponsorById } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { StudentFilters, StudentView, SponsorView } from '../../types';
import StudentDetailModal from './StudentDetailModal';
import Modal from '../../components/common/Modal';

const defaults: StudentFilters = { search: '', gender: '', class_id: '', dist_id: '', st_id: '', mndl_id: '', vil_id: '', sch_id: '', orphan_status: '', sponsor_status: '', is_active: '' };

export default function StudentListPage() {
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selected, setSelected] = useState<StudentView | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorDetails, setSponsorDetails] = useState<SponsorView | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents({ pageNumber: nextPage, pageSize: nextPageSize, filters: applied });
      setStudents(data.students);
      setTotal(data.total);
      setChecked([]);
    } catch {
      setStudents([]);
      setTotal(0);
      setChecked([]);
      setError('Unable to load students from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, pageSize);
  }, [page, pageSize, applied]);

  useEffect(() => {
    let mounted = true;
    getStates().then(data => { if (mounted) setStates(data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!pending.st_id) {
      setDistricts([]);
      return;
    }
    const id = Number(pending.st_id);
    getDistricts(id).then(d => setDistricts(d)).catch(() => setDistricts([]));
  }, [pending.st_id]);

  useEffect(() => {
    if (!pending.dist_id) {
      setMandals([]);
      return;
    }
    const id = Number(pending.dist_id);
    getMandals(id).then(m => setMandals(m)).catch(() => setMandals([]));
  }, [pending.dist_id]);

  useEffect(() => {
    if (!pending.mndl_id) {
      setVillages([]);
      return;
    }
    const id = Number(pending.mndl_id);
    getVillages(id).then(v => setVillages(v)).catch(() => setVillages([]));
  }, [pending.mndl_id]);

  useEffect(() => {
    if (!pending.vil_id) {
      setSchools([]);
      return;
    }
    const id = Number(pending.vil_id);
    getSchools(id).then(s => setSchools(s)).catch(() => setSchools([]));
  }, [pending.vil_id]);

  const allClasses = [...new Set(students.map(s => s.class_id))];
  const filteredStates = states;
  const pageIds = students.map(s => s.student_id);
  const allPageChecked = pageIds.length > 0 && pageIds.every(id => checked.includes(id));
  const toggle = (id: number) => setChecked(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const togglePage = () => setChecked(ids => allPageChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]);

  const confirmBulkDelete = async () => {
    await deactivateStudents(checked, user?.username ?? 'admin');
    setBulkOpen(false);
    toast(`${checked.length} students removed.`, 'success');
    load(page, pageSize);
  };

  const confirmSingleDelete = async () => {
    if (!singleDelete) return;
    await deactivateStudents([singleDelete], user?.username ?? 'admin');
    setSingleDelete(null);
    toast('Student removed.', 'success');
    load(page, pageSize);
  };

  const totalStudents = total;
  const totalBoys = students.filter(s => s.gender === 'Male').length;
  const totalGirls = students.filter(s => s.gender === 'Female').length;

  const openSponsor = async (id: number) => {
    const sp = await getSponsorById(id);
    if (sp) setSponsorDetails(sp);
    setSponsorOpen(true);
  };

  const rows = students.map(s => {
    const dob = new Date(s.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hasBirthdayPassed = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasBirthdayPassed) age -= 1;
    return [
      <input aria-label={`Select ${s.full_name}`} type="checkbox" checked={checked.includes(s.student_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(s.student_id)} />,
      <div className="rowFlex"><Avatar name={s.full_name} size="md" /><div><div className="strong studentNameCell" onClick={async () => { setLoading(true); try { const full = await getStudentById(s.student_id); setSelected(full ?? s); } finally { setLoading(false); } }}>{s.full_name}</div><div className="sub">{s.gender}</div></div></div>,
      <div>{age}</div>,
      <div>{s.class_id}</div>,
      <div>{s.sch_name || 'N/A'}</div>,
      <div>{s.guardian_full_name || 'N/A'}</div>,
      <div>
        {s.sponsor_id ? (
          <button className="photoButton" onClick={(e) => { e.stopPropagation(); openSponsor(s.sponsor_id!); }} title={s.sponsor_full_name ?? undefined}>
            <Avatar name={s.sponsor_full_name ?? 'SP'} size="sm" />
          </button>
        ) : (
          <div title="Saho Foundation">
            <Avatar name="Saho Foundation" size="sm" />
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
        <Button size="sm" variant="danger" className="iconBtn" style={{ marginLeft: 8 }} onClick={(e) => { e.stopPropagation(); setSingleDelete(s.student_id); }} aria-label={`Delete ${s.full_name}`}>
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
    <PageHeader title="Students" subtitle={`All enrolled single-parent students - ${total} total`} actions={<><Button variant="outline">Export CSV</Button><Button onClick={() => nav('/students/add')}>Add Student</Button></>} />
    <div className="statGrid" style={{ marginBottom: '30px' }}>
      <StatCard label="TOTAL STUDENTS" value={totalStudents} note="All enrolled" />
      <StatCard label="TOTAL BOYS" value={totalBoys} note="Percentage of total" />
      <StatCard label="TOTAL GIRLS" value={totalGirls} note="Percentage of total" />
    </div>
    <div className="panel" style={{ marginBottom: '20px' }}>
      <FilterBar onGo={() => { setApplied({ ...pending }); setPage(1); }} onClear={() => { setPending(defaults); setApplied(defaults); setPage(1); }}>
        <div className="filterGroup filterGroupWide">
          <input className="filterSearch" placeholder="Search students" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} />
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.st_id} onChange={e => setPending({ ...pending, st_id: e.target.value, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' })}>
            <option value="">All States</option>
            {filteredStates.map(s => <option value={s.stId ?? s.st_id} key={s.stId ?? s.st_id}>{s.stName ?? s.st_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.dist_id} onChange={e => setPending({ ...pending, dist_id: e.target.value, mndl_id: '', vil_id: '', sch_id: '' })}>
            <option value="">All Districts</option>
            {districts.map(d => <option value={d.distId ?? d.dist_id} key={d.distId ?? d.dist_id}>{d.distName ?? d.dist_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.mndl_id} onChange={e => setPending({ ...pending, mndl_id: e.target.value, vil_id: '', sch_id: '' })}>
            <option value="">All Mandals</option>
            {mandals.map(m => <option value={m.mndlId ?? m.mndl_id} key={m.mndlId ?? m.mndl_id}>{m.mndlName ?? m.mndl_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.vil_id} onChange={e => setPending({ ...pending, vil_id: e.target.value, sch_id: '' })}>
            <option value="">All Villages</option>
            {villages.map(v => <option value={v.vilId ?? v.vil_id} key={v.vilId ?? v.vil_id}>{v.vilName ?? v.vil_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.sch_id} onChange={e => setPending({ ...pending, sch_id: e.target.value })}>
            <option value="">All Schools</option>
            {schools.map(s => <option value={s.schId ?? s.sch_id} key={s.schId ?? s.sch_id}>{s.schName ?? s.sch_name}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.gender} onChange={e => setPending({ ...pending, gender: e.target.value })}>
            <option value="">All Gender</option>
            <option value="1">Male</option>
            <option value="2">Female</option>
            <option value="3">Other</option>
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.orphan_status} onChange={e => setPending({ ...pending, orphan_status: e.target.value })}>
            <option value="">Orphan / Semi Orphan</option>
            <option value="3">Orphan</option>
            <option value="2">Single Parent</option>
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
        <h3 className="panelTitle">Student Records <span style={{ fontSize: '13px', color: 'var(--color-text3)', fontWeight: 500, marginLeft: '10px' }}>{total} results</span></h3>
      </div>

      {error ? <div className="toast error" style={{ position: 'static', marginBottom: 12 }}>{error}</div> : null}

      <div className="selectHeaderRow" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="checkbox" checked={allPageChecked} onChange={togglePage} /> <span style={{ fontWeight: 800, color: 'var(--color-text2)' }}>Select all on this page</span></label>
          <div className="selectedCount" style={{ marginLeft: 8, color: 'var(--color-text3)', fontWeight: 800 }}>Selected {checked.length} of {total}</div>
        </div>
        <div>
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)} disabled={checked.length === 0} style={{ borderColor: checked.length ? 'var(--green-border)' : 'var(--color-border)', color: checked.length ? 'var(--green)' : 'var(--color-text3)' }}>Delete selected</Button>
        </div>
      </div>

      <DataTable loading={loading} columns={[{ key: 'select', label: '', width: '44px' }, { key: 'student', label: 'STUDENT' }, { key: 'age', label: 'AGE' }, { key: 'grade', label: 'CLASS' }, { key: 'school', label: 'SCHOOL NAME' }, { key: 'guardian', label: 'GUARDIAN' }, { key: 'sponsor', label: 'SPONSOR' }, { key: 'actions', label: 'ACTIONS' }]} rows={rows} />
      <Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} onPageSizeChange={(nextPageSize) => { setPageSize(nextPageSize); setPage(1); }} />
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
    <ConfirmModal open={singleDelete !== null} onClose={() => setSingleDelete(null)} onConfirm={confirmSingleDelete} title="Delete Student" message="Delete selected student?" />
    <ConfirmModal open={bulkOpen} onClose={() => setBulkOpen(false)} onConfirm={confirmBulkDelete} title="Delete Selected Students" message={`Delete ${checked.length} selected students?`} />
  </div>;
}
