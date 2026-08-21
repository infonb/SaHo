import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiSearch } from 'react-icons/fi';
import { getAcademicYears, getStudentById } from '../../api/studentService';
import { getStudents, type StudentsResponse } from '../../api/studentApi';
import {
  getMarksByStudentAcademicId,
  getSubjectsByClass,
  saveAnnualMarks,
  type CourseSubjectMarksDto,
  type StudentMarksResponse,
} from '../../api/studentMarksApi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import '../../styles/Marks/AddStudentMarks.css';

const PASS_MARKS = 35;
const MAX_MARKS = 100;

interface StudentOption {
  value: number;
  label: string;
}

const toNumber = (value: string): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export default function AddStudentMarksPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicYears, setAcademicYears] = useState<{ value: string; label: string }[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: number;
    studentName: string;
    studentAcademicId: number;
    academicYearName: string | null;
    className: string | null;
    classId: number | null;
    rollNumber: string | null;
    schoolName: string | null;
  } | null>(null);

  const [subjects, setSubjects] = useState<CourseSubjectMarksDto[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<StudentMarksResponse | null>(null);

  useEffect(() => {
    getAcademicYears()
      .then((years) => {
        const options = years
          .filter((y) => y.academicYearId && y.academicYearName)
          .map((y) => ({ value: String(y.academicYearId), label: y.academicYearName as string }));
        setAcademicYears(options);
        const current = options[0];
        if (current) setAcademicYearId(current.value);

        const studentParam = searchParams.get('studentId');
        if (studentParam) {
          const yearParam = searchParams.get('academicYearId');
          if (yearParam) setAcademicYearId(yearParam);
          void handleSelectStudent(Number(studentParam));
        }
      })
      .catch(() => toast('Failed to load academic years.', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchStudents = useCallback(async () => {
    if (!academicYearId) {
      toast('Please select an academic year first.', 'error');
      return;
    }
    setSearching(true);
    setStudentOptions([]);
    setSelectedStudent(null);
    setSubjects([]);
    setMarks({});
    setSaved(null);
    try {
      const data: StudentsResponse = await getStudents({
        pageNumber: 1,
        pageSize: 50,
        filters: { search: searchText, academic_year_id: academicYearId },
      });
      const options = data.students.map((s) => ({
        value: s.student_id,
        label: `${s.full_name || `Student #${s.student_id}`} — Class ${s.class_id || '-'} · ${s.sch_name || '-'}`,
      }));
      setStudentOptions(options);
      if (options.length === 0) {
        toast('No students found for the selected academic year.', 'error');
      }
    } catch {
      toast('Failed to search students.', 'error');
    } finally {
      setSearching(false);
    }
  }, [academicYearId, searchText, toast]);

  const handleSelectStudent = async (studentId: number) => {
    setSelectedStudent(null);
    setSubjects([]);
    setMarks({});
    setSaved(null);
    setLoadingSubjects(true);
    try {
      const profile = await getStudentById(studentId);
      const academic = profile?.academicDetails;
      const studentAcademicId =
        profile?.studentAcademicId ?? academic?.studentAcademicId ?? null;
      if (!studentAcademicId) {
        toast('No active academic record found for this student.', 'error');
        return;
      }
      const classId = profile?.classId ?? academic?.classId ?? null;
      if (!classId) {
        toast('No class found for this student.', 'error');
        return;
      }

      setSelectedStudent({
        studentId,
        studentName: profile?.studentName ?? `Student #${studentId}`,
        studentAcademicId,
        academicYearName:
          profile?.academicYearName ??
          academicYears.find((y) => y.value === String(academic?.academicYearId ?? profile?.academicYearId))?.label ??
          null,
        className: profile?.className ?? null,
        classId,
        rollNumber: profile?.rollNumber ?? academic?.rollNumber ?? null,
        schoolName: profile?.schoolName ?? null,
      });

      const subjectList = await getSubjectsByClass(classId);
      setSubjects(subjectList);
      const initial: Record<string, string> = {};
      subjectList.forEach((s) => {
        initial[String(s.courseSubjectId)] = '';
      });
      setMarks(initial);

      try {
        const existing = await getMarksByStudentAcademicId(studentAcademicId);
        if (existing.subjects?.length) {
          const prefilled: Record<string, string> = { ...initial };
          existing.subjects.forEach((s) => {
            if (s.marks !== null && s.marks !== undefined) {
              prefilled[String(s.courseSubjectId)] = String(s.marks);
            }
          });
          setMarks(prefilled);
          setSaved(existing);
        }
      } catch {
        // no existing marks yet - treat as fresh entry
      }
    } catch {
      toast('Failed to load student details.', 'error');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleMarksChange = (courseSubjectId: number, value: string) => {
    setMarks((prev) => ({ ...prev, [String(courseSubjectId)]: value }));
    setSaved(null);
  };

  const parsed = useMemo(() => {
    let total = 0;
    let count = 0;
    const rows = subjects.map((s) => {
      const value = toNumber(marks[String(s.courseSubjectId)] ?? '');
      const valid = value !== null && value >= 0 && value <= MAX_MARKS;
      if (valid && value !== null) {
        total += value;
        count += 1;
      }
      return { subject: s, value, valid };
    });
    const maxTotal = subjects.length * MAX_MARKS;
    const percentage = count > 0 && maxTotal > 0 ? (total / maxTotal) * 100 : null;
    const allPresent = subjects.length > 0 && count === subjects.length;
    const anyFail = rows.some((r) => r.valid && r.value !== null && r.value < PASS_MARKS);
    const overallResult = allPresent ? (anyFail ? 'FAIL' : 'PASS') : null;
    return { rows, total, maxTotal, percentage, overallResult, count };
  }, [subjects, marks]);

  const handleSave = async () => {
    if (!selectedStudent) {
      toast('Please select a student first.', 'error');
      return;
    }
    if (subjects.length === 0) {
      toast('No subjects to save.', 'error');
      return;
    }

    const entries = subjects.map((s) => ({
      courseSubjectId: s.courseSubjectId,
      marks: toNumber(marks[String(s.courseSubjectId)] ?? ''),
    }));
    const invalid = entries.filter((e) => e.marks === null || e.marks < 0 || e.marks > MAX_MARKS);
    if (invalid.length > 0) {
      toast('Please enter valid marks (0-100) for every subject.', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await saveAnnualMarks({
        studentId: selectedStudent.studentId,
        studentAcademicId: selectedStudent.studentAcademicId,
        createdBy: user?.user_id || 1,
        marks: entries as { courseSubjectId: number; marks: number }[],
      });
      setSaved(result);
      toast(
        result.overallResult === 'PASS'
          ? 'Marks saved successfully. Result: PASS'
          : 'Marks saved successfully. Result: FAIL',
        'success',
      );
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to save marks.';
      toast(String(message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    nav('/marks');
  };

  return (
    <div className="marksPage">
      <PageHeader
        title="Add Student Marks"
        subtitle="Enter annual marks for a single student"
        actions={
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <FiArrowLeft /> Back
          </Button>
        }
      />

      <div className="marksCard">
        <div className="marksSection">
          <h3 className="marksSectionTitle">Academic Year</h3>
          <select
            className="select"
            value={academicYearId}
            onChange={(e) => {
              setAcademicYearId(e.target.value);
              setStudentOptions([]);
              setSelectedStudent(null);
              setSubjects([]);
              setMarks({});
              setSaved(null);
            }}
          >
            {academicYears.length === 0 && <option value="">No academic years available</option>}
            {academicYears.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>

        <div className="marksSection">
          <h3 className="marksSectionTitle">Student</h3>
          <div className="studentSearchRow">
            <input
              className="input"
              placeholder="Search by name or aadhaar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchStudents();
              }}
            />
            <Button variant="primary" size="sm" onClick={handleSearchStudents} loading={searching}>
              <FiSearch /> Search
            </Button>
          </div>
          {studentOptions.length > 0 && (
            <div className="studentSelectWrap">
              <select
                className="select"
                defaultValue=""
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (id) handleSelectStudent(id);
                }}
              >
                <option value="" disabled>
                  Select a student...
                </option>
                {studentOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedStudent && (
          <div className="marksSection">
            <h3 className="marksSectionTitle">Student Information</h3>
            <div className="studentInfoBox">
              <div className="studentInfoGrid">
                <div className="studentInfoItem">
                  <span className="studentInfoLabel">Name</span>
                  <span className="studentInfoValue">{selectedStudent.studentName}</span>
                </div>
                <div className="studentInfoItem">
                  <span className="studentInfoLabel">Roll Number</span>
                  <span className="studentInfoValue">{selectedStudent.rollNumber || '-'}</span>
                </div>
                <div className="studentInfoItem">
                  <span className="studentInfoLabel">Class</span>
                  <span className="studentInfoValue">{selectedStudent.className || '-'}</span>
                </div>
                <div className="studentInfoItem">
                  <span className="studentInfoLabel">School</span>
                  <span className="studentInfoValue">{selectedStudent.schoolName || '-'}</span>
                </div>
                <div className="studentInfoItem">
                  <span className="studentInfoLabel">Academic Year</span>
                  <span className="studentInfoValue">{selectedStudent.academicYearName || '-'}</span>
                </div>
                <div className="studentInfoItem">
                  <span className="studentInfoLabel">Student Academic ID</span>
                  <span className="studentInfoValue">{selectedStudent.studentAcademicId}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedStudent && (
          <div className="marksSection">
            <h3 className="marksSectionTitle">Annual Marks</h3>
            {loadingSubjects ? (
              <div className="marksLoading">Loading subjects...</div>
            ) : subjects.length === 0 ? (
              <div className="marksLoading">No subjects configured for this class.</div>
            ) : (
              <div className="tableWrap">
                <table className="table marksTable">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>S.No</th>
                      <th>Subject</th>
                      <th style={{ width: '140px' }}>Code</th>
                      <th style={{ width: '140px' }}>Marks</th>
                      <th style={{ width: '120px' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, index) => {
                      const previewResult =
                        row.value !== null ? (row.value >= PASS_MARKS ? 'PASS' : 'FAIL') : null;
                      return (
                        <tr key={row.subject.courseSubjectId}>
                          <td>{index + 1}</td>
                          <td>{row.subject.subjectName || '-'}</td>
                          <td>
                            <span className="badge">{row.subject.subjectCode || '-'}</span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              max={MAX_MARKS}
                              step="0.01"
                              className={`input marksInput ${row.valid || marks[String(row.subject.courseSubjectId)] === '' ? '' : 'marksInputError'}`}
                              value={marks[String(row.subject.courseSubjectId)] ?? ''}
                              onChange={(e) => handleMarksChange(row.subject.courseSubjectId, e.target.value)}
                            />
                          </td>
                          <td>
                            {previewResult ? (
                              <span className={`badge ${previewResult === 'PASS' ? 'success' : 'inactive'}`}>
                                {previewResult}
                              </span>
                            ) : (
                              <span className="marksResultPlaceholder">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {selectedStudent && subjects.length > 0 && (
          <div className="marksSection">
            <h3 className="marksSectionTitle">Summary</h3>
            <div className="summaryBox">
              <div className="summaryItem">
                <span className="summaryLabel">Total</span>
                <span className="summaryValue">{parsed.total}</span>
              </div>
              <div className="summaryItem">
                <span className="summaryLabel">Max Total</span>
                <span className="summaryValue">{parsed.maxTotal}</span>
              </div>
              <div className="summaryItem">
                <span className="summaryLabel">Percentage</span>
                <span className="summaryValue">
                  {parsed.percentage !== null ? `${parsed.percentage.toFixed(2)}%` : '-'}
                </span>
              </div>
              <div className="summaryItem">
                <span className="summaryLabel">Result</span>
                <span className="summaryValue">
                  {saved?.overallResult ? (
                    <span className={`badge ${saved.overallResult === 'PASS' ? 'success' : 'inactive'}`}>
                      {saved.overallResult}
                    </span>
                  ) : parsed.overallResult ? (
                    <span className={`badge ${parsed.overallResult === 'PASS' ? 'success' : 'inactive'}`}>
                      {parsed.overallResult}
                    </span>
                  ) : (
                    <span className="marksResultPlaceholder">-</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedStudent && subjects.length > 0 && (
          <div className="marksActions">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <FiSave /> Save Marks
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}