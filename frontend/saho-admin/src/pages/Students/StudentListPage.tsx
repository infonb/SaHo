import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateStudents, getStudents } from '../../api/studentApi';
import { MOCK_DISTRICTS, MOCK_MANDALS, MOCK_SCHOOLS, MOCK_STATES, MOCK_VILLAGES } from '../../api/mockData';
import { getSponsorById } from '../../api/sponsorApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import Pagination from '../../components/common/Pagination';
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
  const hasSelection = checked.length > 0;
  const selectedStudents = useMemo(() => students.filter(s => checked.includes(s.student_id)), [checked, students]);
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

  const openSponsor = async (id: number) => {
    const sp = await getSponsorById(id);
    if (sp) setSponsorDetails(sp);
    setSponsorOpen(true);
  };

  const exportStudentsCsv = () => {
    const exportRows = hasSelection ? selectedStudents : students;
    const headers = ['Student ID', 'Name', 'Gender', 'Age', 'Grade', 'School', 'Village', 'District', 'Guardian', 'Guardian Phone', 'Sponsor'];
    const csvRows = exportRows.map(s => {
      const dob = new Date(s.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const hasBirthdayPassed = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!hasBirthdayPassed) age -= 1;

      return [
        s.student_id,
        s.full_name,
        s.gender,
        age,
        s.class_id,
        s.sch_name,
        s.vil_name,
        s.dist_name,
        s.guardian_full_name,
        s.guardian_phone,
        s.sponsor_full_name ?? 'Saho Foundation'
      ];
    });

    const escapeCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows].map(row => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = hasSelection ? `selected-students-${checked.length}.csv` : 'students.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const rows = pager.current.map((s, index) => {
    const dob = new Date(s.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hasBirthdayPassed = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasBirthdayPassed) age -= 1;
    const serialNumber = (pager.page - 1) * pager.pageSize + index + 1;
    return [
      <input aria-label={`Select ${s.full_name}`} type="checkbox" checked={checked.includes(s.student_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(s.student_id)} />,
      <span className="recordId">{serialNumber}</span>,
      <div className="rowFlex"><Avatar name={s.full_name} size="md" /><div><div className="strong studentNameCell" onClick={() => setSelected(s)}>{s.full_name}</div><div className="sub">{s.gender}</div></div></div>,
      <div>{age}</div>,
      <div>{s.class_id}</div>,
      <div><div className="strong">{s.sch_name}</div><div className="sub">{s.vil_name}, {s.dist_name}</div></div>,
      <div><div className="strong">{s.guardian_full_name}</div><div className="sub">{s.guardian_relation_name} - {s.guardian_occ || 'N/A'}</div></div>,
      <div>
        {s.sponsor_id ? (
          <button className="photoButton" onClick={(e) => { e.stopPropagation(); openSponsor(s.sponsor_id!); }} title={s.sponsor_full_name ?? undefined}>
            <Avatar name={s.sponsor_full_name ?? 'SP'} size="md" />
          </button>
        ) : (
          <div title="Saho Foundation">
            <Avatar name="Saho Foundation" size="md" />
          </div>
        )}
      </div>,
      <div className="student-actions actions" onClick={e => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="iconBtn" onClick={(e) => { e.stopPropagation(); nav(`/students/edit/${s.student_id}`); }} aria-label="Edit student">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        <Button size="sm" variant="danger" className="iconBtn" onClick={(e) => { e.stopPropagation(); setSingleDelete(s.student_id); }} aria-label={`Delete ${s.full_name}`}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    ];
  });

  const totalBoysPct = totalStudents ? `${Math.round((totalBoys / totalStudents) * 100)}%` : '0%';
  const totalGirlsPct = totalStudents ? `${Math.round((totalGirls / totalStudents) * 100)}%` : '0%';

  return <div>
    <section className="studentsHero">
      <div className="studentsHeroHeader">
        <div className="studentsHeroIntro">
          <p className="studentsHeroEyebrow">Student Management</p>
          <h1>Students</h1>
          <p>All enrolled single-parent students{' — '}{students.length} total</p>
        </div>
        <div className="studentsHeroActions">
          <Button className="heroAddButton" onClick={() => nav('/students/add')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Student
          </Button>
        </div>
      </div>

      <div className="studentsHeroStats">
        <HeroMetricCard
          tone="teal"
          label="Total Students"
          value={totalStudents}
          note="All enrolled"
          delta="12%"
          deltaLabel="vs last month"
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.5" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 8v6M17 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          wavePath="M10 53C22 53 19 34 32 34C45 34 42 49 54 49C66 49 67 31 79 31C92 31 91 46 103 46C115 46 118 24 132 24C145 24 148 36 164 36"
        />
        <HeroMetricCard
          tone="blue"
          label="Total Boys"
          value={totalBoys}
          note={`${totalBoysPct} of total`}
          delta="8%"
          deltaLabel="vs last month"
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="10" cy="10" r="5.2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13.6 6.4L19 1M15.4 1H19v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          wavePath="M10 52C21 52 24 51 32 51C40 51 42 34 53 34C63 34 64 47 74 47C84 47 87 30 98 30C109 30 111 43 120 43C130 43 135 23 147 23C157 23 159 30 164 30"
        />
        <HeroMetricCard
          tone="purple"
          label="Total Girls"
          value={totalGirls}
          note={`${totalGirlsPct} of total`}
          delta="16%"
          deltaLabel="vs last month"
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="4.7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 13v8M8.5 17H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          wavePath="M10 53C22 53 22 47 31 47C40 47 41 35 50 35C59 35 60 49 69 49C78 49 84 28 94 28C104 28 106 19 117 19C128 19 129 34 142 34C152 34 154 26 164 26"
        />
      </div>
    </section>

    <div className="panel studentFilterPanel" style={{ marginBottom: '20px' }}>
      <div className="sectionHeader">
        <div>
          <h3 className="panelTitle">Filters</h3>
          <p className="sub">Refine students by location, demographics, and academic context.</p>
        </div>
      </div>
      <div className="studentFilterGlow" aria-hidden />
      <div className="studentFilterInner">
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
    </div>
    <div className={`panel studentRecordsPanel ${hasSelection ? 'bulkModeActive' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
        <h3 className="panelTitle">Student Records <span style={{ fontSize: '13px', color: 'var(--color-text3)', fontWeight: 500, marginLeft: '10px' }}>{students.length} results</span></h3>
      </div>

      <div className={`bulkToolbarShell ${hasSelection ? 'isActive' : ''}`} aria-hidden={!hasSelection}>
        <div className="selectHeaderRow studentBulkToolbar">
          <div className="bulkToolbarInfo">
            <label className="bulkSelectAll">
              <input type="checkbox" checked={allPageChecked} onChange={togglePage} tabIndex={hasSelection ? 0 : -1} />
              <span>Select all on this page</span>
            </label>
            <div className="selectedCount">
              <strong>{checked.length}</strong> selected
              <span>of {students.length}</span>
            </div>
          </div>
          <div className="bulkToolbarActions">
            <Button
              size="sm"
              variant="outline"
              onClick={exportStudentsCsv}
              tabIndex={hasSelection ? 0 : -1}
            >
              Export CSV
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bulkDeleteButton"
              onClick={() => setBulkOpen(true)}
              disabled={!hasSelection}
              tabIndex={hasSelection ? 0 : -1}
            >
              Delete selected
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={[{ key: 'select', label: '', width: '44px' }, { key: 'studentId', label: 'ID', width: '92px' }, { key: 'student', label: 'STUDENT' }, { key: 'age', label: 'AGE' }, { key: 'grade', label: 'GRADE' }, { key: 'location', label: 'LOCATION' }, { key: 'guardian', label: 'GUARDIAN' }, { key: 'sponsor', label: 'SPONSOR' }, { key: 'actions', label: '', width: '72px' }]}
        rows={rows}
        rowClassName={(index) => {
          const student = pager.current[index];
          return `student-row studentTableRow${student && checked.includes(student.student_id) ? ' isSelected' : ''}`;
        }}
      />
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

function HeroMetricCard({ tone, label, value, note, delta, deltaLabel, icon, wavePath }: { tone: 'teal' | 'blue' | 'purple'; label: string; value: string | number; note: string; delta: string; deltaLabel: string; icon: ReactNode; wavePath: string }) {
  return (
    <article className={`heroMetricCard ${tone}`}>
      <div className="heroMetricGlow" aria-hidden />
      <div className="heroMetricTop">
        <div className="heroMetricIcon">{icon}</div>
        <div className="heroMetricMeta">
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{note}</small>
        </div>
        <div className="heroMetricDelta">
          <b>{delta}</b>
          <small>{deltaLabel}</small>
        </div>
      </div>
      <div className="heroMetricChart" aria-hidden>
        <svg viewBox="0 0 174 62" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`hero-gradient-${tone}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          <path d={`${wavePath}L164 62L10 62Z`} fill={`url(#hero-gradient-${tone})`} />
          <path d={wavePath} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      </div>
    </article>
  );
}
