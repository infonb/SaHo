import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSponsors } from '../../api/sponsorApi';
import { assignSponsor } from '../../api/studentSponsorApi';
import { getStudents } from '../../api/studentApi';
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

const contribution = (value: string) => /^\d+(\.\d+)?$/.test(value) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value)) : value;

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
  const [studentFilters, setStudentFilters] = useState({ gender: '', class_id: '', orphan_status: '', sponsor_status: '', dist_id: '' });

  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    getStudents().then(setStudents);
    getSponsors().then(setSponsors).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // sponsor list filtered locally
  const visibleSponsors = useMemo(() => sponsors.filter(s => (sponsorType === 'All' || s.type === sponsorType) && (!sponsorSearch || s.full_name.toLowerCase().includes(sponsorSearch.toLowerCase()))), [sponsors, sponsorSearch, sponsorType]);

  const classOptions = useMemo(() => [...new Set(students.map(s => s.class_id))], [students]);
  const districtOptions = useMemo(() => [...new Map(students.map(s => [String(s.dist_id), s.dist_name])).entries()], [students]);

  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students.filter(s => {
      if (q && !(s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.aadhaar_number.includes(q))) return false;
      if (studentFilters.gender && s.gender !== studentFilters.gender) return false;
      if (studentFilters.class_id && s.class_id !== studentFilters.class_id) return false;
      if (studentFilters.orphan_status && (s.orphan_status ?? '') !== studentFilters.orphan_status) return false;
      if (studentFilters.sponsor_status === 'assigned' && s.sponsor_id === null) return false;
      if (studentFilters.sponsor_status === 'unassigned' && s.sponsor_id !== null) return false;
      if (studentFilters.dist_id && String(s.dist_id) !== studentFilters.dist_id) return false;
      return true;
    });
  }, [students, studentSearch, studentFilters]);

  // student list pagination
  const pager = usePagination(visibleStudents, 10);
  const pageStudents = pager.current;

  const toggleStudent = (id: number) => setCheckedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const togglePage = () => {
    const pageIds = pageStudents.map(s => s.student_id);
    const allChecked = pageIds.every(id => checkedStudents.includes(id));
    setCheckedStudents(ids => allChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]);
  };

  const selectedStudentsPreview = useMemo(() => {
    const map = new Map(students.map(s => [s.student_id, s.full_name]));
    const names = checkedStudents.map(id => ({ id, name: map.get(id) ?? `Student ${id}` }));
    return names;
  }, [students, checkedStudents]);

  const sponsorRows = visibleSponsors.map(s => [
    <div
      className="rowFlex"
      style={{
        padding: '6px 6px',
        borderRadius: 10,
        border: selectedSponsor?.sponsor_id === s.sponsor_id ? '1px solid var(--green-border)' : '1px solid transparent',
        background: selectedSponsor?.sponsor_id === s.sponsor_id ? 'var(--green-bg)' : 'transparent',
        cursor: 'pointer'
      }}
      onClick={() => setSelectedSponsor(s)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedSponsor(s); }}
      aria-label={`Select sponsor ${s.full_name}`}
    >
      <Avatar name={s.full_name} />
      <div>
        <div className="strong">{s.full_name}</div>
        <div className="sub">{s.type} • {contribution(s.contrib_amt)}</div>
      </div>
    </div>,
    <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>,
    s.students_count
  ]);

  const studentRows = pageStudents.map(st => [
    <input aria-label={`Select ${st.full_name}`} type="checkbox" checked={checkedStudents.includes(st.student_id)} onClick={e => e.stopPropagation()} onChange={() => toggleStudent(st.student_id)} />, 
    st.student_id,
    <div className="rowFlex"><Avatar name={st.full_name} size="md" /><div><div className="strong">{st.full_name}</div><div className="sub">{st.gender}</div></div></div>,
    st.class_id,
    st.sch_name || '-',
    st.dist_name || '-',
    <Badge variant={st.sponsor_id ? 'assigned' : 'unassigned'}>{st.sponsor_full_name ?? 'None'}</Badge>
  ]);

  const confirmAssign = async () => {
    if (!selectedSponsor) return;
    try {
      setConfirmOpen(false);
      await Promise.all(checkedStudents.map(id => assignSponsor(id, selectedSponsor.sponsor_id, user?.username ?? 'admin')));
      toast(`Assigned ${checkedStudents.length} students to ${selectedSponsor.full_name}`, 'success');
      setCheckedStudents([]);
      load();
    } catch (e) {
      toast('Unable to assign sponsors', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Assign Sponsor" subtitle="Select a sponsor, select students, then assign" actions={<Button variant="outline" onClick={() => nav('/sponsors')}>Back</Button>} />

      <div className="bottomGrid" style={{ gridTemplateColumns: '1fr 360px', gap: 18 }}>
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <h3 className="panelTitle" style={{ margin: 0 }}>Select Sponsor</h3>
              <Button size="sm" variant="outline" disabled={!selectedSponsor} onClick={() => setSelectedSponsor(null)}>Clear Sponsor</Button>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <input className="input" placeholder="Search sponsors by name" value={sponsorSearch} onChange={e => setSponsorSearch(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button size="sm" variant={sponsorType === 'All' ? 'success' : 'outline'} onClick={() => setSponsorType('All')}>All</Button>
                <Button size="sm" variant={sponsorType === 'Individual' ? 'success' : 'outline'} onClick={() => setSponsorType('Individual')}>Individual</Button>
                <Button size="sm" variant={sponsorType === 'Organisation' ? 'success' : 'outline'} onClick={() => setSponsorType('Organisation')}>Organisation</Button>
              </div>
            </div>
            <DataTable loading={loading} columns={[{ key: 'n', label: 'Sponsor' }, { key: 't', label: 'Type' }, { key: 'c', label: 'Students' }]} rows={sponsorRows} />
          </div>

          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <h3 className="panelTitle" style={{ margin: 0 }}>Select Students</h3>
              <Button size="sm" variant="outline" disabled={checkedStudents.length === 0} onClick={() => setCheckedStudents([])}>Clear Students</Button>
            </div>

            <div className="filterBar filterBarInline" style={{ marginBottom: 12 }}>
              <div className="filterFields">
                <input className="input" placeholder="Search student name / email / Aadhaar" value={studentSearch} onChange={e => { setStudentSearch(e.target.value); pager.setPage(1); }} />
                <select className="select" value={studentFilters.class_id} onChange={e => { setStudentFilters(f => ({ ...f, class_id: e.target.value })); pager.setPage(1); }}>
                  <option value="">All Classes</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="select" value={studentFilters.gender} onChange={e => { setStudentFilters(f => ({ ...f, gender: e.target.value })); pager.setPage(1); }}>
                  <option value="">All Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <select className="select" value={studentFilters.orphan_status} onChange={e => { setStudentFilters(f => ({ ...f, orphan_status: e.target.value })); pager.setPage(1); }}>
                  <option value="">Orphan Status</option>
                  <option>Orphan</option>
                  <option>Semi Orphan</option>
                </select>
                <select className="select" value={studentFilters.sponsor_status} onChange={e => { setStudentFilters(f => ({ ...f, sponsor_status: e.target.value })); pager.setPage(1); }}>
                  <option value="">Sponsor Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <select className="select" value={studentFilters.dist_id} onChange={e => { setStudentFilters(f => ({ ...f, dist_id: e.target.value })); pager.setPage(1); }}>
                  <option value="">All Districts</option>
                  {districtOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
              <div className="filterActions">
                <Button size="sm" variant="ghost" onClick={() => { setStudentFilters({ gender: '', class_id: '', orphan_status: '', sponsor_status: '', dist_id: '' }); setStudentSearch(''); pager.setPage(1); }}>x Clear</Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={pageStudents.length > 0 && pageStudents.every(s => checkedStudents.includes(s.student_id))} onChange={togglePage} /> Select all on this page</label>
                <div className="selectedCount">Selected {checkedStudents.length} of {visibleStudents.length}</div>
              </div>
              <div>
                <Button size="sm" variant="success" onClick={() => setConfirmOpen(true)} disabled={!selectedSponsor || checkedStudents.length === 0}>Assign Sponsor</Button>
              </div>
            </div>

            <DataTable
              loading={loading}
              columns={[{ key: 'sel', label: '', width: '44px' }, { key: 'id', label: 'Student ID' }, { key: 's', label: 'Student' }, { key: 'class', label: 'Class' }, { key: 'sch', label: 'School' }, { key: 'loc', label: 'Location' }, { key: 'cur', label: 'Current Sponsor' }]}
              rows={studentRows}
              onRowClick={(index) => toggleStudent(pageStudents[index].student_id)}
            />
            <Pagination total={visibleStudents.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} />
          </div>
        </div>

        <div>
          <div className="panel" style={{ position: 'sticky', top: 88 }}>
            <h3 className="panelTitle" style={{ marginTop: 0 }}>Confirmation</h3>

            {selectedSponsor ? (
              <div style={{ marginBottom: 14 }}>
                <div className="sub">Selected Sponsor</div>
                <div className="rowFlex" style={{ marginTop: 8 }}>
                  <Avatar name={selectedSponsor.full_name} size="lg" />
                  <div>
                    <div className="strong">{selectedSponsor.full_name}</div>
                    <div className="sub">{selectedSponsor.type} • {selectedSponsor.nationality}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text3)' }}>No sponsor selected</div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div className="sub">Selected Students</div>
              <div className="strong" style={{ marginTop: 6 }}>{checkedStudents.length}</div>
            </div>

            <Button variant="success" style={{ width: '100%' }} disabled={!selectedSponsor || checkedStudents.length === 0} onClick={() => setConfirmOpen(true)}>
              Assign Now
            </Button>

            {checkedStudents.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="sub">Selected List</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                  {selectedStudentsPreview.slice(0, 5).map(s => (
                    <div key={s.id} className="quickRow" style={{ padding: '10px 12px', marginBottom: 0 }}>
                      <div style={{ fontWeight: 800 }}>{s.name}</div>
                      <div className="sub" style={{ marginTop: 0 }}>ID {s.id}</div>
                    </div>
                  ))}
                  {checkedStudents.length > 5 && (
                    <div className="sub">+ {checkedStudents.length - 5} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmAssign} title="Confirm Assignment" icon="Assign" confirmLabel="Yes, Assign" danger={false} message={`Assign ${checkedStudents.length} students to ${selectedSponsor?.full_name}?`} />
    </div>
  );
}
