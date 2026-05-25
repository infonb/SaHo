import { apiClient } from './client';

export interface ReminderDto {
  remId: number;
  title: string;
  description: string | null;
  eventDate: string; // yyyy-mm-dd
  venue: string;
  stIdCsv: string | null;
  distIdsCsv: string | null;
  mndlIdsCsv: string | null;
  vilIdsCsv: string | null;
  schIdsCsv: string | null;
  classIdsCsv: string | null;
  status?: boolean | null;
  createdBy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ReminderCreatePayload {
  title: string;
  description?: string | null;
  eventDate: string;
  venue: string;
  stIdCsv?: string | null;
  distIdsCsv?: string | null;
  mndlIdsCsv?: string | null;
  vilIdsCsv?: string | null;
  schIdsCsv?: string | null;
  classIdsCsv?: string | null;
  updatedBy: number;
}

export const getReminders = async (): Promise<ReminderDto[]> => {
  const res = await apiClient.get('/reminders');
  return res.data ?? [];
};

export const getReminderById = async (remId: number): Promise<ReminderDto | undefined> => {
  const res = await apiClient.get(`/reminders/${remId}`);
  return res.data ?? undefined;
};

export const createReminder = async (payload: ReminderCreatePayload): Promise<number> => {
  const res = await apiClient.post('/reminders', payload);
  return Number(res.data);
};

export const updateReminder = async (remId: number, payload: ReminderCreatePayload): Promise<number> => {
  const res = await apiClient.put(`/reminders/${remId}`, payload);
  return Number(res.data);
};

export const deleteReminder = async (remId: number): Promise<void> => {
  await apiClient.delete(`/reminders/${remId}`);
};

export const cancelReminder = async (remId: number, updatedBy?: number): Promise<void> => {
  await apiClient.put(`/reminders/${remId}/cancel`, { updatedBy: updatedBy ?? 1 });
};
