import axios from 'axios';
import type { DistrictMaster, MandalMaster, SchoolMaster, StateMaster, VillageMaster } from '../types';

// API base URL - will be configured when backend is ready
const API_BASE_URL = '/api';

// Axios instance for future API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Event form payload type
export interface EventFormPayload {
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  stateId: string;
  districtIds: number[];
  mandalIds: number[];
  villageIds: number[];
  schoolIds: number[];
}

// ==================== STATE APIs (Placeholder) ====================

/**
 * Fetch all states
 * @future - Connect to backend API: GET /api/states
 */
export const fetchStates = async (): Promise<StateMaster[]> => {
  // Future backend API implementation:
  // const response = await apiClient.get<StateMaster[]>('/states');
  // return response.data;

  // Placeholder - return empty array for future integration
  console.log('[API Placeholder] fetchStates - Replace with: axios.get("/api/states")');
  return [];
};

/**
 * Fetch state by ID
 * @future - Connect to backend API: GET /api/states/:id
 */
export const fetchStateById = async (id: number): Promise<StateMaster | null> => {
  // Future backend API implementation:
  // const response = await apiClient.get<StateMaster>(`/states/${id}`);
  // return response.data;

  console.log(`[API Placeholder] fetchStateById(${id}) - Replace with: axios.get("/api/states/${id}")`);
  return null;
};

// ==================== DISTRICT APIs (Placeholder) ====================

/**
 * Fetch districts by state ID
 * @future - Connect to backend API: GET /api/districts?state_id=:id
 */
export const fetchDistrictsByState = async (stateId: number): Promise<DistrictMaster[]> => {
  // Future backend API implementation:
  // const response = await apiClient.get<DistrictMaster[]>('/districts', {
  //   params: { state_id: stateId }
  // });
  // return response.data;

  console.log(`[API Placeholder] fetchDistrictsByState(${stateId}) - Replace with: axios.get("/api/districts", { params: { state_id: ${stateId} } })`);
  return [];
};

/**
 * Fetch all districts
 * @future - Connect to backend API: GET /api/districts
 */
export const fetchAllDistricts = async (): Promise<DistrictMaster[]> => {
  // Future backend API implementation:
  // const response = await apiClient.get<DistrictMaster[]>('/districts');
  // return response.data;

  console.log('[API Placeholder] fetchAllDistricts - Replace with: axios.get("/api/districts")');
  return [];
};

// ==================== MANDAL APIs (Placeholder) ====================

/**
 * Fetch mandals by district ID
 * @future - Connect to backend API: GET /api/mandals?district_id=:id
 */
export const fetchMandalsByDistrict = async (districtId: number): Promise<MandalMaster[]> => {
  // Future backend API implementation:
  // const response = await apiClient.get<MandalMaster[]>('/mandals', {
  //   params: { district_id: districtId }
  // });
  // return response.data;

  console.log(`[API Placeholder] fetchMandalsByDistrict(${districtId}) - Replace with: axios.get("/api/mandals", { params: { district_id: ${districtId} } })`);
  return [];
};

// ==================== VILLAGE APIs (Placeholder) ====================

/**
 * Fetch villages by mandal ID
 * @future - Connect to backend API: GET /api/villages?mandal_id=:id
 */
export const fetchVillagesByMandal = async (mandalId: number): Promise<VillageMaster[]> => {
  // Future backend API implementation:
  // const response = await apiClient.get<VillageMaster[]>('/villages', {
  //   params: { mandal_id: mandalId }
  // });
  // return response.data;

  console.log(`[API Placeholder] fetchVillagesByMandal(${mandalId}) - Replace with: axios.get("/api/villages", { params: { mandal_id: ${mandalId} } })`);
  return [];
};

// ==================== SCHOOL APIs (Placeholder) ====================

/**
 * Fetch schools by village ID
 * @future - Connect to backend API: GET /api/schools?village_id=:id
 */
export const fetchSchoolsByVillage = async (villageId: number): Promise<SchoolMaster[]> => {
  // Future backend API implementation:
  // const response = await apiClient.get<SchoolMaster[]>('/schools', {
  //   params: { village_id: villageId }
  // });
  // return response.data;

  console.log(`[API Placeholder] fetchSchoolsByVillage(${villageId}) - Replace with: axios.get("/api/schools", { params: { village_id: ${villageId} } })`);
  return [];
};

// ==================== EVENT APIs (Placeholder) ====================

/**
 * Create a new event
 * @future - Connect to backend API: POST /api/events
 */
export const createEvent = async (payload: EventFormPayload): Promise<{ success: boolean; message: string }> => {
  // Future backend API implementation:
  // const response = await apiClient.post('/events', payload);
  // return response.data;

  console.log('[API Placeholder] createEvent - Replace with: axios.post("/api/events", payload)');
  console.log('Payload:', payload);

  // Simulate API response
  return {
    success: true,
    message: 'Event created successfully (mock)',
  };
};

/**
 * Fetch all events
 * @future - Connect to backend API: GET /api/events
 */
export const fetchEvents = async () => {
  // Future backend API implementation:
  // const response = await apiClient.get('/events');
  // return response.data;

  console.log('[API Placeholder] fetchEvents - Replace with: axios.get("/api/events")');
  return [];
};

/**
 * Update an event
 * @future - Connect to backend API: PUT /api/events/:id
 */
export const updateEvent = async (id: number, payload: Partial<EventFormPayload>) => {
  // Future backend API implementation:
  // const response = await apiClient.put(`/events/${id}`, payload);
  // return response.data;

  console.log(`[API Placeholder] updateEvent(${id}) - Replace with: axios.put("/api/events/${id}", payload)`);
  return {};
};

/**
 * Delete an event
 * @future - Connect to backend API: DELETE /api/events/:id
 */
export const deleteEvent = async (id: number) => {
  // Future backend API implementation:
  // const response = await apiClient.delete(`/events/${id}`);
  // return response.data;

  console.log(`[API Placeholder] deleteEvent(${id}) - Replace with: axios.delete("/api/events/${id}")`);
  return {};
};

export default {
  fetchStates,
  fetchStateById,
  fetchDistrictsByState,
  fetchAllDistricts,
  fetchMandalsByDistrict,
  fetchVillagesByMandal,
  fetchSchoolsByVillage,
  createEvent,
  fetchEvents,
  updateEvent,
  deleteEvent,
};