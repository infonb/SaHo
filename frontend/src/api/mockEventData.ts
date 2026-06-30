import type { DistrictMaster, MandalMaster, SchoolMaster, StateMaster, VillageMaster } from '../types';

// Location hierarchy mock data for Event Management

// States
export const MOCK_EVENT_STATES: StateMaster[] = [
  { st_id: 1, st_name: 'Andhra Pradesh', created_at: '2024-01-01', updated_at: null },
  { st_id: 2, st_name: 'Telangana', created_at: '2024-01-01', updated_at: null },
] as unknown as StateMaster[];

// Districts (linked to states)
export const MOCK_EVENT_DISTRICTS: DistrictMaster[] = [
  // Andhra Pradesh districts
  { dist_id: 1, dist_name: 'Nellore', st_id: 1, created_at: '2024-01-01', updated_at: null },
  { dist_id: 2, dist_name: 'Kurnool', st_id: 1, created_at: '2024-01-01', updated_at: null },
  // Telangana districts
  { dist_id: 3, dist_name: 'Warangal', st_id: 2, created_at: '2024-01-01', updated_at: null },
  { dist_id: 4, dist_name: 'Karimnagar', st_id: 2, created_at: '2024-01-01', updated_at: null },
] as unknown as DistrictMaster[];

// Mandals (linked to districts)
export const MOCK_EVENT_MANDALS: MandalMaster[] = [
  // Nellore mandals
  { mndl_id: 1, mndl_name: 'Marripadu', dist_id: 1, created_at: '2024-01-01', updated_at: null },
  { mndl_id: 2, mndl_name: 'Atmakur', dist_id: 1, created_at: '2024-01-01', updated_at: null },
  // Kurnool mandals
  { mndl_id: 3, mndl_name: 'Nandyal', dist_id: 2, created_at: '2024-01-01', updated_at: null },
  // Warangal mandals
  { mndl_id: 4, mndl_name: 'Hanamkonda', dist_id: 3, created_at: '2024-01-01', updated_at: null },
  // Karimnagar mandals
  { mndl_id: 5, mndl_name: 'Jammikunta', dist_id: 4, created_at: '2024-01-01', updated_at: null },
] as unknown as MandalMaster[];

// Villages (linked to mandals)
export const MOCK_EVENT_VILLAGES: VillageMaster[] = [
  // Marripadu villages
  { vil_id: 1, vil_name: 'Chunchuluru', vil_pincode: 524321, mndl_id: 1, created_at: '2024-01-01', updated_at: null },
  { vil_id: 2, vil_name: 'Brahmanapalli', vil_pincode: 524322, mndl_id: 1, created_at: '2024-01-01', updated_at: null },
  // Atmakur villages
  { vil_id: 3, vil_name: 'Thummalapenta', vil_pincode: 524331, mndl_id: 2, created_at: '2024-01-01', updated_at: null },
  // Nandyal villages
  { vil_id: 4, vil_name: 'Mamidipalle', vil_pincode: 518112, mndl_id: 3, created_at: '2024-01-01', updated_at: null },
  // Hanamkonda villages
  { vil_id: 5, vil_name: 'Dharmasagar', vil_pincode: 506001, mndl_id: 4, created_at: '2024-01-01', updated_at: null },
  // Jammikunta villages
  { vil_id: 6, vil_name: 'Gangadhara', vil_pincode: 505122, mndl_id: 5, created_at: '2024-01-01', updated_at: null },
] as unknown as VillageMaster[];

// Schools (linked to villages)
export const MOCK_EVENT_SCHOOLS: SchoolMaster[] = [
  // Chunchuluru schools
  { sch_id: 1, sch_name: 'ZPHS Chunchuluru', sch_address: 'Chunchuluru, Marripadu, Nellore', vil_id: 1, created_at: '2024-01-01', updated_at: null },
  { sch_id: 2, sch_name: 'Govt High School Chunchuluru', sch_address: 'Chunchuluru, Marripadu, Nellore', vil_id: 1, created_at: '2024-01-01', updated_at: null },
  // Brahmanapalli schools
  { sch_id: 3, sch_name: 'ZPHS Brahmanapalli', sch_address: 'Brahmanapalli, Marripadu, Nellore', vil_id: 2, created_at: '2024-01-01', updated_at: null },
  // Thummalapenta schools
  { sch_id: 4, sch_name: 'ZPHS Thummalapenta', sch_address: 'Thummalapenta, Atmakur, Nellore', vil_id: 3, created_at: '2024-01-01', updated_at: null },
  // Mamidipalle schools
  { sch_id: 5, sch_name: 'ZPHS Mamidipalle', sch_address: 'Mamidipalle, Nandyal, Kurnool', vil_id: 4, created_at: '2024-01-01', updated_at: null },
  // Dharmasagar schools
  { sch_id: 6, sch_name: 'ZP High School Warangal', sch_address: 'Dharmasagar, Hanamkonda, Warangal', vil_id: 5, created_at: '2024-01-01', updated_at: null },
  // Gangadhara schools
  { sch_id: 7, sch_name: "St. Joseph's High School", sch_address: 'Gangadhara, Jammikunta, Karimnagar', vil_id: 6, created_at: '2024-01-01', updated_at: null },
] as unknown as SchoolMaster[];

// Helper functions to filter data by parent
export const getDistrictsByState = (stateId: number): DistrictMaster[] => {
  return MOCK_EVENT_DISTRICTS.filter(d => d.st_id === stateId);
};

export const getMandalsByDistrict = (districtId: number): MandalMaster[] => {
  return MOCK_EVENT_MANDALS.filter(m => m.dist_id === districtId);
};

export const getVillagesByMandal = (mandalId: number): VillageMaster[] => {
  return MOCK_EVENT_VILLAGES.filter(v => v.mndl_id === mandalId);
};

export const getSchoolsByVillage = (villageId: number): SchoolMaster[] => {
  return MOCK_EVENT_SCHOOLS.filter(s => s.vil_id === villageId);
};
