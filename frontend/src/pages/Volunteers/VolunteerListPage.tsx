import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateVolunteer, getVolunteers } from '../../api/volunteerApi';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import type { User, VolunteerFilters } from '../../types';

const defaults: VolunteerFilters = { search: '', is_active: '' };
export default function VolunteerListPage() {
  const [items, setItems] = useState<User[]>([]); const [pending, setPending] = useState(defaults); const [applied, setApplied] = useState(defaults); const [remove, setRemove] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  const nav = useNavigate(); const { toast } = useToast(); const pager = usePagination(items, 5);
  const load = () => { setLoading(true); getVolunteers(applied).then(setItems).finally(() => setLoading(false)); };
  useEffect(load, [applied]);
  const stop = (e: MouseEvent) => e.stopPropagation();
  const rows = pager.current.map(v => [<div className="rowFlex"><Avatar name={v.username} /><div><strong>{v.username}</strong><div className="sub">{v.email_id}</div></div></div>, <Badge variant="volunteer">{v.role}</Badge>, <Badge variant={v.is_active ? 'active' : 'inactive'}>{v.is_active ? 'Active' : 'Inactive'}</Badge>, new Date(v.created_at).toLocaleDateString(), <div className="actions" onClick={stop}><Button size="sm" variant="outline" onClick={() => nav(`/volunteers/edit/${v.user_id}`)}>Edit</Button><Button size="sm" variant="danger" onClick={() => setRemove(v)}>Delete</Button></div>]);
  return <div><PageHeader title="Volunteers" subtitle="Volunteer users helping update field records" actions={<Button onClick={() => nav('/volunteers/add')}>Add Volunteer</Button>} /><div className="statGrid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 14 }}><StatCard label="Total" value={items.length} /><StatCard label="Active" value={items.filter(v => v.is_active).length} accentColor="var(--green)" /></div><FilterBar onGo={() => { setApplied({ ...pending }); pager.setPage(1); }} onClear={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); }}><input className="input" placeholder="Search" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} /><select className="select" value={pending.is_active} onChange={e => setPending({ ...pending, is_active: e.target.value })}><option value="">All Status</option><option value="true">Active</option><option value="false">Inactive</option></select></FilterBar><DataTable loading={loading} columns={[{ key: 'v', label: 'Volunteer' }, { key: 'r', label: 'Role' }, { key: 's', label: 'Status' }, { key: 'a', label: 'Added On' }, { key: 'x', label: 'Actions' }]} rows={rows} /><Pagination total={items.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} /><ConfirmModal open={!!remove} onClose={() => setRemove(null)} onConfirm={async () => { if (remove) { await deactivateVolunteer(remove.user_id); toast('Volunteer removed.', 'success'); setRemove(null); load(); } }} title="Remove Volunteer" message={`Deactivate ${remove?.username}?`} /></div>;
}
