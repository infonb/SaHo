import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiRotateCcw, FiEdit, FiArrowRight } from 'react-icons/fi';
import { LuSearch } from 'react-icons/lu';
import { getAllSchools } from '../../api/locationApi';
import { getAcademicYears, getClasses } from '../../api/studentService';
import {
  getClassMarksSheet,
  saveClassAnnualMarks,
  type ClassMarksSheet,
  type CourseSubjectMarksDto,
} from '../../api/studentMarksApi';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import '../../styles/Marks/AddStudentMarks.css';
import '../../styles/Marks/StudentMarksPage.css';

const PASS_MARKS = 35;
const MAX_MARKS = 100;

interface Option {
  value: string;
  label: string;
}

interface StudentRow {
  studentAcademicId: number;
  studentId: number;
  rollNumber: string | null;
  studentName: string;
  status?: string | null;
}

const toNumber = (value: string): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const cellKey = (studentAcademicId: number, courseSubjectId: number): string =>
  `${studentAcademicId}:${courseSubjectId}`;

const statusToOutcome = (status?: string | null): string => {
  if (status === '3') return 'TRANSFERRED';
  if (status === '4') return 'DROPPED';
  return 'AUTO';
};

const isOutcomeLocked = (status?: string | null): boolean => !!status && status !== '1';

const outcomeLabel = (outcome: string): string => {
  if (outcome === 'TRANSFERRED') return 'Transferred';
  if (outcome === 'DROPPED') return 'Dropped';
  return 'Auto';
};

const outcomeBadgeClass = (outcome: string): string => {
  if (outcome === 'TRANSFERRED') return 'transferred';
  if (outcome === 'DROPPED') return 'dropped';
  return 'active';
};

