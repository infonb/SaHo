import { type ChangeEvent, type FormEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSponsor, getSponsorById, updateSponsor, setCurrentUserId } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import "../../styles/Sponsors/SponsorFormPage.css";

const init = { name: '', email: '', dob: '', ph_no: '', type: 'Individual', nationality: 'Indian', contrib: '', loc: '', image_url: '' };

export default function SponsorFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(init);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDragStart, setCropDragStart] = useState<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const nationalityOptions = ['Indian', 'Foreigner'];
  const MIN_IMAGE_BYTES = 5 * 1024;
  const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

  // Set user ID in API module when component mounts or user changes
  useEffect(() => {
    if (user?.user_id) {
      setCurrentUserId(user.user_id);
    }
  }, [user?.user_id]);

  useEffect(() => {
  if (!id) return;

  getSponsorById(Number(id)).then((s) => {
    if (!s) return;

    setForm({
      name: s.sponsorName ?? '',
      email: s.email ?? '',
      dob: s.dob ?? '',
      ph_no: s.ph_no ?? '',
      type: s.type ?? 'Individual',
      nationality: s.nationality ?? 'Indian',
      contrib: String(s.contrib ?? ''),
      loc: s.loc ?? '',
      image_url: s.image_url ?? ''
    });
  });
}, [id]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

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
  }, [cameraOpen, capturedUrl]);

  const uploadPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size < MIN_IMAGE_BYTES || file.size > MAX_IMAGE_BYTES) {
      const msg = 'Upload photo size must be between 5KB and 1MB.';
      setUploadError(msg);
      toast(msg, 'error');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      const msg = 'Please upload a valid image file.';
      setUploadError(msg);
      toast(msg, 'error');
      e.target.value = '';
      return;
    }

    setUploadError(null);

    if (form.image_url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
    }

    set('image_url', URL.createObjectURL(file));
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
        set('image_url', URL.createObjectURL(blob));
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
      const msg = 'Captured photo is too large (max 1MB). Please try again or use upload.';
      setUploadError(msg);
      toast(msg, 'error');
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        sponsorName: form.name.trim(),
        email: form.email,
        dob: form.dob,
        ph_no: form.ph_no,
        type: form.type as 'Individual' | 'Organisation',
        nationality: form.nationality,
        contrib: form.contrib.trim(),
        loc: form.loc || null,
        image_url: form.image_url || null
      };
if (isEdit) {
  await updateSponsor(Number(id), {
    ...payload,
    modified_by: user?.user_id ?? 1
  });
} else {
  await createSponsor({
    ...payload,
    created_by: user?.user_id ?? 1
  });
}

      
      toast(isEdit ? 'Sponsor updated.' : 'Sponsor added.', 'success');
      nav('/sponsors');
    } catch {
      toast('Unable to save sponsor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <PageHeader title={isEdit ? 'Edit Sponsor' : 'Add Sponsor'} subtitle="Sponsor profile and contribution details" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} />
      <div className="panel">
        <div className="sponsorPhotoDock">
          <div className="field">
            <span>Sponsor Photo</span>
            <div className={`studentPhotoUpload ${form.image_url ? 'hasImage' : ''}`}>
              <input ref={fileInputRef} className="photoFileInput" accept="image/*" type="file" onChange={uploadPhoto} />
              <button type="button" className="studentPhotoAvatarButton" onClick={() => form.image_url ? setPhotoOpen(true) : fileInputRef.current?.click()} aria-label={form.image_url ? 'Preview sponsor photo' : 'Upload sponsor photo'}>
                {form.image_url ? (
                  <img src={form.image_url} alt="Selected sponsor" />
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

        <div className="formGrid">
          <Field label="Name*" value={form.name} onChange={v => set('name', v)} />
          <Field label="Email*" type="email" value={form.email} onChange={v => set('email', v)} />
          <Field label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} />
          <Field label="Phone Number*" value={form.ph_no} onChange={v => set('ph_no', v)} />
          <label className="field">
            <span>Nationality*</span>
            <select required className="select" value={form.nationality} onChange={e => set('nationality', e.target.value)}>
              {nationalityOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <Field label="Contribution*" value={form.contrib} onChange={v => set('contrib', v)} />
          <label className="field">
            <span>Type*</span>
            <select required className="select" value={form.type} onChange={e => set('type', e.target.value)}>
              <option>Individual</option>
              <option>Organisation</option>
            </select>
          </label>
          <Field label="Location" value={form.loc} onChange={v => set('loc', v)} />
        </div>

        <div className="modalFooter" style={{ paddingInline: 0 }}>
          <Button type="button" variant="outline" onClick={() => nav('/sponsors')}>Cancel</Button>
          <Button loading={loading}>{isEdit ? 'Save Changes' : 'Add Sponsor'}</Button>
        </div>

        <Modal
          open={photoOpen && !!form.image_url}
          onClose={() => setPhotoOpen(false)}
          title="Sponsor Photo"
          width={520}
          footer={<><Button type="button" variant="outline" onClick={() => setPhotoOpen(false)}>Close</Button><Button type="button" onClick={() => { setPhotoOpen(false); openCrop(); }}>Crop Photo</Button></>}
        >
          <div className="photoPreviewWrap">
            {form.image_url ? <img className="photoPreview" src={form.image_url} alt="Sponsor preview" /> : null}
          </div>
        </Modal>

        <Modal
          open={!!cropUrl}
          onClose={closeCrop}
          title="Crop Sponsor Photo"
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
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <label className="field"><span>{label}</span><input className="input" required={label.includes('*')} type={type} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
