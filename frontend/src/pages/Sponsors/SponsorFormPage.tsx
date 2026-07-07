import { type ChangeEvent, type FormEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createSponsor, getSponsorById, setCurrentUserId, updateSponsor } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { SponsorView } from '../../types';
import { HiOutlineXMark } from 'react-icons/hi2';
import { LuCamera, LuImage, LuUpload, LuUser } from 'react-icons/lu';

type SponsorFormMode = 'create' | 'edit' | 'view';

interface SponsorFormState {
  name: string;
  email: string;
  dob: string;
  ph_no: string;
  type: '' | 'Individual' | 'Organisation';
  nationality: string;
  contrib: string;
  loc: string;
  image_url: string;
}

type SponsorFormErrors = Partial<Record<keyof SponsorFormState, string>>;

const init: SponsorFormState = {
  name: '',
  email: '',
  dob: '',
  ph_no: '',
  type: '',
  nationality: '',
  contrib: '',
  loc: '',
  image_url: '',
};

const formFieldKeys: (keyof SponsorFormState)[] = [
  'name',
  'email',
  'dob',
  'ph_no',
  'type',
  'nationality',
  'contrib',
  'loc',
];

const nationalityOptions = ['Indian', 'Foreigner'];
const emailPattern = /^[^\s@]+@(gmail\.com|nichebit\.com)$/i;
const phonePattern = /^\d{10}$/;
const MIN_IMAGE_BYTES = 5 * 1024;
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

const mapSponsorToForm = (sponsor: SponsorView): SponsorFormState => ({
  name: sponsor.sponsorName ?? '',
  email: sponsor.email ?? '',
  dob: sponsor.dob ?? '',
  ph_no: sponsor.ph_no ?? '',
  type: sponsor.type ?? 'Individual',
  nationality: sponsor.nationality ?? 'Indian',
  contrib: String(sponsor.contrib ?? ''),
  loc: sponsor.loc ?? '',
  image_url: sponsor.image_url ?? '',
});

