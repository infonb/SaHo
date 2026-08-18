import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSort, FaSortUp, FaSortDown, FaUserGraduate } from 'react-icons/fa';
import { deactivateStudents, exportStudentsCsv,getStudentIds, getStudents } from '../../api/studentApi';
import { getClasses } from '../../api/masterApi';
import { getStates, getDistricts, getMandals, getVillages, getSchools } from '../../api/locationApi';
import { getParentOccupations, getAcademicYears } from '../../api/studentService';
import { getSponsorById } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Avatar from '../../components/common/Avatar';
import StudentPhoto from '../../components/common/StudentPhoto';
import SponsorDetailsModal from '../../components/common/SponsorDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { StudentFilters, StudentView, SponsorView } from '../../types';
import StudentDetailModal from './StudentDetailModal';
import MultiSelectFilter, { csvValues, toggleCsvValue } from '../../components/common/MultiSelectFilter';
import type { FilterOption } from '../../components/common/MultiSelectFilter';
import { FiUpload, FiPlus, FiUsers, FiUser, FiDownload } from "react-icons/fi";
import { FaMars, FaVenus } from "react-icons/fa";
import { MdVolunteerActivism } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import { HiOutlineXMark } from "react-icons/hi2";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { LuSearch } from 'react-icons/lu';
import { downloadTemplate } from '../../api/importApi';
import ImportModal from '../../components/common/ImportModal';
const defaults: StudentFilters = { search: '', gender: '', class_id: '', academic_year_id: '', dist_id: '', st_id: '', mndl_id: '', vil_id: '', sch_id: '', orphan_status: '', parent_type: '', parent_occupation: '', sponsor_status: '', is_active: '' };
const truncateText = (value?: string | null, maxLength = 15) => {
  const text = value?.trim() || 'N/A';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
const orphanStatusLabel = (value?: string | null) => value === '3' ? 'Orphan' : value === '2' ? 'Semi Orphan' : value || 'N/A';
const orphanStatusClass = (value?: string | null) => {
  const label = orphanStatusLabel(value).toLowerCase();
  return label.includes("orphan") && !label.includes("semi")
    ? "orphan"
    : label.includes("semi") || label.includes("single")
      ? "semi"
      : "default";
};
const getSponsorDisplayName = (student: StudentView) => student.sponsorName ?? null;

export default function StudentListPage() {
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);
  const [sponsoredCount, setSponsoredCount] = useState(0);
  const [orphansCount, setOrphansCount] = useState(0);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [parentOccupationOptions, setParentOccupationOptions] = useState<FilterOption[]>([]);
  const [selected, setSelected] = useState<StudentView | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [globalSelection, setGlobalSelection] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorDetails, setSponsorDetails] = useState<SponsorView | null>(
    null,
  );
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | null>(null);
  const [showImport, setShowImport] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const totalStudents = total;
  const totalBoys = boysCount;
  const totalGirls = girlsCount;
  const totalSponsored = sponsoredCount;
  const totalOrphans = orphansCount;

  const load = async (nextPage = page, nextPageSize = pageSize) => {
    const scrollY = window.scrollY;
    const hasRows = students.length > 0;
    setLoading(!hasRows);
    setFetching(hasRows);
    setError(null);
    try {
      const data = await getStudents({
        pageNumber: nextPage,
        pageSize: nextPageSize,
        filters: applied,
        sortColumn: sortColumn ?? undefined,
        sortDirection: sortDirection ?? undefined,
      });
      setStudents(data.students);
      setTotal(data.total);
      setBoysCount(data.boysCount);
      setGirlsCount(data.girlsCount);
      setSponsoredCount(data.sponsoredCount);
      setOrphansCount(data.orphansCount);
    } catch {
      setStudents([]);
      setTotal(0);
      setBoysCount(0);
      setGirlsCount(0);
      setSponsoredCount(0);
      setOrphansCount(0);
      setChecked([]);
      setGlobalSelection(false);
      setError("Unable to load students from the database.");
    } finally {
      setLoading(false);
      setFetching(false);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      });
    }
  };

  useEffect(() => {
    load(page, pageSize);
  }, [page, pageSize, applied, sortColumn, sortDirection]);

  useEffect(() => {
    let mounted = true;
    getStates()
      .then((data) => {
        if (mounted) setStates(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!pending.st_id) {
      setDistricts([]);
      return;
    }
    const ids = csvValues(pending.st_id).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getDistricts(id)))
      .then((results) =>
        setDistricts(
          Array.from(
            new Map(
              results.flat().map((d) => [d.distId ?? d.dist_id, d]),
            ).values(),
          ),
        ),
      )
      .catch(() => setDistricts([]));
  }, [pending.st_id]);

  useEffect(() => {
    if (!pending.dist_id) {
      setMandals([]);
      return;
    }
    const ids = csvValues(pending.dist_id).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getMandals(id)))
      .then((results) =>
        setMandals(
          Array.from(
            new Map(
              results.flat().map((m) => [m.mndlId ?? m.mndl_id, m]),
            ).values(),
          ),
        ),
      )
      .catch(() => setMandals([]));
  }, [pending.dist_id]);

  useEffect(() => {
    if (!pending.mndl_id) {
      setVillages([]);
      return;
    }
    const ids = csvValues(pending.mndl_id).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getVillages(id)))
      .then((results) =>
        setVillages(
          Array.from(
            new Map(
              results.flat().map((v) => [v.vilId ?? v.vil_id, v]),
            ).values(),
          ),
        ),
      )
      .catch(() => setVillages([]));
  }, [pending.mndl_id]);

  useEffect(() => {
    if (!pending.vil_id) {
      setSchools([]);
      return;
    }
    const ids = csvValues(pending.vil_id).map(Number).filter(Boolean);
    Promise.all(ids.map((id) => getSchools(id)))
      .then((results) =>
        setSchools(
          Array.from(
            new Map(
              results.flat().map((s) => [s.schId ?? s.sch_id, s]),
            ).values(),
          ),
        ),
      )
      .catch(() => setSchools([]));
  }, [pending.vil_id]);

  useEffect(() => {
    let mounted = true;
    getClasses()
      .then((data) => {
        if (mounted) setClasses(data);
      })
      .catch(() => {
        if (mounted) setClasses([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getAcademicYears()
      .then((data) => {
        if (mounted) setAcademicYears(data);
      })
      .catch(() => {
        if (mounted) setAcademicYears([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getParentOccupations()
      .then((data) => {
        if (mounted) setParentOccupationOptions(data.map((o) => ({ value: o.value, label: o.label })));
      })
      .catch(() => {
        if (mounted) setParentOccupationOptions([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const districtDisabled = csvValues(pending.st_id).length === 0;
  const mandalDisabled = csvValues(pending.dist_id).length === 0;
  const villageDisabled = csvValues(pending.mndl_id).length === 0;
  const schoolDisabled = csvValues(pending.vil_id).length === 0;
  const parentOccupationDisabled = pending.parent_type === '' || pending.parent_type === 'orphan';
  const stateHasSelection = csvValues(pending.st_id).length > 0;
  const districtHasSelection = csvValues(pending.dist_id).length > 0;
  const mandalHasSelection = csvValues(pending.mndl_id).length > 0;
  const villageHasSelection = csvValues(pending.vil_id).length > 0;
  const parentTypeHasSelection = csvValues(pending.parent_type).length > 0;
  const showParentOccupation = parentTypeHasSelection && !csvValues(pending.parent_type).includes('orphan');
  const filteredStates = states;
  const stateOptions = filteredStates.map((s) => ({
    value: String(s.stId ?? s.st_id),
    label: s.stName ?? s.st_name,
  }));
  const districtOptions = districts.map((d) => ({
    value: String(d.distId ?? d.dist_id),
    label: d.distName ?? d.dist_name,
  }));
  const mandalOptions = mandals.map((m) => ({
    value: String(m.mndlId ?? m.mndl_id),
    label: m.mndlName ?? m.mndl_name,
  }));
  const villageOptions = villages.map((v) => ({
    value: String(v.vilId ?? v.vil_id),
    label: v.vilName ?? v.vil_name,
  }));
  const schoolOptions = schools.map((s) => ({
    value: String(s.schId ?? s.sch_id),
    label: s.schName ?? s.sch_name,
  }));
  const classOptions = classes.map((c) => ({
    value: String(c.classId ?? c.class_id),
    label: c.className ?? c.class_name,
  }));
  const academicYearOptions = academicYears.map((y) => ({
    value: String(y.academicYearId ?? y.academic_year_id),
    label: y.academicYearName ?? y.academic_year_name,
  }));
  const genderOptions = [
    { value: "1", label: "Male" },
    { value: "2", label: "Female" },
    { value: "3", label: "Other" },
  ];
  const orphanOptions = [
    { value: "3", label: "Orphan" },
    { value: "2", label: "Single Parent" },
  ];
  const parentTypeOptions = [
    { value: "single_mother", label: "Single Mother" },
    { value: "single_father", label: "Single Father" },
    { value: "both_alive", label: "Both Parents Alive" },
    { value: "orphan", label: "Orphan" },
  ];
  const pageIds = students.map((s) => s.student_id);
  const allSelected = globalSelection || checked.length >= total;
  const hasSelection = globalSelection || checked.length > 0;
  const allPageChecked = allSelected || (pageIds.length > 0 && pageIds.every((id) => checked.includes(id)));
  const showSelectAllLink = allPageChecked && !allSelected;

  const toggle = (id: number) => {
    if (globalSelection) {
      setGlobalSelection(false);
      getStudentIds(applied).then(allIds => {
        setChecked(allIds.filter(x => x !== id));
      }).catch(() => setChecked([]));
    } else {
      setChecked((ids) =>
        ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
      );
    }
  };
  const togglePage = () => {
    if (globalSelection) {
      setChecked([]);
      setGlobalSelection(false);
    } else if (allPageChecked) {
      setChecked((ids) => ids.filter((id) => !pageIds.includes(id)));
    } else {
      setChecked((ids) => [...new Set([...ids, ...pageIds])]);
    }
  };

  const selectAllMatchingStudents = async () => {
    try {
      const ids = await getStudentIds(applied);
      setChecked(ids);
      setGlobalSelection(true);
      toast(`All ${ids.length} students matching this search are selected.`, "success");
    } catch {
      toast("Failed to select all students.", "error");
    }
  };

  const confirmBulkDelete = async () => {
    let ids = checked;
    if (globalSelection && ids.length === 0) {
      ids = await getStudentIds(applied);
    }
    await deactivateStudents(ids, user?.username ?? "admin");
    const removedCount = ids.length;
    setChecked([]);
    setGlobalSelection(false);
    setBulkOpen(false);
    toast(`${removedCount} students removed.`, "success");
    load(page, pageSize);
  };

  const confirmSingleDelete = async () => {
    if (!singleDelete) return;
    await deactivateStudents([singleDelete], user?.username ?? "admin");
    setSingleDelete(null);
    toast("Student removed.", "success");
    load(page, pageSize);
  };

  const openSponsor = async (id: number) => {
    setSponsorDetails(null);
    const sp = await getSponsorById(id);
    if (sp) setSponsorDetails(sp);
    setSponsorOpen(true);
  };

  const handleSort = (column: string) => {
    setPage(1);
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
      setSortDirection("ASC");
    }
    setPage(1);
  };

  const handleExportCsv = async () => {
    const blob = await exportStudentsCsv({
      filters: applied,
      sortColumn: sortColumn ?? undefined,
      sortDirection: sortDirection ?? undefined,
      studentIds: allSelected ? undefined : (checked.length ? checked : undefined),
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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

  const rows = students.map(s => {
    const dob = new Date(s.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasBirthdayPassed) age -= 1;
    return [
      <div className="idSelectCell">
        <input
          aria-label={`Select ${s.full_name}`}
          type="checkbox"
          checked={checked.includes(s.student_id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggle(s.student_id)}
        />
        <span className="studentIdCell">{s.student_id}</span>
      </div>,
      <div className="rowFlex studentCell">
        <StudentPhoto name={s.full_name} src={s.image_url} size="md" />
        <div className="tableCellStack studentCellStack">
          <button
            type="button"
            className="cellTopText studentNameCell"
            onClick={() => setSelected(s)}
            title={s.full_name}
          >
            {truncateText(s.full_name, 25)}
          </button>
          <div className="cellSubText">{s.gender}</div>
        </div>
      </div>,
      <div>{age}</div>,
      <div>{s.class_id}</div>,
      <div className="tableCellStack">
        <div className="cellTopText" title={s.sch_name || 'N/A'}>{truncateText(s.sch_name, 18)}</div>
        <div className="cellSubText" title={[s.vil_name, s.dist_name].filter(Boolean).join(', ') || '-'}>
          <span className="cellIconInline" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {[s.vil_name, s.dist_name].filter(Boolean).join(", ") || "-"}
        </div>
      </div>,
      <div className="tableCellStack studentCellStack guardianCell">
        <div className="cellTopText" title={s.guardian_full_name || 'N/A'}>{truncateText(s.guardian_full_name, 15)}</div>
        <div className="cellSubText" title={s.guardian_relation_name || 'N/A'}>{truncateText(s.guardian_relation_name, 15)}</div>
      </div>,
      <div className="orphanStatusCell">
        <span
          className={`orphanStatusBadge ${orphanStatusClass(s.orphan_status)}`}
        >
          {orphanStatusLabel(s.orphan_status)}
        </span>
      </div>,
      <div>
        {s.sponsor_id ? (
          <button
            className="photoButton"
            onClick={(e) => { e.stopPropagation(); openSponsor(s.sponsor_id!); }}
            title={getSponsorDisplayName(s) ?? '--'}
          >
            {getSponsorDisplayName(s) ? ( 
              <Avatar name={getSponsorDisplayName(s) ?? ''} size="md" />
            ) : (
              <div className="avatar md">--</div>
            )}
          </button>
        ) : (
          <div title="--">
            <div className="avatar md">--</div>
          </div>
        )}
      </div>,
      <div
        className="actions student-actions"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="outline"
          className="iconBtn editActionButton"
          onClick={() => nav(`/students/edit/${s.student_id}`)}
          aria-label="Edit student"
        >
          <FiEdit2 size={18} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="iconBtn deleteActionButton"
          onClick={(e) => {
            e.stopPropagation();
            setSingleDelete(s.student_id);
          }}
          aria-label={`Delete ${s.full_name}`}
        >
          <FiTrash2 size={18} />
        </Button>
      </div>,
    ];
  });

  return (
    <div className="student-list-page">
      <div className="student-list-header">
        <div className="student-list-title">
          <h1>Student Management</h1>
        </div>
        <div className="student-list-actions">
          {/* <button type="button" className="btn btnGreen" onClick={downloadTemplate}>
            <FiDownload size={18} />
            &nbsp;Download Template
          </button> */}
          <button type="button" className="btn btnGreen" onClick={() => setShowImport(true)}>
            <FiUpload size={18} />
            &nbsp;Import Students
          </button>
          <button type="button" className="btn btnGreen" onClick={() => nav("/students/add")}>
          <FiPlus size={18} />
            &nbsp;Add Student
          </button>
        </div>
      </div>

      <div className="student-stats-grid grid-cols-5">
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Students</div>
            <div className="stat-card-value">{totalStudents}</div>
            <div className="stat-card-note">All enrolled</div>
          </div>
         
          <div className="stat-card-icon">
          <FiUsers />
          </div>
        </div>
        <div className="reminderRecordCard boys">
          <div className="stat-card-content">
            <div className="stat-card-label">Boys</div>
            <div className="stat-card-value">{totalBoys}</div>
            <div className="stat-card-note">Male students</div>
          </div>
          <div
            className="stat-card-icon"
            aria-hidden="true"
          >
            <FaMars size={26} />
            
          </div>
        </div>
        <div className="reminderRecordCard girls">
          <div className="stat-card-content">
            <div className="stat-card-label">Girls</div>
            <div className="stat-card-value">{totalGirls}</div>
            <div className="stat-card-note">Female students</div>
          </div>
          <div
            className="stat-card-icon"
            aria-hidden="true"
          >
          <FaVenus size={26} />
          </div>
        </div>
        <div className="reminderRecordCard sponsored">
          <div className="stat-card-content">
            <div className="stat-card-label">Sponsored</div>
            <div className="stat-card-value">{totalSponsored}</div>
            <div className="stat-card-note">With sponsors</div>
          </div>
          <div className="stat-card-icon" aria-hidden="true">
            <MdVolunteerActivism size={30} />
          </div>
        </div>
        <div className="reminderRecordCard orphans">
          <div className="stat-card-content">
            <div className="stat-card-label">Orphans</div>
            <div className="stat-card-value">{totalOrphans}</div>
            <div className="stat-card-note">Full orphans</div>
          </div>
          <div className="stat-card-icon">
            <FiUser />
          </div>
        </div>
      </div>

    <div className="student-filters-section">
  <p className="filters-name-tag">Filters</p>

  <div className="container-fluid">

    {/* Row 1 */}
    <div className="row g-2 align-items-center">

      {/* Gender */}
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

      {/* Orphan */}
      <div className="col-2">
        <MultiSelectFilter
          filterKey="orphan"
          label="Orphan Status"
          value={pending.orphan_status}
          options={orphanOptions}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          onChange={(value) =>
            setPending({
              ...pending,
              orphan_status: value,
            })
          }
        />
      </div>

      {/* Academic Year */}
      <div className="col-2">
        <MultiSelectFilter
          filterKey="academicYear"
          label="All Academic Years"
          value={pending.academic_year_id}
          options={academicYearOptions}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          onChange={(value) =>
            setPending({
              ...pending,
              academic_year_id: value,
            })
          }
        />
      </div>

      {/* Class */}
      <div className="col-2">
        <MultiSelectFilter
          filterKey="class"
          label="All Classes"
          value={pending.class_id}
          options={classOptions}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          onChange={(value) =>
            setPending({
              ...pending,
              class_id: value,
            })
          }
        />
      </div>

      {/* Search */}
      <div className="col-4">
        <div className="filter-search-wrapper">
          <LuSearch className="search-icon" size={18} />

          <input
            className="filter-search-input"
            placeholder="Search students by name, ID..."
            value={pending.search}
            onChange={(e) =>
              setPending({
                ...pending,
                search: e.target.value,
              })
            }
          />
        </div>
      </div>

    </div>

    {/* Row 2 - Location */}
    <div className="row g-2 mt-1 align-items-center">

      {/* State */}
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
              dist_id: "",
              mndl_id: "",
              vil_id: "",
              sch_id: "",
            })
          }
        />
      </div>

      {/* District */}
      {stateHasSelection && (
        <div className="col-2 filter-reveal">
          <MultiSelectFilter
            filterKey="district"
            label="All Districts"
            value={pending.dist_id}
            options={districtOptions}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            disabled={districtDisabled}
            onChange={(value) =>
              setPending({
                ...pending,
                dist_id: value,
                mndl_id: "",
                vil_id: "",
                sch_id: "",
              })
            }
          />
        </div>
      )}

      {/* Mandal */}
      {districtHasSelection && (
        <div className="col-2 filter-reveal">
          <MultiSelectFilter
            filterKey="mandal"
            label="All Mandals"
            value={pending.mndl_id}
            options={mandalOptions}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            disabled={mandalDisabled}
            onChange={(value) =>
              setPending({
                ...pending,
                mndl_id: value,
                vil_id: "",
                sch_id: "",
              })
            }
          />
        </div>
      )}

      {/* Village */}
      {mandalHasSelection && (
        <div className="col-2 filter-reveal">
          <MultiSelectFilter
            filterKey="village"
            label="All Villages"
            value={pending.vil_id}
            options={villageOptions}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            disabled={villageDisabled}
            onChange={(value) =>
              setPending({
                ...pending,
                vil_id: value,
                sch_id: "",
              })
            }
          />
        </div>
      )}

      {/* School */}
      {villageHasSelection && (
        <div className="col-2 filter-reveal">
          <MultiSelectFilter
            filterKey="school"
            label="All Schools"
            value={pending.sch_id}
            options={schoolOptions}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            disabled={schoolDisabled}
            onChange={(value) =>
              setPending({
                ...pending,
                sch_id: value,
              })
            }
          />
        </div>
      )}

    </div>

    {/* Row 3 - Parent filters & Buttons */}
    <div className="row g-2 mt-1 align-items-center">

      {/* Parent Type */}
      <div className="col-2">
        <MultiSelectFilter
          filterKey="parentType"
          label="Parent Type"
          value={pending.parent_type}
          options={parentTypeOptions}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          onChange={(value) =>
            setPending({
              ...pending,
              parent_type: value,
              parent_occupation: value === '' || value === 'orphan' ? '' : pending.parent_occupation,
            })
          }
        />
      </div>

      {/* Parent Occupation */}
      {showParentOccupation && (
        <div className="col-2 filter-reveal">
          <MultiSelectFilter
            filterKey="parentOccupation"
            label="Parent Occupation"
            value={pending.parent_occupation}
            options={parentOccupationOptions}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            disabled={parentOccupationDisabled}
            onChange={(value) =>
              setPending({ ...pending, parent_occupation: value })
            }
          />
        </div>
      )}

      {/* Buttons */}
      <div className="filter-actions-group col-auto ms-auto d-flex justify-content-end gap-2 align-items-center">

        <button
          className="clearbtn"
          onClick={() => {
            setPending(defaults);
            setApplied(defaults);
            setPage(1);
            setOpenFilter(null);
          }}
        >
          <HiOutlineXMark className="filterBtnIcon" />
          Clear
        </button>
        <button
          className="gobtn"
          onClick={() => { setApplied({ ...pending }); setPage(1); setOpenFilter(null); }}
        >
          <FiArrowRight className="filterBtnIcon" />
          Go
        </button>
      </div>

    </div>

  </div>
</div>

      <div
        className={`panel studentRecordsPanel student-table-section ${hasSelection ? "bulkModeActive" : ""}`}
      >
        <div className="sponsorRecordsHeader">
          <h3 className="panelTitle">Student Records <span className="results-count" style={{ marginLeft: '10px' }}>{total} results</span></h3>
          {fetching ? <span className="table-updating">Updating...</span> : null}
        </div>

        {error ? <div className="toast error studentListErrorToast">{error}</div> : null}

        <div
          className={`bulkToolbarShell ${hasSelection ? "isActive" : ""}`}
          aria-hidden={!hasSelection}
        >
          <div className="selectHeaderRow studentBulkToolbar">
            <div className="bulkToolbarInfo">
              {allSelected ? (
                <>
                  <span className="selected-count">
                    All {total} students matching this search are selected.
                  </span>
                  <button className="clearSelectionLink" onClick={() => { setChecked([]); setGlobalSelection(false); }}>
                    Clear selection
                  </button>
                </>
              ) : (
                <>
                  <span className="selected-count">
                    Selected {checked.length} of {total}
                  </span>
                  {showSelectAllLink ? (
                    <button className="selectAllLink" onClick={selectAllMatchingStudents}>
                      Select all {total} students matching this search
                    </button>
                  ) : null}
                </>
              )}
            </div>
            <div className="bulkToolbarActions">
              <button className="btn btnGreen" onClick={handleExportCsv}>
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 6h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 11v6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 11v6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                  &nbsp;Delete selected
              </button>
            </div>
          </div>
        </div>

        <div className="studentTableOuter">
          <DataTable
            loading={loading}
            loadingRowCount={Math.min(pageSize, 20)}
            columns={[
              { key: 'id', label: <div className={`idSelectCell header${allPageChecked ? ' isSelectedHeader' : ''}`}><input aria-label="Select all on this page" type="checkbox" checked={allPageChecked} onChange={togglePage} onClick={e => e.stopPropagation()} /><span className="sortableHeaderWrap">{sortHeader('ID', 'student_id')}</span></div>, width: '92px' },
              { key: 'student', label: sortHeader('STUDENT', 'student_name'), width: '250px' },
              { key: 'age', label: sortHeader('AGE', 'age'), width: '92px' },
              { key: 'grade', label: sortHeader('CLASS', 'class_name'), width: '88px' },
              { key: 'school', label: 'SCHOOL', width: '235px' },
              { key: 'guardian', label: 'GUARDIAN', width: '210px' },
              { key: 'orphan', label: 'STATUS', width: '150px' },
              { key: 'sponsor', label: 'SPONSOR', width: '120px' },
              { key: 'actions', label: '', width: '100px' }
            ]}
            rows={rows}
            onRowClick={(index) => setSelected(students[index] ?? null)}
            rowClassName={(index) => {
              const student = students[index];
              return `studentTableRow${student && checked.includes(student.student_id) ? ' isSelected' : ''}`;
            }}
            footer={
              <Pagination
                total={total}
                page={page}
                pageSize={pageSize}
                onChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            }
          />
        </div>
      </div>
      <StudentDetailModal student={selected} onClose={() => setSelected(null)} />
      <SponsorDetailsModal
        open={sponsorOpen}
        sponsor={sponsorDetails}
        onClose={() => setSponsorOpen(false)}
      />
      <ImportModal open={showImport} onClose={() => { setShowImport(false); load(page, pageSize); }} />

      <ConfirmModal
        open={singleDelete !== null}
        onClose={() => setSingleDelete(null)}
        onConfirm={confirmSingleDelete}
        title="Delete Student"
        message="Delete selected student?"
      />

      <ConfirmModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Students"
        message={`Delete ${allSelected ? total : checked.length} selected students?`}
      />
    </div>
  );
}

