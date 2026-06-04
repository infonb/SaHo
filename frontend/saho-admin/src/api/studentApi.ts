import { apiClient } from './client';
import { buildStudentView, delay, MOCK_GUARDIANS, MOCK_STUDENTS } from './mockData';
import type { Guardian, Student, StudentFilters, StudentView } from '../types';

export interface StudentsResponse {
  pageNumber: number;
  pageSize: number;
  students: StudentView[];
  total: number;
  hasMore: boolean;
}

export const getStudents = async ({
  pageNumber = 1,
  pageSize = 10,
  filters,
  sortColumn = 'student_id',
  sortDirection = 'DESC',
}: {
  pageNumber?: number;
  pageSize?: number;
  filters?: Partial<StudentFilters>;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
} = {}): Promise<StudentsResponse> => {
  const normalizeGenderValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === 'Male') return '1';
    if (trimmed === 'Female') return '2';
    if (trimmed === 'Other') return '3';
    return trimmed;
  };

  const genderValues = filters?.gender?.split(',').map(value => normalizeGenderValue(value)).filter(Boolean) ?? [];
  const orphanValues = filters?.orphan_status?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
  if (genderValues.length > 1) {
    const responses = await Promise.all(genderValues.map(gender => getStudents({
      pageNumber: 1,
      pageSize: 10000,
      filters: { ...filters, gender },
      sortColumn,
      sortDirection,
    })));
    const studentMap = new Map<number, StudentView>();
    responses.flatMap(response => response.students).forEach(student => {
      studentMap.set(student.student_id, student);
    });
    const students = Array.from(studentMap.values()).sort((a, b) => b.student_id - a.student_id);
    const start = (pageNumber - 1) * pageSize;
    const pageStudents = students.slice(start, start + pageSize);

    return {
      pageNumber,
      pageSize,
      students: pageStudents,
      total: students.length,
      hasMore: start + pageSize < students.length,
    };
  }
  if (orphanValues.length > 1) {
    const responses = await Promise.all(orphanValues.map(orphan_status => getStudents({
      pageNumber: 1,
      pageSize: 10000,
      filters: { ...filters, orphan_status },
      sortColumn,
      sortDirection,
    })));
    const studentMap = new Map<number, StudentView>();
    responses.flatMap(response => response.students).forEach(student => {
      studentMap.set(student.student_id, student);
    });
    const students = Array.from(studentMap.values()).sort((a, b) => b.student_id - a.student_id);
    const start = (pageNumber - 1) * pageSize;
    const pageStudents = students.slice(start, start + pageSize);

    return {
      pageNumber,
      pageSize,
      students: pageStudents,
      total: students.length,
      hasMore: start + pageSize < students.length,
    };
  }

  try {
    const params: any = { pageNumber, pageSize };
    if (filters?.search?.trim()) params.search = filters.search.trim();
    if (filters?.gender) params.gender = normalizeGenderValue(filters.gender);
    if (filters?.class_id) params.classId = filters.class_id;
    if (filters?.orphan_status) params.orphanStatus = filters.orphan_status;
    if (filters?.st_id) params.stId = filters.st_id;
    if (filters?.dist_id) params.distId = filters.dist_id;
    if (filters?.mndl_id) params.mndlId = filters.mndl_id;
    if (filters?.vil_id) params.vilId = filters.vil_id;
    if (filters?.sch_id) params.schId = filters.sch_id;
    params.sortColumn = sortColumn;
    params.sortDirection = sortDirection;
    const res = await apiClient.get('/students', { params });
    const students = (res.data?.students ?? []).map((s: any) => ({
      student_id: s.studentId,
      full_name: s.name ?? '',
      email: s.emailId ?? '',
      dob: s.dob ?? '',
      gender: s.gender ?? 'Other',
      aadhaar_number: s.aadhaarNumber ?? '',
      caste: casteNameFromValue(s.casteName ?? s.caste ?? s.casteId),
      religion: s.religion ?? null,
      blood_group: s.bloodGroup ?? null,
      class_id: s.className ? String(s.className) : (s.classId ? String(s.classId) : ''),
      orphan_status: s.orphanStatus ?? null,
      image_url: s.imageUrl ?? null,
      is_active: true,
      created_at: s.createdAt ?? new Date().toISOString(),
      created_by: s.createdBy ?? 'system',
      modified_at: s.modifiedAt ?? null,
      modified_by: s.modifiedBy ?? null,
      sch_id: s.schId ?? 0,
      sch_name: s.schName ?? '',
      sch_address: s.schAddress ?? '',
      vil_id: 0,
      mndl_id: 0,
      dist_id: 0,
      st_id: 0,
      guardian_id: s.guardianId ?? 0,
      guardian_full_name: s.guardianName ?? '',
      guardian_phone: s.guardianPhone ?? '',
      guardian_relation_name: s.guardianRelationName ?? '',
      guardian_occ: null,
      sponsor_id: s.sponsorId ?? null,
      sponsorName: s.sponsorName ?? null,
      sponsor_type: null,
      sibling_id: s.siblingId ?? null,
      sibling_student_name: s.siblingStudentName ?? s.siblingName ?? null,
      sibling_student_id: s.siblingStudentId ?? null,
      vil_name: s.vilName ?? '',
      mndl_name: s.mndlName ?? '',
      dist_name: s.distName ?? '',
      st_name: s.stName ?? '',
    } as unknown as StudentView));

    const inferredTotal = Number(res.data?.total ?? res.data?.totalCount ?? (res.data?.students?.[0]?.totalCount ?? res.data?.students?.[0]?.total_count));
    const hasMore = students.length === pageSize;

    return {
      pageNumber: res.data?.pageNumber ?? pageNumber,
      pageSize: res.data?.pageSize ?? pageSize,
      students,
      total: Number.isFinite(inferredTotal) ? inferredTotal : ((pageNumber - 1) * pageSize) + students.length + (hasMore ? 1 : 0),
      hasMore,
    };
  } catch (err) {
    console.error('[studentApi] getStudents failed', { pageNumber, pageSize, filters }, err);
    throw err;
  }
};

