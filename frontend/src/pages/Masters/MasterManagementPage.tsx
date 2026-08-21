import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  checkMasterDependencies,
  createMaster,
  deleteMaster,
  getMasterDetail,
  getMasters,
  updateMaster,
  type DependencyCheck,
  type MasterPage,
} from '../../api/masterApi';
import { getStates, getDistricts, getMandals, getVillages } from '../../api/locationApi';
import { getClassesByCourse } from '../../api/studentService';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../hooks/useToast';
import { FiEdit2, FiEye, FiPlus, FiTrash2, FiTag } from 'react-icons/fi';
import { LuSearch } from 'react-icons/lu';
import { masterConfigMap, type MasterConfig, type MasterField, type MasterSelectSource } from '../../config/masterConfig';
import type { ReactNode } from 'react';
import '../../styles/MastersPage.css';

interface Option {
  value: string;
  label: string;
}

const optionCache = new Map<string, Option[]>();

const loadMasterOptions = async (type: string): Promise<Option[]> => {
  const cached = optionCache.get(type);
  if (cached) return cached;
  const data: MasterPage = await getMasters(type, { size: 1000 });
  const options = data.items
    .filter((x) => x.id != null)
    .map((x) => ({ value: String(x.id), label: String(x.name ?? '') }))
    .sort((a, b) => a.label.localeCompare(b.label));
  optionCache.set(type, options);
  return options;
};

const asOption = (item: Record<string, any>, valueKey = 'id', labelKey = 'name') => ({
  value: String(item[valueKey]),
  label: String(item[labelKey] ?? ''),
});

