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
import FilterBar from '../../components/common/FilterBar';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
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
  const [sponsorType, setSponsorType] = useState('All');
  const [checkedStudents, setCheckedStudents] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // student list pagination
  const pager = usePagination(students, 10);
  const pageStudents = pager.current;

  const toggleStudent = (id: number) => setCheckedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const togglePage = () => {
    const pageIds = pageStudents.map(s => s.student_id);
    const allChecked = pageIds.every(id => checkedStudents.includes(id));
    setCheckedStudents(ids => allChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]);
  };

  const totalSponsors = sponsors.length;
  const totalStudentsSponsored = sponsors.reduce((sum, s) => sum + Number(s.students_count), 0);

  const sponsorRows = visibleSponsors.map(s => [
    <div className="rowFlex"><Avatar name={s.full_name} /><div><div className="strong" style={{ cursor: 'pointer' }} onClick={() => setSelectedSponsor(s)}>{s.full_name}</div><div className="sub">{s.type} • {contribution(s.contrib_amt)}</div></div></div>,
    <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>,
    s.students_count
  ]);

  const studentRows = pageStudents.map(st => [
    <input aria-label={`Select ${st.full_name}`} type="checkbox" checked={checkedStudents.includes(st.student_id)} onClick={e => e.stopPropagation()} onChange={() => toggleStudent(st.student_id)} />, 
    st.student_code || st.student_id,
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
      <PageHeader title="Assign Sponsor" subtitle="Select students and assign them to a sponsor" actions={<><Button variant="outline" onClick={() => nav('/sponsors')}>Back</Button><Button variant="ghost">Assignment History</Button></>} />

      <div className="bottomGrid" style={{ gridTemplateColumns: '1fr 360px', gap: 18 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="input" placeholder="Search and select sponsor" value={sponsorSearch} onChange={e => setSponsorSearch(e.target.value)} style={{ flex: 1 }} />
              <select className="select" value={sponsorType} onChange={e => setSponsorType(e.target.value)} style={{ width: 160 }}>
                <option>All</option>
                <option>Individual</option>
                <option>Organisation</option>
              </select>
            </div>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, marginBottom: 14 }}>
            <DataTable loading={loading} columns={[{ key: 'n', label: 'Sponsor' }, { key: 't', label: 'Type' }, { key: 'c', label: 'Students' }]} rows={sponsorRows} />
          </div>

          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <h4 style={{ margin: '8px 0' }}>Filter Students (Optional)</h4>
            <FilterBar onGo={() => {}} onClear={() => {}} className="filterBarInline" extraAction={<Button size="sm" variant="ghost">Apply Filters</Button>}>
              <input className="input" placeholder="State" />
              <input className="input" placeholder="District" />
              <input className="input" placeholder="Mandal" />
              <input className="input" placeholder="Village" />
            </FilterBar>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={pageStudents.length > 0 && pageStudents.every(s => checkedStudents.includes(s.student_id))} onChange={togglePage} /> Select all on this page</label>
                <div className="selectedCount">Selected {checkedStudents.length} of {students.length}</div>
              </div>
              <div>
                <Button size="sm" variant="success" onClick={() => setConfirmOpen(true)} disabled={!selectedSponsor || checkedStudents.length === 0}>Assign Selected</Button>
              </div>
            </div>

            <DataTable loading={loading} columns={[{ key: 'sel', label: '', width: '44px' }, { key: 'id', label: 'Student ID' }, { key: 's', label: 'Student' }, { key: 'class', label: 'Class' }, { key: 'sch', label: 'School' }, { key: 'loc', label: 'Location' }, { key: 'cur', label: 'Current Sponsor' }]} rows={studentRows} />
            <Pagination total={students.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} />
          </div>
        </div>

        <div>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 16, minHeight: 200 }}>
            {selectedSponsor ? (
              <div>
                <div className="rowFlex"><Avatar name={selectedSponsor.full_name} size="lg" /><div style={{ marginLeft: 12 }}><h3 style={{ margin: 0 }}>{selectedSponsor.full_name}</h3><div className="sub">{selectedSponsor.type} • {selectedSponsor.nationality}</div></div></div>
                <div style={{ marginTop: 12 }}><div className="sub">Email</div><div className="strong">{selectedSponsor.email}</div></div>
                <div style={{ marginTop: 8 }}><div className="sub">Phone</div><div className="strong">{selectedSponsor.ph_no}</div></div>
                <div style={{ marginTop: 12 }}><Badge variant="assigned">{selectedSponsor.students_count} Students</Badge></div>
                <div style={{ marginTop: 16 }}><Button onClick={() => setSelectedSponsor(null)} variant="outline">Clear</Button></div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text3)' }}>No sponsor selected</div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmAssign} title="Confirm Assignment" message={`Assign ${checkedStudents.length} students to ${selectedSponsor?.full_name}?`} />
    </div>
  );
}
