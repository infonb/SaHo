import { delay, MOCK_STUDENT_SPONSORS } from './mockData';
import type { StudentSponsor } from '../types';

export const assignSponsor = async (std_id: number, spn_id: number, created_by: string): Promise<StudentSponsor> => {
  await delay();
  MOCK_STUDENT_SPONSORS.forEach(ss => { if (ss.std_id === std_id && ss.is_active) ss.is_active = false; });
  const row: StudentSponsor = { id: Math.max(0, ...MOCK_STUDENT_SPONSORS.map(ss => ss.id)) + 1, std_id, spn_id, is_active: true, assigned_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), created_by, modified_at: null, modified_by: null };
  MOCK_STUDENT_SPONSORS.push(row);
  return row;
};
export const removeSponsorFromStudent = async (std_id: number): Promise<void> => {
  await delay();
  MOCK_STUDENT_SPONSORS.forEach(ss => { if (ss.std_id === std_id && ss.is_active) ss.is_active = false; });
};
