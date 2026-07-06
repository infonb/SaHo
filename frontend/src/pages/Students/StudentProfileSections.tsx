import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StudentPhoto from '../../components/common/StudentPhoto';
import Modal from '../../components/common/Modal';
import { LuCamera, LuImage, LuUpload, LuUser } from 'react-icons/lu';

export interface StudentFormState {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  dob: string;
  gender: string;
  aadhaar_number: string;
  caste: string;
  religion: string;
  blood_group: string;
  class_id: string;
  orphan_status: string;
  image_url: string;
  st_id: string;
  dist_id: string;
  mndl_id: string;
  vil_id: string;
  sch_id: string;
  father_first: string;
  father_middle: string;
  father_last: string;
  father_is_guardian: string;
  mother_first: string;
  mother_middle: string;
  mother_last: string;
  mother_is_guardian: string;
  guardian_first: string;
  guardian_middle: string;
  guardian_last: string;
  relation: string;
  phone: string;
  occ: string;
  addr: string;
  has_sibling: string;
  sibling_aadhaar: string;
}

export type StudentFormErrors = Partial<Record<keyof StudentFormState, string>>;

interface StudentSiblingResult {
  studentId: number;
  studentName: string;
  classId: number;
  schoolName: string;
}
interface StudentProfileSectionsProps {
  mode: 'create' | 'edit' | 'view';
  form?: StudentFormState;
  set?: (key: keyof StudentFormState, value: string) => void;
  touch?: (key: keyof StudentFormState) => void;
  chooseImage?: (file: File | Blob) => void;
  clearImage?: () => void;
  sibling?: StudentSiblingResult | null;
  siblingChecked?: boolean;
  searchSibling?: () => void;
  schools?: [string, string][];
  states?: [string, string][];
  districts?: [string, string][];
  mandals?: [string, string][];
  villages?: [string, string][];
  relationships?: [string, string][];
  castes?: [string, string][];
  classes?: [string, string][];
  aadhaarStatus?: string;
  errors?: StudentFormErrors;
  validatedFields?: Set<keyof StudentFormState>;
  touchedFields?: Set<keyof StudentFormState>;
  submitAttempted?: boolean;
  guardianSubmitAttempted?: boolean;
  loading?: boolean;
  activeStep?: 'personal' | 'location' | 'guardian';
}

const isViewMode = (mode: StudentProfileSectionsProps['mode']) => mode === 'view';

export const GENDER_OPTIONS: [string, string][] = [
  ['1', 'Male'],
  ['2', 'Female'],
  ['3', 'Other'],
];

export const RELIGION_OPTIONS: [string, string][] = [
  ['1', 'Hindu'],
  ['2', 'Muslim'],
  ['3', 'Christian'],
  ['4', 'Buddhist'],
  ['5', 'Jain'],
  ['6', 'Sikh'],
  ['7', 'Other'],
];

export const ORPHAN_STATUS_OPTIONS: [string, string][] = [
  ['1', 'None'],
  ['2', 'Single Parent'],
  ['3', 'Orphan'],
];

function FormContainer({ children }: { children: ReactNode }) {
  return <div className="studentFormContainer">{children}</div>;
}

function FormSection({ title, step, icon, children }: { title: string; step: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="studentFormSection" aria-labelledby={`student-section-${step}`}>
      <h3 id={`student-section-${step}`} className="studentStepTitle"><span className="studentStepIcon">{icon ?? step}</span>{title}</h3>
      {children}
    </section>
  );
}

function ValidationMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <div id={id} className="validationMessage" role="alert"><span aria-hidden="true">!</span>{message}</div>;
}

