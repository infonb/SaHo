import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateSponsor, getSponsors } from '../../api/sponsorApi';
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
import type { SponsorFilters, SponsorView } from '../../types';

const defaults: SponsorFilters = { search: '', type: '', is_active: '' };
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export default function SponsorListPage() {
  const [items, setItems] = useState<SponsorView[]>([]);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [remove, setRemove] = useState<SponsorView | null>(null);
  const nav = useNavigate(); const { user } = useAuth(); const { toast } = useToast();
  const pager = usePagination(items, 5);
  const load = () => { setLoading(true); getSponsors(applied).then(setItems).finally(() => setLoading(false)); };
  useEffect(load, [applied]);
  const stop = (e: MouseEvent) => e.stopPropagation();
  const rows = pager.current.map(s => [<div className="rowFlex"><Avatar name={s.full_name} /><div><div className="strong">{s.full_name}</div><div className="sub">{s.email}</div></div></div>, <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>, s.ph_no, <strong>{money(s.contrib_amt)}</strong>, <Badge variant="assigned">{s.students_count}</Badge>, <Badge variant={s.is_active ? 'active' : 'inactive'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>, <div className="actions" onClick={stop}><Button size="sm" variant="outline" onClick={() => nav(`/sponsors/edit/${s.sponsor_id}`)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setRemove(s)}>Delete</Button></div>]);
  return <div><PageHeader title="Sponsors" subtitle="Individuals and organisations supporting students" actions={<><Button variant="outline">Export CSV</Button><Button variant="success" onClick={() => nav('/sponsors/assign')}>Assign to Student</Button><Button onClick={() => nav('/sponsors/add')}>Add Sponsor</Button></>} /><div className="statGrid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 14 }}><StatCard label="Total Sponsors" value={items.length} /><StatCard label="Active" value={items.filter(s => s.is_active).length} accentColor="var(--green)" /><StatCard label="Total Pledged" value={money(items.reduce((t, s) => t + s.contrib_amt, 0))} accentColor="var(--amber)" /></div><FilterBar onGo={() => { setApplied({ ...pending }); pager.setPage(1); }} onClear={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); }}><input className="input" placeholder="Search" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} /><select className="select" value={pending.type} onChange={e => setPending({ ...pending, type: e.target.value })}><option value="">All Types</option><option>Individual</option><option>Organisation</option></select></FilterBar><DataTable loading={loading} columns={[{ key: 's', label: 'Sponsor' }, { key: 't', label: 'Type' }, { key: 'p', label: 'Phone' }, { key: 'c', label: 'Contribution' }, { key: 'st', label: 'Students' }, { key: 'a', label: 'Status' }, { key: 'x', label: 'Actions' }]} rows={rows} /><Pagination total={items.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} /><ConfirmModal open={!!remove} onClose={() => setRemove(null)} onConfirm={async () => { if (remove) { await deactivateSponsor(remove.sponsor_id, user?.username ?? 'admin'); toast('Sponsor removed.', 'success'); setRemove(null); load(); } }} title="Remove Sponsor" message={`Deactivate ${remove?.full_name}?`} /></div>;
}