export const exportStudentsCsv = async ({
  filters,
  sortColumn = 'student_id',
  sortDirection = 'DESC',
  studentIds,
}: {
  filters?: Partial<StudentFilters>;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC' | null;
  studentIds?: number[];
} = {}) => {
  const params: any = {};
  const normalizeGenderValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === 'Male') return '1';
    if (trimmed === 'Female') return '2';
    if (trimmed === 'Other') return '3';
    return trimmed;
  };

  if (filters?.search?.trim()) params.search = filters.search.trim();
  if (filters?.gender) params.gender = normalizeGenderValue(filters.gender);
  if (filters?.class_id) params.classId = filters.class_id;
  if (filters?.orphan_status) params.orphanStatus = filters.orphan_status;
  if (filters?.st_id) params.stId = filters.st_id;
  if (filters?.dist_id) params.distId = filters.dist_id;
  if (filters?.mndl_id) params.mndlId = filters.mndl_id;
  if (filters?.vil_id) params.vilId = filters.vil_id;
  if (filters?.sch_id) params.schId = filters.sch_id;
  if (sortColumn) params.sortColumn = sortColumn;
  if (sortDirection) params.sortDirection = sortDirection;
  if (studentIds?.length) params.studentIds = studentIds.join(',');

  const res = await apiClient.get('/students/export', {
    params,
    responseType: 'blob',
  });

  return res.data as Blob;
};

export const getStudentById = async (id: number): Promise<StudentView | undefined> => {
  // Try backend first
  try {
    const res = await apiClient.get(`/students/${id}`);
    const s: any = res.data;
    // normalize codes to labels when necessary
    const mapGender = (g: any) => (g === '1' ? 'Male' : g === '2' ? 'Female' : g === '3' ? 'Other' : g ?? 'Other');
    const mapReligion = (r: any) => (r === '1' ? 'Hindu' : r === '2' ? 'Muslim' : r === '3' ? 'Christian' : r === '4' ? 'Buddhist' : r === '5' ? 'Jain' : r === '6' ? 'Sikh' : r === '7' ? 'Other' : r ?? null);
    const mapOrphan = (o: any) => (o === '1' ? 'None' : o === '2' ? 'Single Parent' : o === '3' ? 'Orphan' : o ?? null);

    const view = {
      student_id: s.studentId ?? s.student_id,
      full_name: s.studentName ?? s.name ?? '',
      email: s.emailId ?? s.email ?? '',
      dob: s.dob ?? '',
      gender: mapGender(s.gender ?? s.gender_code ?? s.gender_label),
      aadhaar_number: s.aadhaarNumber ?? s.aadhaar_number ?? '',
      caste: casteNameFromValue(s.casteName ?? s.caste ?? s.casteId),
      religion: mapReligion(s.religion ?? s.religion_code ?? s.religion_label),
      blood_group: s.bloodGroup ?? s.blood_group ?? null,
      class_id: s.className ?? s.class_id ?? (s.classId ? String(s.classId) : ''),
      orphan_status: mapOrphan(s.orphanStatus ?? s.orphan_status ?? s.orphan_status_code),
      image_url: s.imageUrl ?? s.image_url ?? null,
      is_active: true,
      created_at: s.createdAt ?? s.created_at ?? new Date().toISOString(),
      created_by: s.createdBy ?? s.created_by ?? 'system',
      modified_at: s.modifiedAt ?? s.modified_at ?? null,
      modified_by: s.modifiedBy ?? s.modified_by ?? null,
      sch_id: s.schId ?? s.sch_id ?? 0,
      sch_name: s.schName ?? s.sch_name ?? '',
      sch_address: s.schAddress ?? s.sch_address ?? '',
      vil_id: s.vilId ?? s.vil_id ?? 0,
      vil_name: s.vilName ?? s.vil_name ?? '',
      mndl_id: s.mndlId ?? s.mndl_id ?? 0,
      mndl_name: s.mndlName ?? s.mndl_name ?? '',
      dist_id: s.distId ?? s.dist_id ?? 0,
      dist_name: s.distName ?? s.dist_name ?? '',
      st_id: s.stId ?? s.st_id ?? 0,
      st_name: s.stName ?? s.st_name ?? '',
      guardian_id: 0,
      guardian_full_name: s.guardianName ?? s.guardian_full_name ?? '',
      guardian_phone: s.phoneNumber ?? s.phone_number ?? '',
      guardian_relation_name: s.guardianRelationName ?? s.guardian_relation_name ?? '',
      guardian_occ: s.occ ?? null,
      sponsor_id: s.sponsorId ?? s.sponsor_id ?? null,
      sponsorName: s.sponsorName ?? null,
      sponsor_type: null,
      sibling_id: s.siblingId ?? null,
      sibling_student_name: s.siblingStudentName ?? s.siblingName ?? null,
      sibling_student_id: s.siblingStudentId ?? null,
    } as unknown as StudentView;

    return view;
  } catch (err) {
    console.error('[studentApi] getStudentById failed', id, err);
    return undefined;
  }
};

