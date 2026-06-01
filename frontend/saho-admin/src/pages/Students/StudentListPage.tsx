import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deactivateStudents, getStudents } from "../../api/studentApi";
import {
  getStates,
  getDistricts,
  getMandals,
  getVillages,
  getSchools,
} from "../../api/locationApi";
import { getSponsorById } from "../../api/sponsorApi";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import Avatar from "../../components/common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import type { StudentFilters, StudentView, SponsorView } from "../../types";
import StudentDetailModal from "./StudentDetailModal";
import Modal from "../../components/common/Modal";
const defaults: StudentFilters = {
  search: "",
  gender: "",
  class_id: "",
  dist_id: "",
  st_id: "",
  mndl_id: "",
  vil_id: "",
  sch_id: "",
  orphan_status: "",
  sponsor_status: "",
  is_active: "",
};
type FilterOption = { value: string; label: string };

const csvValues = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
const toggleCsvValue = (value: string, next: string) => {
  const values = csvValues(value);
  return values.includes(next)
    ? values.filter((v) => v !== next).join(",")
    : [...values, next].join(",");
};
const orphanStatusLabel = (value?: string | null) =>
  value === "3" ? "Orphan" : value === "2" ? "Semi Orphan" : value || "N/A";
const orphanStatusClass = (value?: string | null) => {
  const label = orphanStatusLabel(value).toLowerCase();
  return label.includes("orphan") && !label.includes("semi")
    ? "orphan"
    : label.includes("semi") || label.includes("single")
      ? "semi"
      : "default";
};

