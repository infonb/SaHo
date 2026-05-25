import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { getDistricts, getMandals, getSchools, getStates, getVillages } from '../../api/locationApi';
import { getClasses } from '../../api/masterApi';
import { createReminder, getReminderById, updateReminder } from '../../api/remindersApi';

// Form state interface
interface EventFormState {
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  stateId: string;
  districtIds: number[];
  mandalIds: number[];
  villageIds: number[];
  schoolIds: number[];
  classIds: number[];
}

// Multi-select checkbox component
interface MultiSelectProps {
  label: string;
  options: { id: number; name: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

function MultiSelect({ label, options, selectedIds, onChange, placeholder = 'Select options' }: MultiSelectProps) {
  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.id));
    }
  };

  return (
    <div className="multi-select-container">
      <label className="form-label">{label}</label>
      {options.length === 0 ? (
        <p className="text-muted">No options available</p>
      ) : (
        <div className="multi-select-wrapper">
          <div className="multi-select-header">
            <button type="button" className="select-all-btn" onClick={handleSelectAll}>
              {selectedIds.length === options.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="selected-count">
              {selectedIds.length} selected
            </span>
          </div>
          <div className="multi-select-options">
            {options.map(option => (
              <label key={option.id} className="multi-select-option">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                />
                <span>{option.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const initialFormState: EventFormState = {
  title: '',
  description: '',
  eventDate: '',
  venue: '',
  stateId: '',
  districtIds: [],
  mandalIds: [],
  villageIds: [],
  schoolIds: [],
  classIds: [],
};

export default function CreateEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const remIdParam = searchParams.get('remId');
  const editingRemId = remIdParam ? Number(remIdParam) : null;
  const [form, setForm] = useState<EventFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [classes, setClassesState] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    getStates().then(data => { if (mounted) setStates(data); }).catch(() => {});
    getClasses().then(data => {
      if (!mounted) return;
      setClassesState(data.map(c => ({ id: c.classId, name: c.className })));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!editingRemId) return;
    let mounted = true;
    setLoading(true);
    getReminderById(editingRemId)
      .then(r => {
        if (!mounted || !r) return;
        const parseCsv = (csv?: string | null) =>
          (csv ?? '').split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);

        setForm({
          ...initialFormState,
          title: r.title ?? '',
          description: r.description ?? '',
          eventDate: r.eventDate ?? '',
          venue: r.venue ?? '',
          stateId: (r.stIdCsv ?? '').split(',')[0] ?? '',
          districtIds: parseCsv(r.distIdsCsv),
          mandalIds: parseCsv(r.mndlIdsCsv),
          villageIds: parseCsv(r.vilIdsCsv),
          schoolIds: parseCsv(r.schIdsCsv),
          classIds: parseCsv(r.classIdsCsv),
        });
      })
      .catch((e) => console.error('Failed to load reminder', e))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [editingRemId]);

  useEffect(() => {
    if (!form.stateId) {
      setDistricts([]);
      return;
    }
    getDistricts(Number(form.stateId)).then(d => setDistricts(d)).catch(() => setDistricts([]));
  }, [form.stateId]);

  useEffect(() => {
    if (form.districtIds.length !== 1) {
      setMandals([]);
      return;
    }
    getMandals(form.districtIds[0]).then(m => setMandals(m)).catch(() => setMandals([]));
  }, [form.districtIds]);

  useEffect(() => {
    if (form.mandalIds.length !== 1) {
      setVillages([]);
      return;
    }
    getVillages(form.mandalIds[0]).then(v => setVillages(v)).catch(() => setVillages([]));
  }, [form.mandalIds]);

  useEffect(() => {
    if (form.villageIds.length !== 1) {
      setSchools([]);
      return;
    }
    getSchools(form.villageIds[0]).then(s => setSchools(s)).catch(() => setSchools([]));
  }, [form.villageIds]);

  // Handlers
  const handleInputChange = (key: keyof EventFormState, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(e => ({ ...e, [key]: '' }));
    }
  };

  const handleMultiSelectChange = (key: keyof EventFormState, value: number[]) => {
    setForm(f => ({ ...f, [key]: value }));
    // Clear dependent selections when parent changes
    if (key === 'districtIds') {
      setForm(f => ({ ...f, districtIds: value, mandalIds: [], villageIds: [], schoolIds: [] }));
    } else if (key === 'mandalIds') {
      setForm(f => ({ ...f, mandalIds: value, villageIds: [], schoolIds: [] }));
    } else if (key === 'villageIds') {
      setForm(f => ({ ...f, villageIds: value, schoolIds: [] }));
    }
  };

  const handleStateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setForm(f => ({
      ...f,
      stateId: value,
      districtIds: [],
      mandalIds: [],
      villageIds: [],
      schoolIds: [],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    if (!form.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }
    if (!form.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const toCsv = (ids: number[]) => (ids.length ? ids.join(',') : null);
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || null,
        eventDate: form.eventDate,
        venue: form.venue.trim(),
        stIdCsv: form.stateId ? String(form.stateId) : null,
        distIdsCsv: toCsv(form.districtIds),
        mndlIdsCsv: toCsv(form.mandalIds),
        vilIdsCsv: toCsv(form.villageIds),
        schIdsCsv: toCsv(form.schoolIds),
        classIdsCsv: toCsv(form.classIds),
        updatedBy: 1,
      };
      if (editingRemId) {
        await updateReminder(editingRemId, payload);
      } else {
        await createReminder(payload);
      }
      navigate('/reminders/view');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Create Event"
        subtitle="Create a new event for student and community engagement"
      />

      <div className="panel">
        <form onSubmit={handleSubmit} className="event-form">
          {/* Event Details Section */}
          <section className="form-section">
            <h3 className="section-title">Event Details</h3>

            <div className="form-grid">
              {/* Event Title */}
              <div className="form-group">
                <label className="form-label required">Event Title</label>
                <input
                  type="text"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              {/* Event Date */}
              <div className="form-group">
                <label className="form-label required">Event Date</label>
                <input
                  type="date"
                  className={`form-input ${errors.eventDate ? 'error' : ''}`}
                  value={form.eventDate}
                  onChange={e => handleInputChange('eventDate', e.target.value)}
                />
                {errors.eventDate && <span className="form-error">{errors.eventDate}</span>}
              </div>

              {/* Venue */}
              <div className="form-group">
                <label className="form-label required">Venue</label>
                <input
                  type="text"
                  className={`form-input ${errors.venue ? 'error' : ''}`}
                  placeholder="Enter venue location"
                  value={form.venue}
                  onChange={e => handleInputChange('venue', e.target.value)}
                />
                {errors.venue && <span className="form-error">{errors.venue}</span>}
              </div>

              {/* Description */}
              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Enter event description"
                  rows={4}
                  value={form.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Location Hierarchy Section */}
          <section className="form-section">
            <h3 className="section-title">Location Selection</h3>
            <p className="section-subtitle">
              Select the target locations for this event. You can select multiple districts, mandals, villages, and schools.
            </p>

            <div className="form-grid">
              {/* State Dropdown */}
              <div className="form-group">
                <label className="form-label">State</label>
                <select
                  className="form-input"
                  value={form.stateId}
                  onChange={handleStateChange}
                >
                  <option value="">Select State</option>
                  {states.map((state: any) => (
                    <option key={state.stId ?? state.st_id} value={state.stId ?? state.st_id}>
                      {state.stName ?? state.st_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Districts Multi-Select */}
              <div className="form-group">
                <MultiSelect
                  label="Districts"
                  options={districts.map((d: any) => ({ id: d.distId ?? d.dist_id, name: d.distName ?? d.dist_name }))}
                  selectedIds={form.districtIds}
                  onChange={ids => handleMultiSelectChange('districtIds', ids)}
                  placeholder="Select districts"
                />
              </div>

              {/* Mandals Multi-Select */}
              <div className="form-group">
                <MultiSelect
                  label="Mandals"
                  options={mandals.map((m: any) => ({ id: m.mndlId ?? m.mndl_id, name: m.mndlName ?? m.mndl_name }))}
                  selectedIds={form.mandalIds}
                  onChange={ids => handleMultiSelectChange('mandalIds', ids)}
                  placeholder="Select mandals"
                />
              </div>

              {/* Villages Multi-Select */}
              <div className="form-group">
                <MultiSelect
                  label="Villages"
                  options={villages.map((v: any) => ({ id: v.vilId ?? v.vil_id, name: v.vilName ?? v.vil_name }))}
                  selectedIds={form.villageIds}
                  onChange={ids => handleMultiSelectChange('villageIds', ids)}
                  placeholder="Select villages"
                />
              </div>

              {/* Schools Multi-Select */}
              <div className="form-group">
                <MultiSelect
                  label="Schools"
                  options={schools.map((s: any) => ({ id: s.schId ?? s.sch_id, name: s.schName ?? s.sch_name }))}
                  selectedIds={form.schoolIds}
                  onChange={ids => handleMultiSelectChange('schoolIds', ids)}
                  placeholder="Select schools"
                />
              </div>

              <div className="form-group full-width">
                <MultiSelect
                  label="Classes"
                  options={classes}
                  selectedIds={form.classIds}
                  onChange={ids => handleMultiSelectChange('classIds', ids)}
                  placeholder="Select classes"
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {editingRemId ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>

      {/* Additional CSS for this component */}
      <style>{`
        .event-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-section {
          background: var(--color-surface);
          border-radius: var(--r-lg);
          padding: 24px;
          border: 1px solid var(--color-border);
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 8px 0;
          font-family: var(--font-display);
        }

        .section-subtitle {
          font-size: 14px;
          color: var(--color-text3);
          margin: 0 0 20px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text2);
        }

        .form-label.required::after {
          content: ' *';
          color: var(--red);
        }

        .form-input {
          padding: 10px 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--r-md);
          font-size: 14px;
          color: var(--color-text);
          background: var(--color-surface);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .form-input.error {
          border-color: var(--red);
        }

        .form-input::placeholder {
          color: var(--color-muted);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-error {
          font-size: 12px;
          color: var(--red);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 8px;
        }

        /* Multi-select styles */
        .multi-select-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .multi-select-wrapper {
          border: 1px solid var(--color-border);
          border-radius: var(--r-md);
          overflow: hidden;
        }

        .multi-select-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: var(--br-50);
          border-bottom: 1px solid var(--color-border);
        }

        .select-all-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .select-all-btn:hover {
          text-decoration: underline;
        }

        .selected-count {
          font-size: 12px;
          color: var(--color-text3);
        }

        .multi-select-options {
          max-height: 200px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .multi-select-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text2);
          transition: background 0.15s;
        }

        .multi-select-option:hover {
          background: var(--br-50);
        }

        .multi-select-option input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--color-primary);
          cursor: pointer;
        }

        .text-muted {
          font-size: 13px;
          color: var(--color-muted);
          font-style: italic;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
