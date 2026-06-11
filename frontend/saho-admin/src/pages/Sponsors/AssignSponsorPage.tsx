import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSponsors } from '../../api/sponsorApi';
import { getStudents } from '../../api/studentApi';
import { assignSponsor } from '../../api/studentSponsorApi';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import type { SponsorView, StudentView } from '../../types';
import "../../styles/Sponsors/AssignSponsorPage.css";

const contribution = (value?: string | null) => {
  if (!value) return '-';

  return /^\d+(\.\d+)?$/.test(value)
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(Number(value))
    : value;
};

export default function AssignSponsorPage() {
  const [students, setStudents] = useState<StudentView[]>([]);
  const [sponsors, setSponsors] = useState<SponsorView[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorView | null>(null);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsorType, setSponsorType] = useState<'All' | 'Individual' | 'Organisation'>('All');
  const [checkedStudents, setCheckedStudents] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilters, setStudentFilters] = useState({
    gender: '',
    class_id: '',
    orphan_status: '',
    sponsor_status: '',
    dist_id: ''
  });

  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      getStudents({ pageNumber: 1, pageSize: 10000 }),
      getSponsors(),
    ])
      .then(([st, sp]) => {
        setStudents(st.students);
        setSponsors(sp);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visibleSponsors = useMemo(() => {
    const q = sponsorSearch.trim().toLowerCase();

    return sponsors.filter(s => {
      if (sponsorType !== 'All' && s.type !== sponsorType) return false;
      if (!q) return true;
      return (
        s.sponsorName.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [sponsors, sponsorSearch, sponsorType]);

  const sponsorPager = usePagination(visibleSponsors, 10);
  const pageSponsors = sponsorPager.current;

  const classOptions = useMemo(() => [...new Set(students.map(s => s.class_id))], [students]);
  const districtOptions = useMemo(
    () => [...new Map(students.map(s => [String(s.dist_id), s.dist_name])).entries()],
    [students]
  );

  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();

    return students.filter(s => {
      if (q) {
        const match =
          s.full_name.toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.aadhaar_number ?? '').includes(q);
        if (!match) return false;
      }

      if (studentFilters.gender && s.gender !== studentFilters.gender) return false;
      if (studentFilters.class_id && s.class_id !== studentFilters.class_id) return false;
      if (studentFilters.orphan_status && (s.orphan_status ?? '') !== studentFilters.orphan_status) return false;
      if (studentFilters.sponsor_status === 'assigned' && s.sponsor_id === null) return false;
      if (studentFilters.sponsor_status === 'unassigned' && s.sponsor_id !== null) return false;
      if (studentFilters.dist_id && String(s.dist_id) !== studentFilters.dist_id) return false;

      return true;
    });
  }, [students, studentSearch, studentFilters]);

  const pager = usePagination(visibleStudents, 10);
  const pageStudents = pager.current;

  const toggleStudent = (id: number) => {
    setCheckedStudents(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const togglePage = () => {
    const pageIds = pageStudents.map(s => s.student_id);
    const allChecked = pageIds.length > 0 && pageIds.every(id => checkedStudents.includes(id));

    setCheckedStudents(ids =>
      allChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]
    );
  };

  const selectedStudentsPreview = useMemo(() => {
    const map = new Map(students.map(s => [s.student_id, s.full_name]));
    return checkedStudents.map(id => ({ id, name: map.get(id) ?? `Student ${id}` }));
  }, [students, checkedStudents]);

  const sponsorRows = pageSponsors.map(s => [
    <label className="rowFlex" style={{ gap: 12 }}>
      <input
        type="radio"
        name="sponsor"
        checked={selectedSponsor?.sponsor_id === s.sponsor_id}
        onChange={() => setSelectedSponsor(s)}
      />
      <Avatar name={s.sponsorName} size="md" />
      <div style={{ minWidth: 0 }}>
        <div className="strong" style={{ lineHeight: 1.15 }}>{s.sponsorName}</div>
        <div className="sub" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
      </div>
    </label>,
      <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>,
    <div style={{ fontWeight: 800 }}>{contribution(s.contrib)}</div>,
    <div style={{ fontWeight: 800 }}>{s.students_count ?? 0}</div>
  ]);

  const studentRows = pageStudents.map(s => [
    <input type="checkbox" checked={checkedStudents.includes(s.student_id)} onChange={() => toggleStudent(s.student_id)} />,
    <div style={{ fontWeight: 800 }}>{s.student_id}</div>,
    <div className="rowFlex" style={{ gap: 10 }}>
      <Avatar name={s.full_name} size="sm" />
      <div>
        <div style={{ fontWeight: 900 }}>{s.full_name}</div>
        <div className="sub" style={{ marginTop: 0 }}>{s.gender}</div>
      </div>
    </div>,
    <div>{s.class_id}</div>,
    <div style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sch_name}</div>,
    <div style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.dist_name}</div>,
    s.sponsor_id ? (
      <Badge variant="assigned">{s.sponsorName ?? 'Assigned'}</Badge>
    ) : (
      <Badge variant="unassigned">None</Badge>
    )
  ]);

  const confirmAssign = async () => {
    if (!selectedSponsor || checkedStudents.length === 0) return;

    try {
      const createdBy = String(user?.user_id ?? 1);
      await Promise.all(
        checkedStudents.map(stdId => assignSponsor(stdId, selectedSponsor.sponsor_id, createdBy))
      );
      toast('Sponsor assigned successfully.', 'success');
      setConfirmOpen(false);
      setCheckedStudents([]);
      setSelectedSponsor(null);
      load();
    } catch {
      toast('Unable to assign sponsor.', 'error');
    }
  };

  return (
    <div >
      <PageHeader
        title="Assign Sponsor to Students"
        subtitle="Select a sponsor, choose students and assign"
        actions={<Button variant="outline" className="btnRed" onClick={() => nav(-1)}>Back</Button>}
      />

      <div className="assignGrid">
        <div className="assignStack">
          <div className="panel">
            <div className="assignStepHead">
              <div className="assignStepNum">1</div>
              <h3 className="panelTitle" style={{ margin: 0 }}>Select Sponsor</h3>
            </div>

            <div className="assignToolbar">
              <div className="assignSearch">
                <input
                  className="input"
                  placeholder="Search sponsors by name or email..."
                  value={sponsorSearch}
                  onChange={e => setSponsorSearch(e.target.value)}
                />
                <span className="assignSearchIcon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </div>

              <div className="assignTypeBtns">
                <Button size="sm" variant={sponsorType === 'All' ? 'success' : 'outline'} onClick={() => setSponsorType('All')}>All</Button>
                <Button size="sm" variant={sponsorType === 'Individual' ? 'success' : 'outline'} onClick={() => setSponsorType('Individual')}>Individual</Button>
                <Button size="sm" variant={sponsorType === 'Organisation' ? 'success' : 'outline'} onClick={() => setSponsorType('Organisation')}>Organisation</Button>
              </div>
            </div>

            <DataTable
              loading={loading}
              columns={[
                { key: 's', label: 'Sponsor' },
                { key: 't', label: 'Type', width: '140px' },
                { key: 'c', label: 'Contribution', width: '150px' },
                { key: 'st', label: 'Students Sponsored', width: '170px' }
              ]}
              rows={sponsorRows}
              onRowClick={(index) => setSelectedSponsor(pageSponsors[index] ?? null)}
              rowClassName={(index) => (pageSponsors[index]?.sponsor_id === selectedSponsor?.sponsor_id ? 'assignRowSelected' : '')}
            />

            <Pagination
              total={visibleSponsors.length}
              page={sponsorPager.page}
              pageSize={sponsorPager.pageSize}
              onChange={sponsorPager.setPage}
              onPageSizeChange={sponsorPager.setPageSize}
            />

            <div className="assignHint">Showing {Math.min((sponsorPager.page - 1) * sponsorPager.pageSize + 1, visibleSponsors.length)} to {Math.min(sponsorPager.page * sponsorPager.pageSize, visibleSponsors.length)} of {visibleSponsors.length} sponsors</div>
          </div>

          <div className="panel">
            <div className="assignStepHead" style={{ marginBottom: 12 }}>
              <div className="assignStepNum">2</div>
              <h3 className="panelTitle" style={{ margin: 0 }}>Select Students</h3>
              <div style={{ marginLeft: 'auto' }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStudentFilters({ gender: '', class_id: '', orphan_status: '', sponsor_status: '', dist_id: '' });
                    setStudentSearch('');
                    pager.setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="filterBar" style={{ marginBottom: 10 }}>
              <div className="filterFields" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                <input
                  className="input"
                  placeholder="Search by name, email or Aadhaar..."
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    pager.setPage(1);
                  }}
                />

                <select
                  className="select"
                  value={studentFilters.class_id}
                  onChange={e => {
                    setStudentFilters(f => ({ ...f, class_id: e.target.value }));
                    pager.setPage(1);
                  }}
                >
                  <option value="">All Classes</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  className="select"
                  value={studentFilters.gender}
                  onChange={e => {
                    setStudentFilters(f => ({ ...f, gender: e.target.value }));
                    pager.setPage(1);
                  }}
                >
                  <option value="">All Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                <select
                  className="select"
                  value={studentFilters.orphan_status}
                  onChange={e => {
                    setStudentFilters(f => ({ ...f, orphan_status: e.target.value }));
                    pager.setPage(1);
                  }}
                >
                  <option value="">Orphan Status</option>
                  <option value="Orphan">Orphan</option>
                  <option value="Non-Orphan">Non-Orphan</option>
                </select>

                <select
                  className="select"
                  value={studentFilters.sponsor_status}
                  onChange={e => {
                    setStudentFilters(f => ({ ...f, sponsor_status: e.target.value }));
                    pager.setPage(1);
                  }}
                >
                  <option value="">Sponsor Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>

                <select
                  className="select"
                  value={studentFilters.dist_id}
                  onChange={e => {
                    setStudentFilters(f => ({ ...f, dist_id: e.target.value }));
                    pager.setPage(1);
                  }}
                >
                  <option value="">All Districts</option>
                  {districtOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
            </div>

            <div className="between" style={{ marginBottom: 10 }}>
              <div className="rowFlex" style={{ gap: 12, flexWrap: 'wrap' }}>
                <label className="rowFlex" style={{ gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={pageStudents.length > 0 && pageStudents.every(s => checkedStudents.includes(s.student_id))}
                    onChange={togglePage}
                  />
                  Select all on this page
                </label>
                <div className="sub" style={{ fontWeight: 800 }}>Selected {checkedStudents.length} of {visibleStudents.length}</div>
              </div>

              <Button size="sm" variant="success"  onClick={() => setConfirmOpen(true)} disabled={!selectedSponsor || checkedStudents.length === 0}>
                Assign Sponsor
              </Button>
            </div>

            <DataTable
              loading={loading}
              columns={[
                { key: 'sel', label: '', width: '44px' },
                { key: 'id', label: 'Student ID', width: '110px' },
                { key: 's', label: 'Student' },
                { key: 'class', label: 'Class', width: '90px' },
                { key: 'sch', label: 'School' },
                { key: 'loc', label: 'Location', width: '160px' },
                { key: 'cur', label: 'Current Sponsor', width: '140px' }
              ]}
              rows={studentRows}
              onRowClick={(index) => toggleStudent(pageStudents[index].student_id)}
            />

            <Pagination
              total={visibleStudents.length}
              page={pager.page}
              pageSize={pager.pageSize}
              onChange={pager.setPage}
              onPageSizeChange={pager.setPageSize}
            />
          </div>
        </div>

        <div className="panel" style={{ position: 'sticky', top: 88 }}>
          <div className="assignStepHead" style={{ marginBottom: 10 }}>
            <div className="assignStepNum" style={{ background: 'var(--color-primary)' }}>✓</div>
            <h3 className="panelTitle" style={{ margin: 0 }}>Assignment Summary</h3>
          </div>

          <div className="sub" style={{ fontWeight: 900, marginBottom: 8 }}>Selected Sponsor</div>
          {selectedSponsor ? (
            <div className="assignSummaryCard">
              <div className="assignSummaryPill">
                <Avatar name={selectedSponsor.sponsorName} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div className="strong">{selectedSponsor.sponsorName}</div>
                  <div className="sub">{selectedSponsor.type} • {selectedSponsor.nationality}</div>
                  <div className="sub" style={{ marginTop: 6 }}>
                    Contribution <span style={{ fontWeight: 900, color: 'var(--green)' }}>{contribution(selectedSponsor.contrib)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="assignSummaryEmpty" style={{ padding: 12 }}>No sponsor selected yet</div>
          )}

          <div className="assignDivider" />

          <div className="sub" style={{ fontWeight: 900, marginBottom: 6 }}>Selected Students</div>
          <div className="rowFlex" style={{ gap: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{checkedStudents.length}</div>
            <div className="sub">students</div>
          </div>

          {checkedStudents.length === 0 ? (
            <div className="assignSummaryEmpty">
              <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="40" y="24" width="120" height="112" rx="14" fill="var(--green-bg)" stroke="var(--green-border)" />
                <rect x="62" y="52" width="76" height="10" rx="5" fill="var(--green)" opacity=".35" />
                <rect x="62" y="74" width="56" height="10" rx="5" fill="var(--green)" opacity=".28" />
                <rect x="62" y="96" width="66" height="10" rx="5" fill="var(--green)" opacity=".22" />
                <circle cx="54" cy="57" r="6" fill="var(--green)" opacity=".55" />
                <circle cx="54" cy="79" r="6" fill="var(--green)" opacity=".45" />
                <circle cx="54" cy="101" r="6" fill="var(--green)" opacity=".35" />
              </svg>
              <div style={{ fontWeight: 900, color: 'var(--color-text2)' }}>No students selected yet</div>
              <div className="sub">Select students from the list to assign this sponsor.</div>
            </div>
          ) : null}

          <Button

            variant="success"
            style={{ width: '100%', marginTop: 12 }}
            disabled={!selectedSponsor || checkedStudents.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' }}>
              <span>Assign Now</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Button>

          <div className="toast" style={{ marginTop: 12, position: 'static' }}>
            Once assigned, the selected students will be linked to the sponsor. You can reassign later if needed.
          </div>

          {checkedStudents.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div className="sub" style={{ fontWeight: 900 }}>Selected List</div>
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                {selectedStudentsPreview.slice(0, 5).map(s => (
                  <div key={s.id} className="quickRow" style={{ padding: '10px 12px', marginBottom: 0 }}>
                    <div style={{ fontWeight: 800, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div className="sub" style={{ marginTop: 0 }}>ID {s.id}</div>
                  </div>
                ))}
                {checkedStudents.length > 5 ? <div className="sub">+ {checkedStudents.length - 5} more</div> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAssign}
        title="Confirm Assignment"
        icon="Assign"
        confirmLabel="Yes, Assign"
        danger={false}
        message={`Assign ${checkedStudents.length} students to ${selectedSponsor?.sponsorName}?`}
      />
    </div>
  );
}
