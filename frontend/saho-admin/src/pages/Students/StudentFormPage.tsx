import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import StudentProfileSections, { type StudentFormState, GENDER_OPTIONS, ORPHAN_STATUS_OPTIONS, RELIGION_OPTIONS } from './StudentProfileSections';

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
  onCancel?: () => void;
  onSuccess?: () => void;
}

const steps = [
  { key: 'personal', label: 'Personal' },
  { key: 'location', label: 'Location' },
  { key: 'guardian', label: 'Guardian' },
] as const;

type StudentFormStep = typeof steps[number]['key'];

export default function StudentFormPage({ embedded = false, onCancel, onSuccess }: StudentFormPageProps) {
  const { id } = useParams();
  const isEdit = !!id;
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
  const formRef = useRef<HTMLFormElement>(null);

  const mapLabelToOptionValue = (input: string | null | undefined, options: [string, string][]) => {
    if (!input) return '';
    const found = options.find(([value, label]) => value === input || label === input);
    return found ? found[0] : '';
  };
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const setField = (key: keyof StudentFormState, value: string) => {
    setForm((current) => {
      if (key === 'st_id') return { ...current, st_id: value, dist_id: '', mndl_id: '', vil_id: '', sch_id: '' };
      if (key === 'dist_id') return { ...current, dist_id: value, mndl_id: '', vil_id: '', sch_id: '' };
      if (key === 'mndl_id') return { ...current, mndl_id: value, vil_id: '', sch_id: '' };
      if (key === 'vil_id') return { ...current, vil_id: value, sch_id: '' };
      return { ...current, [key]: value };
    });
  };

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
        setStates(statesResponse.map((item) => [String(item.stId), item.stName]));
        setCastes(castesResponse.map((item) => [String(item.casteId), item.casteName]));
        setRelationships(relationshipsResponse.map((item) => [String(item.relationship_id), item.relationship_name]));
        setClasses(classesResponse.map((item) => [String(item.classId), item.className]));

        if (isEdit && id) {
          await loadStudent(Number(id), statesResponse);
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
  }, [id, isEdit, toast]);

  useEffect(() => {
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
  }, [form.aadhaar_number, id, isEdit, aadhaarValidating]);

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

  const loadStudent = async (studentId: number, loadedStates: { stId: number; stName: string }[]) => {
    setEditLoading(true);
    try {
      const student = await getStudentById(studentId);
      const [firstName, ...restName] = student.studentName.split(' ');
      const newForm: StudentFormState = {
        ...init,
        first_name: firstName,
        middle_name: restName.length > 1 ? restName.slice(0, -1).join(' ') : '',
        last_name: restName.slice(-1).join(' '),
        email: student.emailId ?? '',
        dob: student.dob ?? '',
        gender: mapLabelToOptionValue(student.gender, GENDER_OPTIONS),
        aadhaar_number: student.aadhaarNumber ?? '',
        religion: mapLabelToOptionValue(student.religion, RELIGION_OPTIONS),
        blood_group: student.bloodGroup ?? '',
        class_id: student.classId ? String(student.classId) : '',
        orphan_status: mapLabelToOptionValue(student.orphanStatus, ORPHAN_STATUS_OPTIONS),
        image_url: student.imageUrl ?? '',
        guardian_first: student.guardianName ?? '',
        guardian_middle: '',
        guardian_last: '',
        phone: student.phoneNumber ?? '',
        occ: student.occ ?? '',
        addr: student.addr ?? '',
        has_sibling: student.siblingId ? 'Yes' : 'No',
        sibling_aadhaar: '',
        relation: '',
        caste: '',
        st_id: '',
        dist_id: '',
        mndl_id: '',
        vil_id: '',
        sch_id: '',
      };

      setForm(newForm);
      setSelectedImageFile(null);

      let districtEntries: [string, string][] = [];
      let mandalEntries: [string, string][] = [];
      let villageEntries: [string, string][] = [];
      let schoolEntries: [string, string][] = [];

      if (student.stName) {
        const state = loadedStates.find((item) => item.stName === student.stName);
        if (state) {
          setForm((prev) => ({ ...prev, st_id: String(state.stId) }));
          const districtsResponse = await getDistrictsByState(state.stId);
          districtEntries = districtsResponse.map((item) => [String(item.distId), item.distName]);
          setDistricts(districtEntries);
        }
      }

      if (student.distName && districtEntries.length) {
        const dist = districtEntries.find((item) => item[1] === student.distName);
        if (dist) {
          setForm((prev) => ({ ...prev, dist_id: dist[0] }));
          const mandalsResponse = await getMandalsByDistrict(Number(dist[0]));
          mandalEntries = mandalsResponse.map((item) => [String(item.mndlId), item.mndlName]);
          setMandals(mandalEntries);
        }
      }

      if (student.mndlName && mandalEntries.length) {
        const mandal = mandalEntries.find((item) => item[1] === student.mndlName);
        if (mandal) {
          setForm((prev) => ({ ...prev, mndl_id: mandal[0] }));
          const villagesResponse = await getVillagesByMandal(Number(mandal[0]));
          villageEntries = villagesResponse.map((item) => [String(item.vilId), item.vilName]);
          setVillages(villageEntries);
        }
      }

      if (student.vilName && villageEntries.length) {
        const village = villageEntries.find((item) => item[1] === student.vilName);
        if (village) {
          setForm((prev) => ({ ...prev, vil_id: village[0] }));
          const schoolsResponse = await getSchoolsByVillage(Number(village[0]));
          schoolEntries = schoolsResponse.map((item) => [String(item.schId), item.schName]);
          setSchools(schoolEntries);
        }
      }

      if (student.schName && schoolEntries.length) {
        const school = schoolEntries.find((item) => item[1] === student.schName);
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
    if (loading) return;
    if (!form.aadhaar_number || form.aadhaar_number.length !== 12) {
      toast('Aadhaar number must be 12 digits.', 'error');
      return;
    }
    if (aadhaarStatus === 'A student with this Aadhaar already exists.') {
      toast('Please resolve duplicate Aadhaar before saving.', 'error');
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
    } catch {
      toast('Unable to save student. Please verify all required fields.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentCastes = useMemo(() => castes, [castes]);
  const currentClasses = useMemo(() => classes, [classes]);
  const currentRelationships = useMemo(() => relationships, [relationships]);
  const currentStates = useMemo(() => states, [states]);
  const activeStepIndex = steps.findIndex(step => step.key === activeStep);
  const goBack = () => setActiveStep(steps[Math.max(0, activeStepIndex - 1)].key);
  const goNext = () => {
    if (!formRef.current?.reportValidity()) return;
    setActiveStep(steps[Math.min(steps.length - 1, activeStepIndex + 1)].key);
  };
  const goToStep = (index: number) => {
    if (index <= activeStepIndex) {
      setActiveStep(steps[index].key);
      return;
    }
    if (index === activeStepIndex + 1) goNext();
  };
  const cancel = () => {
    if (onCancel) onCancel();
    else if (isEdit) nav(-1);
    else nav('/students');
  };

  return (
    <form ref={formRef} className={embedded ? 'studentWizardForm isEmbedded' : 'studentWizardForm'} onSubmit={submit}>
      {!embedded ? <PageHeader title={isEdit ? 'Edit Student' : 'Add Student'} subtitle="Student, sibling, school, and guardian information" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} /> : null}
      <div className={embedded ? 'studentWizardPanel' : 'panel studentWizardPanel'}>
        <div className="studentWizardHeader">
          <div>
            <div className="studentWizardEyebrow">{isEdit ? 'Update profile' : 'New student registration'}</div>
            <h2>{isEdit ? 'Edit Student' : 'Add Student'}</h2>
          </div>
          <div className="studentStepIndicator" aria-label="Student form steps">
            {steps.map((step, index) => (
              <button
                type="button"
                key={step.key}
                className={`studentStepPill${activeStep === step.key ? ' isActive' : ''}${index < activeStepIndex ? ' isComplete' : ''}`}
                onClick={() => goToStep(index)}
                disabled={index > activeStepIndex + 1}
              >
                <span>{index + 1}</span>{step.label}
              </button>
            ))}
          </div>
        </div>
        <div className="studentWizardBody" key={activeStep}>
        <StudentProfileSections
          mode={isEdit ? 'edit' : 'create'}
          form={form}
          set={setField}
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
          aadhaarStatus={aadhaarStatus || (aadhaarValidating ? 'Checking Aadhaar...' : '')}
          loading={metaLoading || editLoading}
          activeStep={activeStep}
        />
        </div>
        <div className="studentWizardFooter">
          {activeStep === 'personal' ? (
            <Button type="button" variant="outline" onClick={cancel}>Cancel</Button>
          ) : (
            <Button type="button" variant="outline" onClick={goBack}>Back</Button>
          )}
          {activeStep === 'guardian' ? (
            <Button loading={loading || metaLoading || editLoading}>{isEdit ? 'Save Changes' : 'Register Student'}</Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={metaLoading || editLoading}>Next</Button>
          )}
        </div>
      </div>
    </form>
  );
}
