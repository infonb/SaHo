import { type ComponentProps, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import { getDistricts, getMandals, getSchools, getStates, getVillages } from '../../api/locationApi';
import { getClasses } from '../../api/masterApi';
import { createReminder, getReminderById, updateReminder, type ReminderDto } from '../../api/remindersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import '../../styles/Reminders/EventFormPage.css';
import { HiOutlineXMark } from 'react-icons/hi2';
import { LuImage, LuUpload } from 'react-icons/lu';

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
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type EventFormErrors = Partial<Record<keyof EventFormState, string>>;
type EventLocationOptions = {
  states?: any[];
  districts?: any[];
  mandals?: any[];
  villages?: any[];
  schools?: any[];
  classes?: any[];
};

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
  status: '',
  createdBy: '',
  createdAt: '',
  updatedAt: '',
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

const formatEventStatus = (status?: boolean | null) => {
  if (status === false) return 'Cancelled';
  if (status === true) return 'Active';
  return '';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const mapLocationOption = (item: any, idKeys: string[], nameKeys: string[]) => {
  const id = idKeys.map(key => item?.[key]).find(value => value !== undefined && value !== null && value !== '');
  const name = nameKeys.map(key => item?.[key]).find(value => value !== undefined && value !== null && String(value).trim() !== '');
  return id && name ? { id: Number(id), name: String(name) } : null;
};

const uniqueOptions = (options: { id: number; name: string }[]) =>
  Array.from(new Map(options.filter(option => option.id && option.name).map(option => [option.id, option])).values());

const csvFromIds = (ids: number[]) => Array.from(new Set(ids.filter(Boolean))).join(',');

const reminderToForm = (r: ReminderDto): EventFormState => ({
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
  status: formatEventStatus(r.status),
  createdBy: r.createdBy ? String(r.createdBy) : '',
  createdAt: formatDateTime(r.createdAt),
  updatedAt: formatDateTime(r.updatedAt),
});

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
        disabled={readOnly}
        aria-label={placeholder}
        aria-readonly={readOnly || undefined}
        aria-invalid={state === 'error' || undefined}
        aria-describedby={error ? messageId : undefined}
        tabIndex={readOnly ? -1 : undefined}
        type={readOnly ? 'text' : type}
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


function LocationMultiSelect({ fieldKey, label, options, selectedIds, onChange, error, state = 'default', readOnly = false }: {
  fieldKey: string;
  label: string;
  options: { id: number; name: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  state?: FieldState;
  readOnly?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (readOnly) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event.target instanceof Node && details.contains(event.target)) return;
      details.removeAttribute('open');
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [readOnly]);

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
  const selectedNames = selectedIds.map(id => options.find(o => o.id === id)?.name ?? String(id));
  const summary = readOnly
    ? selectedNames.join(', ') || '-'
    : selectedIds.length === 0
    ? `Select ${cleanLabel}`
    : selectedIds.length === 1
    ? selectedNames[0] ?? '1 selected'
    : `${selectedIds.length} selected`;

  if (readOnly) {
    return (
      <div className={`field formField has-${state}`}>
        <input
          id={inputId}
          data-field={fieldKey}
          className="input readonlyField"
          value={summary}
          readOnly
          disabled
          aria-label={cleanLabel}
        />
        <ValidationMessage id={messageId} message={error} />
      </div>
    );
  }

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
          aria-disabled={readOnly || undefined}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={error ? messageId : undefined}
          onClick={(event) => {
            event.preventDefault();
            if (readOnly) return;
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
        {!readOnly ? <div className="multiSelectMenu">
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
        </div> : null}
      </details>
      <ValidationMessage id={messageId} message={error} />
    </div>
  );
}

export default function EventFormPage({
  embedded = false,
  mode,
  eventId,
  eventSnapshot,
  onCancel,
  locationOptions,
}: {
  embedded?: boolean;
  mode?: 'create' | 'edit' | 'view';
  eventId?: number;
  eventSnapshot?: ReminderDto | null;
  onCancel?: () => void;
  locationOptions?: EventLocationOptions;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const remIdParam = searchParams.get('remId');
  const routeRemId = id ? Number(id) : null;
  const editingRemId = eventId ?? (remIdParam ? Number(remIdParam) : routeRemId);
  const isView = mode === 'view';
  const isEdit = !isView && !!editingRemId;
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
  const locationResolveKey = useRef('');

  const activeStepIndex = steps.findIndex(step => step.key === activeStep);
  const { user } = useAuth();
  const { toast } = useToast();
  const routeEventSnapshot = (location.state as { eventSnapshot?: ReminderDto } | null)?.eventSnapshot;
  const effectiveEventSnapshot = eventSnapshot ?? routeEventSnapshot ?? null;

  const setField = (key: keyof EventFormState, value: string) => {
    if (isView) return;
    setErrors(current => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm(current => ({ ...current, [key]: value }));
  };

  const setMultiField = (key: 'stIdCsv' | 'distIdsCsv' | 'mndlIdsCsv' | 'vilIdsCsv' | 'schIdsCsv' | 'classIdsCsv', ids: number[]) => {
    if (isView) return;
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
    if (isView) return;
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

        if (effectiveEventSnapshot) {
          setForm(reminderToForm(effectiveEventSnapshot));
        } else if (editingRemId) {
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
  }, [editingRemId, effectiveEventSnapshot, toast]);

  useEffect(() => {
    if (!isView || !locationOptions) return;

    const nextStates = uniqueOptions([
      ...states,
      ...(locationOptions.states ?? [])
        .map((item) => mapLocationOption(item, ['id', 'stId', 'st_id'], ['name', 'stName', 'st_name']))
        .filter(Boolean) as { id: number; name: string }[],
    ]);
    const nextDistricts = uniqueOptions([
      ...districts,
      ...(locationOptions.districts ?? [])
        .map((item) => mapLocationOption(item, ['id', 'distId', 'dist_id'], ['name', 'distName', 'dist_name']))
        .filter(Boolean) as { id: number; name: string }[],
    ]);
    const nextMandals = uniqueOptions([
      ...mandals,
      ...(locationOptions.mandals ?? [])
        .map((item) => mapLocationOption(item, ['id', 'mndlId', 'mndl_id'], ['name', 'mndlName', 'mndl_name']))
        .filter(Boolean) as { id: number; name: string }[],
    ]);
    const nextVillages = uniqueOptions([
      ...villages,
      ...(locationOptions.villages ?? [])
        .map((item) => mapLocationOption(item, ['id', 'vilId', 'vil_id'], ['name', 'vilName', 'vil_name']))
        .filter(Boolean) as { id: number; name: string }[],
    ]);
    const nextSchools = uniqueOptions([
      ...schools,
      ...(locationOptions.schools ?? [])
        .map((item) => mapLocationOption(item, ['id', 'schId', 'sch_id'], ['name', 'schName', 'sch_name']))
        .filter(Boolean) as { id: number; name: string }[],
    ]);
    const nextClasses = uniqueOptions([
      ...classes,
      ...(locationOptions.classes ?? [])
        .map((item) => mapLocationOption(item, ['id', 'classId', 'class_id'], ['name', 'className', 'class_name']))
        .filter(Boolean) as { id: number; name: string }[],
    ]);

    setStates(nextStates);
    setDistricts(nextDistricts);
    setMandals(nextMandals);
    setVillages(nextVillages);
    setSchools(nextSchools);
    setClassesState(nextClasses);
  }, [isView, locationOptions]);

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
    if ((isView || isEdit) && !stIdArray.length) return;
    void loadDistrictsFn(stIdArray);
  }, [form.stIdCsv, isView, isEdit]);

  useEffect(() => {
    if ((isView || isEdit) && !distIdArray.length) return;
    void loadMandalsFn(distIdArray);
  }, [form.distIdsCsv, isView, isEdit]);

  useEffect(() => {
    if ((isView || isEdit) && !mndlIdArray.length) return;
    void loadVillagesFn(mndlIdArray);
  }, [form.mndlIdsCsv, isView, isEdit]);

  useEffect(() => {
    if ((isView || isEdit) && !vilIdArray.length) return;
    void loadSchoolsFn(vilIdArray);
  }, [form.vilIdsCsv, isView, isEdit]);

  useEffect(() => {
    if ((!isView && !isEdit) || metaLoading || loading) return;

    const resolveKey = [
      form.stIdCsv,
      form.distIdsCsv,
      form.mndlIdsCsv,
      form.vilIdsCsv,
      form.schIdsCsv,
      states.map(item => item.id).join(','),
    ].join('|');
    if (locationResolveKey.current === resolveKey) return;
    locationResolveKey.current = resolveKey;

    const hasMissing = (ids: number[], options: { id: number; name: string }[]) =>
      ids.some(id => !options.some(option => option.id === id));

    const resolveLocationNames = async () => {
      try {
        const wantedStates = parseCsv(form.stIdCsv);
        const wantedDistricts = parseCsv(form.distIdsCsv);
        const wantedMandals = parseCsv(form.mndlIdsCsv);
        const wantedVillages = parseCsv(form.vilIdsCsv);
        const wantedSchools = parseCsv(form.schIdsCsv);

        const districtToState = new Map<number, number>();
        const mandalToDistrict = new Map<number, number>();
        const villageToMandal = new Map<number, number>();
        const schoolToVillage = new Map<number, number>();

        let nextDistricts = districts;
        const needsDistricts = Boolean(
          states.length
          && (!nextDistricts.length || hasMissing(wantedDistricts, nextDistricts) || wantedMandals.length || wantedVillages.length || wantedSchools.length)
        );
        if (needsDistricts) {
          const districtResults = await Promise.all(states.map(state => getDistricts(state.id)));
          districtResults.flat().forEach((item: any) => {
            const districtId = Number(item?.distId ?? item?.dist_id);
            const stateId = Number(item?.stId ?? item?.st_id);
            if (districtId && stateId) districtToState.set(districtId, stateId);
          });
          nextDistricts = uniqueOptions([
            ...nextDistricts,
            ...districtResults.flat()
              .map((item: any) => mapLocationOption(item, ['id', 'distId', 'dist_id'], ['name', 'distName', 'dist_name']))
              .filter(Boolean) as { id: number; name: string }[],
          ]);
          setDistricts(nextDistricts);
        }

        let nextMandals = mandals;
        const needsMandals = Boolean(
          nextDistricts.length
          && (!nextMandals.length || hasMissing(wantedMandals, nextMandals) || wantedVillages.length || wantedSchools.length)
        );
        if (needsMandals) {
          const districtIds = uniqueOptions(nextDistricts).map(district => district.id);
          const mandalResults = await Promise.all(districtIds.map(districtId => getMandals(districtId)));
          mandalResults.flat().forEach((item: any) => {
            const mandalId = Number(item?.mndlId ?? item?.mndl_id);
            const districtId = Number(item?.distId ?? item?.dist_id);
            if (mandalId && districtId) mandalToDistrict.set(mandalId, districtId);
          });
          nextMandals = uniqueOptions([
            ...nextMandals,
            ...mandalResults.flat()
              .map((item: any) => mapLocationOption(item, ['id', 'mndlId', 'mndl_id'], ['name', 'mndlName', 'mndl_name']))
              .filter(Boolean) as { id: number; name: string }[],
          ]);
          setMandals(nextMandals);
        }

        let nextVillages = villages;
        const needsVillages = Boolean(
          nextMandals.length
          && (!nextVillages.length || hasMissing(wantedVillages, nextVillages) || wantedSchools.length)
        );
        if (needsVillages) {
          const mandalIds = uniqueOptions(nextMandals).map(mandal => mandal.id);
          const villageResults = await Promise.all(mandalIds.map(mandalId => getVillages(mandalId)));
          villageResults.flat().forEach((item: any) => {
            const villageId = Number(item?.vilId ?? item?.vil_id);
            const mandalId = Number(item?.mndlId ?? item?.mndl_id);
            if (villageId && mandalId) villageToMandal.set(villageId, mandalId);
          });
          nextVillages = uniqueOptions([
            ...nextVillages,
            ...villageResults.flat()
              .map((item: any) => mapLocationOption(item, ['id', 'vilId', 'vil_id'], ['name', 'vilName', 'vil_name']))
              .filter(Boolean) as { id: number; name: string }[],
          ]);
          setVillages(nextVillages);
        }

        let nextSchools = schools;
        const needsSchools = Boolean(
          nextVillages.length
          && (!nextSchools.length || hasMissing(wantedSchools, nextSchools))
        );
        if (needsSchools) {
          const villageIds = uniqueOptions(nextVillages).map(village => village.id);
          const schoolResults = await Promise.all(villageIds.map(villageId => getSchools(villageId)));
          schoolResults.flat().forEach((item: any) => {
            const schoolId = Number(item?.schId ?? item?.sch_id);
            const villageId = Number(item?.vilId ?? item?.vil_id);
            if (schoolId && villageId) schoolToVillage.set(schoolId, villageId);
          });
          nextSchools = uniqueOptions([
            ...nextSchools,
            ...schoolResults.flat()
              .map((item: any) => mapLocationOption(item, ['id', 'schId', 'sch_id'], ['name', 'schName', 'sch_name']))
              .filter(Boolean) as { id: number; name: string }[],
          ]);
          setSchools(nextSchools);
        }

        const derivedVillageIds = [
          ...wantedVillages,
          ...wantedSchools.map(schoolId => schoolToVillage.get(schoolId)).filter(Boolean) as number[],
        ];
        const derivedMandalIds = [
          ...wantedMandals,
          ...derivedVillageIds.map(villageId => villageToMandal.get(villageId)).filter(Boolean) as number[],
        ];
        const derivedDistrictIds = [
          ...wantedDistricts,
          ...derivedMandalIds.map(mandalId => mandalToDistrict.get(mandalId)).filter(Boolean) as number[],
        ];
        const derivedStateIds = [
          ...wantedStates,
          ...derivedDistrictIds.map(districtId => districtToState.get(districtId)).filter(Boolean) as number[],
        ];

        setForm(current => ({
          ...current,
          stIdCsv: current.stIdCsv || csvFromIds(derivedStateIds),
          distIdsCsv: current.distIdsCsv || csvFromIds(derivedDistrictIds),
          mndlIdsCsv: current.mndlIdsCsv || csvFromIds(derivedMandalIds),
          vilIdsCsv: current.vilIdsCsv || csvFromIds(derivedVillageIds),
        }));
      } catch (error) {
        console.error('[EventFormPage] Unable to resolve location names for view mode', error);
      }
    };

    void resolveLocationNames();
    }, [
    isView,
    isEdit,
    metaLoading,
    loading,
    form.stIdCsv,
    form.distIdsCsv,
    form.mndlIdsCsv,
    form.vilIdsCsv,
    form.schIdsCsv,
    states,
  ]);

  const loadReminder = async (remId: number) => {
    setLoading(true);
    try {
      const r = await getReminderById(remId);
      if (!r) {
        toast('Event not found.', 'error');
        return;
      }

      setForm(reminderToForm(r));
    } catch {
      toast(isView ? 'Unable to load event details.' : 'Unable to load event details for editing.', 'error');
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
    if (isView) {
      setActiveStep(steps[Math.min(steps.length - 1, activeStepIndex + 1)].key);
      return;
    }
    submitAttempted.current = false;
    const nextStep = steps[Math.min(steps.length - 1, activeStepIndex + 1)].key;
    if (!validateAndApply([activeStep])) return;
    setActiveStep(nextStep);
  };

  const goBack = () => {
    setActiveStep(steps[Math.max(0, activeStepIndex - 1)].key);
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
    if (onCancel) {
      onCancel();
      return;
    }
    if (editingRemId) navigate(-1);
    else navigate('/reminders');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isView) return;
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
    if (isView) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedBannerFile(file);
    setField('bannerImage', URL.createObjectURL(file));
    e.target.value = '';
  };

  const title = isView ? 'View Event' : isEdit ? 'Edit Event' : 'Add Event';

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
    <form ref={formRef} className={`studentWizardForm${embedded ? ' isEmbedded' : ''}${isView ? ' isViewMode' : ''}`} onSubmit={submit} noValidate>
      <div className="studentWizardHeader">
        <div className="studentWizardHeaderTop">
          <div className="studentWizardHeaderLeft">
            <h2>{title}</h2>
          </div>
          <button type="button" className="studentWizardClose" onClick={cancel} aria-label="Close">
            <HiOutlineXMark />
          </button>
        </div>
        <div className="studentStepIndicator" aria-label="Event form steps" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
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
                  readOnly={isView}
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
                  readOnly={isView}
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
                  readOnly={isView}
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
                    value={isView ? (form.description || '-') : form.description}
                    readOnly={isView}
                    disabled={isView}
                    onChange={e => setField('description', e.target.value)}
                  />
                </div>
              </div>
              {isView ? (
                <>
                  <div>
                    <Field
                      fieldKey="status"
                      label="Status"
                      value={form.status}
                      onChange={v => setField('status', v)}
                      readOnly
                    />
                  </div>
                  <div>
                    <Field
                      fieldKey="createdBy"
                      label="Created By"
                      value={form.createdBy}
                      onChange={v => setField('createdBy', v)}
                      readOnly
                    />
                  </div>
                  <div>
                    <Field
                      fieldKey="createdAt"
                      label="Created At"
                      value={form.createdAt}
                      onChange={v => setField('createdAt', v)}
                      readOnly
                    />
                  </div>
                  <div>
                    <Field
                      fieldKey="updatedAt"
                      label="Updated At"
                      value={form.updatedAt}
                      onChange={v => setField('updatedAt', v)}
                      readOnly
                    />
                  </div>
                </>
              ) : null}
              <div className="field studentPhotoField">
                <h3 className="studentStepTitle isSubsection"><span className="studentStepIcon">
                  <LuImage size={20} />
                </span>Event Banner</h3>
                <div className="uploadBox studentModalUpload">
                  <div className="studentModalUploadPreview">
                    {form.bannerImage ? <img src={form.bannerImage} alt="Banner" /> : null}
                    {form.bannerImage && !isView ? (
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
                  {!isView ? <div className="rowFlex studentModalUploadActions">
                    <label className="btn outline md studentModalUploadButton">
                      <LuUpload size={20}/>
                      Upload Banner
                      <input accept="image/*" type="file" onChange={handleBannerChange} style={{ display: 'none' }} />
                    </label>
                  </div> : null}
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
                readOnly={isView}
              />
              <LocationMultiSelect
                fieldKey="distIdsCsv"
                label="District"
                options={districts}
                selectedIds={distIdArray}
                onChange={ids => setMultiField('distIdsCsv', ids)}
                error={showMessage('distIdsCsv') ? errors.distIdsCsv : undefined}
                state={getFieldState('distIdsCsv')}
                readOnly={isView}
              />
              <LocationMultiSelect
                fieldKey="mndlIdsCsv"
                label="Mandal"
                options={mandals}
                selectedIds={mndlIdArray}
                onChange={ids => setMultiField('mndlIdsCsv', ids)}
                error={showMessage('mndlIdsCsv') ? errors.mndlIdsCsv : undefined}
                state={getFieldState('mndlIdsCsv')}
                readOnly={isView}
              />
              <LocationMultiSelect
                fieldKey="vilIdsCsv"
                label="Village"
                options={villages}
                selectedIds={vilIdArray}
                onChange={ids => setMultiField('vilIdsCsv', ids)}
                error={showMessage('vilIdsCsv') ? errors.vilIdsCsv : undefined}
                state={getFieldState('vilIdsCsv')}
                readOnly={isView}
              />
              <LocationMultiSelect
                fieldKey="schIdsCsv"
                label="School"
                options={schools}
                selectedIds={parseCsv(form.schIdsCsv)}
                onChange={ids => setMultiField('schIdsCsv', ids)}
                error={showMessage('schIdsCsv') ? errors.schIdsCsv : undefined}
                state={getFieldState('schIdsCsv')}
                readOnly={isView}
              />
              <LocationMultiSelect
                fieldKey="classIdsCsv"
                label="Classes"
                options={classes}
                selectedIds={parseCsv(form.classIdsCsv)}
                onChange={ids => setMultiField('classIdsCsv', ids)}
                error={showMessage('classIdsCsv') ? errors.classIdsCsv : undefined}
                state={getFieldState('classIdsCsv')}
                readOnly={isView}
              />
            </div>
          </FormSection>
        ) : null}
      </FormContainer>

      {!isView ? <div className="studentWizardActions" aria-label="Form actions">
        {activeStep === steps[steps.length - 1].key ? (
            <Button loading={loading || metaLoading} className="btnGreen">{isEdit ? 'Save Changes' : 'Create Event'}</Button>
        ) : (
          <Button type="button" className="btnGreen" onClick={goNext} disabled={metaLoading}>Next</Button>
        )}
        {activeStep === steps[0].key ? (
          <SecondaryButton type="button" className="btnRed" onClick={cancel}>Cancel</SecondaryButton>
        ) : (
           <SecondaryButton type="button" className="btnRed" onClick={goBack}>Back</SecondaryButton>
        )}
      </div> : null}
    </form>
  );
}
