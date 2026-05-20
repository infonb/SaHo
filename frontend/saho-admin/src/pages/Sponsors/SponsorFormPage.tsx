import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSponsor, getSponsorById, updateSponsor } from '../../api/sponsorApi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const init = { name: '', email: '', dob: '', ph_no: '', type: 'Individual', nationality: 'Indian', contrib_amt: '', loc: '' };

export default function SponsorFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(init);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) getSponsorById(Number(id)).then(s => s && setForm({ name: s.full_name, email: s.email, dob: s.dob, ph_no: s.ph_no, type: s.type, nationality: s.nationality, contrib_amt: String(s.contrib_amt), loc: s.loc ?? '' }));
  }, [id]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { first_name: form.name.trim(), middle_name: null, last_name: '', email: form.email, dob: form.dob, ph_no: form.ph_no, loc: form.loc || null, type: form.type as 'Individual' | 'Organisation', nationality: form.nationality, contrib_amt: form.contrib_amt.trim() };
      if (isEdit) await updateSponsor(Number(id), { ...payload, modified_by: user?.username ?? 'admin' });
      else await createSponsor({ ...payload, created_by: user?.username ?? 'admin' });
      toast(isEdit ? 'Sponsor updated.' : 'Sponsor added.', 'success');
      nav('/sponsors');
    } catch {
      toast('Unable to save sponsor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={submit}><PageHeader title={isEdit ? 'Edit Sponsor' : 'Add Sponsor'} subtitle="Sponsor profile and contribution details" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} /><div className="panel"><div className="formGrid"><Field label="Name*" value={form.name} onChange={v => set('name', v)} /><Field label="Email*" type="email" value={form.email} onChange={v => set('email', v)} /><Field label="Date of Birth*" type="date" value={form.dob} onChange={v => set('dob', v)} /><Field label="Phone Number*" value={form.ph_no} onChange={v => set('ph_no', v)} /><Field label="Nationality*" value={form.nationality} onChange={v => set('nationality', v)} /><Field label="Contribution*" value={form.contrib_amt} onChange={v => set('contrib_amt', v)} /><label className="field"><span>Type*</span><select required className="select" value={form.type} onChange={e => set('type', e.target.value)}><option>Individual</option><option>Organisation</option></select></label><Field label="Location" value={form.loc} onChange={v => set('loc', v)} /></div><div className="modalFooter" style={{ paddingInline: 0 }}><Button type="button" variant="outline" onClick={() => nav('/sponsors')}>Cancel</Button><Button loading={loading}>{isEdit ? 'Save Changes' : 'Add Sponsor'}</Button></div></div></form>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <label className="field"><span>{label}</span><input className="input" required={label.includes('*')} type={type} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
