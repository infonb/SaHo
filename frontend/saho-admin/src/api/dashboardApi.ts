import { buildSponsorView, buildStudentView, delay, MOCK_SPONSORS, MOCK_STUDENT_SPONSORS, MOCK_STUDENTS, MOCK_USERS } from './mockData';
import type { DashboardStats } from '../types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  await delay(300);
  const students = MOCK_STUDENTS.filter(s => s.is_active);
  const sponsors = MOCK_SPONSORS.filter(s => s.is_active);
  const volunteers = MOCK_USERS.filter(u => u.role === 'Volunteer' && u.is_active);
  const admins = MOCK_USERS.filter(u => u.role === 'Admin' && u.is_active);
  const assigned = new Set(MOCK_STUDENT_SPONSORS.filter(ss => ss.is_active).map(ss => ss.std_id));
  const distMap: Record<string, number> = {};
  students.forEach(s => { const view = buildStudentView(s); distMap[view.dist_name] = (distMap[view.dist_name] ?? 0) + 1; });
  const numericContribution = (value: string) => (/^\d+(\.\d+)?$/.test(value) ? Number(value) : 0);
  return {
    total_students: students.length, active_students: students.length, pending_students: 0, inactive_students: MOCK_STUDENTS.filter(s => !s.is_active).length, sponsored_students: assigned.size, unsponsored_students: students.length - assigned.size,
    total_sponsors: sponsors.length, active_sponsors: sponsors.length, total_pledged: sponsors.reduce((t, s) => t + numericContribution(s.contrib_amt), 0), total_volunteers: volunteers.length, active_volunteers: volunteers.length, total_admins: admins.length,
    gender_split: { male: students.filter(s => s.gender === 'Male').length, female: students.filter(s => s.gender === 'Female').length, other: students.filter(s => s.gender === 'Other').length },
    status_split: { active: students.length, inactive: MOCK_STUDENTS.filter(s => !s.is_active).length },
    district_breakdown: Object.entries(distMap).map(([dist_name, student_count]) => ({ dist_name, student_count })),
    year_wise_growth: [{ year: '2021', students: 8, sponsors: 2 }, { year: '2022', students: 14, sponsors: 3 }, { year: '2023', students: 22, sponsors: 5 }, { year: '2024', students: 38, sponsors: 8 }, { year: '2025', students: students.length, sponsors: sponsors.length }],
    recent_students: [...students].sort((a, b) => b.student_id - a.student_id).slice(0, 4).map(buildStudentView),
    top_sponsors: [...sponsors].sort((a, b) => numericContribution(b.contrib_amt) - numericContribution(a.contrib_amt)).slice(0, 4).map(buildSponsorView),
  };
};
