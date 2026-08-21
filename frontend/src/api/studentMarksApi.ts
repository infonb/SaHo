import { apiClient } from './client';

export interface CourseSubjectMarksDto {
  courseSubjectId: number;
  courseId: number;
  classId: number;
  subjectId: number;
  subjectName: string | null;
  subjectCode: string | null;
}

export interface SubjectMarksResponse {
  courseSubjectId: number;
  subjectId: number;
  subjectName: string | null;
  subjectCode: string | null;
  marks: number | null;
  result: string | null;
}

export interface StudentMarksResponse {
  studentAcademicId: number;
  studentId: number;
  studentName: string;
  academicYearId: number | null;
  academicYearName: string | null;
  courseId: number | null;
  classId: number | null;
  className: string | null;
  schoolId: number | null;
  schoolName: string | null;
  rollNumber: string | null;
  totalMarks: number | null;
  maxTotal: number | null;
  percentage: number | null;
  overallResult: string | null;
  subjects: SubjectMarksResponse[];
}

export interface StudentMarksEntry {
  courseSubjectId: number;
  marks: number;
}

export interface SaveMarksPayload {
  studentId: number;
  studentAcademicId: number;
  createdBy?: number | null;
  marks: StudentMarksEntry[];
}

export interface ClassStudent {
  studentAcademicId: number;
  studentId: number;
  rollNumber: string | null;
  studentName: string;
  status?: string | null;
}

export interface StudentOutcomeSummary {
  studentAcademicId: number;
  outcome: string;
  status: string;
  admissionType: string | null;
  nextAcademicYearId: number | null;
  nextAcademicYearName: string | null;
  nextClassId: number | null;
  nextClassName: string | null;
  message: string;
}

export interface ExistingSubjectMarks {
  courseSubjectId: number;
  subjectId: number;
  subjectName: string | null;
  subjectCode: string | null;
  marks: number | null;
  result: string | null;
}

export interface ClassMarksSheet {
  academicYearId: number;
  academicYearName: string | null;
  schoolId: number;
  schoolName: string | null;
  classId: number;
  className: string | null;
  subjects: CourseSubjectMarksDto[];
  students: ClassStudent[];
  existingMarks: Record<string, Record<string, ExistingSubjectMarks>>;
  outcomes?: Record<string, StudentOutcomeSummary>;
}

export interface ClassStudentMarksEntry {
  studentAcademicId: number;
  outcome?: string | null;
  marks: StudentMarksEntry[];
}

export interface SaveClassMarksPayload {
  academicYearId: number;
  schoolId: number;
  classId: number;
  students: ClassStudentMarksEntry[];
}

export const getSubjectsByClass = async (classId: number): Promise<CourseSubjectMarksDto[]> => {
  const res = await apiClient.get(`/course-subjects/by-class/${classId}`);
  return res.data ?? [];
};

export const getMarksByStudentAcademicId = async (studentAcademicId: number): Promise<StudentMarksResponse> => {
  const res = await apiClient.get(`/marks/${studentAcademicId}`);
  return res.data;
};

export const saveAnnualMarks = async (payload: SaveMarksPayload): Promise<StudentMarksResponse> => {
  const res = await apiClient.post('/marks/annual', payload);
  return res.data;
};

export const getClassStudents = async (
  academicYearId: number,
  schoolId: number,
  classId: number,
): Promise<ClassStudent[]> => {
  const res = await apiClient.get('/marks/class/students', {
    params: { academicYearId, schoolId, classId },
  });
  return res.data ?? [];
};

export const getClassMarksSheet = async (
  academicYearId: number,
  schoolId: number,
  classId: number,
): Promise<ClassMarksSheet> => {
  const res = await apiClient.get('/marks/class/sheet', {
    params: { academicYearId, schoolId, classId },
  });
  return res.data;
};

export const saveClassAnnualMarks = async (payload: SaveClassMarksPayload): Promise<ClassMarksSheet> => {
  const res = await apiClient.post('/marks/class/annual', payload);
  return res.data;
};