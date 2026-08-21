export interface StateMaster {
  stId: number;
  st_id?: number;
  stName: string;
  st_name?: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string | null;
  updated_at?: string | null;
}
export interface DistrictMaster {
  distId: number;
  dist_id?: number;
  distName: string;
  dist_name?: string;
  stId: number;
  st_id?: number;
  createdAt: string;
  created_at?: string;
  updatedAt: string | null;
  updated_at?: string | null;
}
export interface MandalMaster {
  mndlId: number;
  mndl_id?: number;
  mndlName: string;
  mndl_name?: string;
  distId: number;
  dist_id?: number;
  createdAt: string;
  created_at?: string;
  updatedAt: string | null;
  updated_at?: string | null;
}
export interface VillageMaster {
  vilId: number;
  vil_id?: number;
  vilName: string;
  vil_name?: string;
  vilPincode: number;
  vil_pincode?: number;
  mndlId: number;
  mndl_id?: number;
  createdAt: string;
  created_at?: string;
  updatedAt: string | null;
  updated_at?: string | null;
}
export interface SchoolMaster {
  schId: number;
  sch_id?: number;
  schName: string;
  sch_name?: string;
  schAddress: string;
  sch_address?: string;
  vilId: number;
  vil_id?: number;
  createdAt: string;
  created_at?: string;
  updatedAt: string | null;
  updated_at?: string | null;
}
export interface RelationshipMaster {
  relationship_id: number;
  relationship_name: string;
  relationship_code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
export interface User {
  user_id: number;
  username: string;
  password: string;
  email_id: string;
  role: "Admin" | "Student" | "Sponsor" | "Volunteer" | "admin" | "student" | "sponsor" | "volunteer";
  is_active: boolean;
  created_at: string;
  created_by: string;
  modified_at: string | null;
  modified_by: string | null;
}
export interface Guardian {
  guardian_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string;
  relation: number;
  occ: string | null;
  addr: string | null;
  created_at: string;
  updated_at: string | null;
}
export interface Student {
  student_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  aadhaar_number: string;
  caste: string;
  religion: string | null;
  blood_group: string | null;
  sch_id: number;
  class_id: string;
  guardian_id: number;
  orphan_status: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  modified_at: string | null;
  modified_by: string | null;
}

export interface Sponsor {
  sponsor_id: number;

  sponsorName: string;

  email: string;

  dob: string;

  ph_no: string;

  type: "Individual" | "Organisation";

  nationality: string;

  contrib: string;

  loc?: string | null;

  image_url?: string | null;

  is_active: boolean;

  created_at?: string;

  created_by?: number | string;

  modified_at?: string | null;

  modified_by?: number | string | null;
}
export interface StudentSponsor { id: number; std_id: number; spn_id: number; assigned_date: string; is_active: boolean; created_at: string; created_by: string; modified_at: string | null; modified_by: string | null; }
export interface Reminder { rem_id: number; title: string; description: string | null; event_date: string; venue: string; st_id_csv: number | null; dist_ids_csv: string | null; mndl_ids_csv: string | null; vil_ids_csv: string | null; sch_ids_csv: string | null; status: boolean; created_by: number; created_at: string; updated_at: string | null; }
export interface StudentReminder { rem_std_id: number; std_id: number; rem_id: number; }
export interface AuthUser { user_id: number; username: string; email_id: string; role: User['role']; initials: string; student_id?: number; }
export interface LoginResponse { userId: number; studentId?: number; email?: string; role: string; authenticated?: boolean; token?: string; }
export interface StudentView { student_id: number; studentName?: string; full_name: string; email: string; dob: string; gender: 'Male' | 'Female' | 'Other'; aadhaar_number: string; caste: string; religion: string | null; blood_group: string | null; class_id: string; orphan_status: string | null; image_url: string | null; is_active: boolean; created_at: string; created_by: string; sch_id: number; sch_name: string; sch_address: string; vil_id: number; vil_name: string; mndl_id: number; mndl_name: string; dist_id: number; dist_name: string; st_id: number; st_name: string; guardian_id: number; guardian_full_name: string; guardian_phone: string; guardian_relation_name: string; guardian_occ: string | null; sponsor_id: number | null; sponsorName?: string | null; sponsor_type: string | null; sibling_id?: string | null; sibling_student_name?: string | null; sibling_student_id?: number | null; status?: string | null; admissionType?: string | null; annualResult?: string | null; }

export interface SponsorView {
  sponsor_id: number;

  sponsorName: string;

  email: string;
  dob: string;
  ph_no: string;
  type: "Individual" | "Organisation";
  nationality: string;
  contrib: string;
  loc?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
  created_by?: number;
  modified_at?: string | null;
  modified_by?: number | null;
  students_count?: number;
}
export interface VolunteerView {
  user_id: number;
  username: string;
  email_id: string;
  is_active: boolean;
  created_at: string;
  phone: string;
  district: string;
  availability: string;
  volunteer_role: string;
}
export interface StudentFilters {
  search: string;
  gender: string;
  class_id: string;
  academic_year_id: string;
  dist_id: string;
  st_id: string;
  mndl_id: string;
  vil_id: string;
  sch_id: string;
  orphan_status: string;
  parent_type: string;
  parent_occupation: string;
  sponsor_status: "" | "assigned" | "unassigned";
  is_active: string;
}
export interface SponsorFilters {
  search: string;
  type: string;
  nationality: string;
  is_active: string;
  studentCount: string;
  studentCountMin: string;
  studentCountMax: string;
  createdMonth?: string;
}
export interface VolunteerFilters {
  search: string;
  is_active: string;
}
export interface DashboardStatsLegacy {
  total_students: number;
  active_students: number;
  pending_students: number;
  inactive_students: number;
  sponsored_students: number;
  unsponsored_students: number;
  total_sponsors: number;
  active_sponsors: number;
  total_pledged: number;
  total_volunteers: number;
  active_volunteers: number;
  total_admins: number;
  gender_split: { male: number; female: number; other: number };
  status_split: { active: number; inactive: number };
  district_breakdown: { dist_name: string; student_count: number }[];
  year_wise_growth: { year: string; students: number; sponsors: number }[];
  recent_students: StudentView[];
  top_sponsors: SponsorView[];
}

export interface DashboardData {
  studentSummary: {
    totalStudents: number;
    boysCount: number;
    girlsCount: number;
  };
  villageSummary: {
    totalVillages: number;
    totalMandals: number;
    totalDistricts: number;
  };
  studentCategory: {
    orphanCount: number;
    semiOrphanCount: number;
  };
  upcomingEvents: {
    remId: number;
    title: string;
    description?: string | null;
    eventDate: string;
    eventTime?: string | null;
    venue: string;
  }[];
  ageDistribution: {
    age10To11: number;
    age12To13: number;
    age14To15: number;
    age16Plus: number;
  };
  studentsByLocation: {
    mandalName: string;
    studentCount: number;
  }[];
  yearlyStudentData: {
    year: number;
    totalStudents: number;
    boysCount: number;
    girlsCount: number;
  }[];
}

export type DashboardStats = DashboardData;

export interface ImportError {
  row: number;
  message: string;
}

export interface BulkImportResponse {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  studentsImported?: number;
  guardiansCreated?: number;
  errors?: ImportError[];
}