export default function StudentProfileSections(props: StudentProfileSectionsProps) {
  const { mode, form, set, touch, chooseImage, clearImage, sibling, siblingChecked, searchSibling, schools = [], states = [], districts = [], mandals = [], villages = [], relationships = [], activeStep = 'personal', errors = {}, validatedFields, touchedFields, guardianSubmitAttempted = false } = props;
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!form || !set) return null;
  const readOnly = isViewMode(mode);
  const isEdit = mode === 'edit';
  const studentDisplayName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ') || 'Student';

  const religionOptions = RELIGION_OPTIONS;
  const casteOptions = props.castes ?? ['SC', 'ST', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'OC', 'Other'];
  const classOptions = props.classes ?? [['1', '6TH CLASS'], ['2', '7TH CLASS'], ['3', '8TH CLASS'], ['4', '9TH CLASS'], ['5', '10TH CLASS']];
  const orphanStatusOptions = ORPHAN_STATUS_OPTIONS;
  const MIN_IMAGE_BYTES = 5 * 1024;
  const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
  const viewLabel = (label: string) => readOnly ? label.replace(/\*/g, '') : label;
  const shouldShowFieldError = (key: keyof StudentFormState) => {
    if (!errors[key]) return false;
    if (touchedFields?.has(key)) return true;
    if (activeStep === 'guardian') return guardianSubmitAttempted;
    return validatedFields?.has(key) ?? false;
  };
  const getFieldState = (key: keyof StudentFormState) => {
    if (readOnly) return 'default' as const;
    const touched = touchedFields?.has(key) ?? false;
    if (shouldShowFieldError(key)) return 'error' as const;
    if (!errors[key] && touched && validatedFields?.has(key) && String(form[key] ?? '').trim()) return 'success' as const;
    return 'default' as const;
  };
  const showMessage = shouldShowFieldError;
  const siblingSection = (
    <div className="studentSiblingInline">
      <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon"><SiblingInfoIcon /></span>Sibling Information</h3>
      <div className="formGrid studentStepGrid">
        <label className="field">
          <span>{viewLabel('Does the student have any sibling in this foundation?*')}</span>
          {readOnly ? (
            <input className="input readonlyField" value={form.has_sibling || '-'} readOnly aria-readonly="true" tabIndex={-1} data-field="has_sibling" />
          ) : (
            <div className="radioRow">
              <label><input type="radio" checked={form.has_sibling === 'Yes'} onChange={() => set('has_sibling', 'Yes')} /> Yes</label>
              <label><input type="radio" checked={form.has_sibling === 'No'} onChange={() => set('has_sibling', 'No')} /> No</label>
            </div>
          )}
        </label>
        {form.has_sibling === 'Yes' && (
          <>
            <div className="studentSearchRow">
              <Field fieldKey="sibling_aadhaar" label="Search Existing Student by Aadhaar Number*" value={form.sibling_aadhaar} onChange={v => set('sibling_aadhaar', v)} onBlur={() => touch?.('sibling_aadhaar')} maxLength={12} readOnly={readOnly} numericOnly aadhaarFormat error={showMessage('sibling_aadhaar') ? errors.sibling_aadhaar : undefined} state={getFieldState('sibling_aadhaar')} />
              <div className="studentSearchAction">
                {!readOnly ? <Button className="gobtn" type="button" onClick={searchSibling}>Search</Button> : null}
              </div>
            </div >
            {sibling ? (
              <div className="foundCard ">
                <Avatar name={sibling.studentName} size="lg" />
                <div>
                  <strong>{sibling.studentName}</strong>
                  <Badge variant="success">Student ID: {sibling.studentId}</Badge>
                  <div className="sub">Class: {sibling.classId}</div>
                  <div className="sub">School: {sibling.schoolName}</div>
                </div>
              </div>
            ) : siblingChecked ? (
              <div className="foundCard muted">No existing student selected.</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (readOnly || !cameraOpen) return;
    if (capturedUrl) return;

    let cancelled = false;
    setCameraError(null);

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Camera is not supported in this browser.');
          return;
        }
        stopCamera();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unable to access camera';
        setCameraError(msg);
      }
    };

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen, capturedUrl, readOnly]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size < MIN_IMAGE_BYTES || file.size > MAX_IMAGE_BYTES) {
      setUploadError('Upload photo size must be between 5KB and 1MB.');
      e.target.value = '';
      return;
    }

    setUploadError(null);

    // Avoid leaking blob URLs when re-uploading.
    if (form.image_url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
    }

    if (chooseImage) chooseImage(file);
    else set('image_url', URL.createObjectURL(file));
    e.target.value = '';
  };

  const capturePhoto = async () => {
    if (readOnly) return;
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

    const makeBlob = (q: number) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', q));
    let blob = await makeBlob(0.92);
    if (!blob) return;
    if (blob.size > MAX_IMAGE_BYTES) {
      for (const q of [0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4]) {
        const b = await makeBlob(q);
        if (!b) continue;
        blob = b;
        if (blob.size <= MAX_IMAGE_BYTES) break;
      }
    }
    if (blob.size > MAX_IMAGE_BYTES) {
      setCameraError('Captured photo is too large (max 1MB). Please try again or use upload.');
      return;
    }

    stopCamera();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(URL.createObjectURL(blob));
  };

  const openCamera = () => {
    if (readOnly) return;
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setUploadError(null);
    setCameraError(null);
    setCameraOpen(true);
  };

  const closeCamera = () => {
    stopCamera();
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setCameraOpen(false);
  };

  const useCapturedPhoto = async () => {
    if (!capturedUrl) return;
    setUploadError(null);

    const response = await fetch(capturedUrl);
    const blob = await response.blob();
    if (chooseImage) {
      chooseImage(blob);
    } else {
      set('image_url', capturedUrl);
    }

    setCapturedUrl(null);
    setCameraOpen(false);
  };

  const clearPhoto = () => {
    if (readOnly) return;
    setUploadError(null);
    if (form.image_url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
    }
    clearImage?.();
    set('image_url', '');
  };

  const retakePhoto = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setUploadError(null);
    setCameraError(null);
  };

  return (
    <FormContainer>
      {activeStep === 'personal' ? (
        <>
          <FormSection title="Personal Information" step="1" icon={<ProfileInfoIcon />}>
            <div className="formGrid studentStepGrid">
              <Field fieldKey="first_name" label="First Name*" value={form.first_name} onChange={v => set('first_name', v)} onBlur={() => touch?.('first_name')} readOnly={readOnly} alphabeticOnly error={showMessage('first_name') ? errors.first_name : undefined} state={getFieldState('first_name')} />
              <Field fieldKey="middle_name" label="Middle Name" value={form.middle_name} onChange={v => set('middle_name', v)} onBlur={() => touch?.('middle_name')} readOnly={readOnly} alphabeticOnly state={getFieldState('middle_name')} />
              <Field fieldKey="last_name" label="Last Name*" value={form.last_name} onChange={v => set('last_name', v)} onBlur={() => touch?.('last_name')} readOnly={readOnly} alphabeticOnly error={showMessage('last_name') ? errors.last_name : undefined} state={getFieldState('last_name')} />
              <Field fieldKey="email" label="Email ID*" type="email" value={form.email} onChange={v => set('email', v)} onBlur={() => touch?.('email')} readOnly={readOnly} error={showMessage('email') ? errors.email : undefined} state={getFieldState('email')} />
              <Field fieldKey="dob" label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} onBlur={() => touch?.('dob')} readOnly={readOnly} error={showMessage('dob') ? errors.dob : undefined} state={getFieldState('dob')} />
              <Select
                fieldKey="gender"
                label="Gender*"
                value={form.gender}
                onChange={v => set('gender', v)}
                onBlur={() => touch?.('gender')}
                options={GENDER_OPTIONS}
                readOnly={readOnly || isEdit}
                lockedTooltip={isEdit ? "Gender can't be edited." : undefined}
                error={showMessage('gender') ? errors.gender : undefined}
                state={getFieldState('gender')}
              />
              <Select fieldKey="blood_group" label="Blood Group" value={form.blood_group} onChange={v => set('blood_group', v)} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} readOnly={readOnly} state={getFieldState('blood_group')} />
              <Select fieldKey="religion" label="Religion*" value={form.religion} onChange={v => set('religion', v)} onBlur={() => touch?.('religion')} options={religionOptions} readOnly={readOnly} error={showMessage('religion') ? errors.religion : undefined} state={getFieldState('religion')} />
              <Select fieldKey="caste" label="Caste*" value={form.caste} onChange={v => set('caste', v)} onBlur={() => touch?.('caste')} options={casteOptions} readOnly={readOnly} error={showMessage('caste') ? errors.caste : undefined} state={getFieldState('caste')} />
              <Select fieldKey="class_id" label="Class*" value={form.class_id} onChange={v => set('class_id', v)} onBlur={() => touch?.('class_id')} options={classOptions} readOnly={readOnly} error={showMessage('class_id') ? errors.class_id : undefined} state={getFieldState('class_id')} />
              <Field
                fieldKey="aadhaar_number"
                label="Aadhaar Number*"
                value={form.aadhaar_number}
                onChange={v => set('aadhaar_number', v)}
                onBlur={() => touch?.('aadhaar_number')}
                maxLength={12}
                subText={isEdit || readOnly || errors.aadhaar_number ? undefined : props.aadhaarStatus}
                lockedTooltip={isEdit ? "Aadhaar Number can't be edited." : undefined}
                readOnly={readOnly || isEdit}
                numericOnly
                aadhaarFormat
                error={showMessage('aadhaar_number') ? errors.aadhaar_number : undefined}
                state={getFieldState('aadhaar_number')}
              />
              <Select fieldKey="orphan_status" label="Orphan / Single Parent*" value={form.orphan_status} onChange={v => set('orphan_status', v)} onBlur={() => touch?.('orphan_status')} options={orphanStatusOptions} readOnly={readOnly} error={showMessage('orphan_status') ? errors.orphan_status : undefined} state={getFieldState('orphan_status')} />
              <div className="field studentPhotoField">
                <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon"><PhotoImageIcon /></span>Student Photo</h3>
                <div className="uploadBox studentModalUpload">
                  <div className="studentModalUploadPreview">
                    {form.image_url && !readOnly ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        className="iconBtn uploadDeleteBtn"
                        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); clearPhoto(); }}
                        aria-label="Remove student photo"
                        title="Remove photo"
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M3 6h18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 11v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 11v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    ) : null}
                    {readOnly ? (
                      <StudentPhoto name={studentDisplayName} src={form.image_url} size="lg" />
                    ) : form.image_url ? (
                      <StudentPhoto name={studentDisplayName} src={form.image_url} size="lg" />
                    ) : null}
                    <span className={uploadError ? 'studentModalUploadError' : undefined}>{uploadError || (readOnly ? '' : 'Take photo or upload')}</span>
                  </div>
                  {!readOnly ? (
                    <div className="rowFlex studentModalUploadActions">
                      <Button type="button" variant="outline" onClick={openCamera}>
                        <PhotoCameraIcon /> Take Photo
                      </Button>
                      <label className="btn outline md studentModalUploadButton">
                        <PhotoUploadIcon /> Upload Photo
                        <input accept="image/*" type="file" onChange={handlePhoto} style={{ display: 'none' }} />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </FormSection>
        </>
      ) : null}

      <Modal
        open={cameraOpen}
        onClose={closeCamera}
        title="Take Photo"
        width={680}
        footer={
          capturedUrl ? (
            <>
              <Button variant="outline" className="cameraFooterButton btnRed" onClick={retakePhoto}>Retake</Button>
              <Button className="cameraFooterButton btnGreen" onClick={useCapturedPhoto}>Use Photo</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="cameraFooterButton btnRed" onClick={closeCamera}>Cancel</Button>
              <Button className="cameraFooterButton btnGreen" onClick={capturePhoto} disabled={!!cameraError}>Capture</Button>
            </>
          )
        }
      >
        {cameraError ? (
          <div className="toast error" style={{ position: 'static' }}>
            {cameraError}
            <div className="sub" style={{ marginTop: 8 }}>
              If camera permission is blocked, use “Upload Photo” instead.
            </div>
          </div>
        ) : capturedUrl ? (
          <div className="photoPreviewWrap">
            <img className="photoPreview" src={capturedUrl} alt="Captured" />
          </div>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <video
              ref={videoRef}
              style={{ width: 'min(560px, 100%)', borderRadius: 'var(--r-lg)', border: '1px solid var(--color-border)', background: '#0b1220' }}
              playsInline
              autoPlay
              muted
            />
          </div>
        )}
      </Modal>

      {activeStep === 'location' ? (
        <FormSection title="School & Location" step="2">
          <div className="formGrid studentStepGrid">
            <Select fieldKey="st_id" label="State*" value={form.st_id} onChange={v => set('st_id', v)} onBlur={() => touch?.('st_id')} options={states} readOnly={readOnly} error={showMessage('st_id') ? errors.st_id : undefined} state={getFieldState('st_id')} />
            <Select fieldKey="dist_id" label="District*" value={form.dist_id} onChange={v => set('dist_id', v)} onBlur={() => touch?.('dist_id')} options={districts} readOnly={readOnly} error={showMessage('dist_id') ? errors.dist_id : undefined} state={getFieldState('dist_id')} />
            <Select fieldKey="mndl_id" label="Mandal*" value={form.mndl_id} onChange={v => set('mndl_id', v)} onBlur={() => touch?.('mndl_id')} options={mandals} readOnly={readOnly} error={showMessage('mndl_id') ? errors.mndl_id : undefined} state={getFieldState('mndl_id')} />
            <Select fieldKey="vil_id" label="Village*" value={form.vil_id} onChange={v => set('vil_id', v)} onBlur={() => touch?.('vil_id')} options={villages} readOnly={readOnly} error={showMessage('vil_id') ? errors.vil_id : undefined} state={getFieldState('vil_id')} />
            <Select fieldKey="sch_id" label="School*" value={form.sch_id} onChange={v => set('sch_id', v)} onBlur={() => touch?.('sch_id')} options={schools} readOnly={readOnly} error={showMessage('sch_id') ? errors.sch_id : undefined} state={getFieldState('sch_id')} />
          </div>
        </FormSection>
      ) : null}

      {activeStep === 'guardian' ? (
        <section className="studentFormSection" aria-labelledby="student-section-other-information">
          <h3 id="student-section-other-information" className="studentStepTitle"><span className="studentStepIcon">3</span>Other Information</h3>

          <div className="studentSiblingInline">
            <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon"><ParentInfoIcon /></span>Parent Information</h3>
            <div className="formGrid studentStepGrid">
              <Field fieldKey="father_first" label="Father First Name" value={form.father_first} onChange={v => set('father_first', v)} onBlur={() => touch?.('father_first')} readOnly={readOnly} alphabeticOnly state={getFieldState('father_first')} />
              <Field fieldKey="father_middle" label="Father Middle Name" value={form.father_middle} onChange={v => set('father_middle', v)} onBlur={() => touch?.('father_middle')} readOnly={readOnly} alphabeticOnly state={getFieldState('father_middle')} />
              <Field fieldKey="father_last" label="Father Last Name" value={form.father_last} onChange={v => set('father_last', v)} onBlur={() => touch?.('father_last')} readOnly={readOnly} alphabeticOnly state={getFieldState('father_last')} />
              <CheckboxField fieldKey="father_is_guardian" label="Is Guardian" checked={form.father_is_guardian === 'Yes'} onChange={checked => set('father_is_guardian', checked ? 'Yes' : 'No')} readOnly={readOnly} />
              <Field fieldKey="mother_first" label="Mother First Name" value={form.mother_first} onChange={v => set('mother_first', v)} onBlur={() => touch?.('mother_first')} readOnly={readOnly} alphabeticOnly state={getFieldState('mother_first')} />
              <Field fieldKey="mother_middle" label="Mother Middle Name" value={form.mother_middle} onChange={v => set('mother_middle', v)} onBlur={() => touch?.('mother_middle')} readOnly={readOnly} alphabeticOnly state={getFieldState('mother_middle')} />
              <Field fieldKey="mother_last" label="Mother Last Name" value={form.mother_last} onChange={v => set('mother_last', v)} onBlur={() => touch?.('mother_last')} readOnly={readOnly} alphabeticOnly state={getFieldState('mother_last')} />
              <CheckboxField fieldKey="mother_is_guardian" label="Is Guardian" checked={form.mother_is_guardian === 'Yes'} onChange={checked => set('mother_is_guardian', checked ? 'Yes' : 'No')} readOnly={readOnly} />
            </div>
          </div>

          <div className="studentSiblingInline">
            <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon"><GuardianInfoIcon /></span>Guardian Information</h3>
            <div className="formGrid studentStepGrid">
              <Field fieldKey="guardian_first" label="Guardian First Name*" value={form.guardian_first} onChange={v => set('guardian_first', v)} onBlur={() => touch?.('guardian_first')} readOnly={readOnly} alphabeticOnly error={showMessage('guardian_first') ? errors.guardian_first : undefined} state={getFieldState('guardian_first')} />
              <Field fieldKey="guardian_middle" label="Guardian Middle Name" value={form.guardian_middle} onChange={v => set('guardian_middle', v)} onBlur={() => touch?.('guardian_middle')} readOnly={readOnly} alphabeticOnly state={getFieldState('guardian_middle')} />
              <Field fieldKey="guardian_last" label="Guardian Last Name*" value={form.guardian_last} onChange={v => set('guardian_last', v)} onBlur={() => touch?.('guardian_last')} readOnly={readOnly} alphabeticOnly error={showMessage('guardian_last') ? errors.guardian_last : undefined} state={getFieldState('guardian_last')} />
              <Select fieldKey="relation" label="Relation*" value={form.relation} onChange={v => set('relation', v)} onBlur={() => touch?.('relation')} options={relationships} readOnly={readOnly} error={showMessage('relation') ? errors.relation : undefined} state={getFieldState('relation')} />
              <Field fieldKey="phone" label="Phone Number*" value={form.phone} onChange={v => set('phone', v)} onBlur={() => touch?.('phone')} maxLength={10} numericOnly readOnly={readOnly} error={showMessage('phone') ? errors.phone : undefined} state={getFieldState('phone')} />
              <Field fieldKey="occ" label="Occupation" value={form.occ} onChange={v => set('occ', v)} readOnly={readOnly} state={getFieldState('occ')} />
              <Field fieldKey="addr" label="Address" value={form.addr} onChange={v => set('addr', v)} readOnly={readOnly} state={getFieldState('addr')} />
            </div>
          </div>

          {siblingSection}
        </section>
      ) : null}
    </FormContainer>
  );
}

