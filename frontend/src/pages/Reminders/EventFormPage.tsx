import { type ComponentProps, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import { getDistricts, getMandals, getSchools, getStates, getVillages } from '../../api/locationApi';
import { getClasses } from '../../api/masterApi';
import { createReminder, getReminderById, updateReminder } from '../../api/remindersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import '../../styles/Reminders/EventFormPage.css';

interface EventFormState {
  title: string;
  eventDate: string;
  venue: string;
  description: string;
  bannerImage: string;
  stIdCsv: string;
  distIdsCsv: string;
  mndlIdsCsv: string;
  vilIdsCsv: string;
  schIdsCsv: string;
  classIdsCsv: string;
}

type EventFormErrors = Partial<Record<keyof EventFormState, string>>;

const init: EventFormState = {
  title: '',
  eventDate: '',
  venue: '',
  description: '',
  bannerImage: '',
  stIdCsv: '',
  distIdsCsv: '',
  mndlIdsCsv: '',
  vilIdsCsv: '',
  schIdsCsv: '',
  classIdsCsv: '',
};

const steps = [
  { key: 'event', label: 'Event Details' },
  { key: 'location', label: 'Location' },
] as const;

type EventFormStep = typeof steps[number]['key'];

const eventRequiredFields: (keyof EventFormState)[] = [
  'title', 'eventDate', 'venue',
];

const locationRequiredFields: (keyof EventFormState)[] = [
  'stIdCsv',
];

const requiredFieldLabels: Partial<Record<keyof EventFormState, string>> = {
  title: 'Event Name',
  eventDate: 'Event Date',
  venue: 'Venue',
  stIdCsv: 'State',
};

const stepRequiredFields: Record<EventFormStep, (keyof EventFormState)[]> = {
  event: eventRequiredFields,
  location: locationRequiredFields,
};

const fieldStepMap = steps.reduce((map, step) => {
  stepRequiredFields[step.key].forEach(field => {
    map[field] = step.key;
  });
  return map;
}, {} as Partial<Record<keyof EventFormState, EventFormStep>>);

function PrimaryButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} className={`studentPrimaryButton ${props.className ?? ''}`} />;
}

function SecondaryButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} variant="outline" className={`studentSecondaryButton ${props.className ?? ''}`} />;
}

type FieldState = 'default' | 'error' | 'success';

function ValidationMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <div id={id} className="validationMessage" role="alert"><span aria-hidden="true">!</span>{message}</div>;
}

function FormField({ fieldKey, label, children, error, readOnly = false, state = 'default' }: { fieldKey: string; label: string; children: ReactNode; error?: string; readOnly?: boolean; state?: FieldState }) {
  const inputId = `event-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  return (
    <div className={`field formField has-${state}`}>
      {children}
      <ValidationMessage id={messageId} message={error} />
    </div>
  );
}

function Field({ fieldKey, label, value, onChange, onBlur, type = 'text', error, readOnly = false, state = 'default', htmlMin, htmlMax, alphabeticOnly }: { fieldKey: keyof EventFormState; label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; type?: string; error?: string; readOnly?: boolean; state?: FieldState; htmlMin?: string; htmlMax?: string; alphabeticOnly?: boolean }) {
  const inputId = `event-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  const placeholder = label.replace(/\*/g, '').trim();

  const handleChange = (nextValue: string) => {
    const cleanValue = alphabeticOnly ? nextValue.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ') : nextValue;
    onChange(cleanValue);
  };

  return (
    <FormField fieldKey={fieldKey} label={label} error={error} readOnly={readOnly} state={state}>
      <input
        id={inputId}
        data-field={fieldKey}
        required={!readOnly && label.includes('*')}
        readOnly={readOnly}
        aria-label={placeholder}
        aria-readonly={readOnly || undefined}
        aria-invalid={state === 'error' || undefined}
        aria-describedby={error ? messageId : undefined}
        tabIndex={readOnly ? -1 : undefined}
        type={type}
        min={htmlMin}
        max={htmlMax}
        placeholder={placeholder}
        className={readOnly ? 'input readonlyField' : 'input'}
        value={readOnly ? (value || '-') : value}
        onChange={e => handleChange(e.target.value)}
        onBlur={onBlur}
      />
    </FormField>
  );
}