export interface CreateStudentPayload {
  first_name: string; middle_name?: string | null; last_name: string; email: string; dob: string; gender: 'Male' | 'Female' | 'Other'; aadhaar_number: string; caste: string; religion?: string | null; blood_group?: string | null; sch_id: number; class_id: string; guardian_id: number; orphan_status?: string | null; image_url?: string | null; created_by: string;
}

export const createGuardian = async (payload: Omit<Guardian, 'guardian_id' | 'created_at' | 'updated_at'>): Promise<Guardian> => {
  const guardian: Guardian = { ...payload, guardian_id: Math.max(0, ...MOCK_GUARDIANS.map(g => g.guardian_id)) + 1, created_at: new Date().toISOString(), updated_at: null };
  MOCK_GUARDIANS.push(guardian);
  return guardian;
};

export const createStudent = async (payload: CreateStudentPayload): Promise<Student> => {
  await delay();
  const student: Student = { ...payload, student_id: Math.max(0, ...MOCK_STUDENTS.map(s => s.student_id)) + 1, middle_name: payload.middle_name ?? null, religion: payload.religion ?? null, blood_group: payload.blood_group ?? null, orphan_status: payload.orphan_status ?? null, image_url: payload.image_url ?? null, is_active: true, created_at: new Date().toISOString(), modified_at: null, modified_by: null };
  MOCK_STUDENTS.push(student);
  return student;
};

export const findStudentByAadhaar = async (aadhaar: string): Promise<StudentView | undefined> => {
  await delay(250);
  const student = MOCK_STUDENTS.find(s => s.is_active && s.aadhaar_number === aadhaar);
  return student ? buildStudentView(student) : undefined;
};

export const updateStudent = async (id: number, payload: Partial<Student>): Promise<Student> => {
  await delay();
  const idx = MOCK_STUDENTS.findIndex(s => s.student_id === id);
  if (idx < 0) throw new Error('Student not found');
  MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...payload, modified_at: new Date().toISOString() };
  return MOCK_STUDENTS[idx];
};

export const deactivateStudent = async (id: number, modified_by: string): Promise<void> => {
  // Backend performs soft-delete via DELETE /api/students/{id}.
  // `modified_by` is currently handled server-side; kept for API compatibility.
  await apiClient.delete(`/students/${id}`);
};

export const deactivateStudents = async (ids: number[], modified_by: string): Promise<void> => {
  // No bulk-delete endpoint yet; fan out to single deletes.
  await Promise.all(ids.map(id => deactivateStudent(id, modified_by)));
};
const casteNameFromValue = (value: any) => {
  if (typeof value === 'string' && value.trim()) return value;
  const numeric = Number(value);
  const casteMap: Record<number, string> = {
    1: 'SC',
    2: 'ST',
    3: 'BC-A',
    4: 'BC-B',
    5: 'BC-C',
    6: 'BC-D',
    7: 'OBC',
    8: 'OC',
    9: 'Other',
  };
  return Number.isFinite(numeric) ? (casteMap[numeric] ?? String(value ?? '')) : String(value ?? '');
};