type FieldState = 'default' | 'error' | 'success';

function placeholderLabel(label: string) {
  return label.replace(/\*/g, '').trim();
}

function FormField({ fieldKey, label, children, error, subText, lockedTooltip, readOnly = false, state = 'default' }: { fieldKey: keyof StudentFormState; label: string; children: ReactNode; error?: string; subText?: string; lockedTooltip?: string; readOnly?: boolean; state?: FieldState }) {
  const inputId = `student-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  return (
    <div className={`field formField has-${state}${lockedTooltip ? ' isLockedField' : ''}`} data-tooltip={lockedTooltip}>
      <label htmlFor={inputId}>{placeholderLabel(label)}</label>
      <div className="studentFieldControl">
        {children}
        <ValidationMessage id={messageId} message={error} />
      </div>
      {!error && subText ? <div id={messageId} className="formHelperText">{subText}</div> : null}
    </div>
  );
}

function formatAadhaar(value: string) {
  return value.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatAlphabeticName(value: string) {
  const lettersOnly = value.replace(/[^A-Za-z]/g, '');
  if (!lettersOnly) return '';
  return lettersOnly.charAt(0).toUpperCase() + lettersOnly.slice(1).toLowerCase();
}

function normalizeDateValue(value: string) {
  return value.replace(/^(\d{4})\d+-(\d{2})-(\d{2})$/, '$1-$2-$3');
}

function Field({ fieldKey, label, value, onChange, onBlur, type = 'text', maxLength, subText, lockedTooltip, error, readOnly = false, numericOnly = false, alphabeticOnly = false, aadhaarFormat = false, state = 'default' }: { fieldKey: keyof StudentFormState; label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; type?: string; maxLength?: number; subText?: string; lockedTooltip?: string; error?: string; readOnly?: boolean; numericOnly?: boolean; alphabeticOnly?: boolean; aadhaarFormat?: boolean; state?: FieldState }) {
  const inputType = readOnly || numericOnly || alphabeticOnly ? 'text' : type;
  const inputId = `student-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  const placeholder = placeholderLabel(label);
  const handleChange = (nextValue: string) => {
    const cleanValue = numericOnly
      ? nextValue.replace(/\D/g, '').slice(0, maxLength)
      : alphabeticOnly
        ? formatAlphabeticName(nextValue)
        : type === 'date'
          ? normalizeDateValue(nextValue)
          : nextValue;
    onChange(cleanValue);
  };

  return (
    <FormField fieldKey={fieldKey} label={label} error={error} subText={subText} lockedTooltip={lockedTooltip} readOnly={readOnly} state={state}>
      <input
        id={inputId}
        data-field={fieldKey}
        required={!readOnly && label.includes('*')}
        readOnly={readOnly}
        aria-label={placeholder}
        aria-readonly={readOnly || undefined}
        aria-invalid={state === 'error' || undefined}
        aria-describedby={error || subText ? messageId : undefined}
        tabIndex={readOnly ? -1 : undefined}
        maxLength={aadhaarFormat ? 14 : maxLength}
        type={inputType}
        inputMode={numericOnly ? 'numeric' : alphabeticOnly ? 'text' : undefined}
        pattern={numericOnly ? '\\d*' : alphabeticOnly ? '[A-Za-z]*' : undefined}
        placeholder=""
        className={readOnly ? 'input readonlyField' : 'input'}
        value={readOnly ? (aadhaarFormat && value ? formatAadhaar(value) : value || '-') : aadhaarFormat ? formatAadhaar(value) : value}
        onChange={e => handleChange(e.target.value)}
      />
    </FormField>
  );
}

