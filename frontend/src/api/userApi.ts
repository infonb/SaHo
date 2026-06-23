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
  const { data } = await apiClient.get<User[]>('/users/admins');
  return data;
};
export const createAdmin = async (payload: Omit<User, 'user_id' | 'is_active' | 'created_at' | 'modified_at' | 'modified_by'>): Promise<User> => {
  const { data } = await apiClient.post<User>('/users', payload);
  return data;
};
export const updateAdmin = async (id: number, payload: Partial<User>): Promise<User> => {
  const { data } = await apiClient.put<User>(`/users/${id}`, payload);
  return data;
};
export const deactivateAdmin = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
