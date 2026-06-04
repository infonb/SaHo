import axios from 'axios';
import type { Sponsor, SponsorFilters, SponsorView } from '../types';

// ===============================
// API BASE URL
// ===============================

const API_BASE_URL = 'http://localhost:8080/api';

// ===============================
// AXIOS INSTANCE
// ===============================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================
// REQUEST INTERCEPTOR (MIDDLEWARE)
// ===============================

apiClient.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem('saho_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {

    if (error.response?.status === 401) {

      localStorage.removeItem('saho_token');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ===============================
// CURRENT USER
// ===============================

let currentUserId: number = 1;

export const setCurrentUserId = (userId: number): void => {
  currentUserId = userId;
};

export const getCurrentUserId = (): number => {
  return currentUserId;
};

// ===============================
// API RESPONSE WRAPPER
// ===============================

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ===============================
// CREATE SPONSOR PAYLOAD
// ===============================

export interface CreateSponsorPayload {
  sponsorName: string;
  nationality: string;
  type: 'Individual' | 'Organisation';
  email: string;
  dob: string;
  ph_no: string;
  loc?: string | null;
  contrib: string;
  image_url?: string | null;
  created_by: number;
}

// ===============================
// BACKEND REQUEST DTO
// ===============================

interface BackendSponsorRequest {
  sponsorId?: number | null;
  sponsorName: string;
  email: string;
  dob: string;
  phNo: string;
  sponsorType: 'Individual' | 'Organisation';
  nationality: string;
  contrib: string;
  loc?: string | null;
  createdBy?: number;
  modifiedBy?: number | null;
}

// ===============================
// FRONTEND -> BACKEND MAPPING
// ===============================

const mapFrontendToBackend = (
  payload: CreateSponsorPayload,
  userId: number
): BackendSponsorRequest => {

  return {
    sponsorId: null,
    sponsorName: payload.sponsorName,
    email: payload.email,
    dob: payload.dob,
    phNo: payload.ph_no,
    sponsorType: payload.type,
    nationality: payload.nationality,
    contrib: String(payload.contrib),
    loc: payload.loc || null,
    createdBy: userId,
  };
};

// ===============================
// BACKEND -> FRONTEND MAPPING
// ===============================


const mapBackendToFrontend = (sponsor: any): SponsorView => ({
  sponsor_id: sponsor.sponsorId,

  sponsorName: sponsor.sponsorName ?? '',

  email: sponsor.email ?? '',

  dob: sponsor.dob ?? '',

  ph_no: sponsor.phNo ?? '',

  type: sponsor.sponsorType ?? 'Individual',

  nationality: sponsor.nationality ?? '',

  contrib: String(sponsor.contrib ?? 0),

  loc: sponsor.loc ?? null,

  image_url: sponsor.imageUrl ?? null,

  is_active: sponsor.isActive ?? true,

  created_at: sponsor.createdAt,

  created_by: sponsor.createdBy,

  modified_at: sponsor.modifiedAt,

  modified_by: sponsor.modifiedBy,

  students_count: sponsor.studentsCount ?? 0
});

// ===============================
// GET ALL SPONSORS
// ===============================

export const getSponsors = async (
  filters?: Partial<SponsorFilters>
): Promise<SponsorView[]> => {

  try {

    const params = new URLSearchParams();

    params.append('pageNumber', '1');
    params.append('pageSize', '100');

    const response = await apiClient.get<ApiResponse<any>>(
      '/sponsors',
      { params }
    );

    console.log(
      'Sponsors API Response:',
      response.data
    );

    // SUPPORTS MULTIPLE RESPONSE STRUCTURES
    const sponsorList: any[] = Array.isArray(response.data?.data)
      ? response.data.data
      : response.data?.data?.sponsors || [];

    const sponsors: SponsorView[] = sponsorList.map(mapBackendToFrontend);

    // ===============================
    // FRONTEND FILTERS
    // ===============================

    let filtered = sponsors;

    if (filters?.is_active !== undefined) {

      filtered = filtered.filter(
        s => s.is_active === (filters.is_active !== 'false')
      );
    }

    if (filters?.type) {

      filtered = filtered.filter(
        s => s.type === filters.type
      );
    }

    if (filters?.nationality) {

      filtered = filtered.filter(
        s => s.nationality === filters.nationality
      );
    }

    if (filters?.search) {

      const q = filters.search.toLowerCase();

      filtered = filtered.filter(
        s =>
          s.sponsorName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    return filtered;

  } catch (error) {

    console.error(
      'Failed to fetch sponsors:',
      error
    );

    throw error;
  }
};

// ===============================
// GET SPONSOR BY ID
// ===============================

export const getSponsorById = async (
  id: number
): Promise<SponsorView | undefined> => {

  try {

    const response = await apiClient.get<ApiResponse<any>>(
      `/sponsors/${id}`
    );

    console.log(
      'Get Sponsor By ID Response:',
      response.data
    );

    if (response.data?.data) {

      return mapBackendToFrontend(
        response.data.data
      );
    }

    return undefined;

  } catch (error) {

    console.error(
      `Failed to fetch sponsor ${id}:`,
      error
    );

    throw error;
  }
};

// ===============================
// CREATE SPONSOR
// ===============================

export const createSponsor = async (
  payload: CreateSponsorPayload
): Promise<void> => {

  try {

    const userId = currentUserId;

    const backendPayload =
      mapFrontendToBackend(payload, userId);

    console.log(
      'Create Sponsor Payload:',
      backendPayload
    );

    const response = await apiClient.post<ApiResponse<any>>(
      '/sponsors',
      backendPayload
    );

    console.log(
      'Create Sponsor Response:',
      response.data
    );

    if (response.data?.success) {
      return;
    }

    throw new Error(
      response.data?.message ||
      'Failed to create sponsor'
    );

  } catch (error) {

    console.error(
      'Failed to create sponsor:',
      error
    );

    throw error;
  }
};
// ===============================
// UPDATE SPONSOR
// ===============================

export const updateSponsor = async (
  id: number,
  payload: Partial<SponsorView>
) => {

  try {

    const sponsorType =
      (payload as any).type ??
      (payload as any).sponsor_type;

    const backendPayload = {

      sponsorId: id,

      sponsorName: payload.sponsorName,

      email: payload.email,

      dob: payload.dob,

      phNo: payload.ph_no,

      sponsorType,

      nationality: payload.nationality,

      contrib: payload.contrib,

      loc: payload.loc,

      modifiedBy: currentUserId
    };

    console.log('Update Sponsor Payload:', backendPayload);

    const response = await apiClient.post(
      '/sponsors',
      backendPayload
    );

    console.log('Update Sponsor Response:', response.data);

    if (response.data?.success) {
      return;
    }

    throw new Error(
      response.data?.message ||
      'Failed to update sponsor'
    );

  } catch (error) {

    console.error(
      'Failed to update sponsor:',
      error
    );

    throw error;
  }
};

// ===============================
// DELETE SINGLE SPONSOR
// ===============================

export const deactivateSponsor = async (
  id: number
): Promise<void> => {

  try {

    const userId = currentUserId;

    await apiClient.delete(
      `/sponsors/${id}`,
      {
        params: {
          modifiedBy: userId,
        },
      }
    );

    console.log(
      `Sponsor ${id} deactivated successfully`
    );

  } catch (error) {

    console.error(
      `Failed to deactivate sponsor ${id}:`,
      error
    );

    throw error;
  }
};

// ===============================
// DELETE MULTIPLE SPONSORS
// ===============================

export const deactivateSponsors = async (
  ids: number[]
): Promise<void> => {

  try {

    await Promise.all(
      ids.map(id => deactivateSponsor(id))
    );

  } catch (error) {

    console.error(
      'Failed to deactivate sponsors:',
      error
    );

    throw error;
  }
};
