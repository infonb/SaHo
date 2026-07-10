import { apiClient } from './client';
import type { BulkImportResponse } from '../types';

export const downloadTemplate = async (): Promise<void> => {
  const res = await apiClient.get('/students/import/template', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'student_import_template.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const importStudents = async (file: File): Promise<BulkImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/students/import', formData);
  return res.data as BulkImportResponse;
};
