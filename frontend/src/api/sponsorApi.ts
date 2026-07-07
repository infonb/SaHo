import { apiClient } from './client';
import type { SponsorFilters, SponsorView } from '../types';

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
  imageUrl?: string | null;
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
    imageUrl: payload.image_url || null,
    createdBy: userId,
  };
};

const sendSponsorForm = async (
  url: string,
  method: 'post' | 'put',
  backendPayload: BackendSponsorRequest,
  imageFile?: File | Blob
) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('request', JSON.stringify(backendPayload));
    formData.append('image', imageFile);
    const response = await apiClient.request({
      url,
      method,
      data: formData,
    });
    return response.data;
  }

  const response = await apiClient.request({
    url,
    method,
    data: backendPayload,
  });
  return response.data;
};

const normalizeSponsorTypeFilter = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (trimmed === '1' || trimmed === '2') return trimmed;
  if (trimmed.toLowerCase().startsWith('org')) return '2';
  if (trimmed.toLowerCase().startsWith('ind')) return '1';

  return trimmed;
};

const normalizeNationalityFilter = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (trimmed === '1' || trimmed === '2') return trimmed;
  if (trimmed.toLowerCase().startsWith('for')) return '2';
  if (trimmed.toLowerCase().startsWith('ind')) return '1';

  return trimmed;
};

const normalizeStatusFilter = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed === 'true' || trimmed === 'false') return trimmed;
  if (trimmed.toLowerCase().startsWith('act')) return 'true';
  if (trimmed.toLowerCase().startsWith('inact')) return 'false';
  return trimmed;
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
  filters?: Partial<SponsorFilters>,
  options?: {
    pageNumber?: number;
    pageSize?: number;
    sortColumn?: string;
    sortDirection?: 'ASC' | 'DESC';
  }
): Promise<SponsorView[]> => {

  try {

    const params = new URLSearchParams();

    params.append('pageNumber', String(options?.pageNumber ?? 1));
    params.append('pageSize', String(options?.pageSize ?? 100));
    if (filters?.search?.trim()) {
      params.append('search', filters.search.trim());
    }
    const typeFilter = normalizeSponsorTypeFilter(filters?.type);
    if (typeFilter) {
      params.append('type', typeFilter);
    }
    const nationalityFilter = normalizeNationalityFilter(filters?.nationality);
    if (nationalityFilter) {
      params.append('nationality', nationalityFilter);
    }
    const statusFilter = normalizeStatusFilter(filters?.is_active);
    if (statusFilter) {
      params.append('isActive', statusFilter);
    }
    if (options?.sortColumn) {
      params.append('sortColumn', options.sortColumn);
    }
    if (options?.sortDirection) {
      params.append('sortDirection', options.sortDirection);
    }

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

    return sponsors;

  } catch (error) {

    console.error(
      'Failed to fetch sponsors:',
      error
    );

    throw error;
  }
};

export const getSponsorIds = async (filters?: Partial<SponsorFilters>): Promise<number[]> => {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.append('search', filters.search.trim());
  const typeFilter = normalizeSponsorTypeFilter(filters?.type);
  if (typeFilter) params.append('type', typeFilter);
  const nationalityFilter = normalizeNationalityFilter(filters?.nationality);
  if (nationalityFilter) params.append('nationality', nationalityFilter);
  const statusFilter = normalizeStatusFilter(filters?.is_active);
  if (statusFilter) params.append('isActive', statusFilter);

  const response = await apiClient.get<ApiResponse<number[]>>('/sponsors/ids', { params });
  return response.data?.data ?? [];
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
  payload: CreateSponsorPayload,
  imageFile?: File | Blob
): Promise<void> => {

  try {

    const userId = currentUserId;

    const backendPayload =
      mapFrontendToBackend(payload, userId);

    console.log(
      'Create Sponsor Payload:',
      backendPayload
    );

    const response = await sendSponsorForm('/sponsors', 'post', backendPayload, imageFile);

    console.log('Create Sponsor Response:', response);

    if (response?.success) {
      return;
    }

    throw new Error(
      response?.message ||
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
  payload: Partial<SponsorView>,
  imageFile?: File | Blob
) => {

  try {

    const sponsorType =
      (payload as any).type ??
      (payload as any).sponsor_type;

    const backendPayload = {

      sponsorId: id,

      sponsorName: payload.sponsorName ?? '',

      email: payload.email ?? '',

      dob: payload.dob ?? '',

      phNo: payload.ph_no ?? '',

      sponsorType,

      nationality: payload.nationality ?? '',

      contrib: payload.contrib ?? '',

      loc: payload.loc ?? null,

      imageUrl: (payload as any).image_url ?? (payload as any).imageUrl ?? null,

      modifiedBy: currentUserId
    };

    console.log('Update Sponsor Payload:', backendPayload);

    const response = await sendSponsorForm(`/sponsors/${id}`, 'put', backendPayload, imageFile);

    console.log('Update Sponsor Response:', response);

    if (response?.success) {
      return;
    }

    throw new Error(
      response?.message ||
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
