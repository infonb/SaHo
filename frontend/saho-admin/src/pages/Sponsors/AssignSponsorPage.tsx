import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSponsors } from '../../api/sponsorApi';
import { getStudents } from '../../api/studentApi';
import { assignSponsor } from '../../api/studentSponsorApi';
import { getClasses } from '../../api/masterApi';
import { getStates, getDistricts, getMandals, getVillages, getSchools } from '../../api/locationApi';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import MultiSelectFilter, { csvValues, toggleCsvValue } from '../../components/common/MultiSelectFilter';
import type { FilterOption } from '../../components/common/MultiSelectFilter';
import type { SponsorView, StudentView } from '../../types';
import closeIcon from "../../assets/clera cross favicon.png"
import arrowIcon from "../../assets/Go arrow favicon.png"
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

const orphanStatusLabel = (value?: string | null) => {
  if (!value) return 'N/A';
  if (value === '3' || value?.toLowerCase() === 'orphan') return 'Orphan';
  if (value === '2' || value?.toLowerCase() === 'semi orphan') return 'Semi Orphan';
  if (value === '1' || value?.toLowerCase() === 'non-orphan') return 'Non-Orphan';
  return value;
};

const orphanStatusClass = (value?: string | null) => {
  if (!value) return 'default';
  const v = value.toLowerCase();
  if (v === '3' || v === 'orphan') return 'orphan';
  if (v === '2' || v === 'semi orphan' || v === 'semi' || v === 'single parent' || v === 'single') return 'semi';
  return 'default';
};

