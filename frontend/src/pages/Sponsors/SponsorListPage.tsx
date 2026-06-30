import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { deactivateSponsors, getSponsors } from '../../api/sponsorApi';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import type { SponsorFilters, SponsorView } from '../../types';
import "../../styles/Sponsors/SponsorListPage.css";
import closeIcon from "../../assets/clera cross favicon.png"
import arrowIcon from "../../assets/Go arrow favicon.png"

const defaults: SponsorFilters = { search: '', type: '', nationality: '', is_active: '' };
type SponsorFilterOption = { value: string; label: string };
const nationalityOptions = [
  { label: 'Indian', value: '1' },
  { label: 'Foreigner', value: '2' },
];
const contribution = (value?: string | null, nationality?: string) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '-';
  if (/^[\u20b9\u0024\u20ac\u00a3\u00a5]/.test(trimmed) || /^[A-Z]{3}\s?\d/.test(trimmed)) return trimmed;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const currency = nationality?.toLowerCase() === 'indian' ? 'INR' : 'USD';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(trimmed));
  }
  return trimmed;
};
const truncateText = (value: string, limit = 15) =>
  value.length > limit ? `${value.slice(0, limit).trimEnd()}...` : value;

export default function SponsorListPage() {
  const [items, setItems] = useState<SponsorView[]>([]);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SponsorView | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const nav = useNavigate();
  const { toast } = useToast();
  const sortedItems = useMemo(() => {
    const next = [...items];
    if (!sortColumn || !sortDirection) return next;

    const direction = sortDirection === 'ASC' ? 1 : -1;
    next.sort((left, right) => {
      if (sortColumn === 'sponsor_id') {
        return ((left.sponsor_id ?? 0) - (right.sponsor_id ?? 0)) * direction;
      }

      if (sortColumn === 'sponsor_name') {
        return (left.sponsorName ?? '').localeCompare(right.sponsorName ?? '') * direction;
      }

      return 0;
    });

    return next;
  }, [items, sortColumn, sortDirection]);
  const pager = usePagination(sortedItems, 5);
  const load = () => {
    setLoading(true);
    getSponsors(applied, {
      pageNumber: 1,
      pageSize: 100,
    })
      .then(data => {
        setItems(data);
        setChecked([]);
      })
      .finally(() => setLoading(false));
  };
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === null) {
        setSortDirection('ASC');
      } else if (sortDirection === 'ASC') {
        setSortDirection('DESC');
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('ASC');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortColumn === field && sortDirection !== null) {
      return sortDirection === 'ASC' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  const sortHeader = (label: string, column: string) => (
    <button
      type="button"
      className="sortableHeader"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => handleSort(column)}
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      <span className="sortIcon" aria-hidden>
        {renderSortIcon(column)}
      </span>
    </button>
  );

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
      s.sponsorName,
      s.email,
      s.ph_no,
      s.type,
      s.nationality,
      s.contrib,
      s.students_count,
      s.loc ?? ''
    ]);
    const escapeCsvValue = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
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
    <div className="idSelectCell">
      <input aria-label={`Select ${s.sponsorName}`} type="checkbox" checked={checked.includes(s.sponsor_id)} onClick={e => e.stopPropagation()} onChange={() => toggle(s.sponsor_id)} />
      <span className="studentIdCell">{s.sponsor_id}</span>
    </div>,
    <div className="rowFlex studentCell">
      <Avatar name={s.sponsorName} size="md" />
      <div className="tableCellStack studentCellStack">
        <button
          type="button"
          className="cellTopText sponsorNameCell"
          onClick={() => setSelected(s)}
          title={s.sponsorName}
          aria-label={s.sponsorName}
        >
          {truncateText(s.sponsorName)}
        </button>
        <div className="cellSubText">{s.email}</div>
      </div>
    </div>,
    <span className={`sponsorTypeBadge ${s.type === 'Organisation' ? 'organisation' : 'individual'}`}>
      {s.type}
    </span>,
    s.nationality,
    s.ph_no,
    (() => {
      const value = contribution(s.contrib, s.nationality);
      return <strong title={value}>{truncateText(value)}</strong>;
    })(),
    <span>{s.students_count}</span>,
    <div className="actions student-actions" onClick={e => e.stopPropagation()}>
      <Button size="sm" variant="outline" className="iconBtn editActionButton" onClick={(e) => { e.stopPropagation(); nav(`/sponsors/edit/${s.sponsor_id}`); }} title="Edit Sponsor" aria-label="Edit sponsor">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
      <Button size="sm" variant="outline" className="iconBtn deleteActionButton" onClick={(e) => { e.stopPropagation(); setSingleDelete(s.sponsor_id); }} title="Delete Sponsor" aria-label={`Delete ${s.sponsorName}`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
    </div>
  ]);

  return (
    <div className="student-list-page sponsor-list-page">
      <div className="student-list-header">
        <div className="student-list-title">
          <h1>Sponsors</h1>
          <p>Individuals and organisations supporting students</p>
        </div>
        <div className="student-list-actions sponsor-list-actions">
          <Button className="btnGreen" onClick={() => nav('/sponsors/assign')}>Assign Sponsor</Button>
          <Button className="btnGreen" onClick={() => nav('/sponsors/add')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Sponsor
          </Button>
        </div>
      </div>

      <div className="student-stats-grid grid-cols-3">
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Sponsors</div>
            <div className="stat-card-value">{totalSponsors}</div>
            <div className="stat-card-note">All sponsors</div>
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
        <div className="reminderRecordCard  total" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="stat-card-content">
            <div className="stat-card-label">Active</div>
            <div className="stat-card-value">{activeSponsors}</div>
            <div className="stat-card-note">Currently active</div>
          </div>
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          </div>
        </div>
         {/* <div className="student-stat-card total" style={{ '--card-accent': '#f59e0b' } as React.CSSProperties}>
          <div className="stat-card-content">
            <div className="stat-card-label">Pending</div>
            <div className="stat-card-value">{pendingSponsors}</div>
            <div className="stat-card-note">Needs attention</div>
          </div> 
          <div className="stat-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 3"></path>
            </svg>
          </div>
        </div> */}
        <div className="reminderRecordCard total" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="stat-card-content">
            <div className="stat-card-label">Students</div>
            <div className="stat-card-value">{totalStudentsSponsored}</div>
            <div className="stat-card-note">Sponsored</div>
          </div>
          <div className="stat-card-icon sponsoredIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 20.4C8.4 18.6 4.7 15.1 4.7 10.8c0-2.8 2-4.9 4.7-4.9 1.5 0 2.9.7 3.7 1.9.8-1.2 2.2-1.9 3.7-1.9 2.7 0 4.7 2.1 4.7 4.9 0 4.3-3.7 7.8-8.7 9.6Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="student-filters-section sponsor-filters-section">
        <p className="filters-name-tag">Filters</p>
        <div className="filters-container sponsor-filters-container row g-2 align-items-center">
          <div className="filter-search-wrapper sponsor-search-wrapper col-4">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input className="filter-search-input" placeholder="Search sponsors" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} />
          </div>
          <div className="filter-group col-3">
            <SponsorSelectFilter
              filterKey="nationality"
              label="All Nationality"
              value={pending.nationality}
              options={nationalities.map(n => ({ value: n, label: n }))}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              onChange={nationality => setPending({ ...pending, nationality })}
            />
          </div>
          <div className="filter-group col-3">
            <SponsorSelectFilter
              filterKey="type"
              label="All Types"
              value={pending.type}
              options={[
                { value: 'Individual', label: 'Individual' },
                { value: 'Organisation', label: 'Organisation' },
              ]}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              onChange={type => setPending({ ...pending, type })}
            />
          </div>
          <div className="filter-actions-group col-2 d-flex  justify-content-end   gap-2">
            <button className="clearbtn" onClick={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); setOpenFilter(null); }}>
            <img
                  src={closeIcon}
                  alt="Clear"
                  className="filterBtnIcon"
                /> Clear
            </button>
            <button className="gobtn" onClick={() => { setApplied({ ...pending }); pager.setPage(1); setOpenFilter(null); }}>  <img
          src={arrowIcon}
         alt="Clear"
         className="filterBtnIcon"
           />        
             Go
            </button>
          </div>
        </div>
      </div>

      <div className={`panel studentRecordsPanel sponsorRecordsPanel ${viewMode === 'table' ? 'student-table-section' : ''} ${hasSelection ? 'bulkModeActive' : ''}`}>
        <div className="sponsorRecordsHeader">
          <h3 className="panelTitle">Sponsor Records <span style={{ fontSize: '13px', color: 'var(--color-text3)', fontWeight: 500, marginLeft: '10px' }}>{items.length} results</span></h3>
          <div className="viewToggle" aria-label="Sponsor view mode">
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
            <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>Cards</button>
          </div>
        </div>

        {viewMode === 'table' && (
        <div className={`bulkToolbarShell ${hasSelection ? 'isActive' : ''}`} aria-hidden={!hasSelection}>
          <div className="selectHeaderRow studentBulkToolbar">
            <div className="bulkToolbarInfo">
              <label className="bulkSelectAll">
                {/* <input type="checkbox" checked={allPageChecked} onChange={togglePage} tabIndex={hasSelection ? 0 : -1} /> */}
                <span   >Select all on this page</span>
              </label>
              <div className="selectedCount">
                Selected
                 <span>{checked.length}</span>
                <span>of {items.length}</span>
              </div>
            </div>
            <div className="bulkToolbarActions">
              <button className="btn btnGreen" onClick={exportSponsorsCsv} tabIndex={hasSelection ? 0 : -1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v3h16v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                &nbsp;Export CSV
              </button>
              <button
                className="btn btnRed"
                onClick={() => setBulkOpen(true)}
                disabled={!hasSelection}
                tabIndex={hasSelection ? 0 : -1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                 &nbsp;Delete selected
              </button>
            </div>
          </div>
        </div>
        )}

        {viewMode === 'cards' ? (
          <>
            <div className="sponsorCardGrid">
              {loading ? [0, 1, 2].map(i => <div key={i} className="sponsorCard"><div className="skeleton" style={{ height: 120 }} /></div>) : sortedItems.slice((pager.page - 1) * pager.pageSize, pager.page * pager.pageSize).map(s => {
                const sponsoredCount = Number(s.students_count) || 0;
                return (
                  <article key={s.sponsor_id} className="sponsorCard reminderRecordCard sponsorRecordCard">
                    <div className="sponsorCardTop">
                      <Avatar name={s.sponsorName} size="lg" />
                      <div className="sponsorCardIdentity">
                        <button
                          type="button"
                          className="linkButton sponsorNameCell"
                          onClick={() => setSelected(s)}
                          title={s.sponsorName}
                          aria-label={s.sponsorName}
                        >
                          {truncateText(s.sponsorName, 7)}
                        </button>
                        <div className="sponsorPhone">{s.ph_no || '-'}</div>
                        <div className="sponsorMetaLine">
                        <span className={`sponsorTypeBadge ${s.type === 'Organisation' ? 'organisation' : 'individual'}`}>
                          {s.type}
                        </span>
                        <span className="sponsorNationalityBadge">{s.nationality}</span>
                        </div>
                      </div>
                    </div>
                    <div className="sponsorMetricsGrid">
                      <div className="sponsorCardMetric">
                        <span>Contribution</span>
                        <strong>{contribution(s.contrib, s.nationality)}</strong>
                      </div>
                      <div className="sponsorCountCard">
                        <span>Students</span>
                        <strong>{sponsoredCount}</strong>
                      </div>
                    </div>
                    <div className="actions student-actions" onClick={(event) => event.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="iconBtn editActionButton"
                        title="Edit Sponsor"
                        aria-label="Edit sponsor"
                        onClick={(event) => {
                          event.stopPropagation();
                          nav(`/sponsors/edit/${s.sponsor_id}`);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 4l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="iconBtn deleteActionButton"
                        title="Delete Sponsor"
                        aria-label={`Delete ${s.sponsorName}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSingleDelete(s.sponsor_id);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination
              total={items.length}
              page={pager.page}
              pageSize={pager.pageSize}
              onChange={pager.setPage}
              onPageSizeChange={pager.setPageSize}
            />
          </>
        ) : (
          <div className="sponsorTableOuter">
            <DataTable
              loading={loading}
              columns={[
                {
                  key: 'id',
                  label: (
                    <div className="idSelectCell header">
                      <input
                        aria-label="Select all on this page"
                        type="checkbox"
                        checked={allPageChecked}
                        onChange={togglePage}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <span className="sortableHeaderWrap">{sortHeader('ID', 'sponsor_id')}</span>
                    </div>
                  ),
                  width: '92px'
                },
                { key: 's', label: sortHeader('SPONSOR', 'sponsor_name'), width: '240px' },
                { key: 't', label: 'TYPE', width: '120px' },
                { key: 'n', label: 'NATIONALITY', width: '120px' },
                { key: 'p', label: 'PHONE', width: '120px' },
                { key: 'c', label: 'CONTRIBUTION', width: '130px' },
                { key: 'st', label: 'STUDENTS', width: '80px' },
                { key: 'v', label: '', width: '90px' }
              ]}
              rows={rows}
              rowClassName={(index) => {
                const sponsor = pager.current[index];
                return `studentTableRow${sponsor && checked.includes(sponsor.sponsor_id) ? ' isSelected' : ''}`;
              }}
              footer={
                <Pagination
                  total={items.length}
                  page={pager.page}
                  pageSize={pager.pageSize}
                  onChange={pager.setPage}
                  onPageSizeChange={pager.setPageSize}
                />
              }
            />
          </div>
        )}
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
      title="Sponsor Details"
      width={680}
      footer={
        <>
          <Button className="clearbtn"
            variant="outline"
            
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            className="btn btnGreen"
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
          name={sponsor.sponsorName}
          size="lg"
        />

        <div>

          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)'
            }}
          >
            {sponsor.sponsorName}
          </h2>

          <div
            className="actions"
            style={{ marginTop: 8 }}
          >

            <span
              className={`sponsorTypeBadge ${
                sponsor.type === 'Organisation'
                  ? 'organisation'
                  : 'individual'
              }`}
            >
              {sponsor.type}
            </span>

            <Badge variant="assigned">
              {sponsor.students_count} Students
            </Badge>

          </div>
        </div>
      </div>

      <div className="formGrid sponsorDetailsModal">

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

function SponsorSelectFilter({
  filterKey,
  label,
  value,
  options,
  openFilter,
  setOpenFilter,
  onChange,
}: {
  filterKey: string;
  label: string;
  value: string;
  options: SponsorFilterOption[];
  openFilter: string | null;
  setOpenFilter: (value: string | null) => void;
  onChange: (value: string) => void;
}) {
  const isOpen = openFilter === filterKey;
  const filterRef = useRef<HTMLDetailsElement>(null);
  const summary = options.find(option => option.value === value)?.label ?? label;

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen, setOpenFilter]);

  return (
    <details ref={filterRef} className={`multiSelectFilter${value ? ' hasValue' : ''}`} open={isOpen}>
      <summary
        className="multiSelectTrigger"
        onClick={(event) => {
          event.preventDefault();
          setOpenFilter(isOpen ? null : filterKey);
        }}
      >
        <span>{summary}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="multiSelectMenu">
        <div className="multiSelectOptions">
          {options.map(option => (
            <button
              type="button"
              className={`multiSelectOption${value === option.value ? ' isSelected' : ''}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpenFilter(null);
              }}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