function LocationCascade({ fieldLabel, initialVillageId, onChange }: {
  fieldLabel: string;
  initialVillageId?: string;
  onChange: (villageId: string) => void;
}) {
  const [states, setStates] = useState<Option[]>([]);
  const [stateId, setStateId] = useState('');
  const [districts, setDistricts] = useState<Option[]>([]);
  const [districtId, setDistrictId] = useState('');
  const [mandals, setMandals] = useState<Option[]>([]);
  const [mandalId, setMandalId] = useState('');
  const [villages, setVillages] = useState<Option[]>([]);
  const [villageId, setVillageId] = useState('');

  useEffect(() => {
    getStates().then((data) => setStates(data.map((s: any) => asOption(s, 'stId', 'stName')))).catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!stateId) { setDistricts([]); setDistrictId(''); return; }
    getDistricts(Number(stateId)).then((data) => setDistricts(data.map((d: any) => asOption(d, 'distId', 'distName')))).catch(() => setDistricts([]));
  }, [stateId]);

  useEffect(() => {
    if (!districtId) { setMandals([]); setMandalId(''); return; }
    getMandals(Number(districtId)).then((data) => setMandals(data.map((m: any) => asOption(m, 'mndlId', 'mndlName')))).catch(() => setMandals([]));
  }, [districtId]);

  useEffect(() => {
    if (!mandalId) { setVillages([]); setVillageId(''); return; }
    getVillages(Number(mandalId)).then((data) => setVillages(data.map((v: any) => asOption(v, 'vilId', 'vilName')))).catch(() => setVillages([]));
  }, [mandalId]);

  useEffect(() => {
    if (!initialVillageId || stateId) return;
    let mounted = true;
    (async () => {
      try {
        const v = await getMasterDetail('village', Number(initialVillageId));
        const m = await getMasterDetail('mandal', Number(v.mandalId));
        const d = await getMasterDetail('district', Number(m.districtId));
        if (!mounted) return;
        setStateId(String(d.stateId));
        setDistrictId(String(m.districtId));
        setMandalId(String(v.mandalId));
        setVillageId(String(v.id));
      } catch { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [initialVillageId, stateId]);

  const select = (label: string, options: Option[], value: string, onChangeValue: (v: string) => void) => (
    <select className="input" value={value} onChange={(e) => onChangeValue(e.target.value)}>
      <option value="">Select {label}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="formGrid masterLocationGrid">
      <div className="field formField">
        <label>{fieldLabel}</label>
        {select('State', states, stateId, (v) => { setStateId(v); setDistrictId(''); setMandalId(''); setVillageId(''); })}
      </div>
      {stateId && (
        <div className="field formField">
          <label>District</label>
          {select('District', districts, districtId, (v) => { setDistrictId(v); setMandalId(''); setVillageId(''); })}
        </div>
      )}
      {districtId && (
        <div className="field formField">
          <label>Mandal</label>
          {select('Mandal', mandals, mandalId, (v) => { setMandalId(v); setVillageId(''); })}
        </div>
      )}
      {mandalId && (
        <div className="field formField">
          <label>Village</label>
          {select('Village', villages, villageId, (v) => { setVillageId(v); onChange(v); })}
        </div>
      )}
    </div>
  );
}

type FieldProps = {
  field: MasterField;
  value: any;
  setValue: (value: any) => void;
  options: Option[];
  classOptions: Option[];
};

function FieldInput({ field, value, setValue, options, classOptions }: FieldProps) {
  const { key, label, type } = field;
  const source = type.kind === 'select' ? (type.source as MasterSelectSource) : null;

  if (source?.kind === 'locationCascade') {
    return (
      <LocationCascade
        fieldLabel={label}
        initialVillageId={value}
        onChange={setValue}
      />
    );
  }

  switch (type.kind) {
    case 'checkbox':
      return (
        <label className="masterCheckboxLabel">
          <input className="input masterCheckbox" type="checkbox" checked={!!value} onChange={(e) => setValue(e.target.checked)} />
          <span>{label}</span>
        </label>
      );
    case 'select': {
      const isClassByCourse = source?.kind === 'classByCourse';
      const opts = isClassByCourse ? classOptions : options;
      const disabled = isClassByCourse && opts.length === 0;
      return (
        <div className="field formField">
          <label>{label}</label>
          <select
            className="input"
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">{disabled ? 'Select course first' : `Select ${label.replace(' *', '')}`}</option>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    case 'textarea':
      return (
        <div className="field formField">
          <label>{label}</label>
          <textarea className="input masterTextarea" rows={3} value={value ?? ''} onChange={(e) => setValue(e.target.value)} />
        </div>
      );
    default:
      return (
        <div className="field formField">
          <label>{label}</label>
          <input
            className="input"
            type={type.kind === 'number' ? 'number' : type.kind === 'date' ? 'date' : 'text'}
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      );
  }
}

export default function MasterManagementPage() {
  const { type = '' } = useParams();
  const config: MasterConfig | undefined = masterConfigMap[type as keyof typeof masterConfigMap];
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');

  const [modal, setModal] = useState<{ mode: 'add' | 'edit' | 'view'; record?: Record<string, any> } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);
  const [dependencyBlock, setDependencyBlock] = useState<DependencyCheck | null>(null);

  const [checkingDeps, setCheckingDeps] = useState(false);

  const load = useCallback(async (nextPage: number, nextSize: number, query: string) => {
    setLoading(true);
    try {
      const data = await getMasters(type, { search: query || undefined, page: nextPage, size: nextSize });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (!config) return;
    setPage(1);
    setApplied('');
    setSearch('');
    load(1, pageSize, '');
  }, [type, config]);

  useEffect(() => {
    load(page, pageSize, applied);
  }, [page, pageSize, applied, load]);

  useEffect(() => {
    if (!config || !modal) return;
    let mounted = true;
    const sourceTypes = new Set<string>();
    config.fields.forEach((f) => {
      const source = f.type.kind === 'select' ? (f.type.source as MasterSelectSource) : null;
      if (source?.kind === 'master') sourceTypes.add(source.type);
    });
    Promise.all(
      Array.from(sourceTypes).map(async (st) => {
        const opts = await loadMasterOptions(st);
        return { st, opts };
      }),
    ).then((results) => {
      if (!mounted) return;
      const next: Record<string, Option[]> = {};
      results.forEach(({ st, opts }) => { next[st] = opts; });
      setOptions((prev) => ({ ...prev, ...next }));
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [config, modal]);

  useEffect(() => {
    if (!modal) {
      setClassOptions([]);
      return;
    }
    const courseField = config?.fields.find((f) => f.type.kind === 'select' && (f.type.source as MasterSelectSource)?.kind === 'classByCourse');
    const courseId = form.courseId;
    if (!courseField || !courseId) {
      setClassOptions([]);
      return;
    }
    let mounted = true;
    getClassesByCourse(Number(courseId)).then((classes) => {
      if (mounted) setClassOptions(classes.map((c) => ({ value: String(c.classId), label: c.className })));
    }).catch(() => { if (mounted) setClassOptions([]); });
    return () => { mounted = false; };
  }, [modal, form.courseId, config]);

  if (!config) {
    return (
      <div className="student-list-page">
        <PageHeader title="Masters" subtitle="Unknown master type" />
      </div>
    );
  }

  const openAdd = () => {
    const empty: Record<string, any> = {};
    config.fields.forEach((f) => {
      empty[f.key] = f.type.kind === 'checkbox' ? false : '';
    });
    setForm(empty);
    setFormError('');
    setModal({ mode: 'add' });
  };

  const openEdit = (record: Record<string, any>) => {
    const values: Record<string, any> = {};
    config.fields.forEach((f) => {
      values[f.key] = record[f.key] ?? (f.type.kind === 'checkbox' ? false : '');
    });
    if (values.classOrder === null) values.classOrder = '';
    setForm(values);
    setFormError('');
    setModal({ mode: 'edit', record });
  };

  const openView = (record: Record<string, any>) => {
    setModal({ mode: 'view', record });
  };

  const setField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setFormError('');
    const body: Record<string, any> = {};
    for (const f of config.fields) {
      const value = form[f.key];
      const isRequired = 'required' in f && f.required;
      const blank = value === '' || value === undefined || value === null;
      if (blank && isRequired) {
        setFormError(`${f.label.replace(' *', '')} is required.`);
        return;
      }
      body[f.key] = blank ? null : value;
    }

    setSaving(true);
    try {
      if (modal?.mode === 'edit' && modal.record) {
        await updateMaster(type, Number(modal.record.id), body);
        toast(`${config.singular} updated.`, 'success');
      } else {
        await createMaster(type, body);
        toast(`${config.singular} added.`, 'success');
      }
      setModal(null);
      load(page, pageSize, applied);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Operation failed.';
      setFormError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = async (record: Record<string, any>) => {
    setCheckingDeps(true);
    setDeleteTarget(record);
    try {
      const check = await checkMasterDependencies(type, Number(record.id));
      setDependencyBlock(check.canDelete ? null : check);
    } catch {
      setDependencyBlock(null);
    } finally {
      setCheckingDeps(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMaster(type, Number(deleteTarget.id));
    toast(`${config.singular} removed.`, 'success');
    setDeleteTarget(null);
    load(page, pageSize, applied);
  };

  const formatCell = (field: MasterField, record: Record<string, any>): ReactNode => {
    const { key, resolvedKey } = field as { key: string; resolvedKey?: string };
    let value: any = record[resolvedKey ?? key];
    if (value === undefined || value === null || value === '') return '—';
    if (field.type.kind === 'checkbox') return value ? 'Yes' : 'No';
    return String(value);
  };

  const renderColumnValue = (colKey: string, record: Record<string, any>): ReactNode => {
    let value: any = record[colKey];
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const rows = items.map((record) => [
    ...config.columns.map((col) => renderColumnValue(col.key, record)),
    <div className="actions student-actions" style={{ justifyContent: 'center' }} key="_actions">
      <Button size="sm" variant="outline" className="iconBtn viewActionButton"
        onClick={() => openView(record)} title={`View ${config.singular}`} aria-label={`View ${config.singular}`}>
        <FiEye size={18} />
      </Button>
      <Button size="sm" variant="outline" className="iconBtn editActionButton"
        onClick={() => openEdit(record)} title={`Edit ${config.singular}`} aria-label={`Edit ${config.singular}`}>
        <FiEdit2 size={18} />
      </Button>
      <Button size="sm" variant="outline" className="iconBtn deleteActionButton"
        onClick={() => requestDelete(record)} title={`Delete ${config.singular}`} aria-label={`Delete ${config.singular}`}>
        <FiTrash2 size={18} />
      </Button>
    </div>,
  ]);

  const dependencyTotal = dependencyBlock?.dependencies.reduce((sum, d) => sum + d.count, 0) ?? 0;

  return (
    <div className="admin-access-page student-list-page">
      <PageHeader
        title={config.label}
        subtitle={`Manage ${config.singular.toLowerCase()} master data`}
        actions={<Button className="btnGreen" onClick={openAdd}><FiPlus size={18} /> Add {config.singular}</Button>}
      />

      <div className="student-stats-grid sponsor-stats-grid">
        <div className="reminderRecordCard total">
          <div className="stat-card-content">
            <div className="stat-card-label">Total {config.singular}s</div>
            <div className="stat-card-value">{total}</div>
            <div className="stat-card-note">Active records</div>
          </div>
          <div className="stat-card-icon"><FiTag /></div>
        </div>
      </div>

      <div className="masterSearchRow">
        <div className="filter-search-wrapper masterSearchBox">
          <LuSearch className="search-icon" size={18} />
          <input
            className="filter-search-input"
            placeholder={config.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setApplied(search); setPage(1); }
            }}
          />
        </div>
        <Button
          className="gobtn"
          onClick={() => { setApplied(search); setPage(1); }}
        >
          Search
        </Button>
      </div>

      <DataTable
        loading={loading}
        loadingRowCount={Math.min(pageSize, 10)}
        columns={[...config.columns, { key: '_actions', label: '', width: '130px' }]}
        rows={rows}
        rowClassName="studentTableRow"
        footer={
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={(next) => { setPageSize(next); setPage(1); }}
          />
        }
      />

      <Modal
        open={!!modal}
        onClose={() => !saving && setModal(null)}
        title={modal?.mode === 'add' ? `Add ${config.singular}` : modal?.mode === 'edit' ? `Edit ${config.singular}` : `View ${config.singular}`}
        width={720}
        footer={modal?.mode !== 'view' ? (
          <>
            <Button className="btnRed" variant="outline" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
            <Button className="btnGreen" disabled={saving} onClick={submit}>
              {saving ? 'Saving...' : modal?.mode === 'edit' ? 'Save Changes' : 'Add'}
            </Button>
          </>
        ) : (
          <Button className="btnGreen" variant="outline" onClick={() => setModal(null)}>Close</Button>
        )}
      >
        {modal?.mode === 'view' ? (
          <div className="masterViewBody">
            {config.fields.map((f) => (
              <div className="masterViewRow" key={f.key}>
                <div className="masterViewLabel">{f.label.replace(' *', '')}</div>
                <div className="masterViewValue">{formatCell(f, modal.record ?? {})}</div>
              </div>
            ))}
          </div>
        ) : (
          <form id="master-form" className="adminModalForm studentWizardForm" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="formGrid masterFormGrid student-form-grid">
              {config.fields.map((f) => {
                const source = f.type.kind === 'select' ? (f.type.source as MasterSelectSource) : null;
                const masterKey = source?.kind === 'master' ? source.type : '';
                const fieldOptions = masterKey ? (options[masterKey] ?? []) : [];
                return (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={form[f.key]}
                    setValue={(v) => setField(f.key, v)}
                    options={fieldOptions}
                    classOptions={classOptions}
                  />
                );
              })}
            </div>
            {formError && <div className="adminFormError">{formError}</div>}
            <button id="master-form-submit" hidden type="submit" />
          </form>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${config.singular}`}
        message={`Delete ${deleteTarget?.name ?? config.singular}? This cannot be undone.`}
        confirmLabel="Yes, Delete"
      />

      <Modal
        open={!!dependencyBlock && !!deleteTarget}
        onClose={() => { setDependencyBlock(null); setDeleteTarget(null); }}
        title="Cannot Delete"
        width={560}
        footer={
          <Button className="btnGreen" variant="outline" onClick={() => { setDependencyBlock(null); setDeleteTarget(null); }}>
            OK
          </Button>
        }
      >
        <div className="confirmModalContent">
          <div className="confirmBody">
            <div className="confirmLead">Delete Blocked</div>
            <div className="confirmMessage">
              {config.singular} <strong>{deleteTarget?.name}</strong> is referenced by ({(dependencyTotal)}):
            </div>
            <ul className="masterDependencyList">
              {(dependencyBlock?.dependencies ?? [])
                .filter((d) => d.count > 0)
                .map((d) => (
                  <li key={d.label}>
                    {d.label}: <strong>{d.count}</strong>
                  </li>
                ))}
            </ul>
            <div className="confirmMessage">Remove these references before deleting.</div>
          </div>
        </div>
      </Modal>

      {checkingDeps && deleteTarget && !dependencyBlock && (
        <div className="masterDepChecking">Checking dependencies...</div>
      )}

      {!config && type && (
        <Button className="btnGreen" variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      )}
    </div>
  );
}