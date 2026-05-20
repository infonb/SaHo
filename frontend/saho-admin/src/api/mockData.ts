import type { DistrictMaster, Guardian, MandalMaster, RelationshipMaster, Reminder, SchoolMaster, Sponsor, SponsorView, StateMaster, Student, StudentSponsor, StudentView, User, VillageMaster } from '../types';

export const delay = (ms = 450) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const MOCK_STATES: StateMaster[] = [
  { st_id: 1, st_name: 'Telangana', created_at: '2024-01-01', updated_at: null },
  { st_id: 2, st_name: 'Andhra Pradesh', created_at: '2024-01-01', updated_at: null },
];
export const MOCK_DISTRICTS: DistrictMaster[] = [
  { dist_id: 1, dist_name: 'Warangal', st_id: 1, created_at: '2024-01-01', updated_at: null },
  { dist_id: 2, dist_name: 'Karimnagar', st_id: 1, created_at: '2024-01-01', updated_at: null },
  { dist_id: 3, dist_name: 'Nalgonda', st_id: 1, created_at: '2024-01-01', updated_at: null },
];
export const MOCK_MANDALS: MandalMaster[] = [
  { mndl_id: 1, mndl_name: 'Hanamkonda', dist_id: 1, created_at: '2024-01-01', updated_at: null },
  { mndl_id: 2, mndl_name: 'Jammikunta', dist_id: 2, created_at: '2024-01-01', updated_at: null },
  { mndl_id: 3, mndl_name: 'Miryalaguda', dist_id: 3, created_at: '2024-01-01', updated_at: null },
];
export const MOCK_VILLAGES: VillageMaster[] = [
  { vil_id: 1, vil_name: 'Dharmasagar', vil_pincode: 506001, mndl_id: 1, created_at: '2024-01-01', updated_at: null },
  { vil_id: 2, vil_name: 'Gangadhara', vil_pincode: 505122, mndl_id: 2, created_at: '2024-01-01', updated_at: null },
  { vil_id: 3, vil_name: 'Nereducharla', vil_pincode: 508112, mndl_id: 3, created_at: '2024-01-01', updated_at: null },
];
export const MOCK_SCHOOLS: SchoolMaster[] = [
  { sch_id: 1, sch_name: 'ZP High School Warangal', sch_address: 'Hanamkonda, Warangal, Telangana 506001', vil_id: 1, created_at: '2024-01-01', updated_at: null },
  { sch_id: 2, sch_name: "St. Joseph's High School", sch_address: 'Jammikunta, Karimnagar, Telangana 505122', vil_id: 2, created_at: '2024-01-01', updated_at: null },
  { sch_id: 3, sch_name: 'Kasturba Vidyalaya', sch_address: 'Nereducharla, Nalgonda, Telangana 508112', vil_id: 3, created_at: '2024-01-01', updated_at: null },
];
export const MOCK_RELATIONSHIPS: RelationshipMaster[] = [
  { relationship_id: 1, relationship_name: 'Mother', relationship_code: 'MTH', description: null, is_active: true, created_at: '2024-01-01', updated_at: null },
  { relationship_id: 2, relationship_name: 'Father', relationship_code: 'FTH', description: null, is_active: true, created_at: '2024-01-01', updated_at: null },
  { relationship_id: 3, relationship_name: 'Uncle', relationship_code: 'UNC', description: null, is_active: true, created_at: '2024-01-01', updated_at: null },
  { relationship_id: 4, relationship_name: 'Aunt', relationship_code: 'ANT', description: null, is_active: true, created_at: '2024-01-01', updated_at: null },
  { relationship_id: 5, relationship_name: 'Grandparent', relationship_code: 'GRP', description: null, is_active: true, created_at: '2024-01-01', updated_at: null },
];

