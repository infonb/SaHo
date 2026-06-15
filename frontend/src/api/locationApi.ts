import { apiClient } from './client';

export const getStates = async () => {
  const res = await apiClient.get('/locations/states');
  return res.data ?? [];
};

export const getDistricts = async (stateId: number) => {
  const res = await apiClient.get(`/locations/districts/${stateId}`);
  return res.data ?? [];
};

export const getMandals = async (districtId: number) => {
  const res = await apiClient.get(`/locations/mandals/${districtId}`);
  return res.data ?? [];
};

export const getVillages = async (mandalId: number) => {
  const res = await apiClient.get(`/locations/villages/${mandalId}`);
  return res.data ?? [];
};

export const getSchools = async (villageId: number) => {
  const res = await apiClient.get(`/locations/schools/${villageId}`);
  return res.data ?? [];
};
