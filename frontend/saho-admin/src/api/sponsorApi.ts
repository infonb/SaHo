import { buildSponsorView, delay, MOCK_SPONSORS } from './mockData';
import type { Sponsor, SponsorFilters, SponsorView } from '../types';

export const getSponsors = async (filters?: Partial<SponsorFilters>): Promise<SponsorView[]> => {
  await delay();
  let result = filters?.is_active === 'false' ? MOCK_SPONSORS.filter(s => !s.is_active) : MOCK_SPONSORS.filter(s => s.is_active);
  if (filters?.type) result = result.filter(s => s.type === filters.type);
  let views = result.map(buildSponsorView);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    views = views.filter(v => v.full_name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q));
  }
  return views;
};
export const getSponsorById = async (id: number): Promise<SponsorView | undefined> => {
  await delay();
  const s = MOCK_SPONSORS.find(x => x.sponsor_id === id);
  return s ? buildSponsorView(s) : undefined;
};
export interface CreateSponsorPayload { first_name: string; middle_name?: string | null; last_name: string; email: string; dob: string; ph_no: string; loc?: string | null; type: 'Individual' | 'Organisation'; nationality: string; contrib_amt: number; created_by: string; }
export const createSponsor = async (payload: CreateSponsorPayload): Promise<Sponsor> => {
  await delay();
  const sponsor: Sponsor = { ...payload, sponsor_id: Math.max(0, ...MOCK_SPONSORS.map(s => s.sponsor_id)) + 1, middle_name: payload.middle_name ?? null, loc: payload.loc ?? null, is_active: true, created_at: new Date().toISOString(), modified_at: null, modified_by: null };
  MOCK_SPONSORS.push(sponsor);
  return sponsor;
};
export const updateSponsor = async (id: number, payload: Partial<Sponsor>): Promise<Sponsor> => {
  await delay();
  const idx = MOCK_SPONSORS.findIndex(s => s.sponsor_id === id);
  if (idx < 0) throw new Error('Sponsor not found');
  MOCK_SPONSORS[idx] = { ...MOCK_SPONSORS[idx], ...payload, modified_at: new Date().toISOString() };
  return MOCK_SPONSORS[idx];
};
export const deactivateSponsor = async (id: number, modified_by: string): Promise<void> => {
  await delay();
  const idx = MOCK_SPONSORS.findIndex(s => s.sponsor_id === id);
  if (idx < 0) throw new Error('Sponsor not found');
  MOCK_SPONSORS[idx].is_active = false;
  MOCK_SPONSORS[idx].modified_at = new Date().toISOString();
  MOCK_SPONSORS[idx].modified_by = modified_by;
};
