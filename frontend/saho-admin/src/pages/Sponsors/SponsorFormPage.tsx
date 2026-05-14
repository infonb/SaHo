import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSponsor, getSponsorById, updateSponsor } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const init = { first_name: '', middle_name: '', last_name: '', email: '', dob: '', ph_no: '', type: 'Individual', nationality: 'Indian', contrib_amt: '1000', loc: '' };
export default function SponsorFormPage() {
  const { id } = useParams(); const isEdit = !!id; const [form, setForm] = useState(init); const [loading, setLoading] = useState(false);
  const nav = useNavigate(); const { user } = useAuth(); const { toast } = useToast();
  useEffect(() => { if (id) getSponsorById(Number(id)).then(s => s && setForm({ first_name: s.full_name.split(' ')[0] ?? '', middle_name: '', last_name: s.full_name.split(' ').slice(1).join(' '), email: s.email, dob: s.dob, ph_no: s.ph_no, type: s.type, nationality: s.nationality, contrib_amt: String(s.contrib_amt), loc: s.loc ?? '' })); }, [id]);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e: FormEvent) => { e.preventDefault(); setLoading(true); try { const payload = { ...form, middle_name: form.middle_name || null, loc: form.loc || null, type: form.type as 'Individual' | 'Organisation', contrib_amt: Number(form.contrib_amt) }; if (isEdit) await updateSponsor(Number(id), { ...payload, modified_by: user?.username ?? 'admin' }); else await createSponsor({ ...payload, created_by: user?.username ?? 'admin' }); toast(isEdit ? 'Sponsor updated.' : 'Sponsor added.', 'success'); nav('/sponsors'); } catch { toast('Unable to save sponsor.', 'error'); } finally { setLoading(false); } };
  return <form onSubmit={submit}><PageHeader title={isEdit ? 'Edit Sponsor' : 'Add Sponsor'} subtitle="Sponsor profile and contribution details" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} /><div className="panel"><div className="formGrid">{(['first_name','last_name','middle_name','email','dob','ph_no','nationality','contrib_amt','loc'] as const).map(k => <label className="field" key={k}><span>{k.replace('_',' ')}{['first_name','last_name','email','dob','ph_no','nationality','contrib_amt'].includes(k) ? '*' : ''}</span><input className="input" required={['first_name','last_name','email','dob','ph_no','nationality','contrib_amt'].includes(k)} type={k === 'dob' ? 'date' : k === 'contrib_amt' ? 'number' : 'text'} value={form[k]} onChange={e => set(k, e.target.value)} /></label>)}<label className="field"><span>Type*</span><select className="select" value={form.type} onChange={e => set('type', e.target.value)}><option>Individual</option><option>Organisation</option></select></label></div><div className="modalFooter" style={{ paddingInline: 0 }}><Button type="button" variant="outline" onClick={() => nav('/sponsors')}>Cancel</Button><Button loading={loading}>{isEdit ? 'Save Changes' : 'Add Sponsor'}</Button></div></div></form>;
}
