import { buildStudentView, delay, MOCK_GUARDIANS, MOCK_STUDENTS } from './mockData';
import type { Guardian, Student, StudentFilters, StudentView } from '../types';

export const getStudents = async (filters?: Partial<StudentFilters>): Promise<StudentView[]> => {
  await delay();
  let result = filters?.is_active === 'false' ? MOCK_STUDENTS.filter(s => !s.is_active) : MOCK_STUDENTS.filter(s => s.is_active);
  if (filters?.gender) result = result.filter(s => s.gender === filters.gender);
  if (filters?.class_id) result = result.filter(s => s.class_id === filters.class_id);
  let views = result.map(buildStudentView);
  if (filters?.dist_id) views = views.filter(v => v.dist_id === Number(filters.dist_id));
  if (filters?.st_id) views = views.filter(v => v.st_id === Number(filters.st_id));
  if (filters?.sponsor_status === 'assigned') views = views.filter(v => v.sponsor_id !== null);
  if (filters?.sponsor_status === 'unassigned') views = views.filter(v => v.sponsor_id === null);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    views = views.filter(v => v.full_name.toLowerCase().includes(q) || v.guardian_full_name.toLowerCase().includes(q) || v.sch_name.toLowerCase().includes(q) || v.aadhaar_number.includes(q));
  }
  return views;
};

export const getStudentById = async (id: number): Promise<StudentView | undefined> => {
  await delay();
  const s = MOCK_STUDENTS.find(x => x.student_id === id);
  return s ? buildStudentView(s) : undefined;
};

export interface CreateStudentPayload {
  first_name: string; middle_name?: string | null; last_name: string; dob: string; gender: 'Male' | 'Female' | 'Other'; aadhaar_number: string; caste: string; religion?: string | null; blood_group?: string | null; sch_id: number; class_id: string; guardian_id: number; orphan_status?: string | null; created_by: string;
}

export const createGuardian = async (payload: Omit<Guardian, 'guardian_id' | 'created_at' | 'updated_at'>): Promise<Guardian> => {
  const guardian: Guardian = { ...payload, guardian_id: Math.max(0, ...MOCK_GUARDIANS.map(g => g.guardian_id)) + 1, created_at: new Date().toISOString(), updated_at: null };
  MOCK_GUARDIANS.push(guardian);
  return guardian;
};

export const createStudent = async (payload: CreateStudentPayload): Promise<Student> => {
  await delay();
  const student: Student = { ...payload, student_id: Math.max(0, ...MOCK_STUDENTS.map(s => s.student_id)) + 1, middle_name: payload.middle_name ?? null, religion: payload.religion ?? null, blood_group: payload.blood_group ?? null, orphan_status: payload.orphan_status ?? null, image_url: null, is_active: true, created_at: new Date().toISOString(), modified_at: null, modified_by: null };
  MOCK_STUDENTS.push(student);
  return student;
};

export const updateStudent = async (id: number, payload: Partial<Student>): Promise<Student> => {
  await delay();
  const idx = MOCK_STUDENTS.findIndex(s => s.student_id === id);
  if (idx < 0) throw new Error('Student not found');
  MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...payload, modified_at: new Date().toISOString() };
  return MOCK_STUDENTS[idx];
};

export const deactivateStudent = async (id: number, modified_by: string): Promise<void> => {
  await delay();
  const idx = MOCK_STUDENTS.findIndex(s => s.student_id === id);
  if (idx < 0) throw new Error('Student not found');
  MOCK_STUDENTS[idx].is_active = false;
  MOCK_STUDENTS[idx].modified_at = new Date().toISOString();
  MOCK_STUDENTS[idx].modified_by = modified_by;
};
