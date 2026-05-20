import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateSponsors, getSponsors } from '../../api/sponsorApi';
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
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import type { SponsorFilters, SponsorView } from '../../types';

const defaults: SponsorFilters = { search: '', type: '', nationality: '', is_active: '' };
const contribution = (value: string) => /^\d+(\.\d+)?$/.test(value) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value)) : value;

export default function SponsorListPage() {
  const [items, setItems] = useState<SponsorView[]>([]);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SponsorView | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const pager = usePagination(items, 5);
  const load = () => { setLoading(true); getSponsors(applied).then(data => { setItems(data); setChecked([]); }).finally(() => setLoading(false)); };
  useEffect(load, [applied]);
  const nationalities = [...new Set(items.map(s => s.nationality))];
  const totalSponsors = items.length;
  const totalStudentsSponsored = items.reduce((sum, s) => sum + Number(s.students_count), 0);
  const pageIds = pager.current.map(s => s.sponsor_id);
  const allPageChecked = pageIds.length > 0 && pageIds.every(id => checked.includes(id));
  const toggle = (id: number) => setChecked(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const togglePage = () => setChecked(ids => allPageChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]);
  const confirmBulkDelete = async () => { await deactivateSponsors(checked, user?.username ?? 'admin'); setBulkOpen(false); toast(`${checked.length} sponsors removed.`, 'success'); load(); };

  const rows = pager.current.map(s => [<input aria-label={`Select ${s.full_name}`} type="checkbox" checked={checked.includes(s.sponsor_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(s.sponsor_id)} />, <div className="rowFlex"><Avatar name={s.full_name} /><div><button type="button" className="linkButton strong sponsorNameCell" onClick={() => setSelected(s)}>{s.full_name}</button></div></div>, <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>, s.nationality, s.ph_no, <strong>{contribution(s.contrib_amt)}</strong>, <Badge variant="assigned">{s.students_count}</Badge>, <div className="actions" onClick={e => e.stopPropagation()}><Button size="sm" variant="outline" onClick={() => setSelected(s)}>View</Button><Button size="sm" onClick={() => nav(`/sponsors/edit/${s.sponsor_id}`)}>Edit</Button></div>]);

  return <div><PageHeader title="Sponsors" subtitle="Individuals and organisations supporting students" actions={<><Button variant="outline">Export CSV</Button><Button variant="success" onClick={() => nav('/sponsors/assign')}>Assign to Student</Button><Button onClick={() => nav('/sponsors/add')}>Add Sponsor</Button></>} /><div className="statGrid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', marginBottom: 14 }}><StatCard label="TOTAL SPONSORS" value={totalSponsors} note="All sponsors" /><StatCard label="STUDENTS SPONSORED" value={totalStudentsSponsored} note="Across all sponsors" /></div><FilterBar className="filterBarInline" onGo={() => { setApplied({ ...pending }); pager.setPage(1); }} onClear={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); }} extraAction={<Button size="sm" variant="danger" disabled={checked.length === 0} onClick={() => setBulkOpen(true)}>Delete</Button>}><input className="input" style={{ minWidth: 260, maxWidth: 420, width: '100%' }} placeholder="Search sponsors" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} /><select className="select" style={{ minWidth: 180, maxWidth: 220 }} value={pending.nationality} onChange={e => setPending({ ...pending, nationality: e.target.value })}><option value="">All Nationality</option>{nationalities.map(n => <option key={n}>{n}</option>)}</select><select className="select" style={{ minWidth: 180, maxWidth: 220 }} value={pending.type} onChange={e => setPending({ ...pending, type: e.target.value })}><option value="">All Types</option><option>Individual</option><option>Organisation</option></select></FilterBar><DataTable loading={loading} columns={[{ key: 'select', label: '', width: '44px' }, { key: 's', label: 'Sponsor' }, { key: 't', label: 'Type' }, { key: 'n', label: 'Nationality' }, { key: 'p', label: 'Phone' }, { key: 'c', label: 'Contribution' }, { key: 'st', label: 'Students' }, { key: 'v', label: 'Actions' }]} rows={rows} /><div className="tableSelectAll"><label><input type="checkbox" checked={allPageChecked} onChange={togglePage} /> Select all on this page</label></div><Pagination total={items.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} /><SponsorModal sponsor={selected} onClose={() => setSelected(null)} /><ConfirmModal open={bulkOpen} onClose={() => setBulkOpen(false)} onConfirm={confirmBulkDelete} title="Delete Selected Sponsors" message={`Delete ${checked.length} selected sponsors?`} /></div>;
}

function SponsorModal({ sponsor, onClose }: { sponsor: SponsorView | null; onClose: () => void }) {
  const nav = useNavigate();
  if (!sponsor) return null;
  return <Modal open={!!sponsor} onClose={onClose} title={sponsor.full_name} width={680} footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => nav(`/sponsors/edit/${sponsor.sponsor_id}`)}>Modify Sponsor</Button></>}><div className="rowFlex" style={{ marginBottom: 18 }}><Avatar name={sponsor.full_name} size="lg" /><div><h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{sponsor.full_name}</h2><div className="actions" style={{ marginTop: 8 }}><Badge variant={sponsor.type === 'Organisation' ? 'organisation' : 'individual'}>{sponsor.type}</Badge><Badge variant="assigned">{sponsor.students_count} Students</Badge></div></div></div><div className="formGrid"><Info label="Email" value={sponsor.email} /><Info label="Phone" value={sponsor.ph_no} /><Info label="Nationality" value={sponsor.nationality} /><Info label="Contribution" value={contribution(sponsor.contrib_amt)} /><Info label="Date of Birth" value={sponsor.dob} /><Info label="Location" value={sponsor.loc} /></div></Modal>;
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="field"><span>{label}</span><div className="input" style={{ background: '#f8fafc' }}>{value || '-'}</div></div>;
}
