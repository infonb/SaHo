import { useEffect, useMemo, useState } from 'react';
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
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const nav = useNavigate();
  const { toast } = useToast();
  const pager = usePagination(items, 5);
  const load = () => { setLoading(true); getSponsors(applied).then(data => { setItems(data); setChecked([]); }).finally(() => setLoading(false)); };
  useEffect(load, [applied]);
  const nationalities = [...new Set(items.map(s => s.nationality))];
  const totalSponsors = items.length;
  const totalStudentsSponsored = items.reduce((sum, s) => sum + Number(s.students_count), 0);
  const activeSponsors = items.filter(s => s.is_active).length;
  const pendingSponsors = items.filter(s => !s.is_active).length;
  const pageIds = pager.current.map(s => s.sponsor_id);
  const hasSelection = checked.length > 0;
  const selectedSponsors = useMemo(() => items.filter(s => checked.includes(s.sponsor_id)), [checked, items]);
  const allPageChecked = pageIds.length > 0 && pageIds.every(id => checked.includes(id));
  const toggle = (id: number) => setChecked(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const togglePage = () => setChecked(ids => allPageChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]);
  const confirmBulkDelete = async () => { await deactivateSponsors(checked); setBulkOpen(false); toast(`${checked.length} sponsors removed.`, 'success'); load(); };

  const confirmSingleDelete = async () => {
    if (!singleDelete) return;
    await deactivateSponsors([singleDelete]);
    setSingleDelete(null);
    toast('Sponsor removed.', 'success');
    load();
  };

  const exportSponsorsCsv = () => {
    const exportRows = hasSelection ? selectedSponsors : items;
    const headers = ['Sponsor ID', 'Name', 'Email', 'Phone', 'Type', 'Nationality', 'Contribution', 'Students Sponsored', 'Location'];
    const csvRows = exportRows.map(s => [
      s.sponsor_id,
      s.full_name,
      s.email,
      s.ph_no,
      s.type,
      s.nationality,
      s.contrib_amt,
      s.students_count,
      s.loc ?? ''
    ]);
    const escapeCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows].map(row => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = hasSelection ? `selected-sponsors-${checked.length}.csv` : 'sponsors.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const rows = pager.current.map(s => [
    <input aria-label={`Select ${s.sponsor_name}`} type="checkbox" checked={checked.includes(s.sponsor_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(s.sponsor_id)} />,
    <div className="rowFlex">
      <Avatar name={s.sponsor_name} size="md" />
      <div>
        <button type="button" className="linkButton strong sponsorNameCell" onClick={() => setSelected(s)}>{s.sponsor_name}</button>
      </div>
    </div>,
    <Badge variant={s.type === 'Organisation' ? 'organisation' : 'individual'}>{s.type}</Badge>,
    s.nationality,
    s.ph_no,
    <strong>{contribution(s.contrib)}</strong>,
    <Badge variant="assigned">{s.students_count}</Badge>,
    <div className="actions tableRowActions" onClick={e => e.stopPropagation()}>
      <Button size="sm" variant="outline" className="iconBtn" onClick={(e) => { e.stopPropagation(); nav(`/sponsors/edit/${s.sponsor_id}`); }} aria-label="Edit sponsor">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Button>
      <Button size="sm" variant="outline" className="iconBtn deleteActionButton" onClick={(e) => { e.stopPropagation(); setSingleDelete(s.sponsor_id); }} aria-label={`Delete ${s.sponsor_name}`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Button>
    </div>
  ]);

  return (
    <div>
      <PageHeader
        title="Sponsors"
        subtitle="Individuals and organisations supporting students"
        actions={<><Button variant="success" onClick={() => nav('/sponsors/assign')}>Assign Sponsor</Button><Button onClick={() => nav('/sponsors/add')}>Add Sponsor</Button></>}
      />

      <div className="statGrid sponsorStatsGrid" style={{ marginBottom: 14 }}>
        <StatCard label="TOTAL SPONSORS" value={totalSponsors} note="All sponsors" />
        <StatCard label="ACTIVE" value={activeSponsors} note="Currently active" />
        <StatCard label="PENDING" value={pendingSponsors} note="Needs attention" />
        <StatCard label="SPONSORED STUDENTS" value={totalStudentsSponsored} note="Across sponsors" />
      </div>

      <FilterBar
        className="filterBarInline"
        onGo={() => { setApplied({ ...pending }); pager.setPage(1); }}
        onClear={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); }}
      >
        <div className="filterGroup filterGroupWide">
          <input className="filterSearch" placeholder="Search sponsors" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} />
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.nationality} onChange={e => setPending({ ...pending, nationality: e.target.value })}>
            <option value="">All Nationality</option>
            {nationalities.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="filterGroup filterGroupCompact">
          <select className="select compact" value={pending.type} onChange={e => setPending({ ...pending, type: e.target.value })}>
            <option value="">All Types</option>
            <option>Individual</option>
            <option>Organisation</option>
          </select>
        </div>
      </FilterBar>

      <div className={`panel studentRecordsPanel ${hasSelection ? 'bulkModeActive' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
          <h3 className="panelTitle">Sponsor Records <span style={{ fontSize: '13px', color: 'var(--color-text3)', fontWeight: 500, marginLeft: '10px' }}>{items.length} results</span></h3>
          <div className="viewToggle" aria-label="Sponsor view mode">
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
          </div>
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
                <span>of {items.length}</span>
              </div>
            </div>
            <div className="bulkToolbarActions">
              <Button size="sm" variant="outline" onClick={exportSponsorsCsv} tabIndex={hasSelection ? 0 : -1}>
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

        {viewMode === 'cards' ? (
          <div className="sponsorCardGrid">
            {loading ? [0, 1, 2].map(i => <div key={i} className="sponsorCard"><div className="skeleton" style={{ height: 120 }} /></div>) : pager.current.map(s => {
              const progress = Math.min(100, Math.max(12, Number(s.students_count) * 18));
              return (
                <article key={s.sponsor_id} className="sponsorCard">
                  <div className="sponsorCardTop">
                    <Avatar name={s.full_name} size="lg" />
                    <div>
                      <button type="button" className="linkButton strong sponsorNameCell" onClick={() => setSelected(s)}>{s.full_name}</button>
                      <div className="sub">{s.type} - {s.nationality}</div>
                    </div>
                    <Badge variant={s.is_active ? 'assigned' : 'inactive'}>{s.is_active ? 'Active' : 'Pending'}</Badge>
                  </div>
                  <div className="sponsorCardMetric">
                    <span>Contribution</span>
                    <strong>{contribution(s.contrib_amt)}</strong>
                  </div>
                  <div className="sponsorCardProgress">
                    <div><span>{s.students_count} students</span><span>{progress}%</span></div>
                    <div className="progressTrack"><span style={{ width: `${progress}%` }} /></div>
                  </div>
                  <div className="sponsorCardActions">
                    <Button size="sm" variant="outline" onClick={() => nav(`/sponsors/edit/${s.sponsor_id}`)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => setSingleDelete(s.sponsor_id)}>Delete</Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <DataTable
            loading={loading}
            columns={[{ key: 'select', label: '', width: '44px' }, { key: 's', label: 'Sponsor' }, { key: 't', label: 'Type' }, { key: 'n', label: 'Nationality' }, { key: 'p', label: 'Phone' }, { key: 'c', label: 'Contribution' }, { key: 'st', label: 'Students' }, { key: 'v', label: '' }]}
            rows={rows}
            rowClassName={(index) => {
              const sponsor = pager.current[index];
              return `studentTableRow${sponsor && checked.includes(sponsor.sponsor_id) ? ' isSelected' : ''}`;
            }}
          />
        )}
        <Pagination total={items.length} page={pager.page} pageSize={pager.pageSize} onChange={pager.setPage} onPageSizeChange={pager.setPageSize} />
      </div>

      <SponsorModal sponsor={selected} onClose={() => setSelected(null)} />
      <ConfirmModal open={singleDelete !== null} onClose={() => setSingleDelete(null)} onConfirm={confirmSingleDelete} title="Delete Sponsor" message="Delete selected sponsor?" />
      <ConfirmModal open={bulkOpen} onClose={() => setBulkOpen(false)} onConfirm={confirmBulkDelete} title="Delete Selected Sponsors" message={`Delete ${checked.length} selected sponsors?`} />
    </div>
  );
}

function SponsorModal({
  sponsor,
  onClose
}: {
  sponsor: SponsorView | null;
  onClose: () => void;
}) {

  const nav = useNavigate();

  if (!sponsor) return null;

  return (

    <Modal
      open={!!sponsor}
      onClose={onClose}
      title={sponsor.sponsor_name}
      width={680}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            onClick={() =>
              nav(`/sponsors/edit/${sponsor.sponsor_id}`)
            }
          >
            Modify Sponsor
          </Button>
        </>
      }
    >

      <div
        className="rowFlex"
        style={{ marginBottom: 18 }}
      >

        <Avatar
          name={sponsor.sponsor_name}
          size="lg"
        />

        <div>

          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)'
            }}
          >
            {sponsor.sponsor_name}
          </h2>

          <div
            className="actions"
            style={{ marginTop: 8 }}
          >

            <Badge
              variant={
                sponsor.type === 'Organisation'
                  ? 'organisation'
                  : 'individual'
              }
            >
              {sponsor.type}
            </Badge>

            <Badge variant="assigned">
              {sponsor.students_count} Students
            </Badge>

          </div>
        </div>
      </div>

      <div className="formGrid">

        <Info
          label="Email"
          value={sponsor.email}
        />

        <Info
          label="Phone"
          value={sponsor.ph_no}
        />

        <Info
          label="Nationality"
          value={sponsor.nationality}
        />

        <Info
          label="Contribution"
          value={contribution(sponsor.contrib)}
        />

        <Info
          label="Date of Birth"
          value={sponsor.dob}
        />

        <Info
          label="Location"
          value={sponsor.loc}
        />

      </div>

    </Modal>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="field"><span>{label}</span><div className="input" style={{ background: '#f8fafc' }}>{value || '-'}</div></div>;
}
