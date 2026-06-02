import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createVolunteer, getVolunteerById, updateVolunteer } from '../../api/volunteerApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function VolunteerFormPage() {
  const { id } = useParams(); const isEdit = !!id; const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [changePw, setChangePw] = useState(false); const [loading, setLoading] = useState(false);
  const nav = useNavigate(); const { user } = useAuth(); const { toast } = useToast();
  useEffect(() => { if (id) getVolunteerById(Number(id)).then(v => { if (v) { setUsername(v.username); setEmail(v.email_id); } }); }, [id]);
  const submit = async (e: FormEvent) => { e.preventDefault(); setLoading(true); try { if (isEdit) await updateVolunteer(Number(id), { username, email_id: email, ...(changePw && password ? { password } : {}) }); else await createVolunteer({ username, email_id: email, password, role: 'Volunteer', created_by: user?.username ?? 'admin' }); toast(isEdit ? 'Volunteer updated.' : 'Volunteer added.', 'success'); nav('/volunteers'); } catch { toast('Unable to save volunteer.', 'error'); } finally { setLoading(false); } };
  return <form onSubmit={submit}><PageHeader title={isEdit ? 'Edit Volunteer' : 'Add Volunteer'} subtitle="Volunteer access account" actions={<Button type="button" variant="outline" onClick={() => nav(-1)}>Back</Button>} /><div className="panel"><div className="formGrid"><label className="field"><span>Username*</span><input required className="input" value={username} onChange={e => setUsername(e.target.value)} /></label><label className="field"><span>Email*</span><input required className="input" value={email} onChange={e => setEmail(e.target.value)} /></label>{isEdit ? <label className="field"><span><input type="checkbox" checked={changePw} onChange={e => setChangePw(e.target.checked)} /> Change Password</span>{changePw && <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />}</label> : <label className="field"><span>Password*</span><input required className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>}<div className="field"><span>Role*</span><div><Badge variant="volunteer">Volunteer</Badge></div></div></div><div className="modalFooter" style={{ paddingInline: 0 }}><Button type="button" variant="outline" onClick={() => nav('/volunteers')}>Cancel</Button><Button loading={loading}>{isEdit ? 'Save Changes' : 'Add Volunteer'}</Button></div></div></form>;
}
