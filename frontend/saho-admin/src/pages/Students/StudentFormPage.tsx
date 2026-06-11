import { type ComponentProps, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createStudent,
  findStudentByAadhaar,
  getCastes,
  getClasses,
  getDistrictsByState,
  getMandalsByDistrict,
  getRelationships,
  getSchoolsByVillage,
  getStates,
  getStudentById,
  getVillagesByMandal,
  updateStudent,
  type StudentSiblingSearchResponse,
} from '../../api/studentService';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { StudentView } from '../../types';
import StudentProfileSections, { type StudentFormState, type StudentFormErrors, GENDER_OPTIONS, ORPHAN_STATUS_OPTIONS, RELIGION_OPTIONS } from './StudentProfileSections';
import closeIcon from '../../assets/clera cross favicon.png';

const init: StudentFormState = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  dob: '',
  gender: '',
  aadhaar_number: '',
  caste: '',
  religion: '',
  blood_group: '',
  class_id: '',
  orphan_status: '',
  image_url: '',
  st_id: '',
  dist_id: '',
  mndl_id: '',
  vil_id: '',
  sch_id: '',
  guardian_first: '',
  guardian_middle: '',
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
  { key: 'personal', label: 'Personal' },
  { key: 'location', label: 'Location' },
  { key: 'guardian', label: 'Guardian' },
] as const;

type StudentFormStep = typeof steps[number]['key'];

const personalRequiredFields: (keyof StudentFormState)[] = [
  'first_name', 'last_name', 'email', 'dob', 'gender', 'religion', 'caste', 'class_id', 'aadhaar_number', 'orphan_status'
];

const locationRequiredFields: (keyof StudentFormState)[] = [
  'st_id', 'dist_id', 'mndl_id', 'vil_id', 'sch_id'
];

const guardianRequiredFields: (keyof StudentFormState)[] = [
  'guardian_first', 'guardian_last', 'relation', 'phone'
];

const requiredFieldLabels: Partial<Record<keyof StudentFormState, string>> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email ID',
  dob: 'Date of Birth',
  gender: 'Gender',
  religion: 'Religion',
  caste: 'Caste',
  class_id: 'Class',
  aadhaar_number: 'Aadhaar Number',
  orphan_status: 'Orphan / Semi Orphan',
  st_id: 'State',
  dist_id: 'District',
  mndl_id: 'Mandal',
  vil_id: 'Village',
  sch_id: 'School',
  guardian_first: 'Guardian First Name',
  guardian_last: 'Guardian Last Name',
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
fieldStepMap.sibling_aadhaar = 'personal';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (parts.length === 0) return { first: '', middle: '', last: '' };
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
  return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
};

function PrimaryButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} className={`studentPrimaryButton ${props.className ?? ''}`} />;
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
  const [castes, setCastes] = useState<[string, string][]>([]);
  const [classes, setClasses] = useState<[string, string][]>([]);
  const [relationships, setRelationships] = useState<[string, string][]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | Blob | null>(null);
  const [aadhaarStatus, setAadhaarStatus] = useState<string>('');
  const [aadhaarValidating, setAadhaarValidating] = useState(false);
  const [sibling, setSibling] = useState<StudentSiblingSearchResponse | null>(null);
  const [siblingChecked, setSiblingChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [studentStateList, setStudentStateList] = useState<{ stId: number; stName: string }[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [errors, setErrors] = useState<StudentFormErrors>({});
  const [validatedFields, setValidatedFields] = useState<Set<keyof StudentFormState>>(() => new Set());
  const [touchedFields, setTouchedFields] = useState<Set<keyof StudentFormState>>(() => new Set());
  const pendingFocusField = useRef<keyof StudentFormState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  const setField = (key: keyof StudentFormState, value: string) => {
    const nextValue = key === 'aadhaar_number' || key === 'sibling_aadhaar'
      ? value.replace(/\D/g, '').slice(0, 12)
      : key === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;
    setErrors(current => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm((current) => {
      if (key === 'st_id') return { ...current, st_id: nextValue, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' };
      if (key === 'dist_id') return { ...current, dist_id: nextValue, mndl_id: '', vil_id: '', sch_id: '' };
      if (key === 'mndl_id') return { ...current, mndl_id: nextValue, vil_id: '', sch_id: '' };
      if (key === 'vil_id') return { ...current, vil_id: nextValue, sch_id: '' };
      return { ...current, [key]: nextValue };
    });
  };
  const touchField = (key: keyof StudentFormState) => {
    setTouchedFields((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
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
        let castesResponse = [];
        let relationshipsResponse = [];
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
          relationshipsResponse = await getRelationships();
        } catch (error) {
          console.error('[StudentFormPage] getRelationships failed', error);
          throw new Error('getRelationships');
        }

        try {
          classesResponse = await getClasses();
        } catch (error) {
          console.error('[StudentFormPage] getClasses failed', error);
          throw new Error('getClasses');
        }

        setStudentStateList(statesResponse);
        const stateEntries: [string, string][] = statesResponse.map((item): [string, string] => [String(item.stId), item.stName]).filter(([, label]) => !!label);
        const casteEntries: [string, string][] = castesResponse.map((item): [string, string] => [String(item.casteId), item.casteName]).filter(([value, label]) => !!value && !!label);
        const relationshipEntries: [string, string][] = relationshipsResponse.map((item): [string, string] => [String(item.relationship_id), item.relationship_name]).filter(([value, label]) => !!value && !!label);
        const classEntries: [string, string][] = classesResponse.map((item): [string, string] => [String(item.classId), item.className]).filter(([value, label]) => !!value && !!label);

        setStates(stateEntries);
        setCastes(casteEntries);
        setRelationships(relationshipEntries);
        setClasses(classEntries);

        if ((isEdit || isView) && effectiveStudentId) {
          await loadStudent(effectiveStudentId, statesResponse, {
            castes: casteEntries,
            relationships: relationshipEntries,
            classes: classEntries,
            snapshot: studentSnapshot,
          });
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
  }, [form.aadhaar_number, id, isEdit, isView, aadhaarValidating]);

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
    setSibling(null);
    if (form.sibling_aadhaar.length !== 12) {
      toast('Enter a valid 12 digit Aadhaar number.', 'error');
      return;
    }
    const found = await findStudentByAadhaar(form.sibling_aadhaar);
    if (found) {
      setSibling(found);
    } else {
      setSibling(null);
      toast('No matching student found.', 'error');
    }
  };

  const loadStudent = async (
    studentId: number,
    loadedStates: { stId: number; stName: string }[],
    viewFallback?: {
      castes: [string, string][];
      relationships: [string, string][];
      classes: [string, string][];
      snapshot?: StudentView | null;
    }
  ) => {
    setEditLoading(true);
    try {
      const student = ((await getStudentById(studentId).catch(() => undefined)) ?? viewFallback?.snapshot) as unknown as (StudentView & Record<string, any>) | undefined;
      const snapshot = viewFallback?.snapshot ?? student;
      if (!student) {
        throw new Error('Student not found');
      }
      const [firstName, ...restName] = (student.studentName || snapshot?.full_name || '').split(' ');
      const fallbackGuardian = splitName(student.guardianName ?? snapshot?.guardian_full_name);
      const newForm: StudentFormState = {
        ...init,
        first_name: firstName,
        middle_name: restName.length > 1 ? restName.slice(0, -1).join(' ') : '',
        last_name: restName.slice(-1).join(' '),
        email: student.emailId ?? snapshot?.email ?? '',
        dob: student.dob ?? snapshot?.dob ?? '',
        gender: mapLabelToOptionValue(student.gender || snapshot?.gender, GENDER_OPTIONS),
        aadhaar_number: (student.aadhaarNumber ?? snapshot?.aadhaar_number ?? '').replace(/\D/g, '').slice(0, 12),
        religion: mapLabelToOptionValue(student.religion || snapshot?.religion, RELIGION_OPTIONS),
        blood_group: student.bloodGroup ?? snapshot?.blood_group ?? '',
        class_id: student.classId ? String(student.classId) : mapLabelToOptionValue(snapshot?.class_id, viewFallback?.classes ?? []),
        orphan_status: mapLabelToOptionValue(student.orphanStatus || snapshot?.orphan_status, ORPHAN_STATUS_OPTIONS),
        image_url: student.imageUrl ?? snapshot?.image_url ?? '',
        guardian_first: student.guardianFirstName ?? fallbackGuardian.first,
        guardian_middle: student.guardianMiddleName ?? fallbackGuardian.middle,
        guardian_last: student.guardianLastName ?? fallbackGuardian.last,
        phone: student.phoneNumber ?? snapshot?.guardian_phone ?? '',
        occ: student.occ ?? snapshot?.guardian_occ ?? '',
        addr: student.addr ?? '',
        has_sibling: student.siblingId || snapshot?.sibling_id || snapshot?.sibling_student_id ? 'Yes' : 'No',
        sibling_aadhaar: '',
        relation: mapLabelToOptionValue(student.guardianRelationName || snapshot?.guardian_relation_name, viewFallback?.relationships ?? []),
        caste: student.casteId ? String(student.casteId) : mapLabelToOptionValue(student.casteName || snapshot?.caste, viewFallback?.castes ?? []),
        st_id: '',
        dist_id: '',
        mndl_id: '',
        vil_id: '',
        sch_id: '',
      };

      setForm(newForm);
      setSelectedImageFile(null);
      setSibling(snapshot?.sibling_student_id ? {
        studentId: snapshot.sibling_student_id,
        studentName: snapshot.sibling_student_name || 'Sibling',
        classId: Number(snapshot.class_id) || 0,
        schoolName: snapshot.sch_name || '',
      } : null);

      let districtEntries: [string, string][] = [];
      let mandalEntries: [string, string][] = [];
      let villageEntries: [string, string][] = [];
      let schoolEntries: [string, string][] = [];
      const stateName = student.stName || snapshot?.st_name;
      const districtName = student.distName || snapshot?.dist_name;
      const mandalName = student.mndlName || snapshot?.mndl_name;
      const villageName = student.vilName || snapshot?.vil_name;
      const schoolName = student.schName || snapshot?.sch_name;

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

  const blobToDataUrl = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Unable to encode image.'));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isView) return;
    if (loading) return;

    const isValid = validateAndApply(steps.map(step => step.key));
    if (!isValid) {
      return;
    }

    if (aadhaarStatus === 'A student with this Aadhaar already exists.') {
      const nextErrors: StudentFormErrors = { aadhaar_number: 'A student with this Aadhaar already exists.' };
      setErrors(nextErrors);
      setValidatedFields(new Set(['aadhaar_number']));
      pendingFocusField.current = 'aadhaar_number';
      if (activeStep !== 'personal') setActiveStep('personal');
      else focusField('aadhaar_number');
      return;
    }

    setLoading(true);
    try {
      const imageUrl = selectedImageFile
        ? undefined
        : form.image_url?.startsWith('blob:')
        ? await blobToDataUrl(await fetch(form.image_url).then((res) => res.blob()))
        : form.image_url;

      const payload = {
        firstName: form.first_name,
        middleName: form.middle_name || null,
        lastName: form.last_name,
        emailId: form.email,
        dob: form.dob,
        gender: form.gender,
        aadhaarNumber: form.aadhaar_number,
        casteId: Number(form.caste),
        religion: form.religion || null,
        bloodGroup: form.blood_group || null,
        schId: Number(form.sch_id),
        classId: Number(form.class_id),
        orphanStatus: form.orphan_status || null,
        imageUrl: imageUrl || null,
        createdBy: user?.user_id || 1,
        hasSibling: form.has_sibling === 'Yes',
        siblingIds: sibling?.studentId ? String(sibling.studentId) : null,
        guardian: {
          firstName: form.guardian_first,
          middleName: form.guardian_middle || null,
          lastName: form.guardian_last,
          phoneNumber: form.phone,
          relationshipId: Number(form.relation),
          occ: form.occ || null,
          addr: form.addr || null,
        },
      };

      if (isEdit && id) {
        await updateStudent(Number(id), payload, selectedImageFile ?? undefined);
        toast('Student updated successfully.', 'success');
      } else {
        await createStudent(payload, selectedImageFile ?? undefined);
        toast('Student registered successfully.', 'success');
      }
      if (embedded && onSuccess) {
        onSuccess();
      } else {
        nav('/students');
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
        const firstInvalid = fieldsToValidate[0];
        const targetStep = fieldStepMap[firstInvalid] ?? activeStep;
        pendingFocusField.current = firstInvalid;
        if (targetStep !== activeStep) setActiveStep(targetStep);
        else focusField(firstInvalid);
        toast('Please fix the highlighted fields.', 'error');
      } else {
        toast(serverMessage ? `Unable to save student: ${serverMessage}` : 'Unable to save student. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentCastes = useMemo(() => castes, [castes]);
  const currentClasses = useMemo(() => classes, [classes]);
  const currentRelationships = useMemo(() => relationships, [relationships]);
  const currentStates = useMemo(() => states, [states]);
  const aadhaarMessage = form.aadhaar_number && form.aadhaar_number.length !== 12
    ? 'Aadhaar number must be exactly 12 digits.'
    : aadhaarStatus || (aadhaarValidating ? 'Checking Aadhaar...' : '');
  const goBack = () => setActiveStep(steps[Math.max(0, activeStepIndex - 1)].key);
  const buildValidationErrors = (stepKeys: StudentFormStep[]) => {
    const requiredFields = stepKeys.flatMap(step => stepRequiredFields[step]);
    const nextErrors: StudentFormErrors = {};

    requiredFields.forEach(field => {
      const value = form[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        nextErrors[field] = `${requiredFieldLabels[field] ?? field} is required`;
      }
    });

    if (stepKeys.includes('personal')) {
      if (form.email.trim() && !emailPattern.test(form.email.trim())) {
        nextErrors.email = 'Enter a valid email address';
      }

      if (form.aadhaar_number.trim() && !/^\d{12}$/.test(form.aadhaar_number)) {
        nextErrors.aadhaar_number = 'Aadhaar Number must contain exactly 12 digits.';
      }

      if (form.has_sibling === 'Yes') {
        if (!form.sibling_aadhaar.trim()) {
          nextErrors.sibling_aadhaar = 'Search Existing Student by Aadhaar Number is required';
        } else if (!/^\d{12}$/.test(form.sibling_aadhaar)) {
          nextErrors.sibling_aadhaar = 'Aadhaar Number must contain exactly 12 digits.';
        }
      }

      if (form.dob.trim()) {
        const dobValue = form.dob.trim();
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
      if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
        nextErrors.phone = 'Phone Number must contain exactly 10 digits.';
      }
    }

    return nextErrors;
  };
  const validateAndApply = (stepKeys: StudentFormStep[]) => {
    const nextErrors = buildValidationErrors(stepKeys);
    const fieldsToValidate = stepKeys.flatMap(step => stepRequiredFields[step]);
    if (stepKeys.includes('personal')) {
      fieldsToValidate.push('email', 'aadhaar_number', 'dob');
      if (form.has_sibling === 'Yes') fieldsToValidate.push('sibling_aadhaar');
    }
    if (stepKeys.includes('guardian')) {
      fieldsToValidate.push('phone');
    }
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
    setActiveStep(steps[Math.min(steps.length - 1, activeStepIndex + 1)].key);
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
    else if (isEdit) nav(-1);
    else nav('/view-students');
  };
  const title = isView ? 'View' : isEdit ? 'Edit ' : 'Add ';
  const eyebrow = isView ? '' : isEdit ? '' : '';

  return (
    <form ref={formRef} className={`studentWizardForm${embedded ? ' isEmbedded' : ''}${isView ? ' isViewMode' : ''}`} onSubmit={submit} noValidate>
      <div className="studentWizardHeader">
        <div className="studentWizardHeaderTop">
          <div className="studentWizardHeaderLeft">
            <div className="studentWizardEyebrow">{eyebrow}</div>
            <h2>{title} Student</h2>
          </div>
          <button type="button" className="studentWizardClose" onClick={cancel} aria-label="Close">
            <img src={closeIcon} alt="" className="filterBtnIcon" aria-hidden="true" />
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
        mode={isView ? 'view' : isEdit ? 'edit' : 'create'}
        form={form}
        set={setField}
        touch={touchField}
        chooseImage={chooseImage}
        sibling={sibling}
        siblingChecked={siblingChecked}
        searchSibling={searchSibling}
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
        loading={metaLoading || editLoading}
        activeStep={activeStep}
      />
      {!isView ? (
        <div className="studentWizardActions" aria-label="Form actions">
          {activeStep === 'guardian' ? (
            <PrimaryButton loading={loading || metaLoading || editLoading} className="btn btnGreen">{isEdit ? 'Save Changes' : 'Register Student'}</PrimaryButton>
          ) : (
            <PrimaryButton type="button" className="btn btnGreen" onClick={goNext} disabled={metaLoading || editLoading}>Next</PrimaryButton>
          )}
          {activeStep === 'personal' ? (
            <SecondaryButton type="button" className="btn btnRed" onClick={cancel}>Cancel</SecondaryButton>
          ) : (
            <SecondaryButton type="button" className="btn btnRed" onClick={goBack}>Back</SecondaryButton>
          )}
        </div>
      ) : null}
    </form>
  );
}
