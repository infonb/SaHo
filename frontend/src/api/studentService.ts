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
  middleName?: string | null;
  lastName: string;
  phoneNumber: string;
  relationshipId: number;
  occ?: string | null;
  addr?: string | null;
  isDeleted?: boolean;
}

export interface StudentRequestPayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  emailId: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;
  casteId: number;
  religion?: string | null;
  bloodGroup?: string | null;
  schId: number;
  classId: number;
  orphanStatus?: string | null;
  imageUrl?: string | null;
  createdBy: number;
  hasSibling?: boolean;
  siblingIds?: string | null;
  guardian: StudentRequestGuardianDto;
}

export interface StudentSiblingSearchResponse {
  studentId: number;
  studentName: string;
  classId: number;
  schoolName: string;
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
  classId?: number;
  siblingId?: string;
  orphanStatus?: string | null;
  imageUrl?: string | null;
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

export interface ClassResponse {
  classId: number;
  className: string;
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

export const createStudent = async (payload: StudentRequestPayload, imageFile?: File | Blob) => {
  return sendStudentForm(payload, '/students', 'post', imageFile);
};

export const updateStudent = async (studentId: number, payload: StudentRequestPayload, imageFile?: File | Blob) => {
  return sendStudentForm(payload, `/students/${studentId}`, 'put', imageFile);
};
