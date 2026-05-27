import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateStudents, getStudents, getStudentById } from '../../api/studentApi';
import { getStates, getDistricts, getMandals, getVillages, getSchools } from '../../api/locationApi';
import { getSponsorById } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
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

  const totalStudents = total;
  const totalBoys = students.filter(s => s.gender === 'Male').length;
  const totalGirls = students.filter(s => s.gender === 'Female').length;
  const totalSponsored = students.filter(s => s.sponsor_id).length;
  const totalOrphans = students.filter(s => s.orphan_status === '3').length;

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

  return (
    <div className="student-list-page">
      <div className="student-list-header">
        <div className="student-list-title">
          <h1>Student management</h1>
          <p>All enrolled single-parent students</p>
        </div>
        <div className="student-list-actions">
          <Button variant="outline">Export CSV</Button>
          <Button className="add-student-btn" onClick={() => nav('/students/add')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Student
          </Button>
        </div>
      </div>

      <div className="student-stats-grid">
        <div className="student-stat-card total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Students</div>
            <div className="stat-card-value">{totalStudents}</div>
            <div className="stat-card-note">All enrolled</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card boys">
          <div className="stat-card-content">
            <div className="stat-card-label">Boys</div>
            <div className="stat-card-value">{totalBoys}</div>
            <div className="stat-card-note">Male students</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card girls">
          <div className="stat-card-content">
            <div className="stat-card-label">Girls</div>
            <div className="stat-card-value">{totalGirls}</div>
            <div className="stat-card-note">Female students</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M14 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card sponsored">
          <div className="stat-card-content">
            <div className="stat-card-label">Sponsored</div>
            <div className="stat-card-value">{totalSponsored}</div>
            <div className="stat-card-note">With sponsors</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card orphans">
          <div className="stat-card-content">
            <div className="stat-card-label">Orphans</div>
            <div className="stat-card-value">{totalOrphans}</div>
            <div className="stat-card-note">Full orphans</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18"></path>
              <circle cx="17" cy="12" r="3"></circle>
              <circle cx="7" cy="12" r="3"></circle>
            </svg>
          </div>
        </div>
      </div>

      <div className="student-filters-section">
        <div className="filters-container">
          <div className="filters-row filters-row-1">
            <div className="filter-search-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input
                className="filter-search-input"
                placeholder="Search students by name, ID..."
                value={pending.search}
                onChange={e => setPending({ ...pending, search: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.st_id} onChange={e => setPending({ ...pending, st_id: e.target.value, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' })}>
                <option value="">All States</option>
                {filteredStates.map(s => <option value={s.stId ?? s.st_id} key={s.stId ?? s.st_id}>{s.stName ?? s.st_name}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.dist_id} onChange={e => setPending({ ...pending, dist_id: e.target.value, mndl_id: '', vil_id: '', sch_id: '' })}>
                <option value="">All Districts</option>
                {districts.map(d => <option value={d.distId ?? d.dist_id} key={d.distId ?? d.dist_id}>{d.distName ?? d.dist_name}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.mndl_id} onChange={e => setPending({ ...pending, mndl_id: e.target.value, vil_id: '', sch_id: '' })}>
                <option value="">All Mandals</option>
                {mandals.map(m => <option value={m.mndlId ?? m.mndl_id} key={m.mndlId ?? m.mndl_id}>{m.mndlName ?? m.mndl_name}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.vil_id} onChange={e => setPending({ ...pending, vil_id: e.target.value, sch_id: '' })}>
                <option value="">All Villages</option>
                {villages.map(v => <option value={v.vilId ?? v.vil_id} key={v.vilId ?? v.vil_id}>{v.vilName ?? v.vil_name}</option>)}
              </select>
            </div>
          </div>
          <div className="filters-row filters-row-2">
            <div className="filter-group">
              <select className="filter-select" value={pending.sch_id} onChange={e => setPending({ ...pending, sch_id: e.target.value })}>
                <option value="">All Schools</option>
                {schools.map(s => <option value={s.schId ?? s.sch_id} key={s.schId ?? s.sch_id}>{s.schName ?? s.sch_name}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.gender} onChange={e => setPending({ ...pending, gender: e.target.value })}>
                <option value="">All Gender</option>
                <option value="1">Male</option>
                <option value="2">Female</option>
                <option value="3">Other</option>
              </select>
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.orphan_status} onChange={e => setPending({ ...pending, orphan_status: e.target.value })}>
                <option value="">Orphan Status</option>
                <option value="3">Orphan</option>
                <option value="2">Single Parent</option>
              </select>
            </div>
            <div className="filter-group">
              <select className="filter-select" value={pending.class_id} onChange={e => setPending({ ...pending, class_id: e.target.value })}>
                <option value="">All Classes</option>
                {allClasses.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-actions-group">
              <button className="clear-filters-btn" onClick={() => { setPending(defaults); setApplied(defaults); setPage(1); }}>
                Clear
              </button>
              <button className="go-filter-btn" onClick={() => { setApplied({ ...pending }); setPage(1); }}>
                Go
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="student-table-section">
        <div className="table-header">
          <h3 className="table-title">Student Records <span className="results-count">{total} results</span></h3>
        </div>

        {error ? <div className="toast error" style={{ position: 'static', marginBottom: 12 }}>{error}</div> : null}

        <div className="table-select-row">
          <label className="select-all-label">
            <input type="checkbox" checked={allPageChecked} onChange={togglePage} />
            <span>Select all on this page</span>
          </label>
          <div className="selected-count">Selected {checked.length} of {total}</div>
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)} disabled={checked.length === 0} className={checked.length > 0 ? 'delete-selected-btn' : ''}>
            Delete selected
          </Button>
        </div>

        <DataTable loading={loading} columns={[{ key: 'select', label: '', width: '44px' }, { key: 'student', label: 'STUDENT' }, { key: 'age', label: 'AGE' }, { key: 'grade', label: 'CLASS' }, { key: 'school', label: 'SCHOOL NAME' }, { key: 'guardian', label: 'GUARDIAN' }, { key: 'sponsor', label: 'SPONSOR' }, { key: 'actions', label: 'ACTIONS' }]} rows={rows} />
        <Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} onPageSizeChange={(nextPageSize) => { setPageSize(nextPageSize); setPage(1); }} />
      </div>
      <StudentDetailModal student={selected} onClose={() => setSelected(null)} />
      <Modal open={sponsorOpen} onClose={() => setSponsorOpen(false)} title={sponsorDetails?.full_name ?? 'Sponsor'} width={560} footer={<><Button variant="outline" onClick={() => setSponsorOpen(false)}>Close</Button></>}>
        {sponsorDetails ? <div>
          <h3 style={{ marginTop: 0 }}>{sponsorDetails.full_name}</h3>
          <div className="sub">{sponsorDetails.type} - {sponsorDetails.nationality}</div>
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
    </div>
  );
}