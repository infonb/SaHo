import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StudentPhoto from '../../components/common/StudentPhoto';
import type { StudentView } from '../../types';

const mask = (aadhaar: string) => `........${aadhaar.slice(-4)}`;
const Info = ({ label, value }: { label: string; value?: string | number | null }) => <div><div className="sub">{label}</div><div className="strong">{value || '-'}</div></div>;

export default function StudentDetailModal({ student, onClose }: { student: StudentView | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [photoOpen, setPhotoOpen] = useState(false);
  if (!student) return null;
  return <><Modal open={!!student} onClose={onClose} title={student.full_name} width={760} footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => navigate(`/students/edit/${student.student_id}`)}>Modify Student</Button></>}><div className="rowFlex" style={{ marginBottom: 18 }}><StudentPhoto name={student.full_name} src={student.image_url} size="lg" button onClick={() => setPhotoOpen(true)} /><div><h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{student.full_name}</h2><div className="actions" style={{ marginTop: 8 }}><Badge variant="assigned">{student.class_id}</Badge><Badge variant={student.orphan_status === 'Orphan' ? 'other' : 'individual'}>{student.orphan_status ?? 'Not Set'}</Badge></div></div></div><div className="formGrid"><Info label="Email" value={student.email} /><Info label="Date of Birth" value={student.dob} /><Info label="Gender" value={student.gender} /><Info label="Aadhaar Number" value={mask(student.aadhaar_number)} /><Info label="Blood Group" value={student.blood_group} /><Info label="Caste" value={student.caste} /><Info label="Religion" value={student.religion} /><Info label="Orphan / Semi Orphan" value={student.orphan_status} /></div><h3 className="sectionTitle">Location</h3><div className="formGrid"><Info label="School" value={student.sch_name} /><Info label="Village" value={student.vil_name} /><Info label="Mandal" value={student.mndl_name} /><Info label="District" value={student.dist_name} /><Info label="State" value={student.st_name} /></div><h3 className="sectionTitle">Guardian</h3><div className="formGrid"><Info label="Name" value={student.guardian_full_name} /><Info label="Phone" value={student.guardian_phone} /><Info label="Relation" value={student.guardian_relation_name} /><Info label="Occupation" value={student.guardian_occ} /></div><h3 className="sectionTitle">Sponsor</h3>{student.sponsor_full_name ? <div className="panel"><strong>{student.sponsor_full_name}</strong><div className="sub">{student.sponsor_type}</div></div> : <div className="panel" style={{ borderStyle: 'dashed' }}>No sponsor assigned</div>}</Modal><Modal open={photoOpen} onClose={() => setPhotoOpen(false)} title={`${student.full_name} Photo`} width={460} footer={<Button variant="outline" onClick={() => setPhotoOpen(false)}>Close</Button>}><div className="photoPreviewWrap">{student.image_url ? <img className="photoPreview" src={student.image_url} alt={student.full_name} /> : <StudentPhoto name={student.full_name} size="lg" />}</div></Modal></>;
}
