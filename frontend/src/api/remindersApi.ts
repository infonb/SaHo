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
  imageUrl?: string | null;
  bannerImage?: string | null;
  totalCount?: number | null;
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
  imageUrl?: string | null;
  bannerImage?: string | null;
  updatedBy: number;
}

export interface ReminderFilterParams {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  stateIdsCsv?: string;
  distIdsCsv?: string;
  mndlIdsCsv?: string;
  vilIdsCsv?: string;
  schIdsCsv?: string;
  status?: string;
}

const normalizeReminder = (r: any): ReminderDto => ({
  remId: Number(r?.remId ?? r?.rem_id ?? r?.id),
  title: r?.title ?? '',
  description: r?.description ?? null,
  eventDate: r?.eventDate ?? r?.event_date ?? '',
  venue: r?.venue ?? '',
  stIdCsv: r?.stIdCsv ?? r?.st_id_csv ?? null,
  distIdsCsv: r?.distIdsCsv ?? r?.dist_ids_csv ?? null,
  mndlIdsCsv: r?.mndlIdsCsv ?? r?.mndl_ids_csv ?? null,
  vilIdsCsv: r?.vilIdsCsv ?? r?.vil_ids_csv ?? null,
  schIdsCsv: r?.schIdsCsv ?? r?.sch_ids_csv ?? null,
  classIdsCsv: r?.classIdsCsv ?? r?.class_ids_csv ?? null,
  status: r?.status ?? null,
  createdBy: r?.createdBy ?? r?.created_by ?? null,
  createdAt: r?.createdAt ?? r?.created_at ?? null,
  updatedAt: r?.updatedAt ?? r?.updated_at ?? null,
  imageUrl: r?.imageUrl ?? r?.image_url ?? r?.bannerImage ?? r?.banner_image ?? null,
  bannerImage: r?.bannerImage ?? r?.banner_image ?? r?.imageUrl ?? r?.image_url ?? null,
  totalCount: r?.totalCount ?? r?.total_count ?? null,
});

export const getReminders = async (filters?: ReminderFilterParams): Promise<ReminderDto[]> => {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.pageNumber) params.pageNumber = String(filters.pageNumber);
  if (filters?.pageSize) params.pageSize = String(filters.pageSize);
  if (filters?.stateIdsCsv) params.stateIdsCsv = filters.stateIdsCsv;
  if (filters?.distIdsCsv) params.distIdsCsv = filters.distIdsCsv;
  if (filters?.mndlIdsCsv) params.mndlIdsCsv = filters.mndlIdsCsv;
  if (filters?.vilIdsCsv) params.vilIdsCsv = filters.vilIdsCsv;
  if (filters?.schIdsCsv) params.schIdsCsv = filters.schIdsCsv;
  if (filters?.status) params.status = filters.status;
  const res = await apiClient.get('/reminders', { params });
  return (res.data ?? []).map(normalizeReminder);
};

export const getStudentReminders = async (studentId: number): Promise<ReminderDto[]> => {
  const res = await apiClient.get(`/reminders/student/${studentId}`);
  return res.data ?? [];
};

export const getReminderById = async (remId: number): Promise<ReminderDto | undefined> => {
  const res = await apiClient.get(`/reminders/${remId}`);
  return res.data ? normalizeReminder(res.data) : undefined;
};

const sendReminderForm = async (url: string, method: 'post' | 'put', payload: ReminderCreatePayload, imageFile?: File | Blob) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('request', JSON.stringify(payload));
    formData.append('image', imageFile);
    const res = await apiClient.request({ url, method, data: formData });
    return Number(res.data);
  }
  const res = await apiClient.request({ url, method, data: payload });
  return Number(res.data);
};

export const createReminder = async (payload: ReminderCreatePayload, imageFile?: File | Blob): Promise<number> => {
  return sendReminderForm('/reminders', 'post', payload, imageFile);
};

export const updateReminder = async (remId: number, payload: ReminderCreatePayload, imageFile?: File | Blob): Promise<number> => {
  return sendReminderForm(`/reminders/${remId}`, 'put', payload, imageFile);
};

export const deleteReminder = async (remId: number): Promise<void> => {
  await apiClient.delete(`/reminders/${remId}`);
};

export const cancelReminder = async (remId: number, updatedBy?: number): Promise<void> => {
  await apiClient.put(`/reminders/${remId}/cancel`, { updatedBy: updatedBy ?? 1 });
};
