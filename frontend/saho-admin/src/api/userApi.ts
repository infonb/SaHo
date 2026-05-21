import { delay, MOCK_USERS } from './mockData';
import type { AuthUser, User } from '../types';

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
export const loginUser = async (email_id: string, _password: string): Promise<{ user: AuthUser; token: string }> => {
  await delay(600);
  const found = MOCK_USERS.find(u => u.email_id === email_id && u.is_active && u.role === 'Admin');
  if (!found) throw new Error('Invalid email or password.');
  return { user: { user_id: found.user_id, username: found.username, email_id: found.email_id, role: found.role, initials: initials(found.username) }, token: `mock-jwt-token-${found.user_id}` };
};
export const getAdmins = async (): Promise<User[]> => { await delay(); return MOCK_USERS.filter(u => u.role === 'Admin' && u.is_active); };
export const createAdmin = async (payload: Omit<User, 'user_id' | 'is_active' | 'created_at' | 'modified_at' | 'modified_by'>): Promise<User> => {
  await delay();
  const user: User = { ...payload, user_id: Math.max(0, ...MOCK_USERS.map(u => u.user_id)) + 1, is_active: true, created_at: new Date().toISOString(), modified_at: null, modified_by: null };
  MOCK_USERS.push(user);
  return user;
};
export const updateAdmin = async (id: number, payload: Partial<User>): Promise<User> => {
  await delay();
  const idx = MOCK_USERS.findIndex(u => u.user_id === id);
  if (idx < 0) throw new Error('User not found');
  MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...payload, modified_at: new Date().toISOString() };
  return MOCK_USERS[idx];
};
export const deactivateAdmin = async (id: number): Promise<void> => {
  await delay();
  const idx = MOCK_USERS.findIndex(u => u.user_id === id);
  if (idx < 0) throw new Error('User not found');
  MOCK_USERS[idx].is_active = false;
};
