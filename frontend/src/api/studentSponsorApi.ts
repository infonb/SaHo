import { apiClient } from './client';
import type { StudentSponsor } from '../types';

export const assignSponsor = async (studentId: number, sponsorId: number, createdBy: string): Promise<void> => {
  await apiClient.post('/sponsors/assign', null, {
    params: { studentId, sponsorId, createdBy }
  });
};

export const removeSponsorFromStudent = async (studentId: number): Promise<void> => {
  await apiClient.delete(`/sponsors/student/${studentId}/sponsor`);
};

export const getStudentSponsorAssignment = async (studentId: number): Promise<StudentSponsor | null> => {
  const response = await apiClient.get(`/sponsors/student/${studentId}/assignment`);
  return response.data.data;
};

export const getSponsorAssignments = async (sponsorId: number): Promise<StudentSponsor[]> => {
  const response = await apiClient.get(`/sponsors/${sponsorId}/assignments`);
  return response.data.data;
};