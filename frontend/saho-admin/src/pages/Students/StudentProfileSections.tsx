import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
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
  father_name: string;
  mother_name: string;
  guardian_source: string;
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

interface StudentProfileSectionsProps {
  mode: 'create' | 'edit' | 'view';
  form?: StudentFormState;
  set?: (key: keyof StudentFormState, value: string) => void;
  sibling?: StudentView | null;
  siblingChecked?: boolean;
  searchSibling?: () => void;
  student?: StudentView | null;
  schools?: [string, string][];
  states?: [string, string][];
  districts?: [string, string][];
  mandals?: [string, string][];
  villages?: [string, string][];
  relationships?: [string, string][];
}

const mask = (aadhaar: string) => `........${aadhaar.slice(-4)}`;
const isViewMode = (mode: StudentProfileSectionsProps['mode']) => mode === 'view';

export default function StudentProfileSections(props: StudentProfileSectionsProps) {
  const { mode, form, set, sibling, siblingChecked, searchSibling, student, schools = [], states = [], districts = [], mandals = [], villages = [], relationships = [] } = props;
  const [photoOpen, setPhotoOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDragStart, setCropDragStart] = useState<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
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

  const religionOptions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];
  const casteOptions = ['SC', 'ST', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'OC', 'Other'];
  const classOptions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const MIN_IMAGE_BYTES = 5 * 1024;
  const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
  const guardianSource = form.guardian_source || 'manual';

  const toggleParentGuardian = (source: 'father' | 'mother') => {
    const nextSource = guardianSource === source ? 'manual' : source;
    set('guardian_source', nextSource);
    if (nextSource === 'father') {
      const father = relationships.find(([, name]) => name.toLowerCase() === 'father');
      if (father) set('relation', father[0]);
    }
    if (nextSource === 'mother') {
      const mother = relationships.find(([, name]) => name.toLowerCase() === 'mother');
      if (mother) set('relation', mother[0]);
    }
  };

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

  const setPhotoFromFile = (file: File) => {
    if (file.size < MIN_IMAGE_BYTES || file.size > MAX_IMAGE_BYTES) {
      setUploadError('Upload photo size must be between 5KB and 1MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }

    setUploadError(null);
    if (form.image_url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
    }
    set('image_url', URL.createObjectURL(file));
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFromFile(file);
    e.target.value = '';
  };

  const closeCrop = () => {
    setCropUrl(null);
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setCropDragStart(null);
  };

  const openCrop = () => {
    if (!form.image_url) return;
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    setUploadError(null);
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setCropUrl(form.image_url);
  };

  const startCropDrag = (e: PointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setCropDragStart({ pointerX: e.clientX, pointerY: e.clientY, offsetX: cropOffset.x, offsetY: cropOffset.y });
  };

  const moveCropDrag = (e: PointerEvent<HTMLImageElement>) => {
    if (!cropDragStart) return;
    setCropOffset({
      x: cropDragStart.offsetX + e.clientX - cropDragStart.pointerX,
      y: cropDragStart.offsetY + e.clientY - cropDragStart.pointerY,
    });
  };

  const endCropDrag = () => setCropDragStart(null);

  const resetCrop = () => {
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
  };

  const useCroppedPhoto = () => {
    if (!cropUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const frameSize = cropFrameRef.current?.clientWidth ?? 360;
      const outputSize = 640;
      const baseScale = Math.max(frameSize / img.naturalWidth, frameSize / img.naturalHeight) * cropScale;
      const drawnWidth = img.naturalWidth * baseScale;
      const drawnHeight = img.naturalHeight * baseScale;
      const dx = (frameSize - drawnWidth) / 2 + cropOffset.x;
      const dy = (frameSize - drawnHeight) / 2 + cropOffset.y;
      const outputRatio = outputSize / frameSize;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputSize, outputSize);
      ctx.drawImage(img, dx * outputRatio, dy * outputRatio, drawnWidth * outputRatio, drawnHeight * outputRatio);
      canvas.toBlob(blob => {
        if (!blob) return;
        if (form.image_url?.startsWith('blob:')) {
          try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
        }
        const nextUrl = URL.createObjectURL(blob);
        set('image_url', nextUrl);
        closeCrop();
      }, 'image/jpeg', 0.88);
    };
    img.onerror = () => setUploadError('Unable to crop this photo. Try uploading the image again.');
    img.src = cropUrl;
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

  const useCapturedPhoto = () => {
    if (!capturedUrl) return;
    setUploadError(null);
    set('image_url', capturedUrl);
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
      <div className="student-form-grid">
        <Field label="First Name*" value={form.first_name} onChange={v => set('first_name', v)} />
        <Field label="Middle Name" value={form.middle_name} onChange={v => set('middle_name', v)} />
        <Field label="Last Name*" value={form.last_name} onChange={v => set('last_name', v)} />
        <ParentField label="Mother Name" value={form.mother_name} checked={guardianSource === 'mother'} onChange={v => set('mother_name', v)} onGuardianToggle={() => toggleParentGuardian('mother')} />
        <ParentField label="Father Name" value={form.father_name} checked={guardianSource === 'father'} onChange={v => set('father_name', v)} onGuardianToggle={() => toggleParentGuardian('father')} />
        <Field label="Email ID*" type="email" value={form.email} onChange={v => set('email', v)} />
        <Field label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} />
        <Select label="Gender*" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other']} />
        <Field label="Aadhaar Number*" value={form.aadhaar_number} onChange={v => set('aadhaar_number', v)} maxLength={12} />
        <Select label="Religion*" value={form.religion} onChange={v => set('religion', v)} options={religionOptions} />
        <Select label="Caste*" value={form.caste} onChange={v => set('caste', v)} options={casteOptions} />
        <Select label="Blood Group" value={form.blood_group} onChange={v => set('blood_group', v)} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
        <Select label="Class*" value={form.class_id} onChange={v => set('class_id', v)} options={classOptions} />
        <Select label="Orphan / Semi Orphan*" value={form.orphan_status} onChange={v => set('orphan_status', v)} options={['Orphan', 'Semi Orphan']} />
        <div className="field photoUploadField">
          <span>Student Photo</span>
          <div className={`upload-section studentPhotoUpload ${form.image_url ? 'hasImage' : ''}`}>
            <input ref={fileInputRef} className="photoFileInput" accept="image/*" type="file" onChange={handlePhoto} />
            <button type="button" className="studentPhotoAvatarButton" onClick={() => form.image_url ? setPhotoOpen(true) : fileInputRef.current?.click()} aria-label={form.image_url ? 'Preview student photo' : 'Upload student photo'}>
              {form.image_url ? (
                <img src={form.image_url} alt="Selected student" />
              ) : (
                <div className="studentPhotoPlaceholder" aria-hidden>
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="22" r="10" stroke="currentColor" strokeWidth="4" />
                    <path d="M14 52c0-11 8-18 18-18s18 7 18 18H14Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
            <div className="studentPhotoMeta">
              <div className="studentPhotoTitle">{form.image_url ? 'Photo selected' : 'No photo selected'}</div>
              <div className={`studentPhotoHelp ${uploadError ? 'isError' : ''}`}>
                {uploadError ?? 'JPG or PNG, 5KB to 1MB.'}
              </div>
            </div>
            <div className="studentPhotoActions">
              <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <span aria-hidden>📁</span>
                {form.image_url ? 'Change' : 'Upload'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={openCamera}>
                <span aria-hidden>📷</span>
                Take Photo
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={openCrop} disabled={!form.image_url}>
                <span aria-hidden>✂</span>
                Crop
              </Button>
              <Button type="button" size="sm" variant="ghost" className="photoRemoveButton" onClick={clearPhoto} disabled={!form.image_url}>
                <span aria-hidden>🗑</span>
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={photoOpen && !!form.image_url}
        onClose={() => setPhotoOpen(false)}
        title="Student Photo"
        width={520}
        footer={<><Button type="button" variant="outline" onClick={() => setPhotoOpen(false)}>Close</Button><Button type="button" onClick={() => { setPhotoOpen(false); openCrop(); }}>Crop Photo</Button></>}
      >
        <div className="photoPreviewWrap">
          {form.image_url ? <img className="photoPreview" src={form.image_url} alt="Student preview" /> : null}
        </div>
      </Modal>

      <Modal
        open={!!cropUrl}
        onClose={closeCrop}
        title="Crop Student Photo"
        width={560}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => { closeCrop(); fileInputRef.current?.click(); }}>Choose Another</Button>
            <Button type="button" onClick={useCroppedPhoto}>Use Photo</Button>
          </>
        }
      >
        <div className="photoCropModal">
          <div className="photoCropFrame" ref={cropFrameRef}>
            {cropUrl ? (
              <img
                src={cropUrl}
                alt="Crop preview"
                draggable={false}
                style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})` }}
                onDragStart={e => e.preventDefault()}
                onPointerDown={startCropDrag}
                onPointerMove={moveCropDrag}
                onPointerUp={endCropDrag}
                onPointerCancel={endCropDrag}
              />
            ) : null}
            <div className="photoCropOverlay" aria-hidden />
          </div>
          <div className="photoCropControls">
            <label>
              Zoom
              <input type="range" min="1" max="2.4" step="0.05" value={cropScale} onChange={e => setCropScale(Number(e.target.value))} />
            </label>
            <Button type="button" size="sm" variant="outline" onClick={resetCrop}>Reset</Button>
          </div>
          <div className="sub">Drag the photo to position it inside the square crop area.</div>
        </div>
      </Modal>

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
      <div className="student-form-grid">
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
                <Avatar name={sibling.full_name} size="lg" />
                <div>
                  <strong>{sibling.full_name}</strong>
                  <Badge variant="success">Student ID: {sibling.student_id}</Badge>
                  <div className="sub">Class: {sibling.class_id}</div>
                  <div className="sub">School: {sibling.sch_name}</div>
                </div>
              </div>
            ) : siblingChecked ? (
              <div className="foundCard muted">No existing student selected.</div>
            ) : null}
          </>
        )}
      </div>

      <h3 className="sectionTitle">School & Location</h3>
      <div className="student-form-grid">
        <Select label="State*" value={form.st_id} onChange={v => set('st_id', v)} options={states} />
        <Select label="District*" value={form.dist_id} onChange={v => set('dist_id', v)} options={districts} />
        <Select label="Mandal*" value={form.mndl_id} onChange={v => set('mndl_id', v)} options={mandals} />
        <Select label="Village*" value={form.vil_id} onChange={v => set('vil_id', v)} options={villages} />
        <Select label="School*" value={form.sch_id} onChange={v => set('sch_id', v)} options={schools} />
      </div>

      <h3 className="sectionTitle">Guardian Details</h3>
      <div className="student-form-grid">
        <Field label="Guardian First Name*" value={form.guardian_first} onChange={v => set('guardian_first', v)} disabled={guardianSource !== 'manual'} />
        <Field label="Guardian Middle Name" value={form.guardian_middle} onChange={v => set('guardian_middle', v)} disabled={guardianSource !== 'manual'} />
        <Field label="Guardian Last Name*" value={form.guardian_last} onChange={v => set('guardian_last', v)} disabled={guardianSource !== 'manual'} />
        <Select label="Relation*" value={form.relation} onChange={v => set('relation', v)} options={relationships} disabled={guardianSource !== 'manual'} />
        <Field label="Phone Number*" value={form.phone} onChange={v => set('phone', v)} />
        <Field label="Occupation" value={form.occ} onChange={v => set('occ', v)} />
        <label className="field"><span>Address</span><textarea className="textarea" value={form.addr} onChange={e => set('addr', e.target.value)} /></label>
      </div>
      </>
  );
}
//----------------MY OLD CODE------------------
// function Field({ label, value, onChange, type = 'text', maxLength, disabled }: { label: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number; disabled?: boolean }) {
//   return <label className="field"><span>{label}</span><input required={label.includes('*')} maxLength={maxLength} type={type} className="input" value={value} disabled={disabled} onChange={e => onChange(e.target.value)} /></label>;
// }

// function Select({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: (string | [string, string])[]; disabled?: boolean }) {
//   return <label className="field"><span>{label}</span><select required={label.includes('*')} className="select" value={value} disabled={disabled} onChange={e => onChange(e.target.value)}><option value="">Select</option>{options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select></label>;
// }

// function ParentField({ label, value, checked, onChange, onGuardianToggle }: { label: string; value: string; checked: boolean; onChange: (v: string) => void; onGuardianToggle: () => void }) {
//   return (
//     <div className="field parentGuardianField">
//       <span>{label}</span>
//       <div className="parentGuardianControl">
//         <input className="input" value={value} onChange={e => onChange(e.target.value)} aria-label={label} />
//         <label className={`guardianCheck ${checked ? 'checked' : ''}`}>
//           <input type="checkbox" checked={checked} onChange={onGuardianToggle} />
//           <span>Is Guardian</span>
//         </label>
//       </div>
//     </div>
//   );
// }

// function Info({ label, value }: { label: string; value?: string | number | null }) {
//   return <div><div className="sub">{label}</div><div className="strong">{value || '-'}</div></div>;
// }

//----------------MY NEW CODE------------------
function Field({
  label, value, onChange, type = 'text', maxLength, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; maxLength?: number; disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        required={label.includes('*')}
        maxLength={maxLength}
        type={type}
        className="input"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label, value, onChange, options, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: (string | [string, string])[]; disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        required={label.includes('*')}
        className="select"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select</option>
        {options.map(o =>
          Array.isArray(o)
            ? <option key={o[0]} value={o[0]}>{o[1]}</option>
            : <option key={o} value={o}>{o}</option>
        )}
      </select>
    </label>
  );
}

function ParentField({
  label, value, checked, onChange, onGuardianToggle,
}: {
  label: string; value: string; checked: boolean;
  onChange: (v: string) => void; onGuardianToggle: () => void;
}) {
  return (
    <div className="field parentGuardianField">
      <span>{label}</span>
      <div className="parentGuardianControl">
        <input
          className="input"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={label}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <label className={`guardianCheck${checked ? ' checked' : ''}`}>
          <input type="checkbox" checked={checked} onChange={onGuardianToggle} />
          <span>Guardian</span>
        </label>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="sub">{label}</div>
      <div className="strong" style={{ marginTop: 3 }}>{value || '—'}</div>
    </div>
  );
}