export let MOCK_USERS: User[] = [
  { user_id: 1, username: 'Admin User', password: 'hashed_pw', email_id: 'admin@sahofoundation.org', role: 'Admin', is_active: true, created_at: '2024-01-10', created_by: 'system', modified_at: null, modified_by: null },
  { user_id: 2, username: 'Suresh Verma', password: 'hashed_pw', email_id: 'suresh.v@sahofoundation.org', role: 'Admin', is_active: true, created_at: '2024-03-15', created_by: 'admin', modified_at: null, modified_by: null },
  { user_id: 3, username: 'Preethi Nair', password: 'hashed_pw', email_id: 'preethi.n@sahofoundation.org', role: 'Volunteer', is_active: true, created_at: '2024-06-20', created_by: 'admin', modified_at: null, modified_by: null },
];
export let MOCK_GUARDIANS: Guardian[] = [
  { guardian_id: 1, first_name: 'Sunita', middle_name: null, last_name: 'Reddy', phone_number: '9811001001', relation: 1, occ: 'Tailor', addr: 'Dharmasagar, Warangal', created_at: '2024-02-01', updated_at: null },
  { guardian_id: 2, first_name: 'Ramesh', middle_name: null, last_name: 'Kumar', phone_number: '9811001002', relation: 2, occ: 'Auto Driver', addr: 'Gangadhara, Karimnagar', created_at: '2024-02-02', updated_at: null },
  { guardian_id: 3, first_name: 'Vijaya', middle_name: null, last_name: 'Lakshmi', phone_number: '9811001003', relation: 1, occ: 'Domestic Worker', addr: 'Dharmasagar, Warangal', created_at: '2024-02-03', updated_at: null },
  { guardian_id: 4, first_name: 'Srinivas', middle_name: null, last_name: 'Rao', phone_number: '9811001004', relation: 2, occ: 'Farmer', addr: 'Nereducharla, Nalgonda', created_at: '2024-02-04', updated_at: null },
  { guardian_id: 5, first_name: 'Geeta', middle_name: null, last_name: 'Singh', phone_number: '9811001005', relation: 1, occ: 'Vegetable Vendor', addr: 'Dharmasagar, Warangal', created_at: '2024-02-05', updated_at: null },
];
export let MOCK_STUDENTS: Student[] = [
  { student_id: 1, first_name: 'Priya', middle_name: null, last_name: 'Reddy', dob: '2008-03-15', gender: 'Female', aadhaar_number: '123456789012', caste: 'BC-B', religion: 'Hindu', blood_group: 'O+', sch_id: 1, class_id: '8th', guardian_id: 1, orphan_status: null, image_url: null, is_active: true, created_at: '2024-03-01', created_by: 'admin', modified_at: null, modified_by: null },
  { student_id: 2, first_name: 'Arjun', middle_name: null, last_name: 'Kumar', dob: '2009-07-22', gender: 'Male', aadhaar_number: '234567890123', caste: 'OC', religion: 'Hindu', blood_group: 'A+', sch_id: 2, class_id: '7th', guardian_id: 2, orphan_status: null, image_url: null, is_active: true, created_at: '2024-03-02', created_by: 'admin', modified_at: null, modified_by: null },
  { student_id: 3, first_name: 'Meena', middle_name: null, last_name: 'Devi', dob: '2007-11-08', gender: 'Female', aadhaar_number: '345678901234', caste: 'SC', religion: 'Hindu', blood_group: 'B+', sch_id: 1, class_id: '9th', guardian_id: 3, orphan_status: null, image_url: null, is_active: true, created_at: '2024-03-03', created_by: 'admin', modified_at: null, modified_by: null },
  { student_id: 4, first_name: 'Ravi', middle_name: null, last_name: 'Shankar', dob: '2010-01-30', gender: 'Male', aadhaar_number: '456789012345', caste: 'BC-A', religion: 'Hindu', blood_group: 'AB+', sch_id: 3, class_id: '6th', guardian_id: 1, orphan_status: null, image_url: null, is_active: true, created_at: '2024-03-04', created_by: 'admin', modified_at: null, modified_by: null },
  { student_id: 5, first_name: 'Lakshmi', middle_name: null, last_name: 'Bai', dob: '2008-05-12', gender: 'Female', aadhaar_number: '567890123456', caste: 'SC', religion: 'Hindu', blood_group: 'O-', sch_id: 2, class_id: '8th', guardian_id: 4, orphan_status: null, image_url: null, is_active: true, created_at: '2024-03-05', created_by: 'admin', modified_at: null, modified_by: null },
  { student_id: 6, first_name: 'Kiran', middle_name: null, last_name: 'Babu', dob: '2009-09-18', gender: 'Male', aadhaar_number: '678901234567', caste: 'OC', religion: 'Muslim', blood_group: 'B-', sch_id: 3, class_id: '7th', guardian_id: 2, orphan_status: null, image_url: null, is_active: false, created_at: '2024-03-06', created_by: 'admin', modified_at: null, modified_by: null },
  { student_id: 7, first_name: 'Anitha', middle_name: null, last_name: 'Singh', dob: '2011-02-28', gender: 'Female', aadhaar_number: '789012345678', caste: 'BC-C', religion: 'Hindu', blood_group: 'A-', sch_id: 1, class_id: '5th', guardian_id: 5, orphan_status: 'Single Parent', image_url: null, is_active: true, created_at: '2024-03-07', created_by: 'admin', modified_at: null, modified_by: null },
];
export let MOCK_SPONSORS: Sponsor[] = [
  { sponsor_id: 1, first_name: 'Infosys', middle_name: null, last_name: 'Foundation', email: 'contact@infosys.com', dob: '1981-07-02', ph_no: '8000001111', loc: 'Bengaluru, Karnataka', type: 'Organisation', nationality: 'Indian', contrib_amt: 5000, is_active: true, created_at: '2024-04-01', created_by: 'admin', modified_at: null, modified_by: null },
  { sponsor_id: 2, first_name: 'Anjali', middle_name: null, last_name: 'Mehta', email: 'anjali.m@gmail.com', dob: '1985-03-15', ph_no: '9700002222', loc: 'Mumbai, Maharashtra', type: 'Individual', nationality: 'Indian', contrib_amt: 2500, is_active: true, created_at: '2024-04-02', created_by: 'admin', modified_at: null, modified_by: null },
  { sponsor_id: 3, first_name: 'TCS', middle_name: null, last_name: 'Cares Trust', email: 'csr@tcs.com', dob: '1968-04-01', ph_no: '8000003333', loc: 'Mumbai, Maharashtra', type: 'Organisation', nationality: 'Indian', contrib_amt: 3000, is_active: true, created_at: '2024-04-03', created_by: 'admin', modified_at: null, modified_by: null },
  { sponsor_id: 4, first_name: 'Prakash', middle_name: null, last_name: 'Rao', email: 'prakash.r@yahoo.com', dob: '1972-09-20', ph_no: '9900004444', loc: 'Hyderabad, Telangana', type: 'Individual', nationality: 'Indian', contrib_amt: 1500, is_active: false, created_at: '2024-04-04', created_by: 'admin', modified_at: null, modified_by: null },
];
export let MOCK_STUDENT_SPONSORS: StudentSponsor[] = [
  { id: 1, std_id: 1, spn_id: 1, assigned_date: '2024-05-01', is_active: true, created_at: '2024-05-01', created_by: 'admin', modified_at: null, modified_by: null },
  { id: 2, std_id: 3, spn_id: 2, assigned_date: '2024-05-02', is_active: true, created_at: '2024-05-02', created_by: 'admin', modified_at: null, modified_by: null },
  { id: 3, std_id: 5, spn_id: 1, assigned_date: '2024-05-03', is_active: true, created_at: '2024-05-03', created_by: 'admin', modified_at: null, modified_by: null },
];
export let MOCK_REMINDERS: Reminder[] = [
  { rem_id: 1, title: 'Annual Sports Day', description: 'All students must register before 10th December.', event_date: '2025-12-15', venue: 'ZP High School Ground, Warangal', st_id_csv: 1, dist_ids_csv: '1,2', mndl_ids_csv: null, vil_ids_csv: null, sch_ids_csv: null, status: true, created_by: 1, created_at: '2025-11-01', updated_at: null },
  { rem_id: 2, title: 'Fee Submission Deadline', description: 'Last date for fee submission. Please ensure timely payment.', event_date: '2025-11-30', venue: 'Online / School Office', st_id_csv: null, dist_ids_csv: null, mndl_ids_csv: null, vil_ids_csv: null, sch_ids_csv: null, status: true, created_by: 1, created_at: '2025-10-15', updated_at: null },
];

