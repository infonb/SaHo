import { apiClient } from './client';

export interface ClassDto {
  classId: number;
  className: string;
}

export interface MasterPage<T = Record<string, any>> {
  page: number;
  size: number;
  total: number;
  items: T[];
}

export interface MasterDependency {
  label: string;
  count: number;
}

export interface DependencyCheck {
  canDelete: boolean;
  dependencies: MasterDependency[];
}

export const getClasses = async (): Promise<ClassDto[]> => {
  const res = await apiClient.get('/master/classes');
  return (res.data ?? []).map((c: any) => ({
    classId: c.classId ?? c.class_id,
    className: c.className ?? c.class_name,
  }));
};

export const getMasters = async (
  type: string,
  params: { search?: string; page?: number; size?: number } = {},
): Promise<MasterPage> => {
  const res = await apiClient.get(`/masters/${type}`, { params });
  return res.data;
};

export const getMasterDetail = async (
  type: string,
  id: number,
): Promise<Record<string, any>> => {
  const res = await apiClient.get(`/masters/${type}/${id}`);
  return res.data;
};

export const createMaster = async (
  type: string,
  body: Record<string, any>,
): Promise<Record<string, any>> => {
  const res = await apiClient.post(`/masters/${type}`, body);
  return res.data;
};

export const updateMaster = async (
  type: string,
  id: number,
  body: Record<string, any>,
): Promise<Record<string, any>> => {
  const res = await apiClient.put(`/masters/${type}/${id}`, body);
  return res.data;
};

export const deleteMaster = async (type: string, id: number): Promise<void> => {
  await apiClient.delete(`/masters/${type}/${id}`);
};

export const checkMasterDependencies = async (
  type: string,
  id: number,
): Promise<DependencyCheck> => {
  const res = await apiClient.get(`/masters/${type}/${id}/dependency-check`);
  return res.data;
};

