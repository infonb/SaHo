import { delay, MOCK_USERS } from './mockData';
import type { User, VolunteerFilters } from '../types';

export const getVolunteers = async (filters?: Partial<VolunteerFilters>): Promise<User[]> => {
  await delay();
  let result = filters?.is_active === 'false' ? MOCK_USERS.filter(u => u.role === 'Volunteer' && !u.is_active) : MOCK_USERS.filter(u => u.role === 'Volunteer' && u.is_active);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(u => u.username.toLowerCase().includes(q) || u.email_id.toLowerCase().includes(q));
  }
  return result;
};
export const getVolunteerById = async (id: number): Promise<User | undefined> => {
  await delay();
  return MOCK_USERS.find(u => u.user_id === id && u.role === 'Volunteer');
};
export const createVolunteer = async (payload: Omit<User, 'user_id' | 'is_active' | 'created_at' | 'modified_at' | 'modified_by'>): Promise<User> => {
  await delay();
  const user: User = { ...payload, role: 'Volunteer', user_id: Math.max(0, ...MOCK_USERS.map(u => u.user_id)) + 1, is_active: true, created_at: new Date().toISOString(), modified_at: null, modified_by: null };
  MOCK_USERS.push(user);
  return user;
};
export const updateVolunteer = async (id: number, payload: Partial<User>): Promise<User> => {
  await delay();
  const idx = MOCK_USERS.findIndex(u => u.user_id === id);
  if (idx < 0) throw new Error('Volunteer not found');
  MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...payload, modified_at: new Date().toISOString() };
  return MOCK_USERS[idx];
};
export const deactivateVolunteer = async (id: number): Promise<void> => {
  await delay();
  const idx = MOCK_USERS.findIndex(u => u.user_id === id);
  if (idx < 0) throw new Error('Volunteer not found');
  MOCK_USERS[idx].is_active = false;
};