export default function AssignSponsorPage() {
  const [allStudents, setAllStudents] = useState<StudentView[]>([]);
  const [pageStudents, setPageStudents] = useState<StudentView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sponsors, setSponsors] = useState<SponsorView[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorView | null>(null);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsorType, setSponsorType] = useState('');
  const [checkedStudents, setCheckedStudents] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const filtersDefault = { search: '', gender: '', class_id: '', orphan_status: '', st_id: '', dist_id: '', mndl_id: '', vil_id: '', sch_id: '' };
  const [pending, setPending] = useState(filtersDefault);
  const [applied, setApplied] = useState(filtersDefault);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const loadSponsors = () => {
    getSponsors().then(setSponsors).catch(() => {});
  };

  const loadStudents = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const data = await getStudents({
        pageNumber: nextPage,
        pageSize: nextPageSize,
        filters: applied,
      });
      setPageStudents(data.students);
      setTotal(data.total);
    } catch {
      setPageStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsors();
    getStudents({ pageNumber: 1, pageSize: 10000 })
      .then(data => setAllStudents(data.students))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStudents(page, pageSize);
  }, [page, pageSize, applied]);

  useEffect(() => {
    let mounted = true;
    getStates().then(data => { if (mounted) setStates(data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    getClasses().then(data => { if (mounted) setClasses(data); }).catch(() => { if (mounted) setClasses([]); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!pending.st_id) { setDistricts([]); return; }
    const ids = csvValues(pending.st_id).map(Number).filter(Boolean);
    Promise.all(ids.map(id => getDistricts(id)))
      .then(results => setDistricts(Array.from(new Map(results.flat().map(d => [d.distId ?? d.dist_id, d])).values())))
      .catch(() => setDistricts([]));
  }, [pending.st_id]);

  useEffect(() => {
    if (!pending.dist_id) { setMandals([]); return; }
    const ids = csvValues(pending.dist_id).map(Number).filter(Boolean);
    Promise.all(ids.map(id => getMandals(id)))
      .then(results => setMandals(Array.from(new Map(results.flat().map(m => [m.mndlId ?? m.mndl_id, m])).values())))
      .catch(() => setMandals([]));
  }, [pending.dist_id]);

  useEffect(() => {
    if (!pending.mndl_id) { setVillages([]); return; }
    const ids = csvValues(pending.mndl_id).map(Number).filter(Boolean);
    Promise.all(ids.map(id => getVillages(id)))
      .then(results => setVillages(Array.from(new Map(results.flat().map(v => [v.vilId ?? v.vil_id, v])).values())))
      .catch(() => setVillages([]));
  }, [pending.mndl_id]);

  useEffect(() => {
    if (!pending.vil_id) { setSchools([]); return; }
    const ids = csvValues(pending.vil_id).map(Number).filter(Boolean);
    Promise.all(ids.map(id => getSchools(id)))
      .then(results => setSchools(Array.from(new Map(results.flat().map(s => [s.schId ?? s.sch_id, s])).values())))
      .catch(() => setSchools([]));
  }, [pending.vil_id]);

  const visibleSponsors = useMemo(() => {
    const q = sponsorSearch.trim().toLowerCase();
    const selectedTypes = csvValues(sponsorType);

    return sponsors.filter(s => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(s.type)) return false;
      if (!q) return true;
      return (
        s.sponsorName.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [sponsors, sponsorSearch, sponsorType]);

  const sponsorPager = usePagination(visibleSponsors, 10);
  const pageSponsors = sponsorPager.current;

  const sponsorTypeOptions: FilterOption[] = [
    { value: 'Individual', label: 'Individual' },
    { value: 'Organisation', label: 'Organisation' }
  ];

  const genderOptions: FilterOption[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  const orphanOptions: FilterOption[] = [
    { value: 'Orphan', label: 'Orphan' },
    { value: 'Non-Orphan', label: 'Non-Orphan' }
  ];

  const classFilterOptions = useMemo<FilterOption[]>(
    () => [...new Set(allStudents.map(s => s.class_id))].map(c => ({ value: c, label: c })),
    [allStudents]
  );

  const stateOptions = useMemo<FilterOption[]>(
    () => states.map(s => ({ value: String(s.stId ?? s.st_id), label: s.stName ?? s.st_name })),
    [states]
  );
  const districtOptions = useMemo<FilterOption[]>(
    () => districts.map(d => ({ value: String(d.distId ?? d.dist_id), label: d.distName ?? d.dist_name })),
    [districts]
  );
  const mandalOptions = useMemo<FilterOption[]>(
    () => mandals.map(m => ({ value: String(m.mndlId ?? m.mndl_id), label: m.mndlName ?? m.mndl_name })),
    [mandals]
  );
  const villageOptions = useMemo<FilterOption[]>(
    () => villages.map(v => ({ value: String(v.vilId ?? v.vil_id), label: v.vilName ?? v.vil_name })),
    [villages]
  );
  const schoolOptions = useMemo<FilterOption[]>(
    () => schools.map(s => ({ value: String(s.schId ?? s.sch_id), label: s.schName ?? s.sch_name })),
    [schools]
  );

  const showDistrictFilter = csvValues(pending.st_id).length > 0;
  const showMandalFilter = csvValues(pending.dist_id).length > 0;
  const showVillageFilter = csvValues(pending.mndl_id).length > 0;
  const showSchoolFilter = csvValues(pending.vil_id).length > 0;

  const toggleStudent = (id: number) => {
    setCheckedStudents(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const pageIds = pageStudents.map(s => s.student_id);
  const allPageChecked = pageIds.length > 0 && pageIds.every(id => checkedStudents.includes(id));

  const togglePage = () => {
    const pageIds = pageStudents.map(s => s.student_id);
    const allChecked = pageIds.length > 0 && pageIds.every(id => checkedStudents.includes(id));

    setCheckedStudents(ids =>
      allChecked ? ids.filter(id => !pageIds.includes(id)) : [...new Set([...ids, ...pageIds])]
    );
  };

  const selectedStudentsPreview = useMemo(() => {
    const map = new Map(allStudents.map(s => [s.student_id, s.full_name]));
    return checkedStudents.map(id => ({ id, name: map.get(id) ?? `Student ${id}` }));
  }, [allStudents, checkedStudents]);

  const handleSponsorSelect = (sponsor: SponsorView) => {
    setSelectedSponsor(prev => prev?.sponsor_id === sponsor.sponsor_id ? null : sponsor);
  };

  const sponsorRows = pageSponsors.map(s => [
    <div className="idSelectCell">
      <input
        type="radio"
         className="sponsor-radio"
        checked={selectedSponsor?.sponsor_id === s.sponsor_id}
        onChange={() => handleSponsorSelect(s)}
        onClick={e => e.stopPropagation()}
      />
      <span className="studentIdCell">{s.sponsor_id}</span>
    </div>,
    <div className="rowFlex sponsorCell">
      <Avatar name={s.sponsorName} size="md" />
      <div className="tableCellStack sponsorCellStack">
        <span className="cellTopText studentNameCell" title={s.sponsorName}>{s.sponsorName}</span>
        <span className="cellSubText">{s.email ?? ''}</span>
      </div>
    </div>,
    <div><span className={`typeBadge ${s.type === 'Organisation' ? 'organisation' : 'individual'}`}>{s.type}</span></div>,
    <div>{contribution(s.contrib)}</div>,
    <div>{s.students_count ?? 0}</div>
  ]);

  const studentRows = pageStudents.map(s => [
    <div className="idSelectCell">
      <input type="checkbox" checked={checkedStudents.includes(s.student_id)} onChange={() => toggleStudent(s.student_id)} onClick={e => e.stopPropagation()} />
      <span className="studentIdCell">{s.student_id}</span>
    </div>,
    <div className="rowFlex studentCell">
      <Avatar name={s.full_name} size="md" />
      <div className="tableCellStack studentCellStack">
        <span className="cellTopText studentNameCell" title={s.full_name}>{s.full_name}</span>
        <span className="cellSubText">{s.gender}</span>
      </div>
    </div>,
    <div>{s.class_id}</div>,
    <div className="tableCellStack">
      <div className="cellTopText" title={s.sch_name || 'N/A'}>{s.sch_name || 'N/A'}</div>
      <div className="cellSubText" title={[s.vil_name, s.dist_name].filter(Boolean).join(', ') || '-'}>
        <span className="cellIconInline" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        {[s.vil_name, s.dist_name].filter(Boolean).join(", ") || "-"}
      </div>
    </div>,
    <div className="orphanStatusCell">
      <span className={`orphanStatusBadge ${orphanStatusClass(s.orphan_status)}`}>
        {orphanStatusLabel(s.orphan_status)}
      </span>
    </div>,
    s.sponsor_id ? (
      <div title={s.sponsorName ?? '--'}>
        {s.sponsorName ? (
          <Avatar name={s.sponsorName} size="md" />
        ) : (
          <div className="avatar md">--</div>
        )}
      </div>
    ) : (
      <div title="--">
        <div className="avatar md">--</div>
      </div>
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
      loadSponsors();
      loadStudents(page, pageSize);
    } catch {
      toast('Unable to assign sponsor.', 'error');
    }
  };

  return (
    <div className="assign-page">
      <PageHeader
        title="Assign Sponsor to Students"
        actions={<Button variant="outline" className="clearbtn" onClick={() => nav(-1)}>Back</Button>}
      />

      <div className="assignGrid">
        <div className="assignStack">
          <div className="student-table-section sponsorRecordsPanel sponsorTableSection">
            <div className="table-header">
              <h3 className="table-title">Select Sponsor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 160 }}>
                  <MultiSelectFilter
                    filterKey="sponsor_type"
                    label="All Types"
                    value={sponsorType}
                    options={sponsorTypeOptions}
                    openFilter={openFilter}
                    setOpenFilter={setOpenFilter}
                    onChange={setSponsorType}
                  />
                </div>
                <div className="filter-search-wrapper" style={{ width: 320 }}>
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                  </svg>
                  <input
                    className="filter-search-input"
                    placeholder="Search sponsors..."
                    value={sponsorSearch}
                    onChange={e => setSponsorSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

              <DataTable
                loading={loading}
                columns={[
                  
                  { key: 'id', label: (<div className="idSelectCell header"><div style={{ width: '13px', height: '13px' }} aria-hidden="true" /><span>ID</span></div>), width: '92px' },
                    

                  { key: 's', label: 'Sponsor', width: '420px' },
                  { key: 't', label: 'Type', width: '140px' },
                  { key: 'c', label: 'Contribution', width: '180px' },
                  { key: 'st', label: 'Students Sponsored', width: '180px' }
                ]}
              rows={sponsorRows}
              onRowClick={(index) => setSelectedSponsor(pageSponsors[index] ?? null)}
              rowClassName={(index) => {
                const sponsor = pageSponsors[index];
                return `studentTableRow${sponsor && selectedSponsor?.sponsor_id === sponsor.sponsor_id ? ' isSelected' : ''}`;
              }}
              footer={
                <Pagination
                  total={visibleSponsors.length}
                  page={sponsorPager.page}
                  pageSize={sponsorPager.pageSize}
                  onChange={sponsorPager.setPage}
                  onPageSizeChange={sponsorPager.setPageSize}
                />
              }
            />
          </div>

          <div className="student-table-section studentRecordsPanel">
            <div className="table-header">
              <h3 className="table-title">Select Students</h3>
            </div>

            <div className="student-filters-section">
              <p className="filters-name-tag">Filters</p>
              <div className="container-fluid">
                <div className="row g-3">
                  <div className="col-2">
                    <MultiSelectFilter
                      filterKey="gender"
                      label="All Gender"
                      value={pending.gender}
                      options={genderOptions}
                      openFilter={openFilter}
                      setOpenFilter={setOpenFilter}
                      onChange={(value) =>
                        setPending({ ...pending, gender: value })
                      }
                    />
                  </div>
                  <div className="col-2">
                    <MultiSelectFilter
                      filterKey="orphan"
                      label="Orphan Status"
                      value={pending.orphan_status}
                      options={orphanOptions}
                      openFilter={openFilter}
                      setOpenFilter={setOpenFilter}
                      onChange={(value) =>
                        setPending({ ...pending, orphan_status: value })
                      }
                    />
                  </div>
                  <div className="col-2">
                    <MultiSelectFilter
                      filterKey="class"
                      label="All Classes"
                      value={pending.class_id}
                      options={classFilterOptions}
                      openFilter={openFilter}
                      setOpenFilter={setOpenFilter}
                      onChange={(value) =>
                        setPending({ ...pending, class_id: value })
                      }
                    />
                  </div>
                  <div className="col-2">
                    <MultiSelectFilter
                      filterKey="state"
                      label="All States"
                      value={pending.st_id}
                      options={stateOptions}
                      openFilter={openFilter}
                      setOpenFilter={setOpenFilter}
                      onChange={(value) =>
                        setPending({
                          ...pending,
                          st_id: value,
                          dist_id: '',
                          mndl_id: '',
                          vil_id: '',
                          sch_id: ''
                        })
                      }
                    />
                  </div>
                  <div className="col-4">
                    <div className="filter-search-wrapper">
                      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                      </svg>
                      <input
                        className="filter-search-input"
                        placeholder="Search students by name, ID..."
                        value={pending.search}
                        onChange={e => setPending({ ...pending, search: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="row g-3 mt-1">
                  {showDistrictFilter ? (
                    <div className="col-2">
                      <MultiSelectFilter
                        filterKey="district"
                        label="All Districts"
                        value={pending.dist_id}
                        options={districtOptions}
                        openFilter={openFilter}
                        setOpenFilter={setOpenFilter}
                        onChange={(value) =>
                          setPending({
                            ...pending,
                            dist_id: value,
                            mndl_id: '',
                            vil_id: '',
                            sch_id: ''
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="col-2" />
                  )}
                  {showMandalFilter ? (
                    <div className="col-2">
                      <MultiSelectFilter
                        filterKey="mandal"
                        label="All Mandals"
                        value={pending.mndl_id}
                        options={mandalOptions}
                        openFilter={openFilter}
                        setOpenFilter={setOpenFilter}
                        onChange={(value) =>
                          setPending({
                            ...pending,
                            mndl_id: value,
                            vil_id: '',
                            sch_id: ''
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="col-2" />
                  )}
                  {showVillageFilter ? (
                    <div className="col-2">
                      <MultiSelectFilter
                        filterKey="village"
                        label="All Villages"
                        value={pending.vil_id}
                        options={villageOptions}
                        openFilter={openFilter}
                        setOpenFilter={setOpenFilter}
                        onChange={(value) =>
                          setPending({
                            ...pending,
                            vil_id: value,
                            sch_id: ''
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="col-2" />
                  )}
                  {showSchoolFilter ? (
                    <div className="col-2">
                      <MultiSelectFilter
                        filterKey="school"
                        label="All Schools"
                        value={pending.sch_id}
                        options={schoolOptions}
                        openFilter={openFilter}
                        setOpenFilter={setOpenFilter}
                        onChange={(value) =>
                          setPending({
                            ...pending,
                            sch_id: value,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="col-2" />
                  )}
                  <div className="col-2" />
                  <div className="col-2" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <button
                      className="clearbtn"
                      onClick={() => {
                        setPending(filtersDefault);
                        setApplied(filtersDefault);
                        setOpenFilter(null);
                        setPage(1);
                      }}>
                      <img src={closeIcon} alt="Clear" className="filterBtnIcon" />
                      Clear
                    </button>
                    <button
                      className="gobtn"
                      onClick={() => {
                        setApplied({ ...pending });
                        setPage(1);
                        setOpenFilter(null);
                      }}
                    >
                      <img src={arrowIcon} alt="Go" className="filterBtnIcon" />
                      Go
                    </button>
                  </div>
                </div>
              </div>
            </div>
            

            <div className={`bulkToolbarShell ${checkedStudents.length > 0 ? 'isActive' : ''}`} aria-hidden={checkedStudents.length === 0}>
              <div className="selectHeaderRow studentBulkToolbar">
                <div className="bulkToolbarInfo">
                  <span className="bulkSelectAllText">Select all on this page</span>
                  <span className="selected-count">
                    Selected {checkedStudents.length} of {total}
                  </span>
                </div>
              </div>
            </div>

            <DataTable
              loading={loading}
              columns={[
                { key: 'id', label: <div className="idSelectCell header"><input type="checkbox" checked={allPageChecked} onChange={togglePage} onClick={e => e.stopPropagation()} /><span>ID</span></div>, width: '92px' },
                { key: 's', label: 'Student', width: '260px' },
                { key: 'class', label: 'Class', width: '88px' },
                { key: 'sch', label: 'School',  width: '235px' },
                { key: 'orphan', label: 'Orphan Status', width: '120px' },
                { key: 'cur', label: 'Sponsor', width: '120px' }
              ]}
              rows={studentRows}
              onRowClick={(index) => toggleStudent(pageStudents[index].student_id)}
              rowClassName={(index) => {
                const student = pageStudents[index];
                return `studentTableRow${student && checkedStudents.includes(student.student_id) ? ' isSelected' : ''}`;
              }}
            />

            <Pagination
              total={total}
              page={page}
              pageSize={pageSize}
              onChange={setPage}
              onPageSizeChange={(nextPageSize: number) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="assign-summary-sticky">
          <div className="panel assign-summary-panel">
            <div className="assignStepHead" style={{ marginBottom: 10 }}>
            {/* <div className="assignStepNum" style={{ background: 'var(--color-primary)' }}>✓</div> */}
            {/* <h3 className="panelTitle" style={{ margin: 0 }}>Assignment Summary</h3> */}
          </div>

          <div className="assignSummarySection">
            {/* <div className="sub assignSummaryLabel">Selected Sponsor</div> */}
            
             <h3 className="panelTitle" style={{ margin: 0, position: 'relative', bottom: '10px' }}>
              Selected Sponsor
             </h3>
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
          </div>

          <div className="assignDivider" />

          <div className="assignSummarySection assignSelectedStudentsSection">
            {/* <div className="sub assignSummaryLabel">Selected Students</div> */}
             <h3 className="panelTitle" style={{ margin: 0, position: 'relative', bottom: '5px' }}>
              Selected Students
             </h3>
            <div className="rowFlex" style={{ gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13,color:'grey'}}>{checkedStudents.length} Selected</div>
            </div>

            <div className="assignSelectedStudentsList">
              {checkedStudents.length === 0 ? (
                <div className="assignSummaryEmpty assignSummaryEmptyCompact">
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
              ) : (
                <div className="assignSelectedStudentsScroll">
                  {selectedStudentsPreview.map(s => (
                    <div key={s.id} className="assignSelectedStudentRow">
                      <span className="studentIdPlain">{s.id}</span>
                      <span className="assignSummaryStudentName" title={s.name}>{s.name}</span>
                     	  <button type="button" className="studentWizardClose" onClick={() => toggleStudent(s.id)}
                        aria-label={`Remove student ${s.id}`}
                      >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button

            variant="success"
            className="btnGreen"
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

            <div className="toast assignSummaryToast" style={{ marginTop: 12, position: 'static' }}>
              Once assigned, the selected students will be linked to the sponsor. You can reassign later if needed.
            </div>
          </div>
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
  cancelDanger={true}
  message={`Assign ${checkedStudents.length} students to ${selectedSponsor?.sponsorName}?`}
/>
    </div>
  );
}
