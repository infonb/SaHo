import axios from 'axios';
import { apiClient } from './client';
import type { DistrictMaster, MandalMaster, RelationshipMaster, SchoolMaster, StateMaster, VillageMaster } from '../types';

const logApiFailure = (name: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error(`[studentService] ${name} failed`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
  } else {
    console.error(`[studentService] ${name} failed`, error);
  }
};

export interface StudentRequestGuardianDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  relationshipId: number;
  occ?: string | null;
  addr?: string | null;
  isDeleted?: boolean;
}

export interface StudentFamilyRequestPayload {
  fatherName: string;
  fatherOccupation: string;
  fatherStatus: string;
  motherName: string;
  motherOccupation: string;
  motherStatus: string;
  createdBy?: number;
}

export interface GuardianRequestPayload {
  guardianId?: number | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  relationshipId: number;
  occ?: string | null;
  addr?: string | null;
}

export interface StudentAcademicRequestPayload {
  studentAcademicId?: number | null;
  academicYearId: number;
  schoolId: number;
  classId: number;
  rollNumber?: string | null;
  admissionType?: string | null;
  status?: string | null;
  remarks?: string | null;
  isActive?: boolean | null;
  isDeleted?: boolean | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface StudentRequestPayload {
  firstName: string;
  lastName: string;
  emailId: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;
  casteId: number;
  academicYearId?: number | null;
  religion?: string | null;
  bloodGroup?: string | null;
  schId?: number | null;
  classId?: number | null;
  orphanStatus?: string | null;
  imageUrl?: string | null;
  createdBy: number;
  hasSibling?: boolean;
  siblingIds?: string | null;
  familyId?: number | null;
  guardianId?: number | null;
  fatherName?: string | null;
  fatherOccupation?: string | null;
  fatherStatus?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  motherStatus?: string | null;
  guardian?: StudentRequestGuardianDto;
  academicDetails?: StudentAcademicRequestPayload;
}

export interface StudentSiblingSearchResponse {
  studentId: number;
  studentName: string;
  classId: number;
  className?: string;
  schoolName: string;
}

export interface StudentSiblingInfo {
  studentId: number;
  fullName: string;
  classId?: number;
  className?: string;
  schoolName?: string;
}

export interface StudentProfileResponse {
  studentId: number;
  studentName: string;
  emailId: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;
  casteId?: number;
  casteName?: string | null;
  religion?: string | null;
  bloodGroup?: string | null;
  studentAcademicId?: number;
  academicYearId?: number;
  academicYearName?: string | null;
  schoolId?: number;
  schoolName?: string | null;
  classId?: number;
  className?: string | null;
  familyId?: number;
  guardianId?: number;
  fatherName?: string | null;
  fatherOccupation?: string | null;
  fatherStatus?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  motherStatus?: string | null;
  siblingId?: string;
  orphanStatus?: string | null;
  imageUrl?: string | null;
  rollNumber?: string | null;
  admissionType?: string | null;
  status?: string | null;
  remarks?: string | null;
  academicDetails?: StudentAcademicRequestPayload | null;
  guardianName?: string;
  guardianFirstName?: string | null;
  guardianMiddleName?: string | null;
  guardianLastName?: string | null;
  phoneNumber?: string;
  guardianRelationName?: string | null;
  occ?: string | null;
  addr?: string | null;
  schName?: string;
  schAddress?: string;
  vilName?: string;
  vilPincode?: string;
  mndlName?: string;
  distName?: string;
  stName?: string;
}

export interface LabelValueOption {
  value: string;
  label: string;
}

export interface ClassResponse {
  classId: number;
  className: string;
}

export interface AcademicYearResponse {
  academicYearId: number;
  academicYearName: string;
}

interface CasteResponse {
  casteId: number;
  casteName: string;
}

const asArray = <T,>(data: T[] | { data?: T[]; content?: T[]; items?: T[] }): T[] => {
  if (Array.isArray(data)) return data;
  return data.data ?? data.content ?? data.items ?? [];
};

export const getStates = async (): Promise<StateMaster[]> => {
  try {
    const response = await apiClient.get<StateMaster[]>('/locations/states');
    return response.data;
  } catch (error) {
    logApiFailure('getStates', error);
    throw error;
  }
};

export const getDistrictsByState = async (stateId: number): Promise<DistrictMaster[]> => {
  try {
    const response = await apiClient.get<DistrictMaster[]>(`/locations/districts/${stateId}`);
    return response.data;
  } catch (error) {
    logApiFailure('getDistrictsByState', error);
    throw error;
  }
};

export const getMandalsByDistrict = async (districtId: number): Promise<MandalMaster[]> => {
  try {
    const response = await apiClient.get<MandalMaster[]>(`/locations/mandals/${districtId}`);
    return response.data;
  } catch (error) {
    logApiFailure('getMandalsByDistrict', error);
    throw error;
  }
};

export const getVillagesByMandal = async (mandalId: number): Promise<VillageMaster[]> => {
  try {
    const response = await apiClient.get<VillageMaster[]>(`/locations/villages/${mandalId}`);
    return response.data;
  } catch (error) {
    logApiFailure('getVillagesByMandal', error);
    throw error;
  }
};

export const getSchoolsByVillage = async (villageId: number): Promise<SchoolMaster[]> => {
  try {
    const response = await apiClient.get<SchoolMaster[]>(`/locations/schools/${villageId}`);
    return response.data;
  } catch (error) {
    logApiFailure('getSchoolsByVillage', error);
    throw error;
  }
};

export const getCastes = async (): Promise<CasteResponse[]> => {
  try {
    const response = await apiClient.get<any[] | { data?: any[]; content?: any[]; items?: any[] }>('/master/castes');
    return asArray(response.data)
      .map((c) => ({
        casteId: Number(c.casteId ?? c.caste_id ?? c.id),
        casteName: String(c.casteName ?? c.caste_name ?? c.name ?? ''),
      }))
      .filter((c) => Number.isFinite(c.casteId) && c.casteName.trim() !== '');
  } catch (error) {
    logApiFailure('getCastes', error);
    throw error;
  }
};

export const getRelationships = async (): Promise<RelationshipMaster[]> => {
  try {
    const response = await apiClient.get<any[]>('/master/relationships');
    // normalize backend DTO (relationshipId/relationshipName) to frontend shape (relationship_id/relationship_name)
    return response.data.map((r) => ({
      relationship_id: r.relationshipId ?? r.relationship_id,
      relationship_name: r.relationshipName ?? r.relationship_name,
      relationship_code: r.relationshipCode ?? r.relationship_code ?? null,
      description: r.description ?? null,
      is_active: r.isActive ?? r.is_active ?? true,
      created_at: r.createdAt ?? r.created_at ?? new Date().toISOString(),
      updated_at: r.updatedAt ?? r.updated_at ?? null,
    }));
  } catch (error) {
    logApiFailure('getRelationships', error);
    throw error;
  }
};

export const getParentStatuses = async (): Promise<LabelValueOption[]> => {
  try {
    const response = await apiClient.get<LabelValueOption[]>('/master/parent-statuses');
    return response.data ?? [];
  } catch (error) {
    logApiFailure('getParentStatuses', error);
    throw error;
  }
};

export const getParentOccupations = async (): Promise<LabelValueOption[]> => {
  try {
    const response = await apiClient.get<LabelValueOption[]>('/master/parent-occupations');
    return response.data ?? [];
  } catch (error) {
    logApiFailure('getParentOccupations', error);
    throw error;
  }
};

export const getAcademicYears = async (): Promise<AcademicYearResponse[]> => {
  try {
    const response = await apiClient.get<AcademicYearResponse[]>('/master/academic-years');
    return response.data ?? [];
  } catch (error) {
    logApiFailure('getAcademicYears', error);
    throw error;
  }
};

export const getClasses = async (): Promise<ClassResponse[]> => {
  try {
    const response = await apiClient.get<any[] | { data?: any[]; content?: any[]; items?: any[] }>('/master/classes');
    return asArray(response.data)
      .map((c) => ({
        classId: Number(c.classId ?? c.class_id ?? c.id),
        className: String(c.className ?? c.class_name ?? c.name ?? ''),
      }))
      .filter((c) => Number.isFinite(c.classId) && c.className.trim() !== '');
  } catch (error) {
    logApiFailure('getClasses', error);
    throw error;
  }
};

export const findStudentByAadhaar = async (aadhaarNumber: string): Promise<StudentSiblingSearchResponse | undefined> => {
  try {
    const response = await apiClient.get<StudentSiblingSearchResponse>(`/students/aadhaar/${aadhaarNumber}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return undefined;
    }
    logApiFailure('findStudentByAadhaar', error);
    throw error;
  }
};

export const getStudentSiblings = async (studentId: number): Promise<StudentSiblingInfo[]> => {
  try {
    const response = await apiClient.get<StudentSiblingInfo[]>(`/students/${studentId}/siblings`);
    return response.data;
  } catch (error) {
    logApiFailure('getStudentSiblings', error);
    return [];
  }
};

export const getStudentById = async (studentId: number): Promise<StudentProfileResponse> => {
  try {
    const response = await apiClient.get<StudentProfileResponse>(`/students/${studentId}`);
    return response.data;
  } catch (error) {
    logApiFailure('getStudentById', error);
    throw error;
  }
};

const sendStudentForm = async (payload: StudentRequestPayload, url: string, method: 'post' | 'put', file?: File | Blob) => {
  if (file) {
    const formData = new FormData();
    formData.append('request', JSON.stringify(payload));
    formData.append('image', file);
    const response = await apiClient.request({
      url,
      method,
      data: formData,
    });
    return response.data;
  }
  const response = await apiClient.request({ url, method, data: payload });
  return response.data;
};

const sendJson = async <T,>(url: string, method: 'post' | 'put', payload: T) => {
  const response = await apiClient.request({ url, method, data: payload });
  return response.data;
};

export const createOrUpdateStudentFamily = async (payload: StudentFamilyRequestPayload, familyId?: number | null) => {
  const url = familyId ? `/student-families/${familyId}` : '/student-families';
  const method = familyId ? 'put' : 'post';
  return sendJson(url, method, payload);
};

export const createOrUpdateGuardian = async (payload: GuardianRequestPayload, guardianId?: number | null) => {
  const url = guardianId ? `/guardians/${guardianId}` : '/guardians';
  const method = guardianId ? 'put' : 'post';
  return sendJson(url, method, payload);
};

export const createStudent = async (payload: StudentRequestPayload, imageFile?: File | Blob) => {
  return sendStudentForm(payload, '/students', 'post', imageFile);
};

export const updateStudent = async (studentId: number, payload: StudentRequestPayload, imageFile?: File | Blob) => {
  return sendStudentForm(payload, `/students/${studentId}`, 'put', imageFile);
};
