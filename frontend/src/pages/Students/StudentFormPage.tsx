import { type ComponentProps, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createStudent,
  getAcademicYears,
  findStudentByAadhaar,
  getCastes,
  getClasses,
  getDistrictsByState,
  getMandalsByDistrict,
  getParentOccupations,
  getParentStatuses,
  getRelationships,
  getSchoolsByVillage,
  getStates,
  getStudentById,
  getStudentSiblings,
  getVillagesByMandal,
  updateStudent,
  type LabelValueOption,
  type StudentProfileResponse,
  type StudentSiblingInfo,
  type StudentSiblingSearchResponse,
  type StudentRequestPayload,
} from '../../api/studentService';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { StudentView } from '../../types';
import StudentProfileSections, { type StudentFormState, type StudentFormErrors, GENDER_OPTIONS, ORPHAN_STATUS_OPTIONS, RELIGION_OPTIONS } from './StudentProfileSections';
import { HiOutlineXMark } from 'react-icons/hi2';

const init: StudentFormState = {
  first_name: '',
  last_name: '',
  email: '',
  dob: '',
  gender: '',
  aadhaar_number: '',
  caste: '',
  religion: '',
  blood_group: '',
  academic_year_id: '',
  class_id: '',
  orphan_status: '',
  image_url: '',
  st_id: '',
  dist_id: '',
  mndl_id: '',
  vil_id: '',
  sch_id: '',
  roll_number: '',
  admission_type: '',
  status: '',
  remarks: '',
  father_first: '',
  father_last: '',
  father_is_guardian: 'No',
  father_occupation: '',
  father_status: '',
  mother_first: '',
  mother_last: '',
  mother_is_guardian: 'No',
  mother_occupation: '',
  mother_status: '',
  guardian_first: '',
  guardian_last: '',
  relation: '',
  phone: '',
  occ: '',
  addr: '',
  has_sibling: 'No',
  sibling_aadhaar: '',
};

interface StudentFormPageProps {
  embedded?: boolean;
  mode?: 'create' | 'edit' | 'view';
  studentId?: number;
  studentSnapshot?: StudentView | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const steps = [
  { key: 'personal', label: 'Student Information' },
  { key: 'location', label: 'Academic Information' },
  { key: 'guardian', label: 'Family & Guardian' },
] as const;

type StudentFormStep = typeof steps[number]['key'];

const personalRequiredFields: (keyof StudentFormState)[] = [
  'first_name', 'last_name', 'dob', 'gender', 'aadhaar_number', 'religion', 'caste', 'orphan_status'
];

const locationRequiredFields: (keyof StudentFormState)[] = [
  'academic_year_id', 'st_id', 'dist_id', 'mndl_id', 'vil_id', 'sch_id', 'class_id', 'roll_number', 'admission_type', 'status'
];

const guardianRequiredFields: (keyof StudentFormState)[] = [
  'father_first',
  'father_last',
  'father_occupation',
  'father_status',
  'mother_first',
  'mother_last',
  'mother_occupation',
  'mother_status',
  'guardian_first',
  'guardian_last',
  'relation',
  'occ',
  'phone',
  'addr',
];

const requiredFieldLabels: Partial<Record<keyof StudentFormState, string>> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email ID',
  dob: 'Date of Birth',
  gender: 'Gender',
  religion: 'Religion',
  caste: 'Caste',
  academic_year_id: 'Academic Year',
  class_id: 'Class',
  roll_number: 'Roll Number',
  admission_type: 'Admission Type',
  status: 'Status',
  remarks: 'Remarks',
  aadhaar_number: 'Aadhaar Number',
  orphan_status: 'Orphan / Single Parent',
  st_id: 'State',
  dist_id: 'District',
  mndl_id: 'Mandal',
  vil_id: 'Village',
  sch_id: 'School',
  guardian_first: 'Guardian First Name',
  guardian_last: 'Guardian Last Name',
  father_first: 'Father First Name',
  father_last: 'Father Last Name',
  father_occupation: 'Father Occupation',
  father_status: 'Father Status',
  mother_first: 'Mother First Name',
  mother_last: 'Mother Last Name',
  mother_occupation: 'Mother Occupation',
  mother_status: 'Mother Status',
  occ: 'Occupation',
  addr: 'Address',
  relation: 'Relation',
  phone: 'Phone Number',
};

const stepRequiredFields: Record<StudentFormStep, (keyof StudentFormState)[]> = {
  personal: personalRequiredFields,
  location: locationRequiredFields,
  guardian: guardianRequiredFields
};

const fieldStepMap = steps.reduce((map, step) => {
  stepRequiredFields[step.key].forEach(field => {
    map[field] = step.key;
  });
  return map;
}, {} as Partial<Record<keyof StudentFormState, StudentFormStep>>);
fieldStepMap.email = 'personal';
fieldStepMap.sibling_aadhaar = 'guardian';

const emailPattern = /^[^\s@]+@(gmail\.com|nichebit\.com)$/i;
const indianMobilePattern = /^[6-9]\d{9}$/;
const indianMobileErrorMessage = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';

function normalizeDateValue(value: string) {
  return value.replace(/^(\d{4})\d+-(\d{2})-(\d{2})$/, '$1-$2-$3');
}

const getAge = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

const splitName = (fullName: string | null | undefined) => {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
};

const firstString = (source: Record<string, any> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = key.split('.').reduce<any>((current, part) => current?.[part], source);
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
};

const getStudentImageValue = (...sources: (Record<string, any> | null | undefined)[]) => {
  const keys = [
    'imageUrl',
    'imageURL',
    'image_url',
    'studentImageUrl',
    'student_image_url',
    'studentPhotoUrl',
    'student_photo_url',
    'photoUrl',
    'photoURL',
    'photo_url',
    'profileImageUrl',
    'profile_image_url',
    'profilePhotoUrl',
    'profile_photo_url',
    'fileUrl',
    'file_url',
    'filePath',
    'file_path',
    'image.url',
    'image.path',
    'photo.url',
    'photo.path',
    'profilePhoto.url',
    'profilePhoto.path',
  ];

  for (const source of sources) {
    const value = firstString(source, keys);
    if (value) return value;
  }

  return '';
};

const firstBoolean = (source: Record<string, any> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = key.split('.').reduce<any>((current, part) => current?.[part], source);
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value).trim().toLowerCase();
    if (['yes', 'true', '1', 'y'].includes(normalized)) return true;
    if (['no', 'false', '0', 'n'].includes(normalized)) return false;
  }
  return undefined;
};

const sameName = (a: { first: string; last: string }, b: { first: string; last: string }) => {
  const normalize = (value: string) => value.trim().toLowerCase();
  return Boolean(a.first || a.last)
    && normalize(a.first) === normalize(b.first)
    && normalize(a.last) === normalize(b.last);
};

function PrimaryButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} className={props.className ?? ''} />;
}

function SecondaryButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} variant="outline" className={`studentSecondaryButton ${props.className ?? ''}`} />;
}

