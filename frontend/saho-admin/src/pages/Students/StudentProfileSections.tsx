import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StudentPhoto from '../../components/common/StudentPhoto';
import type { StudentView } from '../../types';

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
  chooseImage?: (file: File | Blob) => void;
  sibling?: StudentSiblingResult | null;
  siblingChecked?: boolean;
  searchSibling?: () => void;
  student?: StudentView | null;
  schools?: [string, string][];
  states?: [string, string][];
  districts?: [string, string][];
  mandals?: [string, string][];
  villages?: [string, string][];
  relationships?: [string, string][];
  castes?: [string, string][];
  classes?: [string, string][];
  aadhaarStatus?: string;
  loading?: boolean;
}

const mask = (aadhaar: string) => `........${aadhaar.slice(-4)}`;
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

export default function StudentProfileSections(props: StudentProfileSectionsProps) {
  const { mode, form, set, chooseImage, sibling, siblingChecked, searchSibling, student, schools = [], states = [], districts = [], mandals = [], villages = [], relationships = [] } = props;
  const [photoOpen, setPhotoOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (isViewMode(mode)) {
    if (!student) return null;

    return (
      <>
        <div className="rowFlex" style={{ marginBottom: 18 }}>
          <StudentPhoto name={student.full_name} src={student.image_url} size="lg" button onClick={() => setPhotoOpen(true)} />
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{student.full_name}</h2>
            <div className="actions" style={{ marginTop: 8 }}>
              <Badge variant="assigned">{student.class_id}</Badge>
              <Badge variant={student.orphan_status === 'Orphan' ? 'other' : 'individual'}>{student.orphan_status ?? 'Not Set'}</Badge>
            </div>
          </div>
        </div>

        <h3 className="panelTitle">Basic Student Details</h3>
        <div className="formGrid">
          <Info label="Email" value={student.email} />
          <Info label="Date of Birth" value={student.dob} />
          <Info label="Gender" value={student.gender} />
          <Info label="Aadhaar Number" value={mask(student.aadhaar_number)} />
          <Info label="Blood Group" value={student.blood_group} />
          <Info label="Caste" value={student.caste} />
          <Info label="Religion" value={student.religion} />
          <Info label="Orphan / Semi Orphan" value={student.orphan_status} />
        </div>

        <h3 className="sectionTitle">School & Location</h3>
        <div className="formGrid">
          <Info label="School" value={student.sch_name} />
          <Info label="Village" value={student.vil_name} />
          <Info label="Mandal" value={student.mndl_name} />
          <Info label="District" value={student.dist_name} />
          <Info label="State" value={student.st_name} />
        </div>

        <h3 className="sectionTitle">Guardian Details</h3>
        <div className="formGrid">
          <Info label="Name" value={student.guardian_full_name} />
          <Info label="Phone" value={student.guardian_phone} />
          <Info label="Relation" value={student.guardian_relation_name} />
          <Info label="Occupation" value={student.guardian_occ} />
        </div>

        <h3 className="sectionTitle">Sponsor</h3>
        {student.sponsor_full_name ? (
          <div className="panel">
            <strong>{student.sponsor_full_name}</strong>
            <div className="sub">{student.sponsor_type}</div>
          </div>
        ) : (
          <div className="panel" style={{ borderStyle: 'dashed' }}>No sponsor assigned</div>
        )}

        <Modal
          open={photoOpen}
          onClose={() => setPhotoOpen(false)}
          title={`${student.full_name} Photo`}
          width={520}
          footer={<Button variant="outline" onClick={() => setPhotoOpen(false)}>Close</Button>}
        >
          <div className="photoPreviewWrap">
            {student.image_url ? (
              <img className="photoPreview" src={student.image_url} alt={student.full_name} />
            ) : (
              <StudentPhoto name={student.full_name} size="lg" />
            )}
          </div>
        </Modal>
      </>
    );
  }

  if (!form || !set) return null;

  const religionOptions = RELIGION_OPTIONS;
  const casteOptions = props.castes ?? ['SC', 'ST', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'OC', 'Other'];
  const classOptions = props.classes ?? [['1', '6TH CLASS'], ['2', '7TH CLASS'], ['3', '8TH CLASS'], ['4', '9TH CLASS'], ['5', '10TH CLASS']];
  const orphanStatusOptions = ORPHAN_STATUS_OPTIONS;
  const MIN_IMAGE_BYTES = 5 * 1024;
  const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!cameraOpen) return;
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
  }, [cameraOpen, capturedUrl]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
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
    setUploadError(null);
    if (form.image_url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
    }
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
    <>
      <h3 className="panelTitle">Basic Student Details</h3>
      <div className="formGrid">
        <Field label="First Name*" value={form.first_name} onChange={v => set('first_name', v)} />
        <Field label="Middle Name" value={form.middle_name} onChange={v => set('middle_name', v)} />
        <Field label="Last Name*" value={form.last_name} onChange={v => set('last_name', v)} />
        <Field label="Email ID*" type="email" value={form.email} onChange={v => set('email', v)} />
        <Field label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} />
        <Select label="Gender*" value={form.gender} onChange={v => set('gender', v)} options={GENDER_OPTIONS} />
        <Field label="Aadhaar Number*" value={form.aadhaar_number} onChange={v => set('aadhaar_number', v)} maxLength={12} subText={props.aadhaarStatus} />
        <Select label="Blood Group" value={form.blood_group} onChange={v => set('blood_group', v)} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
        <Select label="Religion*" value={form.religion} onChange={v => set('religion', v)} options={religionOptions} />
        <Select label="Caste*" value={form.caste} onChange={v => set('caste', v)} options={casteOptions} />
        <Select label="Class*" value={form.class_id} onChange={v => set('class_id', v)} options={classOptions} />
        <Select label="Orphan / Semi Orphan*" value={form.orphan_status} onChange={v => set('orphan_status', v)} options={orphanStatusOptions} />
        <label className="field">
          <span>Student Photo</span>
          <div className="uploadBox" style={{ gap: 10, padding: 12 }}>
            {form.image_url ? (
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
                  <path d="M3 6h18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            ) : null}
            {form.image_url ? <img src={form.image_url} alt="Student" /> : <span>Select photo option<br /><small>Take photo or upload</small></span>}
            <div className="rowFlex" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Button type="button" variant="outline" onClick={openCamera}>Take Photo</Button>
              <label className="btn outline md" style={{ cursor: 'pointer' }}>
                Upload Photo
                <input accept="image/*" type="file" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            </div>
            <div className="sub" style={{ marginTop: 2 }}>
              {uploadError ? <span style={{ color: 'var(--red)' }}>{uploadError}</span> : 'Upload size: 5KB to 1MB'}
            </div>
          </div>
        </label>
      </div>

      <Modal
        open={cameraOpen}
        onClose={closeCamera}
        title="Take Photo"
        width={680}
        footer={
          capturedUrl ? (
            <>
              <Button variant="outline" onClick={retakePhoto}>Retake</Button>
              <Button onClick={useCapturedPhoto}>Use Photo</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={closeCamera}>Cancel</Button>
              <Button onClick={capturePhoto} disabled={!!cameraError}>Capture</Button>
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

      <h3 className="sectionTitle">Sibling Information</h3>
      <div className="formGrid">
        <label className="field">
          <span>Does the student have any sibling in this foundation?*</span>
          <div className="radioRow">
            <label><input type="radio" checked={form.has_sibling === 'Yes'} onChange={() => set('has_sibling', 'Yes')} /> Yes</label>
            <label><input type="radio" checked={form.has_sibling === 'No'} onChange={() => set('has_sibling', 'No')} /> No</label>
          </div>
        </label>
        {form.has_sibling === 'Yes' && (
          <>
            <div className="siblingSearch">
              <Field label="Search Existing Student by Aadhaar Number*" value={form.sibling_aadhaar} onChange={v => set('sibling_aadhaar', v)} maxLength={12} />
              <Button type="button" onClick={searchSibling}>Search</Button>
            </div>
            {sibling ? (
              <div className="foundCard">
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

      <h3 className="sectionTitle">School & Location</h3>
      <div className="formGrid">
        <Select label="State*" value={form.st_id} onChange={v => set('st_id', v)} options={states} />
        <Select label="District*" value={form.dist_id} onChange={v => set('dist_id', v)} options={districts} />
        <Select label="Mandal*" value={form.mndl_id} onChange={v => set('mndl_id', v)} options={mandals} />
        <Select label="Village*" value={form.vil_id} onChange={v => set('vil_id', v)} options={villages} />
        <Select label="School*" value={form.sch_id} onChange={v => set('sch_id', v)} options={schools} />
      </div>

      <h3 className="sectionTitle">Guardian Details</h3>
      <div className="formGrid">
        <Field label="Guardian First Name*" value={form.guardian_first} onChange={v => set('guardian_first', v)} />
        <Field label="Guardian Middle Name" value={form.guardian_middle} onChange={v => set('guardian_middle', v)} />
        <Field label="Guardian Last Name*" value={form.guardian_last} onChange={v => set('guardian_last', v)} />
        <Select label="Relation*" value={form.relation} onChange={v => set('relation', v)} options={relationships} />
        <Field label="Phone Number*" value={form.phone} onChange={v => set('phone', v)} />
        <Field label="Occupation" value={form.occ} onChange={v => set('occ', v)} />
        <label className="field"><span>Address</span><textarea className="textarea" value={form.addr} onChange={e => set('addr', e.target.value)} /></label>
      </div>
      </>
  );
}

function Field({ label, value, onChange, type = 'text', maxLength, subText }: { label: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number; subText?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required={label.includes('*')} maxLength={maxLength} type={type} className="input" value={value} onChange={e => onChange(e.target.value)} />
      {subText ? <div className="sub" style={{ marginTop: 6 }}>{subText}</div> : null}
    </label>
  );
}

function Select({ label, value, onChange, options, subText }: { label: string; value: string; onChange: (v: string) => void; options: (string | [string, string])[]; subText?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select required={label.includes('*')} className="select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
      {subText ? <div className="sub" style={{ marginTop: 6 }}>{subText}</div> : null}
    </label>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <div><div className="sub">{label}</div><div className="strong">{value || '-'}</div></div>;
}