const validateSponsorField = (
  key: keyof SponsorFormState,
  form: SponsorFormState,
): string | undefined => {
  const value = String(form[key] ?? '').trim();

  switch (key) {
    case 'name':
      if (!value) return 'Sponsor name is required.';
      if (!/^[A-Za-z ]+$/.test(value)) return 'Sponsor name should contain only letters.';
      if (value.length < 2) return 'Enter a valid sponsor name.';
      return undefined;
    case 'email':
      if (!value) return 'Email is required.';
      if (!emailPattern.test(value)) return 'Email must end with @gmail.com or @nichebit.com.';
      return undefined;
    case 'dob':
      if (!value) return 'Date of birth is required.';
      {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        const date = match ? new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`) : new Date('invalid');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = match ? Number(match[1]) : NaN;

        if (
          !match ||
          Number.isNaN(date.getTime()) ||
          !Number.isFinite(year) ||
          year < 1900 ||
          year > today.getFullYear() ||
          date.getFullYear() !== year
        ) {
          return 'Enter a valid Date of Birth.';
        }
        if (date > today) return 'Date of Birth cannot be in the future.';
      }
      return undefined;
    case 'ph_no':
      if (!value) return 'Phone number is required.';
      if (!phonePattern.test(value)) return 'Phone Number must contain exactly 10 digits.';
      return undefined;
    case 'type':
      if (!value) return 'Type is required.';
      return undefined;
    case 'nationality':
      if (!value) return 'Nationality is required.';
      return undefined;
    case 'contrib':
      if (!value) return 'Contribution is required.';
      if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Contribution must be a valid amount.';
      return undefined;
    default:
      return undefined;
  }
};

function formatSponsorName(value: string) {
  return value
    .replace(/[^A-Za-z ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[A-Za-z]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function normalizeDateValue(value: string) {
  return value.replace(/^(\d{4})\d+-(\d{2})-(\d{2})$/, '$1-$2-$3');
}

const validateSponsorForm = (form: SponsorFormState): SponsorFormErrors => {
  const nextErrors: SponsorFormErrors = {};
  formFieldKeys.forEach((key) => {
    const error = validateSponsorField(key, form);
    if (error) nextErrors[key] = error;
  });
  return nextErrors;
};

const modeFromPath = (pathname: string): SponsorFormMode => {
  if (pathname.includes('/sponsors/view/')) return 'view';
  if (pathname.includes('/sponsors/edit/')) return 'edit';
  return 'create';
};

export default function SponsorFormPage() {
  const { id } = useParams();
  const location = useLocation();
  const mode = modeFromPath(location.pathname);
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<SponsorFormState>(init);
  const [errors, setErrors] = useState<SponsorFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof SponsorFormState>>(() => new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loadingSponsor, setLoadingSponsor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | Blob | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDragStart, setCropDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.user_id) {
      setCurrentUserId(user.user_id);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (!id || mode === 'create') return;

    let active = true;
    setLoadingSponsor(true);

    getSponsorById(Number(id))
      .then((sponsor) => {
        if (!active) return;
        if (!sponsor) {
          toast('Sponsor not found.', 'error');
          nav('/sponsors', { replace: true });
          return;
        }
        setForm(mapSponsorToForm(sponsor));
      })
      .catch((error) => {
        if (!active) return;
        console.error('[SponsorFormPage] load sponsor failed', error);
        toast('Unable to load sponsor details.', 'error');
      })
      .finally(() => {
        if (active) setLoadingSponsor(false);
      });

    return () => {
      active = false;
    };
  }, [id, mode, nav, toast]);

  const setField = (key: keyof SponsorFormState, value: string) => {
    const nextValue =
      key === 'ph_no'
        ? value.replace(/\D/g, '').slice(0, 10)
        : key === 'name'
        ? formatSponsorName(value)
        : key === 'dob'
        ? normalizeDateValue(value)
        : value;

    setForm((current) => ({ ...current, [key]: nextValue }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const touchField = (key: keyof SponsorFormState) => {
    if (isView) return;
    setTouchedFields((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  const handleFieldBlur = (key: keyof SponsorFormState) => {
    if (isView) return;
    touchField(key);
  };

  const fieldState = (key: keyof SponsorFormState) => {
    if (isView) return 'default' as const;
    const touched = touchedFields.has(key);
    if (errors[key] && submitAttempted) return 'error' as const;
    if (!errors[key] && touched && String(form[key] ?? '').trim()) return 'success' as const;
    return 'default' as const;
  };

  const showError = (key: keyof SponsorFormState) => submitAttempted ? errors[key] : undefined;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (isView || !cameraOpen) return;
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
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unable to access camera';
        setCameraError(msg);
      }
    };

    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen, capturedUrl, isView]);

  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    if (isView) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size < MIN_IMAGE_BYTES || file.size > MAX_IMAGE_BYTES) {
      const message = 'Upload photo size must be between 5KB and 1MB.';
      setUploadError(message);
      toast(message, 'error');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      const message = 'Please upload a valid image file.';
      setUploadError(message);
      toast(message, 'error');
      event.target.value = '';
      return;
    }

    setUploadError(null);
    setSelectedImageFile(file);
    if (form.image_url?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(form.image_url);
      } catch {
        // ignore
      }
    }

    setField('image_url', URL.createObjectURL(file));
    event.target.value = '';
  };

  const openCamera = () => {
    if (isView) return;
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setCapturedBlob(null);
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
    setCapturedBlob(null);
    setCameraOpen(false);
  };

  const useCapturedPhoto = () => {
    if (isView || !capturedUrl) return;
    setUploadError(null);
    if (capturedBlob) setSelectedImageFile(capturedBlob);
    setField('image_url', capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
    setCameraOpen(false);
  };

  const retakePhoto = () => {
    if (isView) return;
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    setCapturedBlob(null);
    setUploadError(null);
    setCameraError(null);
  };

  const clearPhoto = () => {
    if (isView) return;
    setUploadError(null);
    if (form.image_url?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(form.image_url);
      } catch {
        // ignore
      }
    }
    setField('image_url', '');
    setSelectedImageFile(null);
  };

  const openCrop = () => {
    if (isView || !form.image_url) return;
    setUploadError(null);
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setCropUrl(form.image_url);
  };

  const closeCrop = () => {
    setCropUrl(null);
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setCropDragStart(null);
  };

  const startCropDrag = (event: PointerEvent<HTMLImageElement>) => {
    if (isView) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setCropDragStart({
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    });
  };

  const moveCropDrag = (event: PointerEvent<HTMLImageElement>) => {
    if (isView || !cropDragStart) return;
    setCropOffset({
      x: cropDragStart.offsetX + event.clientX - cropDragStart.pointerX,
      y: cropDragStart.offsetY + event.clientY - cropDragStart.pointerY,
    });
  };

  const endCropDrag = () => setCropDragStart(null);

  const resetCrop = () => {
    if (isView) return;
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
  };

  const useCroppedPhoto = () => {
    if (isView || !cropUrl) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const frameSize = cropFrameRef.current?.clientWidth ?? 360;
      const outputSize = 640;
      const baseScale = Math.max(frameSize / image.naturalWidth, frameSize / image.naturalHeight) * cropScale;
      const drawnWidth = image.naturalWidth * baseScale;
      const drawnHeight = image.naturalHeight * baseScale;
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
      ctx.drawImage(image, dx * outputRatio, dy * outputRatio, drawnWidth * outputRatio, drawnHeight * outputRatio);
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (form.image_url?.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(form.image_url);
          } catch {
            // ignore
          }
        }
        setSelectedImageFile(blob);
        setField('image_url', URL.createObjectURL(blob));
        closeCrop();
      }, 'image/jpeg', 0.88);
    };
    image.onerror = () => setUploadError('Unable to crop this photo. Try uploading the image again.');
    image.src = cropUrl;
  };

  const capturePhoto = async () => {
    if (isView) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const makeBlob = (quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

    let blob = await makeBlob(0.92);
    if (!blob) return;

    if (blob.size > MAX_IMAGE_BYTES) {
      for (const quality of [0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4]) {
        const nextBlob = await makeBlob(quality);
        if (!nextBlob) continue;
        blob = nextBlob;
        if (blob.size <= MAX_IMAGE_BYTES) break;
      }
    }

    if (blob.size > MAX_IMAGE_BYTES) {
      const message = 'Captured photo is too large (max 1MB). Please try again or use upload.';
      setUploadError(message);
      toast(message, 'error');
      return;
    }

    stopCamera();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(blob);
    setCapturedUrl(URL.createObjectURL(blob));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isView) return;

    setSubmitAttempted(true);
    const nextErrors = validateSponsorForm(form);
    setErrors(nextErrors);
    setTouchedFields(new Set(formFieldKeys));

    if (Object.keys(nextErrors).length > 0) {
      toast('Please fix the highlighted fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (!form.type) return;

      const payload = {
        sponsorName: form.name.trim(),
        email: form.email.trim(),
        dob: form.dob,
        ph_no: form.ph_no.trim(),
        type: form.type,
        nationality: form.nationality.trim(),
        contrib: form.contrib.trim(),
        loc: form.loc.trim() || null,
        image_url: form.image_url || null,
      };

      if (isEdit) {
        await updateSponsor(Number(id), {
          ...payload,
          modified_by: user?.user_id ?? 1,
        }, selectedImageFile ?? undefined);
      } else {
        await createSponsor({
          ...payload,
          created_by: user?.user_id ?? 1,
        }, selectedImageFile ?? undefined);
      }

      toast(isEdit ? 'Sponsor updated.' : 'Sponsor added.', 'success');
      nav('/sponsors');
    } catch (error) {
      console.error('[SponsorFormPage] save sponsor failed', error);
      if (axios.isAxiosError(error)) {
        const data: any = error.response?.data;
        const serverMessage = String(data?.message ?? data?.error ?? data?.detail ?? '').trim();
        toast(serverMessage ? `Unable to save sponsor: ${serverMessage}` : 'Unable to save sponsor. Please try again.', 'error');
      } else {
        toast('Unable to save sponsor.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isView ? 'View Sponsor' : isEdit ? 'Edit Sponsor' : 'Add Sponsor';
  const pageSubtitle = 'Sponsor profile and contribution details';
  const sponsorLoading = loadingSponsor && (mode === 'edit' || mode === 'view');

  return (
    <form className="studentWizardForm sponsorWizardForm" onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <button type="button" className="studentWizardClose" onClick={() => nav('/sponsors')} aria-label="Close">
            <HiOutlineXMark/>
          </button>
        }
      />

      {sponsorLoading ? (
        <section className="studentFormSection">
          <div className="sub">Loading sponsor details...</div>
        </section>
      ) : (
        <section className="studentFormSection" aria-labelledby="sponsor-section-profile">
            <h3 id="sponsor-section-profile" className="studentStepTitle"><span className="studentStepIcon"><ProfileInfoIcon /></span>Personal Information</h3>
            <div className="formGrid studentStepGrid">
              <SponsorField
                fieldKey="name"
                label="Name*"
                placeholder="Name"
                value={form.name}
                onChange={(value) => setField('name', value)}
                onBlur={() => handleFieldBlur('name')}
                error={showError('name')}
                state={fieldState('name')}
                readOnly={isView}
              />
              <SponsorField
                fieldKey="email"
                label="Email*"
                placeholder="Email ID"
                type="email"
                value={form.email}
                onChange={(value) => setField('email', value)}
                onBlur={() => handleFieldBlur('email')}
                error={showError('email')}
                state={fieldState('email')}
                readOnly={isView}
              />
              <SponsorField
                fieldKey="dob"
                label="Date of Birth*"
                type="date"
                placeholder="Date of Birth"
                value={form.dob}
                onChange={(value) => setField('dob', value)}
                onBlur={() => handleFieldBlur('dob')}
                error={showError('dob')}
                state={fieldState('dob')}
                readOnly={isView}
              />
              <SponsorField
                fieldKey="ph_no"
                label="Phone Number*"
                placeholder="Phone Number"
                value={form.ph_no}
                onChange={(value) => setField('ph_no', value)}
                onBlur={() => handleFieldBlur('ph_no')}
                error={showError('ph_no')}
                state={fieldState('ph_no')}
                readOnly={isView}
                numericOnly
                maxLength={10}
              />
              <SponsorSelect
                fieldKey="nationality"
                label="Nationality*"
                placeholder="Nationality"
                value={form.nationality}
                onChange={(value) => setField('nationality', value)}
                onBlur={() => handleFieldBlur('nationality')}
                options={nationalityOptions}
                error={showError('nationality')}
                state={fieldState('nationality')}
                readOnly={isView}
              />
              <SponsorField
                fieldKey="contrib"
                label="Contribution*"
                placeholder="Contribution"
                value={form.contrib}
                onChange={(value) => setField('contrib', value)}
                onBlur={() => handleFieldBlur('contrib')}
                error={showError('contrib')}
                state={fieldState('contrib')}
                readOnly={isView}
              />
              <SponsorSelect
                fieldKey="type"
                label="Type*"
                placeholder="Type"
                value={form.type}
                onChange={(value) => setField('type', value as SponsorFormState['type'])}
                onBlur={() => handleFieldBlur('type')}
                options={['Individual', 'Organisation']}
                error={showError('type')}
                state={fieldState('type')}
                readOnly={isView}
              />
              <SponsorField
                fieldKey="loc"
                label="Location"
                placeholder="Location"
                value={form.loc}
                onChange={(value) => setField('loc', value)}
                onBlur={() => handleFieldBlur('loc')}
                readOnly={isView}
              />
            </div>

            <div className="field studentPhotoField sponsorPhotoField">
              <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon"><PhotoImageIcon /></span>Sponsor Photo</h3>
              <div className="uploadBox studentModalUpload">
                <div className="studentModalUploadPreview">
                  {form.image_url && !isView ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      className="iconBtn uploadDeleteBtn"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        clearPhoto();
                      }}
                      aria-label="Remove sponsor photo"
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
                  {form.image_url ? (
                    <img src={form.image_url} alt="Sponsor" />
                  ) : null}
                  <span className={uploadError ? 'studentModalUploadError' : undefined}>
                    {uploadError || (isView ? 'No photo available' : 'Take photo or upload')}
                  </span>
                </div>
                {!isView ? (
                  <>
                    <div className="rowFlex studentModalUploadActions">
                      <Button type="button" variant="outline" onClick={openCamera}>
                        <PhotoCameraIcon /> Take Photo
                      </Button>
                      <label className="btn outline md" style={{ cursor: 'pointer' }}>
                        <PhotoUploadIcon /> Upload Photo
                        <input
                          ref={fileInputRef}
                          accept="image/*"
                          type="file"
                          onChange={uploadPhoto}
                          style={{ display: 'none' }}
                          disabled={isView}
                        />
                      </label>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="modalFooter" style={{ paddingInline: 0 }}>
              {isView ? (
                <>
                  <Button type="button" className="btn btnRed" variant="outline" onClick={() => nav('/sponsors')}>
                    Close
                  </Button>
                  <Button type="button" className="btn btnGreen" onClick={() => nav(`/sponsors/edit/${id}`)}>
                    Edit Sponsor
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" className="btnRed" variant="outline" onClick={() => nav('/sponsors')}>
                    Cancel
                  </Button>
                  <Button className="btnGreen" loading={saving}>
                    {isEdit ? 'Save changes' : 'Add Sponsor'}
                  </Button>
                </>
              )}
            </div>
        </section>
      )}

      <Modal
          open={photoOpen && !!form.image_url && !isView}
          onClose={() => setPhotoOpen(false)}
          title="Sponsor Photo"
          width={520}
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setPhotoOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={() => { setPhotoOpen(false); openCrop(); }}>
                Crop Photo
              </Button>
            </>
          )}
        >
          <div className="photoPreviewWrap">
            {form.image_url ? <img className="photoPreview" src={form.image_url} alt="Sponsor preview" /> : null}
          </div>
      </Modal>

      <Modal
          open={!!cropUrl && !isView}
          onClose={closeCrop}
          title="Crop Sponsor Photo"
          width={560}
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => { closeCrop(); fileInputRef.current?.click(); }}>
                Choose Another
              </Button>
              <Button type="button" onClick={useCroppedPhoto}>
                Use Photo
              </Button>
            </>
          )}
        >
          <div className="photoCropModal">
            <div className="photoCropFrame" ref={cropFrameRef}>
              {cropUrl ? (
                <img
                  src={cropUrl}
                  alt="Crop preview"
                  draggable={false}
                  style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})` }}
                  onDragStart={(event) => event.preventDefault()}
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
                <input type="range" min="1" max="2.4" step="0.05" value={cropScale} onChange={(event) => setCropScale(Number(event.target.value))} />
              </label>
              <Button type="button" size="sm" variant="outline" onClick={resetCrop}>
                Reset
              </Button>
            </div>
            <div className="sub">Drag the photo to position it inside the square crop area.</div>
          </div>
      </Modal>

      <Modal
          open={cameraOpen && !isView}
          onClose={closeCamera}
          title="Take Photo"
          width={680}
          footer={(
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
          )}
        >
          {cameraError ? (
            <div className="toast error" style={{ position: 'static' }}>
              {cameraError}
              <div className="sub" style={{ marginTop: 8 }}>
                If camera permission is blocked, use upload instead.
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
                style={{
                  width: 'min(560px, 100%)',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--color-border)',
                  background: '#0b1220',
                }}
                playsInline
                autoPlay
                muted
              />
            </div>
          )}
      </Modal>
    </form>
  );
}

function ValidationMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <div id={id} className="validationMessage" role="alert">
      <span aria-hidden="true">!</span>
      {message}
    </div>
  );
}

function ProfileInfoIcon() {
  return <LuUser size={20} />;
}

function PhotoCameraIcon() {
  return <LuCamera size={20} />;
}
function PhotoImageIcon() {
  return (
    <LuImage size={20} />
  );
}
function PhotoUploadIcon() {
  return <LuUpload size={20} />;
}

function SponsorField({
  fieldKey,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  type = 'text',
  maxLength,
  error,
  readOnly = false,
  numericOnly = false,
  state = 'default',
}: {
  fieldKey: keyof SponsorFormState;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  maxLength?: number;
  error?: string;
  readOnly?: boolean;
  numericOnly?: boolean;
  state?: 'default' | 'error' | 'success';
}) {
  const inputId = `sponsor-field-${fieldKey}`;
  const messageId = `${inputId}-message`;

  const handleChange = (nextValue: string) => {
    const cleanValue = numericOnly
      ? nextValue.replace(/\D/g, '').slice(0, maxLength)
      : type === 'date'
      ? normalizeDateValue(nextValue)
      : nextValue;
    onChange(cleanValue);
  };

  return (
    <div className={`field formField has-${state}`}>
      <label htmlFor={inputId}>{label.replace(/\*/g, '')}</label>
      <div className="studentFieldControl">
        <input
          id={inputId}
          data-field={fieldKey}
          required={!readOnly && label.includes('*')}
          readOnly={readOnly}
          aria-label={!readOnly ? label.replace(/\*/g, '') : undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={error ? messageId : undefined}
          tabIndex={readOnly ? -1 : undefined}
          maxLength={maxLength}
          type={readOnly || numericOnly ? 'text' : type}
          inputMode={numericOnly ? 'numeric' : undefined}
          pattern={numericOnly ? '\\d*' : undefined}
          className={readOnly ? 'input readonlyField' : 'input'}
          placeholder=""
          value={readOnly ? (value || '-') : value}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={onBlur}
        />
        <ValidationMessage id={messageId} message={error} />
      </div>
    </div>
  );
}

export function SponsorSelect({
  fieldKey,
  label,
  placeholder,
  value,
  onChange,
  options,
  error,
  readOnly = false,
  state = 'default',
}: {
  fieldKey: keyof SponsorFormState;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: string[];
  error?: string;
  readOnly?: boolean;
  state?: 'default' | 'error' | 'success';
}) {
  const inputId = `sponsor-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedLabel = options.find((option) => option === value) ?? '';

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
    <div className={`field formField has-${state}`}>
      <label htmlFor={inputId}>{label.replace(/\*/g, '')}</label>
      <div className="studentFieldControl">
        {readOnly ? (
          <input
            id={inputId}
            data-field={fieldKey}
            className="input readonlyField"
            value={value || '-'}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
          />
        ) : (
          <details
            ref={detailsRef}
            className={`multiSelectFilter studentFormSelect sponsorFormSelect${value ? ' hasValue' : ''}`}
          >
            <summary
              id={inputId}
              data-field={fieldKey}
              className="multiSelectTrigger"
              aria-label={label.replace(/\*/g, '')}
              aria-invalid={state === 'error' || undefined}
              aria-describedby={error ? messageId : undefined}
              onClick={(event) => {
                event.preventDefault();
                const shouldOpen = !detailsRef.current?.open;
                document.querySelectorAll<HTMLDetailsElement>('.sponsorFormSelect[open]').forEach((details) => {
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
                {options.map((option) => (
                  <button
                    type="button"
                    className={`multiSelectOption${value === option ? ' isSelected' : ''}`}
                    key={option}
                    onClick={() => {
                      onChange(option);
                      detailsRef.current?.removeAttribute('open');
                    }}
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </details>
        )}
        <ValidationMessage id={messageId} message={error} />
      </div>
    </div>
  );
}
