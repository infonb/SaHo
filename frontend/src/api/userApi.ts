import apiClient from './client';
import type { AuthUser, User, LoginResponse } from '../types';
import { getStudentById } from './studentApi';

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export const loginUser = async (email: string, password: string): Promise<AuthUser> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  if (data.token) {
    localStorage.setItem('saho_token', data.token);
  }
  const username = email.split('@')[0] || 'Admin';
  return {
    user_id: data.userId,
    username: username,
    email_id: data.email || '',
    role: data.role.toLowerCase() as User['role'],
    initials: initials(username),
  };
};

export const studentLogin = async (studentId: number, password: string): Promise<AuthUser> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/student-login', { studentId, password });
  if (data.token) {
    localStorage.setItem('saho_token', data.token);
  }
  let studentName = `Student ${data.studentId}`;
  const studentData = await getStudentById(data.studentId!);
  if (studentData) {
    studentName = studentData.studentName || studentData.full_name || studentName;
  }
  return {
    user_id: data.userId,
    username: studentName,
    email_id: '',
    role: data.role.toLowerCase() as User['role'],
    initials: initials(studentName),
    student_id: data.studentId,
  };
};

export const getAdmins = async (): Promise<User[]> => {
  const { data } = await apiClient.get<any[]>('/admins');
  return data.map((a: any) => ({
    user_id: a.user_id,
    username: a.email_id || '',
    email_id: a.email_id,
    password: '',
    role: a.role,
    is_active: a.is_active,
    created_at: a.created_at,
    created_by: a.created_by || '',
    modified_at: null,
    modified_by: null,
  }));
};
export const getAdminCount = async (): Promise<number> => {
  const { data } = await apiClient.get<{ count: number }>('/admins/count');
  return data.count;
};
export const createAdmin = async (payload: { email_id: string; password: string; role: string; created_by: string }): Promise<User> => {
  const { data } = await apiClient.post<any>('/admins', payload);
  return {
    user_id: data.user_id,
    username: data.email_id || '',
    email_id: data.email_id,
    password: '',
    role: data.role,
    is_active: data.is_active,
    created_at: data.created_at,
    created_by: data.created_by || '',
    modified_at: null,
    modified_by: null,
  };
};
export const updateAdmin = async (id: number, payload: { email_id?: string; password?: string; role?: string; created_by?: string }): Promise<User> => {
  const { data } = await apiClient.put<any>(`/admins/${id}`, payload);
  return {
    user_id: data.user_id,
    username: data.email_id || '',
    email_id: data.email_id,
    password: '',
    role: data.role,
    is_active: data.is_active,
    created_at: data.created_at,
    created_by: data.created_by || '',
    modified_at: null,
    modified_by: null,
  };
};
export const deactivateAdmin = async (id: number): Promise<void> => {
  await apiClient.delete(`/admins/${id}`);
};
