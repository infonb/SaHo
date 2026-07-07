import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSort, FaSortUp, FaSortDown, FaUserCheck } from 'react-icons/fa';
import { deactivateSponsors, getSponsors } from '../../api/sponsorApi';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SponsorDetailsModal from '../../components/common/SponsorDetailsModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import SponsorSelectFilter from '../../components/common/SponsorSelectFilter';
import type { SponsorFilters, SponsorView } from '../../types';
import "../../styles/Sponsors/SponsorListPage.css";
import closeIcon from "../../assets/clera cross favicon.png"
import arrowIcon from "../../assets/Go arrow favicon.png"
import assignSponsorIcon from "../../assets/assignsponsor.png"
import { FiArrowRight, FiPlus, FiUsers } from "react-icons/fi";
import { FiUserPlus } from "react-icons/fi";
import { HiOutlineXMark } from "react-icons/hi2";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { LuLink, LuSearch } from "react-icons/lu";
import { MdVerifiedUser, MdVolunteerActivism } from 'react-icons/md';
const defaults: SponsorFilters = { search: '', type: '', nationality: '', is_active: '', studentCount: '', studentCountMin: '', studentCountMax: '' };
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
  const [globalSelection, setGlobalSelection] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const nav = useNavigate();
  const { toast } = useToast();
  const filteredItems = useMemo(() => {
    const sc = applied.studentCount;
    if (!sc) return items;
    let result = [...items];
    if (sc === '0') {
      result = result.filter(s => Number(s.students_count) === 0);
    } else if (sc === 'gt10') {
      result = result.filter(s => Number(s.students_count) > 10);
    } else if (sc === 'custom') {
      const min = Number(applied.studentCountMin);
      const max = Number(applied.studentCountMax);
      if (!isNaN(min)) {
        result = result.filter(s => Number(s.students_count) >= min);
      }
      if (!isNaN(max)) {
        result = result.filter(s => Number(s.students_count) <= max);
      }
    }
    return result;
  }, [items, applied.studentCount, applied.studentCountMin, applied.studentCountMax]);
  const sortedItems = useMemo(() => {
    const next = [...filteredItems];
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
  }, [filteredItems, sortColumn, sortDirection]);
  const pager = usePagination(sortedItems, 5);
  const load = () => {
    setLoading(true);
    getSponsors(applied, {
      pageNumber: 1,
      pageSize: 100,
    })
      .then(data => {
        setItems(data);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [applied]);
  const nationalities = [...new Set(items.map(s => s.nationality))];
  const totalSponsors = filteredItems.length;
  const totalStudentsSponsored = filteredItems.reduce((sum, s) => sum + Number(s.students_count), 0);
  const activeSponsors = filteredItems.filter(s => s.is_active).length;
  const pendingSponsors = filteredItems.filter(s => !s.is_active).length;
  const pageIds = pager.current.map(s => s.sponsor_id);
  const allSelected = globalSelection || checked.length >= totalSponsors;
  const hasSelection = globalSelection || checked.length > 0;
  const allPageChecked = allSelected || (pageIds.length > 0 && pageIds.every(id => checked.includes(id)));
  const showSelectAllLink = allPageChecked && !allSelected;
  const selectedSponsors = useMemo(() => filteredItems.filter(s => checked.includes(s.sponsor_id)), [checked, filteredItems]);
  const toggle = (id: number) => {
    if (globalSelection) {
      setGlobalSelection(false);
      const allIds = filteredItems.map(s => s.sponsor_id);
      setChecked(allIds.filter(x => x !== id));
      return;
    }
    setChecked(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };
  const togglePage = () => {
    if (globalSelection) {
      setChecked([]);
      setGlobalSelection(false);
    } else if (allPageChecked) {
      setChecked(ids => ids.filter(id => !pageIds.includes(id)));
    } else {
      setChecked(ids => [...new Set([...ids, ...pageIds])]);
    }
  };
  const selectAllMatchingSponsors = async () => {
    const ids = filteredItems.map(s => s.sponsor_id);
    setChecked(ids);
    setGlobalSelection(true);
    toast(`All ${ids.length} sponsors matching this search are selected.`, 'success');
  };
  const confirmBulkDelete = async () => {
    let ids = checked;
    if (globalSelection && ids.length === 0) {
      ids = filteredItems.map(s => s.sponsor_id);
    }
    await deactivateSponsors(ids);
    setChecked([]);
    setGlobalSelection(false);
    setBulkOpen(false);
    toast(`${ids.length} sponsors removed.`, 'success');
    load();
  };

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
    const exportRows = hasSelection ? (allSelected ? items : selectedSponsors) : items;
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
    link.download = hasSelection ? `selected-sponsors-${allSelected ? totalSponsors : checked.length}.csv` : 'sponsors.csv';
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
        <FiEdit2 size={18} />
      </Button>
      <Button size="sm" variant="outline" className="iconBtn deleteActionButton" onClick={(e) => { e.stopPropagation(); setSingleDelete(s.sponsor_id); }} title="Delete Sponsor" aria-label={`Delete ${s.sponsorName}`}>
        <FiTrash2 size={18} />
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
          <Button className="btnGreen" onClick={() => nav('/sponsors/assign')}>
            <FiUserPlus size={18}/>
            Assign Sponsor
          </Button>
          <Button className="btnGreen" onClick={() => nav('/sponsors/add')}>
            <FiPlus size={18} />
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
            <FiUsers />
          </div>
        </div>
        <div className="reminderRecordCard  total" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="stat-card-content">
            <div className="stat-card-label">Active</div>
            <div className="stat-card-value">{activeSponsors}</div>
            <div className="stat-card-note">Currently active</div>
          </div>
          <div className="stat-card-icon">
            
              <FaUserCheck size={28} />
          </div>
        </div>
       
        <div className="reminderRecordCard total" style={{ '--card-accent': '#22c55e' } as React.CSSProperties}>
          <div className="stat-card-content">
            <div className="stat-card-label">Students</div>
            <div className="stat-card-value">{totalStudentsSponsored}</div>
            <div className="stat-card-note">Sponsored</div>
          </div>
          <div className="stat-card-icon sponsoredIcon" aria-hidden="true">
            <MdVolunteerActivism size={30} />
          </div>
        </div>
      </div>

      <div className="student-filters-section sponsor-filters-section">
        <p className="filters-name-tag">Filters</p>
        <div className="filters-container sponsor-filters-container row g-2 align-items-center">
          <div className="filter-search-wrapper sponsor-search-wrapper col-4">
            <LuSearch className="search-icon" size={18} />
            <input className="filter-search-input" placeholder="Search sponsors" value={pending.search} onChange={e => setPending({ ...pending, search: e.target.value })} />
          </div>
          <div className="filter-group col-2">
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
          <div className="filter-group col-2">
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
          <div className="filter-group col-2">
            <SponsorSelectFilter
              filterKey="studentCount"
              label="Student Count"
              value={pending.studentCount}
              options={[
                { value: '', label: 'All Sponsors' },
                { value: '0', label: 'No Students (0)' },
                { value: 'gt10', label: 'Greater than 10' },
                { value: 'custom', label: 'Custom Range' },
              ]}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              onChange={studentCount => setPending({ ...pending, studentCount, studentCountMin: '', studentCountMax: '' })}
            />
          </div>
           <div className="filter-actions-group col-2 d-flex justify-content-end gap-2">
            <button className="clearbtn" onClick={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); setOpenFilter(null); }}>
              <HiOutlineXMark className="filterBtnIcon" />
              Clear
            </button>
            <button className="gobtn" onClick={() => { setApplied({ ...pending }); pager.setPage(1); setOpenFilter(null); }}>
              <FiArrowRight className="filterBtnIcon" />
              Go
            </button>
          </div>
          {pending.studentCount === 'custom' && (
            <div className="filter-group filter-range-group col-2">
              <div className="custom-range-container">
                <div className="custom-range-field">
                  {/* <label htmlFor="sc-min">From:</label> */}
                  <input
                    id="sc-min"
                    type="number"
                    min="0"
                    className="custom-range-input filter-search-input"
                    placeholder="Min"
                    value={pending.studentCountMin}
                    onChange={e => setPending({ ...pending, studentCountMin: e.target.value })}
                  />
                </div>
                <div className="custom-range-field">
                  {/* <label htmlFor="sc-max">To:</label> */}
                  <input
                    id="sc-max"
                    type="number"
                    min="0"
                    className="custom-range-input filter-search-input"
                    placeholder="Max"
                    value={pending.studentCountMax}
                    onChange={e => setPending({ ...pending, studentCountMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          {/* <div className="filter-actions-group col-2 d-flex justify-content-end gap-2">
            <button className="clearbtn" onClick={() => { setPending(defaults); setApplied(defaults); pager.setPage(1); setOpenFilter(null); }}>
              <HiOutlineXMark className="filterBtnIcon" />
              Clear
            </button>
            <button className="gobtn" onClick={() => { setApplied({ ...pending }); pager.setPage(1); setOpenFilter(null); }}>
              <FiArrowRight className="filterBtnIcon" />
              Go
            </button>
          </div> */}
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
              {allSelected ? (
                <>
                  <span className="selected-count">
                    All {totalSponsors} sponsors matching this search are selected.
                  </span>
                  <button className="clearSelectionLink" onClick={() => { setChecked([]); setGlobalSelection(false); }}>
                    Clear selection
                  </button>
                </>
              ) : (
                <>
                  <span className="selected-count">
                    Selected {checked.length} of {totalSponsors}
                  </span>
                  {showSelectAllLink ? (
                    <button className="selectAllLink" onClick={selectAllMatchingSponsors}>
                      Select all {totalSponsors} sponsors matching this search
                    </button>
                  ) : null}
                </>
              )}
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
              {loading ? [0, 1, 2].map(i => <div key={i} className="sponsorCard"><div className="skeleton" style={{ height: 120 }} /></div>) : pager.current.map(s => {
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
                        className="iconBtn editActionButton actionTooltip"
                        title="Edit Sponsor"
                        aria-label="Edit sponsor"
                        data-tooltip="Edit Sponsor"
                        onClick={(event) => {
                          event.stopPropagation();
                          nav(`/sponsors/edit/${s.sponsor_id}`);
                        }}
                      >
                        <FiEdit2 size={18} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="iconBtn deleteActionButton actionTooltip"
                        title="Delete Sponsor"
                        aria-label={`Delete ${s.sponsorName}`}
                        data-tooltip="Delete Sponsor"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSingleDelete(s.sponsor_id);
                        }}
                      >
                        <FiTrash2 size={18} />
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
                    <div className={`idSelectCell header${allPageChecked ? ' isSelectedHeader' : ''}`}>
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

      <SponsorDetailsModal open={!!selected} sponsor={selected} onClose={() => setSelected(null)} />
      <ConfirmModal open={singleDelete !== null} onClose={() => setSingleDelete(null)} onConfirm={confirmSingleDelete} title="Delete Sponsor" message="Delete selected sponsor?" />
      <ConfirmModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Sponsors"
        message={`Delete ${allSelected ? totalSponsors : checked.length} selected sponsors?`}
      />
    </div>
  );
}
