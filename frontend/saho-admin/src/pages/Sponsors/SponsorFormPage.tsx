import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSponsor, getSponsorById, updateSponsor, setCurrentUserId } from '../../api/sponsorApi';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

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
      name: s.sponsor_name ?? '',
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

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

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

    setUploadError(null);

    if (form.image_url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(form.image_url); } catch { /* ignore */ }
    }

    set('image_url', URL.createObjectURL(file));
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
        sponsor_name: form.name.trim(),
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
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 'min(520px, 100%)' }}>
            <div className="sub" style={{ fontWeight: 900, marginBottom: 8 }}>Sponsor Photo</div>
            <div className="uploadBox" style={{ gap: 10, padding: 14 }}>
              {form.image_url ? (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="iconBtn uploadDeleteBtn"
                  onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); clearPhoto(); }}
                  aria-label="Remove sponsor photo"
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
              {form.image_url ? <img src={form.image_url} alt="Sponsor" /> : <Avatar name={form.name || 'SP'} size="lg" />}
              <div className="rowFlex" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Button type="button" variant="outline" onClick={openCamera}>Take Photo</Button>
                <label className="btn outline md" style={{ cursor: 'pointer' }}>
                  Upload Photo
                  <input accept="image/*" type="file" onChange={uploadPhoto} style={{ display: 'none' }} />
                </label>
              </div>
              <div className="sub" style={{ marginTop: 2 }}>
                {uploadError ? <span style={{ color: 'var(--red)' }}>{uploadError}</span> : 'Upload size: 5KB to 1MB'}
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