function CheckboxField({ fieldKey, label, checked, onChange, readOnly = false }: { fieldKey: keyof StudentFormState; label: string; checked: boolean; onChange: (checked: boolean) => void; readOnly?: boolean }) {
  return (
    <label className="field studentCheckboxField">
      <span className="studentCheckboxControl">
        <input data-field={fieldKey} type="checkbox" checked={checked} disabled={readOnly} onChange={e => onChange(e.target.checked)} />
        <span>{label}</span>
      </span>
    </label>
  );
}

function PhotoCameraIcon() {
  return <LuCamera size={20} />;
}

function ProfileInfoIcon() {
  return <LuUser size={20} />;
}

function PhotoImageIcon() {
  return <LuImage size={20} />;
}

function ParentInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 10.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 10.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19a4.5 4.5 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.5 19a4.5 4.5 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GuardianInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SiblingInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 18.5a4.5 4.5 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 18.5a4.5 4.5 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhotoUploadIcon() {
  return <LuUpload size={20} />;
}
function Select({ fieldKey, label, value, onChange, onBlur, options, subText, lockedTooltip, error, readOnly = false, state = 'default' }: { fieldKey: keyof StudentFormState; label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; options: (string | [string, string])[]; subText?: string; lockedTooltip?: string; error?: string; readOnly?: boolean; state?: FieldState }) {
  const inputId = `student-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const placeholder = placeholderLabel(label);
  const normalizedOptions = options.map(option => Array.isArray(option) ? { value: option[0], label: option[1] } : { value: option, label: option });
  const selectedLabel = options.reduce<string>((labelValue, option) => {
    if (labelValue) return labelValue;
    if (Array.isArray(option)) return option[0] === value ? option[1] : '';
    return option === value ? option : '';
  }, '');

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) {
        detailsRef.current?.removeAttribute('open');
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <FormField fieldKey={fieldKey} label={label} error={error} subText={subText} lockedTooltip={lockedTooltip} readOnly={readOnly} state={state}>
      {readOnly ? (
        <input id={inputId} data-field={fieldKey} className="input readonlyField" value={selectedLabel || value || '-'} readOnly aria-readonly="true" tabIndex={-1} />
      ) : (
        <details ref={detailsRef} className={`multiSelectFilter studentFormSelect${value ? ' hasValue' : ''}`}>
          <summary
            id={inputId}
            data-field={fieldKey}
            className="multiSelectTrigger"
            aria-label={placeholder}
            aria-invalid={state === 'error' || undefined}
            aria-describedby={error || subText ? messageId : undefined}
            onClick={(event) => {
              event.preventDefault();
              const shouldOpen = !detailsRef.current?.open;
              document.querySelectorAll<HTMLDetailsElement>('.studentWizardForm .studentFormSelect[open]').forEach((details) => {
                if (details !== detailsRef.current) details.removeAttribute('open');
              });
              if (shouldOpen) detailsRef.current?.setAttribute('open', '');
              else detailsRef.current?.removeAttribute('open');
            }}
          >
            <span>{selectedLabel}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="multiSelectMenu">
            <div className="multiSelectOptions">
              {normalizedOptions.length ? normalizedOptions.map(option => (
                <button
                  type="button"
                  className={`multiSelectOption${value === option.value ? ' isSelected' : ''}`}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    onBlur?.();
                    detailsRef.current?.removeAttribute('open');
                  }}
                >
                  <span>{option.label}</span>
                </button>
              )) : <div className="multiSelectEmpty">No options available</div>}
            </div>
          </div>
        </details>
      )}
    </FormField>
  );
}
