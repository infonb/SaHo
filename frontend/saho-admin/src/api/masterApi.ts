import { apiClient } from './client';

export interface ClassDto {
  classId: number;
  className: string;
}

export const getClasses = async (): Promise<ClassDto[]> => {
  const res = await apiClient.get('/master/classes');
  return (res.data ?? []).map((c: any) => ({
    classId: c.classId ?? c.class_id,
    className: c.className ?? c.class_name,
  }));
};

