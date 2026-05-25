import axios from 'axios';
import type { Sponsor, SponsorFilters, SponsorView } from '../types';

// API Base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Create Axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store current user ID for API requests
let currentUserId: number = 1;

/**
 * Set the current user ID for API requests (call from AuthContext or on login)
 */
export const setCurrentUserId = (userId: number): void => {
  currentUserId = userId;
};

/**
 * Get the current user ID
 */
export const getCurrentUserId = (): number => {
  return currentUserId;
};

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Backend Sponsor Request DTO
interface BackendSponsorRequest {
  sponsorId?: number | null;
  sponsorName: string;
  email: string;
  dob: string; // Format: YYYY-MM-DD
  phNo: string;
  sponsorType: 'Individual' | 'Organisation';
  nationality: string;
  contrib: string; // BigDecimal as string
  loc?: string | null;
  createdBy?: number;
  modifiedBy?: number;
}

/**
 * Convert frontend payload to backend request format
 */
const mapFrontendToBackend = (
  payload: CreateSponsorPayload,
  userId: number
): BackendSponsorRequest => {
  return {
    sponsorId: null,
    sponsorName: payload.first_name,
    email: payload.email,
    dob: payload.dob, // Already in YYYY-MM-DD format from form
    phNo: payload.ph_no,
    sponsorType: payload.type,
    nationality: payload.nationality,
    contrib: payload.contrib_amt ? String(payload.contrib_amt) : null,
    loc: payload.loc || null,
    createdBy: userId,
    modifiedBy: null,
  };
};

/**
 * Convert backend response to frontend format
 */
const mapBackendToFrontend = (sponsor: any): SponsorView => {
  return {
    sponsor_id: sponsor.sponsorId,
    full_name: sponsor.sponsorName,
    email: sponsor.email,
    dob: sponsor.dob,
    ph_no: sponsor.phNo,
    type: sponsor.sponsorType,
    nationality: sponsor.nationality,
    contrib_amt: sponsor.contrib,
    loc: sponsor.loc,
    image_url: sponsor.imageUrl,
    is_active: sponsor.isActive ?? true,
    created_at: sponsor.createdAt,
    created_by: sponsor.createdBy,
    modified_at: sponsor.modifiedAt,
    modified_by: sponsor.modifiedBy,
    students_count: sponsor.studentsCount ?? 0,
  };
};

export const getSponsors = async (filters?: Partial<SponsorFilters>): Promise<SponsorView[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('pageNumber', '0');
    params.append('pageSize', '100');

    const response = await apiClient.get<ApiResponse<any>>('/sponsors', { params });

    if (response.data?.data?.sponsors) {
      const sponsors = response.data.data.sponsors.map(mapBackendToFrontend);

      // Apply frontend filters
      let filtered = sponsors;
      if (filters?.is_active !== undefined) {
        filtered = filtered.filter(s => s.is_active === (filters.is_active !== 'false'));
      }
      if (filters?.type) {
        filtered = filtered.filter(s => s.type === filters.type);
      }
      if (filters?.nationality) {
        filtered = filtered.filter(s => s.nationality === filters.nationality);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          v => v.full_name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)
        );
      }

      return filtered;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch sponsors:', error);
    throw error;
  }
};

export const getSponsorById = async (id: number): Promise<SponsorView | undefined> => {
  try {
    const response = await apiClient.get<ApiResponse<any>>(`/sponsors/${id}`);

    if (response.data?.data) {
      return mapBackendToFrontend(response.data.data);
    }

    return undefined;
  } catch (error) {
    console.error(`Failed to fetch sponsor ${id}:`, error);
    throw error;
  }
};

export interface CreateSponsorPayload {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  dob: string;
  ph_no: string;
  loc?: string | null;
  type: 'Individual' | 'Organisation';
  nationality: string;
  contrib_amt: string;
  image_url?: string | null;
  created_by: string;
}

export const createSponsor = async (payload: CreateSponsorPayload): Promise<Sponsor> => {
  try {
    const userId = currentUserId;
    const backendPayload = mapFrontendToBackend(payload, userId);

    const response = await apiClient.post<ApiResponse<any>>('/sponsors', backendPayload);

    if (response.data?.success) {
      console.log('Sponsor created successfully:', response.data.message);
      return {
        sponsor_id: Math.random() * 1000, // Backend should return ID in real scenario
        ...payload,
        is_active: true,
        created_at: new Date().toISOString(),
        modified_at: null,
        modified_by: null,
      } as Sponsor;
    }

    throw new Error(response.data?.message || 'Failed to create sponsor');
  } catch (error) {
    console.error('Failed to create sponsor:', error);
    throw error;
  }
};

export const updateSponsor = async (id: number, payload: Partial<Sponsor>): Promise<Sponsor> => {
  try {
    const userId = currentUserId;
    const backendPayload: any = {
      sponsorId: id,
      sponsorName: payload.first_name || payload.full_name,
      email: payload.email,
      dob: payload.dob,
      phNo: payload.ph_no,
      sponsorType: payload.type,
      nationality: payload.nationality,
      contrib: payload.contrib_amt,
      loc: payload.loc,
      modifiedBy: userId,
    };

    // Filter out undefined values
    Object.keys(backendPayload).forEach(
      key => backendPayload[key] === undefined && delete backendPayload[key]
    );

    const response = await apiClient.post<ApiResponse<any>>('/sponsors', backendPayload);

    if (response.data?.success) {
      console.log('Sponsor updated successfully:', response.data.message);
      return {
        sponsor_id: id,
        ...payload,
      } as Sponsor;
    }

    throw new Error(response.data?.message || 'Failed to update sponsor');
  } catch (error) {
    console.error('Failed to update sponsor:', error);
    throw error;
  }
};

export const deactivateSponsor = async (id: number, modified_by: string): Promise<void> => {
  try {
    const userId = currentUserId;
    // Backend delete endpoint expects sponsorId and modifiedBy parameters
    await apiClient.delete(`/sponsors/${id}`, {
      params: { modifiedBy: userId },
    });

    console.log(`Sponsor ${id} deactivated successfully`);
  } catch (error) {
    console.error(`Failed to deactivate sponsor ${id}:`, error);
    throw error;
  }
};

export const deactivateSponsors = async (ids: number[], modified_by: string): Promise<void> => {
  try {
    await Promise.all(ids.map(id => deactivateSponsor(id, modified_by)));
  } catch (error) {
    console.error('Failed to deactivate sponsors:', error);
    throw error;
  }
};