function FormContainer({ children }: { children: ReactNode }) {
  return <div className="studentFormContainer">{children}</div>;
}

function FormSection({ title, step, children }: { title: string; step: string; children: ReactNode }) {
  return (
    <section className="studentFormSection" aria-labelledby={`event-section-${step}`}>
      <h3 id={`event-section-${step}`} className="studentStepTitle"><span className="studentStepIcon">{step}</span>{title}</h3>
      {children}
    </section>
  );
}


function LocationMultiSelect({ fieldKey, label, options, selectedIds, onChange, error, state = 'default' }: {
  fieldKey: string;
  label: string;
  options: { id: number; name: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  state?: FieldState;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  const clear = () => {
    onChange([]);
    detailsRef.current?.removeAttribute('open');
  };

  const inputId = `event-field-${fieldKey}`;
  const messageId = `${inputId}-message`;
  const cleanLabel = label.replace(/\*/g, '').trim();
  const summary = selectedIds.length === 0
    ? `Select ${cleanLabel}`
    : selectedIds.length === 1
    ? options.find(o => o.id === selectedIds[0])?.name ?? '1 selected'
    : `${selectedIds.length} selected`;

  return (
    <div className={`field formField has-${state}`}>
      <details
        ref={detailsRef}
        className={`multiSelectFilter studentFormSelect${selectedIds.length > 0 ? ' hasValue' : ''}`}
      >
        <summary
          id={inputId}
          data-field={fieldKey}
          className="multiSelectTrigger"
          aria-label={cleanLabel}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={error ? messageId : undefined}
          onClick={(event) => {
            event.preventDefault();
            const details = detailsRef.current;
            if (!details) return;
            document.querySelectorAll<HTMLDetailsElement>('.studentWizardForm .studentFormSelect[open]').forEach(d => {
              if (d !== details) d.removeAttribute('open');
            });
            if (details.open) details.removeAttribute('open');
            else details.setAttribute('open', '');
          }}
        >
          <span>{summary}</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="multiSelectMenu">
          <div className="multiSelectMenuHead">
            <span>{cleanLabel}</span>
            {selectedIds.length > 0 ? <button type="button" onClick={clear}>Clear</button> : null}
          </div>
          <div className="multiSelectOptions">
            {options.length === 0 ? (
              <div className="multiSelectEmpty">No options available</div>
            ) : (
              options.map(option => (
                <label key={option.id} className="multiSelectOption">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(option.id)}
                    onChange={() => toggle(option.id)}
                  />
                  <span>{option.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </details>
      <ValidationMessage id={messageId} message={error} />
    </div>
  );
}

export default function EventFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const remIdParam = searchParams.get('remId');
  const editingRemId = remIdParam ? Number(remIdParam) : null;
  const isEdit = !!editingRemId;
  const [form, setForm] = useState<EventFormState>(init);
  const [activeStep, setActiveStep] = useState<EventFormStep>('event');
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [mandals, setMandals] = useState<{ id: number; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: number; name: string }[]>([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClassesState] = useState<{ id: number; name: string }[]>([]);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | Blob | null>(null);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [validatedFields, setValidatedFields] = useState<Set<keyof EventFormState>>(() => new Set());
  const [touchedFields, setTouchedFields] = useState<Set<keyof EventFormState>>(() => new Set());
  const pendingFocusField = useRef<keyof EventFormState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitAttempted = useRef(false);

  const activeStepIndex = steps.findIndex(step => step.key === activeStep);
  const { user } = useAuth();
  const { toast } = useToast();

  const setField = (key: keyof EventFormState, value: string) => {
    setErrors(current => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm(current => ({ ...current, [key]: value }));
  };

  const setMultiField = (key: 'stIdCsv' | 'distIdsCsv' | 'mndlIdsCsv' | 'vilIdsCsv' | 'schIdsCsv' | 'classIdsCsv', ids: number[]) => {
    const csv = ids.join(',');
    setErrors(current => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm(current => {
      if (key === 'stIdCsv') {
        return { ...current, stIdCsv: csv, distIdsCsv: '', mndlIdsCsv: '', vilIdsCsv: '', schIdsCsv: '' };
      }
      if (key === 'distIdsCsv') {
        return { ...current, distIdsCsv: csv, mndlIdsCsv: '', vilIdsCsv: '', schIdsCsv: '' };
      }
      if (key === 'mndlIdsCsv') {
        return { ...current, mndlIdsCsv: csv, vilIdsCsv: '', schIdsCsv: '' };
      }
      if (key === 'vilIdsCsv') {
        return { ...current, vilIdsCsv: csv, schIdsCsv: '' };
      }
      return { ...current, [key]: csv };
    });
  };

  const touchField = (key: keyof EventFormState) => {
    setTouchedFields(prev => {
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

  const focusField = (field: keyof EventFormState) => {
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
        const statesResponse: any[] = await getStates();
        const classesResponse = await getClasses();

        const stateEntries = statesResponse
          .map((item: any) => ({ id: item.stId ?? item.st_id, name: item.stName ?? item.st_name }))
          .filter(s => !!s.id && !!s.name);
        setStates(stateEntries);

        const classEntries = classesResponse
          .map((item: any) => ({ id: item.classId ?? item.class_id, name: item.className ?? item.class_name }))
          .filter(c => !!c.id && !!c.name);
        setClassesState(classEntries);

        if (editingRemId) {
          await loadReminder(editingRemId);
        }
      } catch (error) {
        const errorLabel = error instanceof Error ? error.message : 'Unknown';
        toast(`Unable to load form data. Failed: ${errorLabel}.`, 'error');
      } finally {
        setMetaLoading(false);
      }
    };

    loadMasterData();
  }, [editingRemId, toast]);

  const parseCsv = (csv?: string | null) =>
    (csv ?? '').split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);

  const loadDistrictsFn = async (stateIds: number[]) => {
    setDistricts([]);
    setMandals([]);
    setVillages([]);
    setSchools([]);
    if (!stateIds.length) return;
    try {
      const results = await Promise.all(stateIds.map(id => getDistricts(id)));
      const map = new Map<number, string>();
      results.flat().forEach((item: any) => {
        const id = item.distId ?? item.dist_id;
        const name = item.distName ?? item.dist_name;
        if (id && name) map.set(id, name);
      });
      setDistricts(Array.from(map, ([id, name]) => ({ id, name })));
    } catch {
      toast('Unable to load districts.', 'error');
    }
  };

  const loadMandalsFn = async (districtIds: number[]) => {
    setMandals([]);
    setVillages([]);
    setSchools([]);
    if (!districtIds.length) return;
    try {
      const results = await Promise.all(districtIds.map(id => getMandals(id)));
      const map = new Map<number, string>();
      results.flat().forEach((item: any) => {
        const id = item.mndlId ?? item.mndl_id;
        const name = item.mndlName ?? item.mndl_name;
        if (id && name) map.set(id, name);
      });
      setMandals(Array.from(map, ([id, name]) => ({ id, name })));
    } catch {
      toast('Unable to load mandals.', 'error');
    }
  };

  const loadVillagesFn = async (mandalIds: number[]) => {
    setVillages([]);
    setSchools([]);
    if (!mandalIds.length) return;
    try {
      const results = await Promise.all(mandalIds.map(id => getVillages(id)));
      const map = new Map<number, string>();
      results.flat().forEach((item: any) => {
        const id = item.vilId ?? item.vil_id;
        const name = item.vilName ?? item.vil_name;
        if (id && name) map.set(id, name);
      });
      setVillages(Array.from(map, ([id, name]) => ({ id, name })));
    } catch {
      toast('Unable to load villages.', 'error');
    }
  };

  const loadSchoolsFn = async (villageIds: number[]) => {
    setSchools([]);
    if (!villageIds.length) return;
    try {
      const results = await Promise.all(villageIds.map(id => getSchools(id)));
      const map = new Map<number, string>();
      results.flat().forEach((item: any) => {
        const id = item.schId ?? item.sch_id;
        const name = item.schName ?? item.sch_name;
        if (id && name) map.set(id, name);
      });
      setSchools(Array.from(map, ([id, name]) => ({ id, name })));
    } catch {
      toast('Unable to load schools.', 'error');
    }
  };

  const stIdArray = parseCsv(form.stIdCsv);
  const distIdArray = parseCsv(form.distIdsCsv);
  const mndlIdArray = parseCsv(form.mndlIdsCsv);
  const vilIdArray = parseCsv(form.vilIdsCsv);

  useEffect(() => {
    void loadDistrictsFn(stIdArray);
  }, [form.stIdCsv]);

  useEffect(() => {
    void loadMandalsFn(distIdArray);
  }, [form.distIdsCsv]);

  useEffect(() => {
    void loadVillagesFn(mndlIdArray);
  }, [form.mndlIdsCsv]);

  useEffect(() => {
    void loadSchoolsFn(vilIdArray);
  }, [form.vilIdsCsv]);

  const loadReminder = async (remId: number) => {
    setLoading(true);
    try {
      const r = await getReminderById(remId);
      if (!r) {
        toast('Event not found.', 'error');
        return;
      }

      setForm({
        ...init,
        title: r.title ?? '',
        eventDate: r.eventDate ?? '',
        venue: r.venue ?? '',
        description: r.description ?? '',
        bannerImage: String((r as any).bannerImage ?? ''),
        stIdCsv: r.stIdCsv ?? '',
        distIdsCsv: r.distIdsCsv ?? '',
        mndlIdsCsv: r.mndlIdsCsv ?? '',
        vilIdsCsv: r.vilIdsCsv ?? '',
        schIdsCsv: r.schIdsCsv ?? '',
        classIdsCsv: r.classIdsCsv ?? '',
      });
    } catch {
      toast('Unable to load event details for editing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const namePattern = /^[A-Za-z\s]+$/;

  const buildValidationErrors = (stepKeys: EventFormStep[]) => {
    const fields = stepKeys.flatMap(step => stepRequiredFields[step]);
    const nextErrors: EventFormErrors = {};

    fields.forEach(field => {
      const value = form[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        nextErrors[field] = `${requiredFieldLabels[field] ?? field} is required`;
      }
    });

    const nameFields: (keyof EventFormState)[] = ['title', 'venue'];
    nameFields.forEach(field => {
      if (nextErrors[field]) return;
      const value = String(form[field] ?? '').trim();
      if (value.length < 2 || value.length > 100 || !namePattern.test(value)) {
        nextErrors[field] = `${requiredFieldLabels[field] ?? field} should contain only alphabets and spaces.`;
      }
    });

    if (form.eventDate) {
      const today = new Date().toISOString().split('T')[0];
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      const maxDateStr = maxDate.toISOString().split('T')[0];
      if (form.eventDate < today || form.eventDate > maxDateStr) {
        nextErrors.eventDate = 'Event date must be between today and one year from today.';
      }
    }

    return nextErrors;
  };

  const validateAndApply = (stepKeys: EventFormStep[]) => {
    const nextErrors = buildValidationErrors(stepKeys);
    const fieldsToValidate = stepKeys.flatMap(step => stepRequiredFields[step]);

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

  const clearStepValidation = (step: EventFormStep) => {
    const fields = stepRequiredFields[step];
    setErrors(current => {
      const next = { ...current };
      fields.forEach(field => {
        if (!touchedFields.has(field)) delete next[field];
      });
      return next;
    });
    setValidatedFields(current => {
      const next = new Set(current);
      fields.forEach(f => next.delete(f));
      return next;
    });
  };

  const goNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    submitAttempted.current = false;
    const nextStep = steps[Math.min(steps.length - 1, activeStepIndex + 1)].key;
    if (!validateAndApply([activeStep])) return;
    setActiveStep(nextStep);
  };

  const goBack = () => {
    setActiveStep(steps[Math.max(0, activeStepIndex - 1)].key);
  };

  const goToStep = (index: number) => {
    if (index <= activeStepIndex) {
      setActiveStep(steps[index].key);
      return;
    }
    if (index === activeStepIndex + 1) goNext();
  };

  const cancel = () => {
    if (editingRemId) navigate(-1);
    else navigate('/reminders');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (activeStep !== steps[steps.length - 1].key) return;

    submitAttempted.current = true;
    const isValid = validateAndApply(steps.map(step => step.key));
    if (!isValid) return;

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        eventDate: form.eventDate,
        venue: form.venue.trim(),
        stIdCsv: form.stIdCsv || null,
        distIdsCsv: form.distIdsCsv || null,
        mndlIdsCsv: form.mndlIdsCsv || null,
        vilIdsCsv: form.vilIdsCsv || null,
        schIdsCsv: form.schIdsCsv || null,
        classIdsCsv: form.classIdsCsv || null,
        updatedBy: user?.user_id || 1,
      };

      if (editingRemId) {
        await updateReminder(editingRemId, payload as any);
        toast('Event updated successfully.', 'success');
      } else {
        await createReminder(payload as any);
        toast('Event created successfully.', 'success');
      }
      navigate('/reminders');
      navigate('/reminders');
    } catch (error) {
      let serverMessage = '';
      if (axios.isAxiosError(error)) {
        const data: any = error.response?.data;
        serverMessage = String(data?.message ?? data?.error ?? data?.detail ?? '').trim();
      }
      toast(serverMessage ? `Unable to save event: ${serverMessage}` : 'Unable to save event. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedBannerFile(file);
    setField('bannerImage', URL.createObjectURL(file));
    e.target.value = '';
  };

  const title = isEdit ? 'Edit Event' : 'Add Event';

  const getFieldState = (key: keyof EventFormState): FieldState => {
    const touched = touchedFields.has(key);
    if (errors[key] && (touched || validatedFields.has(key))) return 'error';
    if (!errors[key] && validatedFields.has(key) && String(form[key] ?? '').trim()) return 'success';
    return 'default';
  };

  const showMessage = (key: keyof EventFormState) => {
    if (fieldStepMap[key] === 'location' && !submitAttempted.current) return false;
    return Boolean(errors[key]) && (touchedFields.has(key) || validatedFields.has(key));
  };

  return (
    <form ref={formRef} className="studentWizardForm" onSubmit={submit} noValidate>
      <div className="studentWizardHeader">
        <div className="studentWizardHeaderTop">
          <div className="studentWizardHeaderLeft">
            <h2>{title}</h2>
          </div>
          <button type="button" className="studentWizardClose" onClick={cancel} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="studentStepIndicator" aria-label="Event form steps" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
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

      <FormContainer>
        {activeStep === 'event' ? (
          <FormSection title="Event Details" step="1">
            <div className="formGrid studentStepGrid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              <div>
                <Field
                  fieldKey="title"
                  label="Event Name *"
                  value={form.title}
                  onChange={v => setField('title', v)}
                  onBlur={() => touchField('title')}
                  error={showMessage('title') ? errors.title : undefined}
                  state={getFieldState('title')}
                  alphabeticOnly
                />
              </div>
              <div>
                <Field
                  fieldKey="eventDate"
                  label="Event Date *"
                  type="date"
                  value={form.eventDate}
                  onChange={v => setField('eventDate', v)}
                  error={showMessage('eventDate') ? errors.eventDate : undefined}
                  state={getFieldState('eventDate')}
                  htmlMin={new Date().toISOString().split('T')[0]}
                  htmlMax={(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })()}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Field
                  fieldKey="venue"
                  label="Venue *"
                  value={form.venue}
                  onChange={v => setField('venue', v)}
                  onBlur={() => touchField('venue')}
                  error={showMessage('venue') ? errors.venue : undefined}
                  state={getFieldState('venue')}
                  alphabeticOnly
                />
              </div>
              <div style={{ gridColumn: 'span 4' }}>
                <div className="field">
                  <textarea
                    id="event-field-description"
                    data-field="description"
                    className="textarea"
                    placeholder="Description"
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                  />
                </div>
              </div>
              <div className="field studentPhotoField">
                <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                  </svg>
                </span>Event Banner</h3>
                <div className="uploadBox studentModalUpload">
                  <div className="studentModalUploadPreview">
                    {form.bannerImage ? <img src={form.bannerImage} alt="Banner" /> : null}
                    {form.bannerImage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        className="iconBtn uploadDeleteBtn"
                        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setField('bannerImage', ''); setSelectedBannerFile(null); }}
                        aria-label="Remove banner image"
                        title="Remove banner"
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
                    <span>{form.bannerImage ? '' : 'Upload banner image'}</span>
                  </div>
                  <div className="rowFlex studentModalUploadActions">
                    <label className="btn outline md studentModalUploadButton">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17,8 12,3 7,8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      Upload Banner
                      <input accept="image/*" type="file" onChange={handleBannerChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        ) : null}

        {activeStep === 'location' ? (
          <FormSection title="Location" step="2">
            <div className="formGrid studentStepGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <LocationMultiSelect
                fieldKey="stIdCsv"
                label="State *"
                options={states}
                selectedIds={stIdArray}
                onChange={ids => setMultiField('stIdCsv', ids)}
                error={showMessage('stIdCsv') ? errors.stIdCsv : undefined}
                state={getFieldState('stIdCsv')}
              />
              <LocationMultiSelect
                fieldKey="distIdsCsv"
                label="District"
                options={districts}
                selectedIds={distIdArray}
                onChange={ids => setMultiField('distIdsCsv', ids)}
                error={showMessage('distIdsCsv') ? errors.distIdsCsv : undefined}
                state={getFieldState('distIdsCsv')}
              />
              <LocationMultiSelect
                fieldKey="mndlIdsCsv"
                label="Mandal"
                options={mandals}
                selectedIds={mndlIdArray}
                onChange={ids => setMultiField('mndlIdsCsv', ids)}
                error={showMessage('mndlIdsCsv') ? errors.mndlIdsCsv : undefined}
                state={getFieldState('mndlIdsCsv')}
              />
              <LocationMultiSelect
                fieldKey="vilIdsCsv"
                label="Village"
                options={villages}
                selectedIds={vilIdArray}
                onChange={ids => setMultiField('vilIdsCsv', ids)}
                error={showMessage('vilIdsCsv') ? errors.vilIdsCsv : undefined}
                state={getFieldState('vilIdsCsv')}
              />
              <LocationMultiSelect
                fieldKey="schIdsCsv"
                label="School"
                options={schools}
                selectedIds={parseCsv(form.schIdsCsv)}
                onChange={ids => setMultiField('schIdsCsv', ids)}
                error={showMessage('schIdsCsv') ? errors.schIdsCsv : undefined}
                state={getFieldState('schIdsCsv')}
              />
              <LocationMultiSelect
                fieldKey="classIdsCsv"
                label="Classes"
                options={classes}
                selectedIds={parseCsv(form.classIdsCsv)}
                onChange={ids => setMultiField('classIdsCsv', ids)}
                error={showMessage('classIdsCsv') ? errors.classIdsCsv : undefined}
                state={getFieldState('classIdsCsv')}
              />
            </div>
          </FormSection>
        ) : null}
      </FormContainer>

      <div className="studentWizardActions" aria-label="Form actions">
        {activeStep === steps[steps.length - 1].key ? (
          <PrimaryButton loading={loading || metaLoading} className="btn btnGreen">{isEdit ? 'Save Changes' : 'Create Event'}</PrimaryButton>
        ) : (
          <PrimaryButton type="button" className="btn btnGreen" onClick={goNext} disabled={metaLoading}>Next</PrimaryButton>
        )}
        {activeStep === steps[0].key ? (
          <SecondaryButton type="button" className="btn btnRed" onClick={cancel}>Cancel</SecondaryButton>
        ) : (
          <SecondaryButton type="button" className="btn btnRed" onClick={goBack}>Back</SecondaryButton>
        )}
      </div>
    </form>
  );
}