export default function StudentMarksPage() {
  const nav = useNavigate();
  const { toast } = useToast();

  const [academicYears, setAcademicYears] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');

  const [sheet, setSheet] = useState<ClassMarksSheet | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [outcomes, setOutcomes] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingYears(true);
    getAcademicYears()
      .then((years) => {
        const options = years
          .filter((y) => y.academicYearId && y.academicYearName)
          .map((y) => ({ value: String(y.academicYearId), label: y.academicYearName as string }));
        setAcademicYears(options);
      })
      .catch(() => toast('Failed to load academic years.', 'error'))
      .finally(() => setLoadingYears(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!academicYearId) {
      setSchools([]);
      setSchoolId('');
      return;
    }
    setLoadingSchools(true);
    setSchools([]);
    setSchoolId('');
    setClassId('');
    setSheet(null);
    setMarks({});
    setOutcomes({});
    setDirty(false);
    getAllSchools()
      .then((list: any[]) => {
        const options = list
          .filter((s) => s.schId && s.schName)
          .map((s) => ({ value: String(s.schId), label: String(s.schName) }));
        setSchools(options);
      })
      .catch(() => toast('Failed to load schools.', 'error'))
      .finally(() => setLoadingSchools(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearId]);

  useEffect(() => {
    if (!schoolId) {
      setClasses([]);
      setClassId('');
      return;
    }
    setLoadingClasses(true);
    setClasses([]);
    setClassId('');
    setSheet(null);
    setMarks({});
    setOutcomes({});
    setDirty(false);
    getClasses()
      .then((list) => {
        const options = list
          .filter((c) => c.classId && c.className)
          .map((c) => ({ value: String(c.classId), label: String(c.className) }));
        setClasses(options);
      })
      .catch(() => toast('Failed to load classes.', 'error'))
      .finally(() => setLoadingClasses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const handleLoadSheet = async () => {
    if (!academicYearId || !schoolId || !classId) {
      toast('Please select academic year, school and class first.', 'error');
      return;
    }
    setLoadingSheet(true);
    setSheet(null);
    setMarks({});
    setDirty(false);
    try {
      const data = await getClassMarksSheet(
        Number(academicYearId),
        Number(schoolId),
        Number(classId),
      );
      setSheet(data);
      const next: Record<string, string> = {};
      const nextOutcomes: Record<string, string> = {};
      data.students.forEach((st) => {
        nextOutcomes[String(st.studentAcademicId)] = statusToOutcome(st.status);
        data.subjects.forEach((sub) => {
          const row = data.existingMarks?.[String(st.studentAcademicId)]?.[String(sub.courseSubjectId)];
          const existing = row?.marks ?? null;
          next[cellKey(st.studentAcademicId, sub.courseSubjectId)] =
            existing !== null && existing !== undefined ? String(existing) : '';
        });
      });
      setMarks(next);
      setOutcomes(nextOutcomes);
      if (data.students.length === 0) {
        toast('No eligible students found for the selected class.', 'error');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Failed to load the class marks sheet.';
      toast(String(message), 'error');
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleMarksChange = (studentAcademicId: number, courseSubjectId: number, value: string) => {
    setMarks((prev) => ({ ...prev, [cellKey(studentAcademicId, courseSubjectId)]: value }));
    setDirty(true);
  };

  const handleOutcomeChange = (studentAcademicId: number, value: string) => {
    setOutcomes((prev) => ({ ...prev, [String(studentAcademicId)]: value }));
    setDirty(true);
  };

  const filteredStudents: StudentRow[] = useMemo(() => {
    if (!sheet) return [];
    const q = searchText.trim().toLowerCase();
    if (!q) return sheet.students;
    return sheet.students.filter((s) => {
      const name = (s.studentName || '').toLowerCase();
      const roll = (s.rollNumber || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [sheet, searchText]);

  const incompleteStudentIds = useMemo(() => {
    if (!sheet) return new Set<number>();
    const incomplete = new Set<number>();
    sheet.students.forEach((st) => {
      let entered = 0;
      for (const sub of sheet.subjects) {
        const value = toNumber(marks[cellKey(st.studentAcademicId, sub.courseSubjectId)] ?? '');
        if (value !== null) entered += 1;
      }
      if (entered > 0 && entered < sheet.subjects.length) {
        incomplete.add(st.studentAcademicId);
      }
    });
    return incomplete;
  }, [sheet, marks]);

  const studentSummary = useMemo(() => {
    if (!sheet) return new Map<number, { total: number; max: number; percentage: number | null; result: string | null }>();
    const summary = new Map<number, { total: number; max: number; percentage: number | null; result: string | null }>();
    sheet.students.forEach((st) => {
      let total = 0;
      let count = 0;
      let anyFail = false;
      for (const sub of sheet.subjects) {
        const value = toNumber(marks[cellKey(st.studentAcademicId, sub.courseSubjectId)] ?? '');
        if (value !== null && value >= 0 && value <= MAX_MARKS) {
          total += value;
          count += 1;
          if (value < PASS_MARKS) anyFail = true;
        }
      }
      const max = sheet.subjects.length * MAX_MARKS;
      const complete = sheet.subjects.length > 0 && count === sheet.subjects.length;
      const percentage = complete && max > 0 ? (total / max) * 100 : null;
      const result = complete ? (anyFail ? 'FAIL' : 'PASS') : null;
      summary.set(st.studentAcademicId, { total, max, percentage, result });
    });
    return summary;
  }, [sheet, marks]);

  const handleSaveAll = async () => {
    if (!sheet) {
      toast('Please load a class first.', 'error');
      return;
    }
    if (sheet.subjects.length === 0) {
      toast('No subjects configured for this class.', 'error');
      return;
    }
    if (incompleteStudentIds.size > 0) {
      const names = sheet.students
        .filter((s) => incompleteStudentIds.has(s.studentAcademicId))
        .slice(0, 5)
        .map((s) => s.studentName)
        .join(', ');
      toast(`Complete marks for all subjects before saving. Incomplete: ${names}${incompleteStudentIds.size > 5 ? '…' : ''}`, 'error');
      return;
    }

    const students = sheet.students
      .map((st) => ({
        studentAcademicId: st.studentAcademicId,
        outcome: isOutcomeLocked(st.status) ? undefined : (outcomes[String(st.studentAcademicId)] ?? 'AUTO'),
        marks: sheet.subjects.map((sub) => ({
          courseSubjectId: sub.courseSubjectId,
          marks: toNumber(marks[cellKey(st.studentAcademicId, sub.courseSubjectId)] ?? ''),
        })),
      }))
      .filter((entry) => entry.marks.some((m) => m.marks !== null))
      .map((entry) => ({
        studentAcademicId: entry.studentAcademicId,
        outcome: entry.outcome,
        marks: entry.marks as { courseSubjectId: number; marks: number }[],
      }));

    if (students.length === 0) {
      toast('No marks entered to save.', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await saveClassAnnualMarks({
        academicYearId: Number(academicYearId),
        schoolId: Number(schoolId),
        classId: Number(classId),
        students,
      });
      setSheet(result);
      const next: Record<string, string> = {};
      const nextOutcomes: Record<string, string> = {};
      result.students.forEach((st) => {
        nextOutcomes[String(st.studentAcademicId)] = statusToOutcome(st.status);
        result.subjects.forEach((sub) => {
          const row = result.existingMarks?.[String(st.studentAcademicId)]?.[String(sub.courseSubjectId)];
          const existing = row?.marks ?? null;
          next[cellKey(st.studentAcademicId, sub.courseSubjectId)] =
            existing !== null && existing !== undefined ? String(existing) : '';
        });
      });
      setMarks(next);
      setOutcomes(nextOutcomes);
      setDirty(false);
      const outcomeCounts = Object.values(result.outcomes ?? {}).reduce(
        (acc, o) => {
          acc[o.outcome] = (acc[o.outcome] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const outcomeParts = Object.entries(outcomeCounts)
        .map(([key, count]) => `${key}: ${count}`)
        .join(', ');
      toast(
        `Saved marks for ${students.length} student(s). Outcome${outcomeParts ? ` - ${outcomeParts}` : ''}`,
        'success',
      );
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Failed to save marks.';
      toast(String(message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => {
    setSearchText('');
    void handleLoadSheet();
  };

  const classLabel = sheet?.className ?? classes.find((c) => c.value === classId)?.label ?? '';

  return (
    <div className="student-list-page marks-list-page">
      <div className="student-list-header">
        <div className="student-list-title">
          <h1>Student Marks</h1>
          <p>Enter and manage annual marks for an entire class</p>
        </div>
        <div className="student-list-actions">
          <button type="button" className="btn outline md" onClick={handleReload} disabled={loadingSheet}>
            <FiRotateCcw size={16} />
            &nbsp;Reload
          </button>
          <button
            type="button"
            className="btn btnGreen md"
            onClick={() =>
              nav(`/marks/add?academicYearId=${academicYearId}&schoolId=${schoolId}&classId=${classId}`)
            }
          >
            <FiEdit size={16} />
            &nbsp;Edit Individual
          </button>
        </div>
      </div>

      <div className="student-filters-section">
        <p className="filters-name-tag">Filters</p>
        <div className="container-fluid">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <select
                className="select"
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                disabled={loadingYears}
              >
                <option value="">{loadingYears ? 'Loading…' : 'Academic Year'}</option>
                {academicYears.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="select"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                disabled={!academicYearId || loadingSchools}
              >
                <option value="">
                  {!academicYearId ? 'Select Academic Year first' : loadingSchools ? 'Loading…' : 'School'}
                </option>
                {schools.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select
                className="select"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={!schoolId || loadingClasses}
              >
                <option value="">
                  {!schoolId ? 'Select School first' : loadingClasses ? 'Loading…' : 'Class'}
                </option>
                {classes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <button
                type="button"
                className="gobtn"
                onClick={handleLoadSheet}
                disabled={!academicYearId || !schoolId || !classId}
              >
                <FiArrowRight className="filterBtnIcon" />
                {loadingSheet ? 'Loading…' : 'Load Students'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {sheet && (
        <div className="panel marksGridPanel">
          <div className="sponsorRecordsHeader">
            <h3 className="panelTitle">
              Class {classLabel} - Annual Marks
              <span className="results-count" style={{ marginLeft: '10px' }}>
                {sheet.students.length} students · {sheet.subjects.length} subjects
                {dirty && <span className="classSheetDirty"> · unsaved changes</span>}
              </span>
            </h3>
            <div className="filter-search-wrapper">
              <LuSearch className="search-icon" size={18} />
              <input
                className="filter-search-input"
                placeholder="Search student (name / roll)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {loadingSheet ? (
            <div className="marksLoading">Loading class marks…</div>
          ) : sheet.students.length === 0 ? (
            <div className="marksLoading">No eligible students found for this class.</div>
          ) : sheet.subjects.length === 0 ? (
            <div className="marksLoading">No subjects configured for this class.</div>
          ) : (
            <div className="tableWrap classGridWrap">
              <table className="table marksTable classGridTable">
                <thead>
                  <tr>
                    <th className="classGridStickyCell" style={{ width: '44px' }}>S.No</th>
                    <th className="classGridStickyCell" style={{ minWidth: '150px' }}>Student</th>
                    <th className="classGridStickyCell" style={{ width: '90px' }}>Roll</th>
                    {sheet.subjects.map((sub) => (
                      <th key={sub.courseSubjectId} style={{ minWidth: '110px' }} title={sub.subjectCode || ''}>
                        <div className="classSubjectHeader">
                          <span>{sub.subjectName || '-'}</span>
                          <small>{sub.subjectCode || ''}</small>
                        </div>
                      </th>
                    ))}
                    <th style={{ width: '90px' }}>Total</th>
                    <th style={{ width: '100px' }}>%</th>
                    <th style={{ width: '90px' }}>Result</th>
                    <th style={{ width: '150px' }}>Outcome</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st, index) => {
                    const summary = studentSummary.get(st.studentAcademicId);
                    const incomplete = incompleteStudentIds.has(st.studentAcademicId);
                    return (
                      <tr
                        key={st.studentAcademicId}
                        className={incomplete ? 'studentTableRow classRowIncomplete' : 'studentTableRow'}
                      >
                        <td className="classGridStickyCell">{index + 1}</td>
                        <td className="classGridStickyCell">
                          <div className="classStudentName">{st.studentName || `Student #${st.studentId}`}</div>
                          {incomplete && <div className="classRowWarn">Incomplete</div>}
                        </td>
                        <td className="classGridStickyCell">{st.rollNumber || '-'}</td>
                        {sheet.subjects.map((sub: CourseSubjectMarksDto) => {
                          const value = marks[cellKey(st.studentAcademicId, sub.courseSubjectId)] ?? '';
                          const parsed = toNumber(value);
                          const valid = parsed === null || (parsed >= 0 && parsed <= MAX_MARKS);
                          return (
                            <td key={sub.courseSubjectId}>
                              <input
                                type="number"
                                min={0}
                                max={MAX_MARKS}
                                step="0.01"
                                className={`input marksInput classCellInput ${valid ? '' : 'marksInputError'}`}
                                value={value}
                                onChange={(e) =>
                                  handleMarksChange(st.studentAcademicId, sub.courseSubjectId, e.target.value)
                                }
                              />
                            </td>
                          );
                        })}
                        <td>
                          {summary && summary.total > 0 ? (
                            <span className="classSummaryValue">
                              {summary.total}/{summary.max}
                            </span>
                          ) : (
                            <span className="marksResultPlaceholder">-</span>
                          )}
                        </td>
                        <td>
                          {summary?.percentage !== null && summary?.percentage !== undefined ? (
                            <span className="classSummaryValue">{summary.percentage.toFixed(2)}%</span>
                          ) : (
                            <span className="marksResultPlaceholder">-</span>
                          )}
                        </td>
                        <td>
                          {summary?.result ? (
                            <span className={`orphanStatusBadge ${summary.result === 'PASS' ? 'completed' : 'dropped'}`}>
                              {summary.result}
                            </span>
                          ) : (
                            <span className="marksResultPlaceholder">-</span>
                          )}
                        </td>
                        <td>
                          {isOutcomeLocked(st.status) ? (
                            <span
                              className={`orphanStatusBadge ${outcomeBadgeClass(outcomes[String(st.studentAcademicId)] ?? 'AUTO')}`}
                              title={outcomes[String(st.studentAcademicId)] ?? 'AUTO'}
                            >
                              {outcomeLabel(outcomes[String(st.studentAcademicId)] ?? 'AUTO')}
                            </span>
                          ) : (
                            <select
                              className="select outcomeSelect"
                              value={outcomes[String(st.studentAcademicId)] ?? 'AUTO'}
                              onChange={(e) => handleOutcomeChange(st.studentAcademicId, e.target.value)}
                            >
                              <option value="AUTO">AUTO</option>
                              <option value="TRANSFERRED">TRANSFERRED</option>
                              <option value="DROPPED">DROPPED</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <div className="actions student-actions">
                            <Button
                              size="sm"
                              variant="outline"
                              className="iconBtn editActionButton"
                              title="Edit individual marks"
                              onClick={() => nav(`/marks/add?studentId=${st.studentId}&academicYearId=${academicYearId}`)}
                            >
                              <FiEdit />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loadingSheet && sheet.students.length > 0 && sheet.subjects.length > 0 && (
            <div className="marksActions classGridActions">
              <div className="classGridHint">
                {incompleteStudentIds.size > 0
                  ? `${incompleteStudentIds.size} student(s) have incomplete marks.`
                  : 'All marks complete. Entering 0 counts as a real mark.'}
                <div className="classGridOutcomeHint">
                  Outcome: AUTO promotes on PASS / retains on FAIL. TRANSFERRED and DROPPED create no next-year
                  record. Already finalized students have a locked outcome.
                </div>
              </div>
              <button type="button" className="btn btnGreen md" onClick={handleSaveAll} disabled={loadingSheet || saving}>
                <FiSave size={16} />
                &nbsp;{saving ? 'Saving…' : 'Save All Marks'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}