export const buildStudentView = (s: Student): StudentView => {
  const school = MOCK_SCHOOLS.find(sc => sc.sch_id === s.sch_id)!;
  const village = MOCK_VILLAGES.find(v => v.vil_id === school.vil_id)!;
  const mandal = MOCK_MANDALS.find(m => m.mndl_id === village.mndl_id)!;
  const district = MOCK_DISTRICTS.find(d => d.dist_id === mandal.dist_id)!;
  const state = MOCK_STATES.find(st => st.st_id === district.st_id)!;
  const guardian = MOCK_GUARDIANS.find(g => g.guardian_id === s.guardian_id)!;
  const rel = MOCK_RELATIONSHIPS.find(r => r.relationship_id === guardian.relation)!;
  const assignment = MOCK_STUDENT_SPONSORS.find(ss => ss.std_id === s.student_id && ss.is_active);
  const sponsor = assignment ? MOCK_SPONSORS.find(sp => sp.sponsor_id === assignment.spn_id) : null;
  return {
    student_id: s.student_id, full_name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' '), dob: s.dob, gender: s.gender, aadhaar_number: s.aadhaar_number, caste: s.caste, religion: s.religion, blood_group: s.blood_group, class_id: s.class_id, orphan_status: s.orphan_status, image_url: s.image_url, is_active: s.is_active, created_at: s.created_at, created_by: s.created_by,
    sch_id: school.sch_id, sch_name: school.sch_name, sch_address: school.sch_address, vil_id: village.vil_id, vil_name: village.vil_name, mndl_id: mandal.mndl_id, mndl_name: mandal.mndl_name, dist_id: district.dist_id, dist_name: district.dist_name, st_id: state.st_id, st_name: state.st_name,
    guardian_id: guardian.guardian_id, guardian_full_name: [guardian.first_name, guardian.last_name].join(' '), guardian_phone: guardian.phone_number, guardian_relation_name: rel.relationship_name, guardian_occ: guardian.occ,
    sponsor_id: sponsor?.sponsor_id ?? null, sponsor_full_name: sponsor ? [sponsor.first_name, sponsor.last_name].join(' ') : null, sponsor_type: sponsor?.type ?? null,
  };
};

export const buildSponsorView = (sp: Sponsor): SponsorView => ({
  sponsor_id: sp.sponsor_id,
  full_name: [sp.first_name, sp.middle_name, sp.last_name].filter(Boolean).join(' '),
  email: sp.email,
  dob: sp.dob,
  ph_no: sp.ph_no,
  loc: sp.loc,
  type: sp.type,
  nationality: sp.nationality,
  contrib_amt: sp.contrib_amt,
  is_active: sp.is_active,
  created_at: sp.created_at,
  students_count: MOCK_STUDENT_SPONSORS.filter(ss => ss.spn_id === sp.sponsor_id && ss.is_active).length,
});