export default function StudentListPage() {
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selected, setSelected] = useState<StudentView | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<number | null>(null);
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorDetails, setSponsorDetails] = useState<SponsorView | null>(
    null,
  );
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const totalStudents = total;
  const totalBoys = students.filter((s) => s.gender === "Male").length;
  const totalGirls = students.filter((s) => s.gender === "Female").length;
  const totalSponsored = students.filter((s) => s.sponsor_id).length;
  const totalOrphans = students.filter((s) => s.orphan_status === "3").length;

  const load = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents({
        pageNumber: nextPage,
        pageSize: nextPageSize,
        filters: applied,
      });
      setStudents(data.students);
      setTotal(data.total);
    } catch {
      setStudents([]);
      setTotal(0);
      setChecked([]);
      setError("Unable to load students from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, pageSize);
  }, [page, pageSize, applied]);

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

  const allClasses = [...new Set(students.map((s) => s.class_id))];
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
  const genderOptions = [
    { value: "1", label: "Male" },
    { value: "2", label: "Female" },
    { value: "3", label: "Other" },
  ];
  const orphanOptions = [
    { value: "3", label: "Orphan" },
    { value: "2", label: "Single Parent" },
  ];
  const classOptions = allClasses.map((c) => ({ value: c, label: c }));
  const pageIds = students.map((s) => s.student_id);
  const hasSelection = checked.length > 0;
  const allPageChecked =
    pageIds.length > 0 && pageIds.every((id) => checked.includes(id));
  const toggle = (id: number) =>
    setChecked((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  const togglePage = () =>
    setChecked((ids) =>
      allPageChecked
        ? ids.filter((id) => !pageIds.includes(id))
        : [...new Set([...ids, ...pageIds])],
    );

  const confirmBulkDelete = async () => {
    await deactivateStudents(checked, user?.username ?? "admin");
    const removedCount = checked.length;
    setChecked([]);
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
    const sp = await getSponsorById(id);
    if (sp) setSponsorDetails(sp);
    setSponsorOpen(true);
  };

  const rows = students.map((s) => {
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
        <Avatar name={s.full_name} size="md" />
        <div className="tableCellStack studentCellStack">
          <button
            type="button"
            className="cellTopText studentNameCell"
            onClick={() => setSelected(s)}
          >
            {s.full_name}
          </button>
          <div className="cellSubText">{s.gender}</div>
        </div>
      </div>,
      <div>{age}</div>,
      <div>{s.class_id}</div>,
      <div className="tableCellStack">
        <div className="cellTopText">{s.sch_name || "N/A"}</div>
        <div className="cellSubText">
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
          {[s.vil_name, s.dist_name].filter(Boolean).join(", ") || "—"}
        </div>
      </div>,
      <div className="tableCellStack studentCellStack guardianCell">
        <div className="cellTopText">{s.guardian_full_name || "N/A"}</div>
        <div className="cellSubText">{s.guardian_relation_name || "N/A"}</div>
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
            onClick={(e) => {
              e.stopPropagation();
              openSponsor(s.sponsor_id!);
            }}
            title={s.sponsor_full_name ?? undefined}
          >
            <Avatar name={s.sponsor_full_name ?? "SP"} size="md" />
          </button>
        ) : (
          <div title="Saho Foundation">
            <Avatar name="Saho Foundation" size="md" />
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
          className="iconBtn"
          onClick={() => nav(`/students/edit/${s.student_id}`)}
          aria-label="Edit student"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M4 20h4.5L20.5 8l-4.5-4.5L4 15.5V20Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 4l6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M3 6h18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11v6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11v6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>,
    ];
  });

  return (
    <div className="student-list-page">
      <div className="student-list-header">
        <div className="student-list-title">
          <h1>Student management</h1>
        </div>
        <div className="student-list-actions">
          <Button
            className="add-student-btn"
            onClick={() => nav("/students/add")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Student
          </Button>
        </div>
      </div>

      <div className="student-stats-grid">
        <div className="student-stat-card total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total Students</div>
            <div className="stat-card-value">{totalStudents}</div>
            <div className="stat-card-note">All enrolled</div>
          </div>
          <div className="stat-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card boys">
          <div className="stat-card-content">
            <div className="stat-card-label">Boys</div>
            <div className="stat-card-value">{totalBoys}</div>
            <div className="stat-card-note">Male students</div>
          </div>
          <div
            className="stat-card-icon genderIcon maleIcon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <circle
                cx="10"
                cy="14"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.9"
              ></circle>
              <path
                d="M13.8 10.2L20 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M16 4H20V8"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card girls">
          <div className="stat-card-content">
            <div className="stat-card-label">Girls</div>
            <div className="stat-card-value">{totalGirls}</div>
            <div className="stat-card-note">Female students</div>
          </div>
          <div
            className="stat-card-icon genderIcon femaleIcon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="9.5"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.9"
              ></circle>
              <path
                d="M12 15v5.5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              ></path>
              <path
                d="M9.2 18H14.8"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              ></path>
            </svg>
          </div>
        </div>
        <div className="student-stat-card sponsored">
          <div className="stat-card-content">
            <div className="stat-card-label">Sponsored</div>
            <div className="stat-card-value">{totalSponsored}</div>
            <div className="stat-card-note">With sponsors</div>
          </div>
          <div className="stat-card-icon sponsoredIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20.4C8.4 18.6 4.7 15.1 4.7 10.8c0-2.8 2-4.9 4.7-4.9 1.5 0 2.9.7 3.7 1.9.8-1.2 2.2-1.9 3.7-1.9 2.7 0 4.7 2.1 4.7 4.9 0 4.3-3.7 7.8-8.7 9.6Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 14.3c1.1-1.1 2.2-1.9 3.7-2.4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M19 14.3c-1.1-1.1-2.2-1.9-3.7-2.4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M12 10.9l1.2-1.2c1-1 1.8-1.6 2.8-1.6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="student-stat-card orphans">
          <div className="stat-card-content">
            <div className="stat-card-label">Orphans</div>
            <div className="stat-card-value">{totalOrphans}</div>
            <div className="stat-card-note">Full orphans</div>
          </div>
          <div className="stat-card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12h18M3 6h18M3 18h18"></path>
              <circle cx="17" cy="12" r="3"></circle>
              <circle cx="7" cy="12" r="3"></circle>
            </svg>
          </div>
        </div>
      </div>

      <div className="student-filters-section">
        <div className="filters-container">
          <div className="filters-row filters-row-1">
            <div className="filter-search-wrapper">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input
                className="filter-search-input"
                placeholder="Search students by name, ID..."
                value={pending.search}
                onChange={(e) =>
                  setPending({ ...pending, search: e.target.value })
                }
              />
            </div>
            <div className="filter-group">
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
            <div className="filter-group">
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
                    mndl_id: "",
                    vil_id: "",
                    sch_id: "",
                  })
                }
              />
            </div>
            <div className="filter-group">
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
                    vil_id: "",
                    sch_id: "",
                  })
                }
              />
            </div>
            <div className="filter-empty-slot" aria-hidden="true" />
          </div>
          <div className="filters-row filters-row-2">
            <div className="filter-group">
              <MultiSelectFilter
                filterKey="village"
                label="All Villages"
                value={pending.vil_id}
                options={villageOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) =>
                  setPending({ ...pending, vil_id: value, sch_id: "" })
                }
              />
            </div>
            <div className="filter-group">
              <MultiSelectFilter
                filterKey="school"
                label="All Schools"
                value={pending.sch_id}
                options={schoolOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => setPending({ ...pending, sch_id: value })}
              />
            </div>
            <div className="filter-group">
              <MultiSelectFilter
                filterKey="gender"
                label="All Gender"
                value={pending.gender}
                options={genderOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) => setPending({ ...pending, gender: value })}
              />
            </div>
            <div className="filter-group">
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
            <div className="filter-group">
              <MultiSelectFilter
                filterKey="class"
                label="All Classes"
                value={pending.class_id}
                options={classOptions}
                openFilter={openFilter}
                setOpenFilter={setOpenFilter}
                onChange={(value) =>
                  setPending({ ...pending, class_id: value })
                }
              />
            </div>
          </div>
          <div className="filter-actions-group">
            <button
              className="clear-filters-btn"
              onClick={() => {
                setPending(defaults);
                setApplied(defaults);
                setPage(1);
              }}
            >
              <span className="filterBtnIcon" aria-hidden>
                x
              </span>{" "}
              Clear
            </button>
            <button
              className="go-filter-btn"
              onClick={() => {
                setApplied({ ...pending });
                setPage(1);
              }}
            >
              Go
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`student-table-section studentRecordsPanel ${hasSelection ? "bulkModeActive" : ""}`}
      >
        <div className="table-header">
          <h3 className="table-title">
            Student Records{" "}
            <span className="results-count">{total} results</span>
          </h3>
        </div>

        {error ? (
          <div
            className="toast error"
            style={{ position: "static", marginBottom: 12 }}
          >
            {error}
          </div>
        ) : null}

        <div
          className={`bulkToolbarShell ${hasSelection ? "isActive" : ""}`}
          aria-hidden={!hasSelection}
        >
          <div className="selectHeaderRow studentBulkToolbar">
            <div className="bulkToolbarInfo">
              <span className="bulkSelectAllText">Select all on this page</span>
              <span className="selected-count">
                Selected {checked.length} of {total}
              </span>
            </div>
            <div className="bulkToolbarActions">
              <Button
                size="sm"
                variant="outline"
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
                    d="M12 3v10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 11l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 17v3h16v-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
                Delete selected
              </Button>
            </div>
          </div>
        </div>

        <DataTable
          loading={loading}
          columns={[
            {
              key: "id",
              label: (
                <div className="idSelectCell header">
                  <input
                    aria-label="Select all on this page"
                    type="checkbox"
                    checked={allPageChecked}
                    onChange={togglePage}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>ID</span>
                </div>
              ),
              width: "92px",
            },
            { key: "student", label: "STUDENT" },
            { key: "age", label: "AGE", width: "72px" },
            { key: "grade", label: "CLASS", width: "88px" },
            { key: "school", label: "SCHOOL" },
            { key: "guardian", label: "GUARDIAN" },
            { key: "orphan", label: "STATUS" },
            { key: "sponsor", label: "SPONSOR" },
            { key: "actions", label: "" },
          ]}
          rows={rows}
          onRowClick={(index) => setSelected(students[index] ?? null)}
          rowClassName={(index) => {
            const student = students[index];
            return `studentTableRow${student && checked.includes(student.student_id) ? " isSelected" : ""}`;
          }}
        />
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
      </div>
      <StudentDetailModal
        student={selected}
        onClose={() => setSelected(null)}
      />
      <Modal
        open={sponsorOpen}
        onClose={() => setSponsorOpen(false)}
        title={sponsorDetails?.full_name ?? "Sponsor"}
        width={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setSponsorOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {sponsorDetails ? (
          <div>
            <h3 style={{ marginTop: 0 }}>{sponsorDetails.full_name}</h3>
            <div className="sub">
              {sponsorDetails.type} - {sponsorDetails.nationality}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800 }}>{sponsorDetails.email}</div>
              <div className="sub">{sponsorDetails.ph_no}</div>
              <div className="sub" style={{ marginTop: 8 }}>
                {sponsorDetails.loc}
              </div>
              <div style={{ marginTop: 12 }}>
                <strong>Contribution:</strong>{" "}
                <div className="sub" style={{ marginTop: 6 }}>
                  {sponsorDetails.contrib_amt}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <strong>Students Sponsored:</strong>{" "}
                <span className="strong">{sponsorDetails.students_count}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>No sponsor information available</div>
        )}
      </Modal>
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
        message={`Delete ${checked.length} selected students?`}
      />
    </div>
  );
}

function MultiSelectFilter({
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
  options: FilterOption[];
  openFilter: string | null;
  setOpenFilter: (value: string | null) => void;
  onChange: (value: string) => void;
}) {
  const selected = csvValues(value);
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const summary =
    selectedLabels.length === 0
      ? label
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;
  const isOpen = openFilter === filterKey;

  return (
    <details
      className={`multiSelectFilter${selected.length ? " hasValue" : ""}`}
      open={isOpen}
    >
      <summary
        className="multiSelectTrigger"
        onClick={(event) => {
          event.preventDefault();
          setOpenFilter(isOpen ? null : filterKey);
        }}
      >
        <span>{summary}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="multiSelectMenu">
        <div className="multiSelectMenuHead">
          <span>{label}</span>
          {selected.length ? (
            <button type="button" onClick={() => onChange("")}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="multiSelectOptions">
          {options.length ? (
            options.map((option) => (
              <label className="multiSelectOption" key={option.value}>
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => onChange(toggleCsvValue(value, option.value))}
                />
                <span>{option.label}</span>
              </label>
            ))
          ) : (
            <div className="multiSelectEmpty">No options available</div>
          )}
        </div>
      </div>
    </details>
  );
}