export default function StudentFormPage({ embedded = false, mode, studentId, studentSnapshot, onCancel, onSuccess }: StudentFormPageProps) {
  const { id } = useParams();
  const isView = mode === 'view';
  const effectiveStudentId = studentId ?? (id ? Number(id) : undefined);
  const isEdit = mode === 'edit' || (!mode && !!id);
  const [form, setForm] = useState<StudentFormState>(init);
  const [activeStep, setActiveStep] = useState<StudentFormStep>('personal');
  const [states, setStates] = useState<[string, string][]>([]);
  const [districts, setDistricts] = useState<[string, string][]>([]);
  const [mandals, setMandals] = useState<[string, string][]>([]);
  const [villages, setVillages] = useState<[string, string][]>([]);
  const [schools, setSchools] = useState<[string, string][]>([]);
  const [academicYears, setAcademicYears] = useState<[string, string][]>([]);
  const [castes, setCastes] = useState<[string, string][]>([]);
  const [classes, setClasses] = useState<[string, string][]>([]);
  const [relationships, setRelationships] = useState<[string, string][]>([]);
  const [occupations, setOccupations] = useState<[string, string][]>([]);
  const [parentStatuses, setParentStatuses] = useState<[string, string][]>([]);
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [guardianRecordId, setGuardianRecordId] = useState<number | null>(null);
  const [studentAcademicId, setStudentAcademicId] = useState<number | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | Blob | null>(null);
  const [aadhaarStatus, setAadhaarStatus] = useState<string>('');
  const [aadhaarValidating, setAadhaarValidating] = useState(false);
  const [siblingsList, setSiblingsList] = useState<StudentSiblingSearchResponse[]>([]);
  const [siblingChecked, setSiblingChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [studentStateList, setStudentStateList] = useState<{ stId: number; stName: string }[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [siblings, setSiblings] = useState<StudentSiblingInfo[]>([]);
  const [profileSchoolName, setProfileSchoolName] = useState('');
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [profileImagePreviewOpen, setProfileImagePreviewOpen] = useState(false);
  const [siblingConfirm, setSiblingConfirm] = useState<{
    scenario: 1 | 2;
    existingNames: string[];
    mergedPreview: string;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const [errors, setErrors] = useState<StudentFormErrors>({});
  const [validatedFields, setValidatedFields] = useState<Set<keyof StudentFormState>>(() => new Set());
  const [touchedFields, setTouchedFields] = useState<Set<keyof StudentFormState>>(() => new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [guardianSubmitAttempted, setGuardianSubmitAttempted] = useState(false);
  const pendingFocusField = useRef<keyof StudentFormState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const finalSubmitRequested = useRef(false);

  const activeStepIndex = steps.findIndex(step => step.key === activeStep);

  const mapLabelToOptionValue = (input: string | null | undefined, options: [string, string][]) => {
    if (!input) return '';
    const normalizedInput = String(input).trim().toLowerCase();
    const found = options.find(([value, label]) => value === input || label === input || label.trim().toLowerCase() === normalizedInput);
    return found ? found[0] : '';
  };
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const updateStepErrors = (step: StudentFormStep, nextForm: StudentFormState) => {
    const stepErrors = buildValidationErrors([step], nextForm);
    const fieldsToValidate = getFieldsToValidate([step], nextForm);
    setErrors(current => {
      const next = { ...current };
      fieldsToValidate.forEach(field => {
        if (stepErrors[field]) next[field] = stepErrors[field];
        else delete next[field];
      });
      return next;
    });
  };

  const setField = (key: keyof StudentFormState, value: string) => {
    const nextValue = key === 'aadhaar_number' || key === 'sibling_aadhaar'
      ? value.replace(/\D/g, '').slice(0, 12)
      : key === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : key === 'dob'
      ? normalizeDateValue(value)
      : value;

    const relationValue = (label: string) => relationships.find(([, optionLabel]) => optionLabel.trim().toLowerCase() === label.toLowerCase())?.[0] ?? '';

    setForm((current) => {
      const apply = (next: StudentFormState, extraSteps: StudentFormStep[] = []) => {
        const step = fieldStepMap[key];
        const stepsToValidate = new Set<StudentFormStep>(extraSteps);
        if (step) stepsToValidate.add(step);
        stepsToValidate.forEach(stepToValidate => updateStepErrors(stepToValidate, next));
        return next;
      };

      if (key === 'st_id') return apply({ ...current, st_id: nextValue, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' });
      if (key === 'dist_id') return apply({ ...current, dist_id: nextValue, mndl_id: '', vil_id: '', sch_id: '' });
      if (key === 'mndl_id') return apply({ ...current, mndl_id: nextValue, vil_id: '', sch_id: '' });
      if (key === 'vil_id') return apply({ ...current, vil_id: nextValue, sch_id: '' });

      if (key === 'father_is_guardian') {
        const next = {
          ...current,
          father_is_guardian: nextValue === 'Yes' ? 'Yes' : 'No',
          mother_is_guardian: nextValue === 'Yes' ? 'No' : current.mother_is_guardian,
        };
        if (nextValue === 'Yes') {
          next.guardian_first = current.father_first;
          next.guardian_last = current.father_last;
          next.occ = current.father_occupation;
          next.relation = relationValue('Father') || current.relation;
          next.phone = '';
          next.addr = '';
        }
        return apply(next, ['guardian']);
      }

      if (key === 'mother_is_guardian') {
        const next = {
          ...current,
          mother_is_guardian: nextValue === 'Yes' ? 'Yes' : 'No',
          father_is_guardian: nextValue === 'Yes' ? 'No' : current.father_is_guardian,
        };
        if (nextValue === 'Yes') {
          next.guardian_first = current.mother_first;
          next.guardian_last = current.mother_last;
          next.occ = current.mother_occupation;
          next.relation = relationValue('Mother') || current.relation;
          next.phone = '';
          next.addr = '';
        }
        return apply(next, ['guardian']);
      }

      if (key === 'father_first' || key === 'father_last' || key === 'father_occupation' || key === 'father_status') {
        const next = { ...current, [key]: nextValue };
        if (current.father_is_guardian === 'Yes') {
          next.guardian_first = key === 'father_first' ? nextValue : current.father_first;
          next.guardian_last = key === 'father_last' ? nextValue : current.father_last;
          next.occ = key === 'father_occupation' ? nextValue : current.father_occupation;
          next.relation = relationValue('Father') || current.relation;
          return apply(next, ['guardian']);
        }
        return apply(next);
      }

      if (key === 'mother_first' || key === 'mother_last' || key === 'mother_occupation' || key === 'mother_status') {
        const next = { ...current, [key]: nextValue };
        if (current.mother_is_guardian === 'Yes') {
          next.guardian_first = key === 'mother_first' ? nextValue : current.mother_first;
          next.guardian_last = key === 'mother_last' ? nextValue : current.mother_last;
          next.occ = key === 'mother_occupation' ? nextValue : current.mother_occupation;
          next.relation = relationValue('Mother') || current.relation;
          return apply(next, ['guardian']);
        }
        return apply(next);
      }

      if (key === 'guardian_first' || key === 'guardian_last' || key === 'occ' || key === 'relation' || key === 'phone' || key === 'addr') {
        return apply({ ...current, [key]: nextValue }, ['guardian']);
      }

      return apply({ ...current, [key]: nextValue });
    });
  };
  const touchField = (key: keyof StudentFormState) => {
    setTouchedFields((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    const step = fieldStepMap[key];
    if (!step) return;
    setErrors(current => {
      const stepErrors = buildValidationErrors([step]);
      const next = { ...current };
      if (stepErrors[key]) next[key] = stepErrors[key];
      else delete next[key];
      return next;
    });
  };

  const focusField = (field: keyof StudentFormState) => {
    window.requestAnimationFrame(() => {
      const control = formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
      if (!control) return;
      control.scrollIntoView({ behavior: 'smooth', block: 'center' });
      control.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (!pendingFocusField.current) return;
    const field = pendingFocusField.current;
    pendingFocusField.current = null;
    focusField(field);
  }, [activeStep]);

  useEffect(() => {
    const loadMasterData = async () => {
      setMetaLoading(true);
      try {
        let statesResponse = [];
        let academicYearsResponse = [];
        let castesResponse = [];
        let relationshipsResponse = [];
        let occupationsResponse = [];
        let parentStatusesResponse = [];
        let classesResponse = [];

        try {
          statesResponse = await getStates();
        } catch (error) {
          console.error('[StudentFormPage] getStates failed', error);
          throw new Error('getStates');
        }

        try {
          castesResponse = await getCastes();
        } catch (error) {
          console.error('[StudentFormPage] getCastes failed', error);
          throw new Error('getCastes');
        }

        try {
          academicYearsResponse = await getAcademicYears();
        } catch (error) {
          console.error('[StudentFormPage] getAcademicYears failed', error);
          throw new Error('getAcademicYears');
        }

        try {
          relationshipsResponse = await getRelationships();
        } catch (error) {
          console.error('[StudentFormPage] getRelationships failed', error);
          throw new Error('getRelationships');
        }

        try {
          occupationsResponse = await getParentOccupations();
        } catch (error) {
          console.error('[StudentFormPage] getParentOccupations failed', error);
          throw new Error('getParentOccupations');
        }

        try {
          parentStatusesResponse = await getParentStatuses();
        } catch (error) {
          console.error('[StudentFormPage] getParentStatuses failed', error);
          throw new Error('getParentStatuses');
        }

        try {
          classesResponse = await getClasses();
        } catch (error) {
          console.error('[StudentFormPage] getClasses failed', error);
          throw new Error('getClasses');
        }

        setStudentStateList(statesResponse);
        const stateEntries: [string, string][] = statesResponse.map((item): [string, string] => [String(item.stId), item.stName]).filter(([, label]) => !!label);
        const academicYearEntries: [string, string][] = academicYearsResponse.map((item): [string, string] => [String(item.academicYearId), item.academicYearName]).filter(([value, label]) => !!value && !!label);
        const casteEntries: [string, string][] = castesResponse.map((item): [string, string] => [String(item.casteId), item.casteName]).filter(([value, label]) => !!value && !!label);
        const relationshipEntries: [string, string][] = relationshipsResponse.map((item): [string, string] => [String(item.relationship_id), item.relationship_name]).filter(([value, label]) => !!value && !!label);
        const occupationEntries: [string, string][] = occupationsResponse.map((item: LabelValueOption): [string, string] => [String(item.value), item.label]).filter(([value, label]) => !!value && !!label);
        const parentStatusEntries: [string, string][] = parentStatusesResponse.map((item: LabelValueOption): [string, string] => [String(item.value), item.label]).filter(([value, label]) => !!value && !!label);
        const classEntries: [string, string][] = classesResponse.map((item): [string, string] => [String(item.classId), item.className]).filter(([value, label]) => !!value && !!label);

        setStates(stateEntries);
        setAcademicYears(academicYearEntries);
        setCastes(casteEntries);
        setRelationships(relationshipEntries);
        setOccupations(occupationEntries);
        setParentStatuses(parentStatusEntries);
        setClasses(classEntries);

        if ((isEdit || isView) && effectiveStudentId) {
          await loadStudent(effectiveStudentId, statesResponse, {
            castes: casteEntries,
            relationships: relationshipEntries,
            occupations: occupationEntries,
            statuses: parentStatusEntries,
            academicYears: academicYearEntries,
            classes: classEntries,
            snapshot: studentSnapshot,
          });
          if (isView) {
            getStudentSiblings(effectiveStudentId).then(setSiblings);
          }
        }
      } catch (error) {
        const errorLabel = error instanceof Error ? error.message : 'Unknown';
        console.error('[StudentFormPage] loadMasterData failed:', errorLabel, error);
        toast(`Unable to load form data. Failed: ${errorLabel}.`, 'error');
      } finally {
        setMetaLoading(false);
      }
    };

    loadMasterData();
  }, [effectiveStudentId, isEdit, isView, studentSnapshot, toast]);

  useEffect(() => {
    if (isView) return;
    if (aadhaarValidating || form.aadhaar_number.length !== 12) {
      if (form.aadhaar_number.length < 12) {
        setAadhaarStatus('');
      }
      return;
    }

    const currentAadhaar = form.aadhaar_number;
    const checkAadhaar = async () => {
      setAadhaarValidating(true);
      try {
        const found = await findStudentByAadhaar(currentAadhaar);
        if (found) {
          if (isEdit && found.studentId === Number(id)) {
            setAadhaarStatus('This Aadhaar belongs to the current student.');
          } else {
            setAadhaarStatus('A student with this Aadhaar already exists.');
          }
        } else {
          setAadhaarStatus('Aadhaar is available.');
        }
      } catch {
        setAadhaarStatus('Unable to validate Aadhaar at the moment.');
      } finally {
        setAadhaarValidating(false);
      }
    };

    void checkAadhaar();
  }, [form.aadhaar_number, id, isEdit, isView]);

  const loadDistricts = async (stateId: number) => {
    setDistricts([]);
    setMandals([]);
    setVillages([]);
    setSchools([]);
    if (!stateId) return;
    try {
      const response = await getDistrictsByState(stateId);
      setDistricts(response.map((item) => [String(item.distId), item.distName]));
    } catch {
      toast('Unable to load districts.', 'error');
    }
  };

  const loadMandals = async (districtId: number) => {
    setMandals([]);
    setVillages([]);
    setSchools([]);
    if (!districtId) return;
    try {
      const response = await getMandalsByDistrict(districtId);
      setMandals(response.map((item) => [String(item.mndlId), item.mndlName]));
    } catch {
      toast('Unable to load mandals.', 'error');
    }
  };

  const loadVillages = async (mandalId: number) => {
    setVillages([]);
    setSchools([]);
    if (!mandalId) return;
    try {
      const response = await getVillagesByMandal(mandalId);
      setVillages(response.map((item) => [String(item.vilId), item.vilName]));
    } catch {
      toast('Unable to load villages.', 'error');
    }
  };

  const loadSchools = async (villageId: number) => {
    setSchools([]);
    if (!villageId) return;
    try {
      const response = await getSchoolsByVillage(villageId);
      setSchools(response.map((item) => [String(item.schId), item.schName]));
    } catch {
      toast('Unable to load schools.', 'error');
    }
  };

  useEffect(() => {
    if (form.st_id) {
      void loadDistricts(Number(form.st_id));
    }
  }, [form.st_id]);

  useEffect(() => {
    if (form.dist_id) {
      void loadMandals(Number(form.dist_id));
    }
  }, [form.dist_id]);

  useEffect(() => {
    if (form.mndl_id) {
      void loadVillages(Number(form.mndl_id));
    }
  }, [form.mndl_id]);

  useEffect(() => {
    if (form.vil_id) {
      void loadSchools(Number(form.vil_id));
    }
  }, [form.vil_id]);

  const chooseImage = (image: File | Blob) => {
    setSelectedImageFile(image);
    setField('image_url', URL.createObjectURL(image));
  };

  const searchSibling = async () => {
    setSiblingChecked(true);
    if (form.sibling_aadhaar.length !== 12) {
      toast('Enter a valid 12 digit Aadhaar number.', 'error');
      return;
    }
    const found = await findStudentByAadhaar(form.sibling_aadhaar);
    if (found) {
      if (siblingsList.some(s => s.studentId === found.studentId)) {
        toast('This student is already added as a sibling.', 'error');
        return;
      }
      if (effectiveStudentId && found.studentId === effectiveStudentId) {
        toast('A student cannot be their own sibling.', 'error');
        return;
      }
      setSiblingsList(prev => [...prev, found]);
      setForm(prev => ({ ...prev, sibling_aadhaar: '' }));
      toast(`Found: ${found.studentName}`, 'success');
    } else {
      toast('No matching student found.', 'error');
    }
  };

  const removeSibling = (index: number) => {
    setSiblingsList(prev => prev.filter((_, i) => i !== index));
  };

  const navigateToSibling = async (siblingId: number) => {
    await loadStudent(siblingId, studentStateList, {
      castes: currentCastes,
      relationships: currentRelationships,
      occupations,
      statuses: parentStatuses,
      academicYears,
      classes: currentClasses,
    });
    getStudentSiblings(siblingId).then(setSiblings);
  };

  const loadStudent = async (
    studentId: number,
    loadedStates: { stId: number; stName: string }[],
    viewFallback?: {
      castes: [string, string][];
      relationships: [string, string][];
      occupations: [string, string][];
      statuses: [string, string][];
      academicYears: [string, string][];
      classes: [string, string][];
      snapshot?: StudentView | null;
    }
  ) => {
    setEditLoading(true);
    try {
      const student = ((await getStudentById(studentId).catch(() => undefined)) ?? viewFallback?.snapshot) as unknown as (StudentProfileResponse & StudentView & Record<string, any>) | undefined;
      const snapshot = viewFallback?.snapshot ?? student;
      if (!student) {
        throw new Error('Student not found');
      }
      const studentNameParts = (student.studentName || snapshot?.full_name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = studentNameParts[0] || '';
      const lastName = studentNameParts.length > 1 ? studentNameParts.slice(1).join(' ') : '';
      const fatherName = splitName(student.fatherName ?? firstString(student, ['father_name', 'father.name']));
      const motherName = splitName(student.motherName ?? firstString(student, ['mother_name', 'mother.name']));
      const guardianName = splitName(student.guardianName ?? snapshot?.guardian_full_name);
      const guardianRelationLabel = String(student.guardianRelationName || student.relationshipName || snapshot?.guardian_relation_name || '').trim();
      const guardianRelationValue = mapLabelToOptionValue(guardianRelationLabel, viewFallback?.relationships ?? []);
      const fatherOccupation = mapLabelToOptionValue(student.fatherOccupation ?? firstString(student, ['father_occupation']), viewFallback?.occupations ?? []);
      const motherOccupation = mapLabelToOptionValue(student.motherOccupation ?? firstString(student, ['mother_occupation']), viewFallback?.occupations ?? []);
      const fatherStatus = mapLabelToOptionValue(student.fatherStatus ?? firstString(student, ['father_status']), viewFallback?.statuses ?? []);
      const motherStatus = mapLabelToOptionValue(student.motherStatus ?? firstString(student, ['mother_status']), viewFallback?.statuses ?? []);
      const fatherIsGuardian = firstBoolean(student, ['fatherIsGuardian', 'father_is_guardian', 'isFatherGuardian'])
        ?? (guardianRelationLabel.toLowerCase() === 'father' || sameName(fatherName, guardianName));
      const motherIsGuardian = firstBoolean(student, ['motherIsGuardian', 'mother_is_guardian', 'isMotherGuardian'])
        ?? (guardianRelationLabel.toLowerCase() === 'mother' || sameName(motherName, guardianName));
      const relationValue = guardianRelationValue || mapLabelToOptionValue(fatherIsGuardian ? 'Father' : motherIsGuardian ? 'Mother' : guardianRelationLabel, viewFallback?.relationships ?? []);
      const guardianFirst = fatherIsGuardian ? fatherName.first : motherIsGuardian ? motherName.first : student.guardianFirstName ?? guardianName.first;
      const guardianLast = fatherIsGuardian ? fatherName.last : motherIsGuardian ? motherName.last : student.guardianLastName ?? guardianName.last;
      const guardianOccupation = fatherIsGuardian ? fatherOccupation : motherIsGuardian ? motherOccupation : firstString(student, ['occ']) || '';
      const guardianPhone = student.phoneNumber ?? snapshot?.guardian_phone ?? '';
      const guardianAddress = student.addr ?? '';
      const aadhaarNumber = firstString(student, ['aadhaarNumber', 'aadhaar_number', 'aadharNumber', 'aadhar_number']) || snapshot?.aadhaar_number || '';
      const religionValue = firstString(student, ['religion', 'religionName', 'religion_name', 'religionLabel', 'religion_label']) || snapshot?.religion || '';
      const casteValue = firstString(student, ['casteName', 'caste_name', 'caste', 'casteLabel', 'caste_label']) || snapshot?.caste || '';
      const casteId = firstString(student, ['casteId', 'caste_id']);
      const academicYearValue = firstString(student, ['academicYearId', 'academic_year_id', 'academicDetails.academicYearId', 'academicDetails.academic_year_id']) || firstString(snapshot as Record<string, any>, ['academicYearId', 'academic_year_id']);
      const rollNumberValue = firstString(student, ['rollNumber', 'roll_number', 'academicDetails.rollNumber', 'academicDetails.roll_number']) || firstString(snapshot as Record<string, any>, ['rollNumber', 'roll_number']);
      const admissionTypeValue = firstString(student, ['admissionType', 'admission_type', 'academicDetails.admissionType', 'academicDetails.admission_type']) || firstString(snapshot as Record<string, any>, ['admissionType', 'admission_type']);
      const academicStatusValue = firstString(student, ['status', 'academicDetails.status']) || firstString(snapshot as Record<string, any>, ['status']);
      const remarksValue = firstString(student, ['remarks', 'academicDetails.remarks']) || firstString(snapshot as Record<string, any>, ['remarks']);
      const newForm: StudentFormState = {
        ...init,
        first_name: firstName,
        last_name: lastName,
        email: student.emailId ?? snapshot?.email ?? '',
        dob: student.dob ?? snapshot?.dob ?? '',
        gender: mapLabelToOptionValue(student.gender || snapshot?.gender, GENDER_OPTIONS),
        aadhaar_number: aadhaarNumber.replace(/\D/g, '').slice(0, 12),
        religion: mapLabelToOptionValue(religionValue, RELIGION_OPTIONS),
        blood_group: student.bloodGroup ?? snapshot?.blood_group ?? '',
        academic_year_id: academicYearValue ? String(academicYearValue) : mapLabelToOptionValue(firstString(student, ['academicYearName', 'academic_year_name', 'academicDetails.academicYearName', 'academicDetails.academic_year_name']) || firstString(snapshot as Record<string, any>, ['academicYearName', 'academic_year_name']), viewFallback?.academicYears ?? []),
        class_id: student.classId ? String(student.classId) : mapLabelToOptionValue(snapshot?.class_id, viewFallback?.classes ?? []),
        orphan_status: mapLabelToOptionValue(student.orphanStatus || snapshot?.orphan_status, ORPHAN_STATUS_OPTIONS),
        image_url: getStudentImageValue(student, snapshot),
        roll_number: rollNumberValue,
        admission_type: admissionTypeValue,
        status: academicStatusValue,
        remarks: remarksValue,
        father_first: fatherName.first,
        father_last: fatherName.last,
        father_is_guardian: fatherIsGuardian ? 'Yes' : 'No',
        father_occupation: fatherOccupation,
        father_status: fatherStatus,
        mother_first: motherName.first,
        mother_last: motherName.last,
        mother_is_guardian: motherIsGuardian ? 'Yes' : 'No',
        mother_occupation: motherOccupation,
        mother_status: motherStatus,
        guardian_first: guardianFirst,
        guardian_last: guardianLast,
        phone: guardianPhone,
        occ: guardianOccupation,
        addr: guardianAddress,
        has_sibling: student.siblingId || snapshot?.sibling_id || snapshot?.sibling_student_id ? 'Yes' : 'No',
        sibling_aadhaar: '',
        relation: relationValue,
        caste: casteId ? casteId : mapLabelToOptionValue(casteValue, viewFallback?.castes ?? []),
        st_id: '',
        dist_id: '',
        mndl_id: '',
        vil_id: '',
        sch_id: '',
      };

      setForm(newForm);
      setFamilyId(student.familyId ?? null);
      setGuardianRecordId((student.guardianId ?? (snapshot as StudentView | null)?.guardian_id) ?? null);
      setStudentAcademicId(student.studentAcademicId ?? null);
      setSelectedImageFile(null);
      if (effectiveStudentId && (student.siblingId || snapshot?.sibling_id || snapshot?.sibling_student_id)) {
        getStudentSiblings(effectiveStudentId).then(sibList => {
          setSiblingsList(sibList.map(s => ({
            studentId: s.studentId,
            studentName: s.fullName,
            classId: s.classId ?? 0,
            className: s.className ?? '',
            schoolName: s.schoolName ?? '',
          })));
        }).catch(() => {
          const ids = ((student.siblingId || snapshot?.sibling_id) ?? '').split(',').filter(Boolean);
          setSiblingsList(ids.map((id: string) => ({
            studentId: Number(id),
            studentName: snapshot?.sibling_student_name || `ID: ${id}`,
            classId: Number(snapshot?.class_id) || 0,
            className: '',
            schoolName: snapshot?.sch_name || '',
          })));
        });
      } else {
        setSiblingsList([]);
      }

      let districtEntries: [string, string][] = [];
      let mandalEntries: [string, string][] = [];
      let villageEntries: [string, string][] = [];
      let schoolEntries: [string, string][] = [];
      const stateName = student.stName || snapshot?.st_name;
      const districtName = student.distName || snapshot?.dist_name;
      const mandalName = student.mndlName || snapshot?.mndl_name;
      const villageName = student.vilName || snapshot?.vil_name;
      const schoolName = firstString(student, ['schName', 'sch_name', 'schoolName', 'school_name']) || snapshot?.sch_name;
      setProfileSchoolName(schoolName || '');

      if (stateName) {
        const state = loadedStates.find((item) => item.stName === stateName);
        if (state) {
          setForm((prev) => ({ ...prev, st_id: String(state.stId) }));
          const districtsResponse = await getDistrictsByState(state.stId);
          districtEntries = districtsResponse.map((item) => [String(item.distId), item.distName]);
          setDistricts(districtEntries);
        }
      }

      if (districtName && districtEntries.length) {
        const dist = districtEntries.find((item) => item[1] === districtName);
        if (dist) {
          setForm((prev) => ({ ...prev, dist_id: dist[0] }));
          const mandalsResponse = await getMandalsByDistrict(Number(dist[0]));
          mandalEntries = mandalsResponse.map((item) => [String(item.mndlId), item.mndlName]);
          setMandals(mandalEntries);
        }
      }

      if (mandalName && mandalEntries.length) {
        const mandal = mandalEntries.find((item) => item[1] === mandalName);
        if (mandal) {
          setForm((prev) => ({ ...prev, mndl_id: mandal[0] }));
          const villagesResponse = await getVillagesByMandal(Number(mandal[0]));
          villageEntries = villagesResponse.map((item) => [String(item.vilId), item.vilName]);
          setVillages(villageEntries);
        }
      }

      if (villageName && villageEntries.length) {
        const village = villageEntries.find((item) => item[1] === villageName);
        if (village) {
          setForm((prev) => ({ ...prev, vil_id: village[0] }));
          const schoolsResponse = await getSchoolsByVillage(Number(village[0]));
          schoolEntries = schoolsResponse.map((item) => [String(item.schId), item.schName]);
          setSchools(schoolEntries);
        }
      }

      if (schoolName && schoolEntries.length) {
        const school = schoolEntries.find((item) => item[1] === schoolName);
        if (school) {
          setForm((prev) => ({ ...prev, sch_id: school[0] }));
        }
      }
    } catch {
      toast('Unable to load student details for editing.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const checkSiblingConfirmation = async (siblingIds: number[]): Promise<boolean> => {
    if (siblingIds.length === 0 || form.has_sibling !== 'Yes') return true;

    const currentStudentId = effectiveStudentId;
    const nameMap = new Map<number, string>();
    if (currentStudentId) {
      nameMap.set(currentStudentId, [form.first_name, form.last_name].filter(Boolean).join(' ') || `Student #${currentStudentId}`);
    }
    siblingsList.forEach(s => nameMap.set(s.studentId, s.studentName));

    let currentStudentSiblings: StudentSiblingInfo[] = [];
    if (currentStudentId) {
      try { currentStudentSiblings = await getStudentSiblings(currentStudentId); } catch { /* ignore */ }
    }
    currentStudentSiblings.forEach(s => nameMap.set(s.studentId, s.fullName));

    const selectedSiblingGroups = new Map<number, StudentSiblingInfo[]>();
    for (const id of siblingIds) {
      try {
        const grp = await getStudentSiblings(id);
        selectedSiblingGroups.set(id, grp);
        grp.forEach(s => nameMap.set(s.studentId, s.fullName));
      } catch { selectedSiblingGroups.set(id, []); }
    }

    const currentHas = currentStudentSiblings.length > 0;
    const anySelectedHas = Array.from(selectedSiblingGroups.values()).some(g => g.length > 0);
    if (!currentHas && !anySelectedHas) return true;

    const mergedIds = new Set<number>();
    if (currentStudentId) mergedIds.add(currentStudentId);
    siblingIds.forEach(id => mergedIds.add(id));
    for (const [, grp] of selectedSiblingGroups) {
      grp.forEach(s => mergedIds.add(s.studentId));
    }

    const sortedIds = [...mergedIds];
    const futureSiblings = new Map<number, number[]>();
    for (const id of sortedIds) {
      futureSiblings.set(id, sortedIds.filter(other => other !== id));
    }

    const previewLines = sortedIds.map(id => {
      const name = nameMap.get(id) || `Student #${id}`;
      const sibNames = futureSiblings.get(id)?.map(sid => nameMap.get(sid) || `Student #${sid}`) ?? [];
      return `  ${name} → ${sibNames.join(', ')}`;
    });
    const mergedPreview = previewLines.join('\n');

    const existingNames = [...currentStudentSiblings.map(s => s.fullName)];

    return new Promise<boolean>(resolve => {
      setSiblingConfirm({
        scenario: currentHas && anySelectedHas ? 2 : 1,
        existingNames,
        mergedPreview,
        resolve,
      });
    });
  };

  const doSave = async () => {
    setLoading(true);
    try {
      const imageUrl = selectedImageFile
        ? undefined
        : form.image_url;
      const parentGuardianMode = form.father_is_guardian === 'Yes' ? 'father' : form.mother_is_guardian === 'Yes' ? 'mother' : null;
      const guardianFirstName = parentGuardianMode === 'father'
        ? form.father_first
        : parentGuardianMode === 'mother'
          ? form.mother_first
          : form.guardian_first;
      const guardianLastName = parentGuardianMode === 'father'
        ? form.father_last
        : parentGuardianMode === 'mother'
          ? form.mother_last
          : form.guardian_last;
      const guardianOccupation = parentGuardianMode === 'father'
        ? form.father_occupation
        : parentGuardianMode === 'mother'
          ? form.mother_occupation
          : form.occ;
      const payload: StudentRequestPayload = {
        firstName: form.first_name,
        lastName: form.last_name,
        emailId: form.email,
        dob: form.dob,
        gender: form.gender,
        aadhaarNumber: form.aadhaar_number,
        casteId: Number(form.caste),
        academicYearId: Number(form.academic_year_id),
        religion: form.religion || null,
        bloodGroup: form.blood_group || null,
        schId: Number(form.sch_id),
        classId: Number(form.class_id),
        familyId: familyId ?? null,
        guardianId: guardianRecordId ?? null,
        orphanStatus: form.orphan_status || null,
        imageUrl: imageUrl || null,
        createdBy: user?.user_id || 1,
        hasSibling: form.has_sibling === 'Yes',
        siblingIds: siblingsList.length > 0 ? siblingsList.map(s => s.studentId).join(',') : null,
        fatherName: [form.father_first, form.father_last].filter(Boolean).join(' '),
        fatherOccupation: form.father_occupation || null,
        fatherStatus: form.father_status || null,
        motherName: [form.mother_first, form.mother_last].filter(Boolean).join(' '),
        motherOccupation: form.mother_occupation || null,
        motherStatus: form.mother_status || null,
        guardian: {
          firstName: guardianFirstName,
          lastName: guardianLastName,
          phoneNumber: form.phone,
          relationshipId: Number(form.relation),
          occ: guardianOccupation || null,
          addr: form.addr || null,
        },
        academicDetails: {
          studentAcademicId: studentAcademicId ?? null,
          academicYearId: Number(form.academic_year_id),
          schoolId: Number(form.sch_id),
          classId: Number(form.class_id),
          rollNumber: form.roll_number || null,
          admissionType: form.admission_type || null,
          status: form.status || null,
          remarks: form.remarks || null,
          isActive: true,
          createdBy: user?.user_id || 1,
        },
      };

      const successMessage = isEdit ? 'Student updated successfully.' : 'Student added successfully.';

      if (isEdit) {
        if (!effectiveStudentId) throw new Error('Student id is missing for update.');
        await updateStudent(effectiveStudentId, payload, selectedImageFile ?? undefined);
      } else {
        await createStudent(payload, selectedImageFile ?? undefined);
      }
      if (embedded && onSuccess) {
        toast(successMessage, 'success');
        onSuccess();
      } else {
        nav('/view-students');
        window.setTimeout(() => toast(successMessage, 'success'), 0);
      }
    } catch (error) {
      const nextErrors: StudentFormErrors = {};
      let serverMessage = '';

      if (axios.isAxiosError(error)) {
        const data: any = error.response?.data;
        serverMessage = String(data?.message ?? data?.error ?? data?.detail ?? '').trim();

        // Common backend duplicate errors
        if (/email/i.test(serverMessage) && /exist|duplicate|already/i.test(serverMessage)) {
          nextErrors.email = 'Email already exists.';
        }
        if (/aadhaar/i.test(serverMessage) && /exist|duplicate|already/i.test(serverMessage)) {
          nextErrors.aadhaar_number = 'A student with this Aadhaar already exists.';
        }
      }

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        const fieldsToValidate = Object.keys(nextErrors) as (keyof StudentFormState)[];
        setValidatedFields(new Set(fieldsToValidate));
      } else {
        toast(serverMessage || 'Failed to save student record.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isView) return;
    if (loading) return;
    if (activeStep !== 'guardian' || !finalSubmitRequested.current) return;
    finalSubmitRequested.current = false;

    setSubmitAttempted(true);
    if (activeStep === 'guardian') setGuardianSubmitAttempted(true);
    const isValid = validateAndApply(steps.map(step => step.key));
    if (!isValid) {
      return;
    }

    if (aadhaarStatus === 'A student with this Aadhaar already exists.') {
      const nextErrors: StudentFormErrors = { aadhaar_number: 'A student with this Aadhaar already exists.' };
      setErrors(nextErrors);
      setValidatedFields(new Set(['aadhaar_number']));
      pendingFocusField.current = 'aadhaar_number';
      if ((activeStep as StudentFormStep) !== 'personal') setActiveStep('personal');
      else focusField('aadhaar_number');
      return;
    }

    const siblingIds = siblingsList.map(s => s.studentId);
    const confirmed = await checkSiblingConfirmation(siblingIds);
    if (!confirmed) return;

    await doSave();
  };

  const submitFinalStep = () => {
    finalSubmitRequested.current = true;
    formRef.current?.requestSubmit();
  };

  const currentCastes = useMemo(() => castes, [castes]);
  const currentClasses = useMemo(() => classes, [classes]);
  const currentRelationships = useMemo(() => relationships, [relationships]);
  const currentStates = useMemo(() => states, [states]);
  const aadhaarMessage = form.aadhaar_number && form.aadhaar_number.length !== 12
    ? 'Aadhaar number must be exactly 12 digits.'
    : aadhaarStatus || (aadhaarValidating ? 'Checking Aadhaar...' : '');
  const goBack = () => setActiveStep(steps[Math.max(0, activeStepIndex - 1)].key);
  const buildValidationErrors = (stepKeys: StudentFormStep[], formState: StudentFormState = form) => {
    const requiredFields = stepKeys.flatMap(step => stepRequiredFields[step]);
    const nextErrors: StudentFormErrors = {};

    requiredFields.forEach(field => {
      const value = formState[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        nextErrors[field] = `${requiredFieldLabels[field] ?? field} is required`;
      }
    });

    if (stepKeys.includes('personal')) {
      if (formState.email.trim() && !emailPattern.test(formState.email.trim())) {
        nextErrors.email = 'Email must end with @gmail.com or @nichebit.com';
      }

      if (formState.aadhaar_number.trim() && !/^\d{12}$/.test(formState.aadhaar_number)) {
        nextErrors.aadhaar_number = 'Aadhaar Number must contain exactly 12 digits.';
      }

      if (formState.dob.trim()) {
        const dobValue = formState.dob.trim();
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobValue);
        const date = match ? new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`) : new Date('invalid');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(date.getTime())) {
          nextErrors.dob = 'Enter a valid Date of Birth';
        } else if (date > today) {
          nextErrors.dob = 'Date of Birth cannot be in the future';
        } else {
          const year = match ? Number(match[1]) : NaN;
          if (!Number.isFinite(year) || year < 1900 || year > today.getFullYear() || date.getFullYear() !== year) {
            nextErrors.dob = 'Enter a valid Date of Birth';
          } else {
            const age = getAge(dobValue);
            if (age === null || age < 3 || age > 120) {
              nextErrors.dob = 'Date of Birth must be a realistic age';
            }
          }
        }
      }

      if (aadhaarStatus === 'A student with this Aadhaar already exists.') {
        nextErrors.aadhaar_number = 'A student with this Aadhaar already exists.';
      }
    }

    if (stepKeys.includes('guardian')) {
      if (formState.phone.trim() && !indianMobilePattern.test(formState.phone.trim())) {
        nextErrors.phone = indianMobileErrorMessage;
      }
      if (formState.has_sibling === 'Yes' && siblingsList.length === 0) {
        if (!formState.sibling_aadhaar.trim()) {
          nextErrors.sibling_aadhaar = 'Search at least one sibling by Aadhaar Number';
        } else if (!/^\d{12}$/.test(formState.sibling_aadhaar)) {
          nextErrors.sibling_aadhaar = 'Aadhaar Number must contain exactly 12 digits.';
        }
      }
    }

    return nextErrors;
  };
  const getFieldsToValidate = (stepKeys: StudentFormStep[], formState: StudentFormState = form) => {
    const fieldsToValidate = stepKeys.flatMap(step => stepRequiredFields[step]);
    if (stepKeys.includes('personal')) {
      fieldsToValidate.push('email', 'aadhaar_number', 'dob');
      if (formState.has_sibling === 'Yes' && siblingsList.length === 0) fieldsToValidate.push('sibling_aadhaar');
    }
    if (stepKeys.includes('guardian') && formState.has_sibling === 'Yes' && siblingsList.length === 0) fieldsToValidate.push('sibling_aadhaar');
    return fieldsToValidate;
  };
  const clearStepValidation = (step: StudentFormStep) => {
    const fieldsToClear = new Set(getFieldsToValidate([step]));
    setValidatedFields(current => new Set([...current].filter(field => !fieldsToClear.has(field))));
    setErrors(current => {
      const next = { ...current };
      fieldsToClear.forEach(field => {
        if (!touchedFields.has(field)) delete next[field];
      });
      return next;
    });
  };
  const clearGuardianDisplayState = () => {
    setErrors(current => {
      const next = { ...current };
      ([
        'father_first',
        'father_last',
        'father_occupation',
        'father_status',
        'mother_first',
        'mother_last',
        'mother_occupation',
        'mother_status',
        'guardian_first',
        'guardian_last',
        'relation',
        'phone',
        'occ',
        'addr',
      ] as (keyof StudentFormState)[]).forEach(field => {
        if (!touchedFields.has(field)) delete next[field];
      });
      return next;
    });
    setValidatedFields(current => new Set([...current].filter(field => !([
      'father_first',
      'father_last',
      'father_occupation',
      'father_status',
      'mother_first',
      'mother_last',
      'mother_occupation',
      'mother_status',
      'guardian_first',
      'guardian_last',
      'relation',
      'phone',
      'occ',
      'addr',
    ] as (keyof StudentFormState)[]).includes(field))));
  };
  const validateAndApply = (stepKeys: StudentFormStep[]) => {
    const nextErrors = buildValidationErrors(stepKeys);
    const fieldsToValidate = getFieldsToValidate(stepKeys);
    setErrors(nextErrors);
    setValidatedFields(new Set(fieldsToValidate));

    const firstInvalid = fieldsToValidate.find(field => nextErrors[field]);
    if (firstInvalid) {
      const targetStep = fieldStepMap[firstInvalid] ?? activeStep;
      pendingFocusField.current = firstInvalid;
      if (targetStep !== activeStep) setActiveStep(targetStep);
      else focusField(firstInvalid);
      return false;
    }

    return true;
  };
  const goNext = () => {
    if (!validateAndApply([activeStep])) return;
    const nextStep = steps[Math.min(steps.length - 1, activeStepIndex + 1)].key;
    if (nextStep === 'guardian') {
      clearGuardianDisplayState();
      setGuardianSubmitAttempted(false);
    }
    setActiveStep(nextStep);
  };
  const goToStep = (index: number) => {
    if (isView) {
      setActiveStep(steps[index].key);
      return;
    }
    if (index <= activeStepIndex) {
      setActiveStep(steps[index].key);
      return;
    }
    if (index === activeStepIndex + 1) goNext();
  };
  const cancel = () => {
    if (onCancel) onCancel();
    else nav('/view-students');
  };
  const title = isView ? 'View' : isEdit ? 'Edit' : 'Add';
  const eyebrow = isView ? '' : isEdit ? '' : '';
  const optionLabel = (value: string, options: [string, string][]) => {
    return options.find(([optionValue]) => optionValue === value)?.[1] || value || '-';
  };
  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ') || studentSnapshot?.full_name || '-';
  const guardianName = [form.guardian_first, form.guardian_last].filter(Boolean).join(' ') || studentSnapshot?.guardian_full_name || '-';
  const profileStudentId = String(effectiveStudentId ?? studentSnapshot?.student_id ?? '-');
  const profileInitials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'ST';
  const profileImageUrl = form.image_url || studentSnapshot?.image_url || '';
  const showProfileImage = Boolean(profileImageUrl && !profileImageFailed);
  useEffect(() => {
    setProfileImageFailed(false);
    setProfileImagePreviewOpen(false);
  }, [profileImageUrl]);
  const address = form.addr || [
    optionLabel(form.vil_id, villages),
    optionLabel(form.mndl_id, mandals),
    optionLabel(form.dist_id, districts),
    optionLabel(form.st_id, states),
  ].filter(value => value && value !== '-').join(', ');
  const schoolName = schools.find(([value]) => value === form.sch_id)?.[1] || profileSchoolName || studentSnapshot?.sch_name || form.sch_id || '-';
  const formatProfileDate = (value: string) => {
    if (!value) return '-';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatProfileAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    return digits ? digits.replace(/(\d{4})(?=\d)/g, '$1 ') : '-';
  };

  return (
    <form ref={formRef} className={`studentWizardForm${embedded ? ' isEmbedded' : ''}${isView ? ' isViewMode' : ''}`} onSubmit={submit} noValidate>
      {isView ? (
        <section className="studentProfileViewCard" aria-label="Student profile">
          <div className="studentProfileViewHeader">
            <h2><ProfileViewIcon /> View Student</h2>
            <button type="button" className="studentWizardClose studentProfileViewClose" onClick={cancel} aria-label="Close">
              <HiOutlineXMark/>
            </button>
          </div>
          <div className="studentProfileViewBanner">
            {showProfileImage ? (
              <button
                type="button"
                className="studentProfileViewAvatar studentProfileViewAvatarButton"
                onClick={() => setProfileImagePreviewOpen(true)}
                aria-label="View student photo"
              >
                <img src={profileImageUrl} alt="" onError={() => setProfileImageFailed(true)} />
              </button>
            ) : (
              <div className="studentProfileViewAvatar" aria-hidden="true">
                {profileInitials}
              </div>
            )}
            <div className="studentProfileViewBannerText">
              <div className="studentProfileViewBannerName">{fullName}</div>
              <div className="studentProfileViewBannerMeta">Student ID: {profileStudentId} | {schoolName}</div>
            </div>
          </div>
          <div className="studentProfileViewGrid">
            <ProfileViewItem label="Full Name" value={fullName} />
            <ProfileViewItem label="Date of Birth" value={formatProfileDate(form.dob)} />
            <ProfileViewItem label="Gender" value={optionLabel(form.gender, GENDER_OPTIONS)} badge />
            <ProfileViewItem label="Aadhaar Number" value={formatProfileAadhaar(form.aadhaar_number)} />
            <ProfileViewItem label="Class" value={optionLabel(form.class_id, currentClasses)} />
            <ProfileViewItem label="Religion" value={optionLabel(form.religion, RELIGION_OPTIONS)} />
            <ProfileViewItem label="Caste" value={optionLabel(form.caste, currentCastes)} />
            <ProfileViewItem label="Blood Group" value={form.blood_group || '-'} />
            <ProfileViewItem label="Orphan / Single Parent" value={optionLabel(form.orphan_status, ORPHAN_STATUS_OPTIONS)} />
            <ProfileViewItem label="School" value={schoolName} />
            <ProfileViewItem label="Address" value={address} wide />
            <ProfileViewItem label="Guardian" value={guardianName} />
            <ProfileViewItem label="Relation" value={optionLabel(form.relation, currentRelationships)} />
            <ProfileViewItem label="Phone" value={form.phone || '-'} />
            <ProfileViewItem label="Guardian Occupation" value={optionLabel(form.occ, occupations)} />
            <div className="studentProfileViewItem">
              <div className="studentProfileViewLabel">Sibling</div>
              <div className="studentProfileViewValue">
                {siblings.length === 0 ? (
                  <span>No siblings</span>
                ) : (
                  siblings.map((sib, idx) => (
                    <button
                      key={sib.studentId}
                      type="button"
                      className="siblingLinkBtn"
                      onClick={() => navigateToSibling(sib.studentId)}
                      title={`View ${sib.fullName}'s profile`}
                    >
                      {sib.fullName}{idx < siblings.length - 1 ? ', ' : ''}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          {profileImagePreviewOpen ? (
            <div className="studentImagePreviewOverlay" role="dialog" aria-modal="true" aria-label="Student photo preview" onClick={() => setProfileImagePreviewOpen(false)}>
              <button type="button" className="studentImagePreviewClose" onClick={() => setProfileImagePreviewOpen(false)} aria-label="Close photo preview">
                <HiOutlineXMark />
              </button>
              <div className="studentImagePreviewFrame" onClick={(event) => event.stopPropagation()}>
                <img src={profileImageUrl} alt={fullName} />
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <div className="studentWizardHeader">
            <div className="studentWizardHeaderTop">
              <div className="studentWizardHeaderLeft">
                <div className="studentWizardEyebrow">{eyebrow}</div>
                <h2>{title} Student</h2>
              </div>
              <button type="button" className="studentWizardClose" onClick={cancel} aria-label="Close">
                <HiOutlineXMark/>
              </button>
            </div>
            <div className="studentStepIndicator" aria-label="Student form steps">
              {steps.map((step, index) => (
                <button
                  type="button"
                  key={step.key}
                  className={`studentStepPill${activeStep === step.key ? ' isActive' : ''}${index < activeStepIndex ? ' isComplete' : ''}`}
                  onClick={() => goToStep(index)}
                  disabled={!isView && index > activeStepIndex + 1}
                >
                  <span>{index + 1}</span>{step.label}
                </button>
              ))}
            </div>
          </div>
          <StudentProfileSections
            key={activeStep}
            mode={isEdit ? 'edit' : 'create'}
            form={form}
            set={setField}
            touch={touchField}
            chooseImage={chooseImage}
            clearImage={() => setSelectedImageFile(null)}
            siblingsList={siblingsList}
            siblingChecked={siblingChecked}
            searchSibling={searchSibling}
            removeSibling={removeSibling}
            academicYears={academicYears}
            schools={schools}
            states={currentStates}
            districts={districts}
            mandals={mandals}
            villages={villages}
            relationships={currentRelationships}
            castes={currentCastes}
            classes={currentClasses}
            aadhaarStatus={aadhaarMessage}
            errors={errors}
            validatedFields={validatedFields}
            touchedFields={touchedFields}
            submitAttempted={submitAttempted}
            guardianSubmitAttempted={guardianSubmitAttempted}
            loading={metaLoading || editLoading}
            activeStep={activeStep}
          />
          <div className="studentWizardActions" aria-label="Form actions">
            {activeStep === 'guardian' ? (
              <PrimaryButton type="button" onClick={submitFinalStep} loading={loading || metaLoading || editLoading} className="btn btnGreen">{isEdit ? 'Save Changes' : 'Register Student'}</PrimaryButton>
            ) : (
              <PrimaryButton type="button" className="btnGreen" onClick={goNext} disabled={metaLoading || editLoading}>Next</PrimaryButton>
            )}
            {activeStep === 'personal' ? (
              <SecondaryButton type="button" className="btnRed" onClick={cancel}>Cancel</SecondaryButton>
            ) : (
              <SecondaryButton type="button" className="btnRed" onClick={goBack}>Back</SecondaryButton>
            )}
          </div>
        </>
      )}
      {siblingConfirm && (
        <div className="studentImagePreviewOverlay" role="dialog" aria-modal="true" aria-label="Confirm sibling changes" onClick={() => {
          siblingConfirm.resolve(false);
          setSiblingConfirm(null);
        }}>
          <div className="studentImagePreviewFrame siblingConfirmModal" onClick={(event) => event.stopPropagation()}>
            <div className="siblingConfirmHeader">
              <span className="siblingConfirmIcon">&#9888;</span>
              <span>Confirm Sibling Changes</span>
            </div>
            <div className="siblingConfirmBody">
              {siblingConfirm.scenario === 2 ? (
                <p>Both students already belong to different sibling groups. Continuing will merge the sibling groups into:</p>
              ) : (
                <p>This student already has sibling(s): <strong>{siblingConfirm.existingNames.join(', ')}</strong>. Adding more siblings will update the sibling group as shown below.</p>
              )}
              <pre className="siblingConfirmPreview">{siblingConfirm.mergedPreview}</pre>
            </div>
            <div className="siblingConfirmActions">
              <button
                type="button"
                className="btn btnRed"
                onClick={() => {
                  siblingConfirm.resolve(false);
                  setSiblingConfirm(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btnGreen"
                onClick={() => {
                  siblingConfirm.resolve(true);
                  setSiblingConfirm(null);
                }}
              >
                {siblingConfirm.scenario === 2 ? 'Merge Groups' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function ProfileViewItem({ label, value, badge = false, wide = false }: { label: string; value: string; badge?: boolean; wide?: boolean }) {
  const displayValue = value || '-';
  return (
    <div className={`studentProfileViewItem${wide ? ' isWide' : ''}`}>
      <div className="studentProfileViewLabel">{label}</div>
      {badge && displayValue !== '-' ? (
        <div className="studentProfileViewValue">
          <span className="sdGenderBadge">{displayValue}</span>
        </div>
      ) : (
        <div className="studentProfileViewValue">{displayValue}</div>
      )}
    </div>
  );
}

function ProfileViewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 12a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
