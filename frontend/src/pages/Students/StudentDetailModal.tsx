import { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { getSponsorById } from '../../api/sponsorApi';
import type { SponsorView, StudentView } from '../../types';

type TabKey = 'personal' | 'location' | 'guardian';

const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
  { key: 'personal', label: 'Personal', icon: <IconPerson /> },
  { key: 'location', label: 'Location', icon: <IconMapPin /> },
  { key: 'guardian', label: 'Guardian', icon: <IconShield /> },
];

export default function StudentDetailModal({ student, onClose }: { student: StudentView | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [sponsor, setSponsor] = useState<SponsorView | null>(null);

  useEffect(() => {
    if (!student) return;
    setActiveTab('personal');
    setSponsor(null);
    if (!student.sponsor_id) return;
    let mounted = true;
    getSponsorById(student.sponsor_id)
      .then(data => { if (mounted) setSponsor(data ?? null); })
      .catch(() => { if (mounted) setSponsor(null); });
    return () => { mounted = false; };
  }, [student]);

  if (!student) return null;

  const sponsorName = sponsor?.sponsor_name ?? student.sponsor_sponsor_name ?? '';
  const hasSponsor = Boolean(student.sponsor_id);

  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title=" "
      width={820}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="studentProfileModal">
        <section className="studentProfileHero">
          <div className="studentProfileHeroTop">
            <div className="studentProfileIdentity">
              <div className="studentProfileTitle">Student Profile</div>
              <h2>{student.full_name}</h2>
              <div className="studentProfilePills">
                <Pill>{`STU-${student.student_id}`}</Pill>
                <Pill>{student.class_id}</Pill>
                <Pill>{student.gender}</Pill>
                {student.orphan_status ? <Pill tone="amber">{student.orphan_status}</Pill> : null}
                {hasSponsor ? <Pill tone="emerald">Sponsored</Pill> : null}
              </div>
            </div>
            <div className="studentProfileAvatar">{getInitials(student.full_name)}</div>
          </div>
        </section>

        <div className="studentProfileTabs">
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`studentProfileTab${active ? ' isActive' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'personal' ? (
          <ProfileGrid
            items={[
              { label: 'Date of Birth', value: student.dob, icon: <IconCalendar /> },
              { label: 'Gender', value: student.gender, icon: <IconGender /> },
              { label: 'Blood Group', value: student.blood_group, icon: <IconBlood /> },
              { label: 'Aadhaar Number', value: maskAadhaar(student.aadhaar_number), icon: <IconIdCard /> },
              { label: 'Religion', value: student.religion, icon: <IconHeart /> },
              { label: 'Caste', value: student.caste, icon: <IconTag /> },
              { label: 'Orphan Status', value: student.orphan_status, icon: <IconShield /> },
              { label: 'Sibling', value: student.sibling_id ? `${student.sibling_student_name || 'Sibling'} ${student.sibling_student_id ? `(${student.sibling_student_id})` : ''}` : 'No', icon: <IconUserCheck /> },
              ...(hasSponsor ? [{ label: 'Sponsor Name', value: sponsorName || 'Assigned sponsor', icon: <IconSpark /> }] : []),
            ]}
          />
        ) : null}

        {activeTab === 'location' ? (
          <ProfileGrid
            items={[
              { label: 'School Name', value: student.sch_name, icon: <IconSchool /> },
              { label: 'Village', value: student.vil_name, icon: <IconMapPin /> },
              { label: 'Mandal', value: student.mndl_name, icon: <IconMap /> },
              { label: 'District', value: student.dist_name, icon: <IconBuilding /> },
              { label: 'State', value: student.st_name, icon: <IconWorld /> },
            ]}
          />
        ) : null}

        {activeTab === 'guardian' ? (
          <ProfileGrid
            items={[
              { label: 'Guardian Name', value: student.guardian_full_name, icon: <IconUserCheck /> },
              { label: 'Relation', value: student.guardian_relation_name, icon: <IconLink /> },
              { label: 'Phone Number', value: student.guardian_phone, icon: <IconPhone /> },
              { label: 'Occupation', value: student.guardian_occ, icon: <IconBriefcase /> },
            ]}
          />
        ) : null}

        {hasSponsor ? (
          <section className="studentProfileSponsor">
            <div className="studentProfileSectionTitle">
              <IconSpark />
              Sponsor
            </div>
            <div className="studentProfileSponsorGrid">
              <InfoChip label="Sponsor" value={sponsorName || 'Assigned'} />
              <InfoChip label="Sponsor Type" value={student.sponsor_type || sponsor?.type || 'N/A'} />
              <InfoChip label="Contribution" value={sponsor?.contrib || 'N/A'} />
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

function ProfileGrid({ items }: { items: { label: string; value?: string | number | null; icon: JSX.Element }[] }) {
  return (
    <div className="studentProfileGrid">
      {items.map(item => (
        <div key={item.label} className="studentProfileCard">
          <div className="studentProfileLabel">
            <span className="studentProfileIcon">{item.icon}</span>
            {item.label}
          </div>
          <div className="studentProfileValue">{item.value || 'Not available'}</div>
        </div>
      ))}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="studentProfileChip">
      <div className="studentProfileChipLabel">{label}</div>
      <div className="studentProfileChipValue">{value}</div>
    </div>
  );
}

function Pill({ children, tone = 'slate' }: { children: string; tone?: 'slate' | 'emerald' | 'amber' }) {
  return <span className={`studentProfilePill ${tone}`}>{children}</span>;
}

const maskAadhaar = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return 'Not available';
  return `XXXX XXXX ${digits.slice(-4).padStart(4, '0')}`;
};

const getInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'S';

function IconPerson() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-6 9a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconMapPin() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconShield() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3 5 6v5c0 5 3.5 8.7 7 10 3.5-1.3 7-5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconCalendar() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconGender() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12 2v5M9.5 4.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconBlood() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3s5 5.2 5 9.2A5 5 0 0 1 7 12.2C7 8.2 12 3 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function IconIdCard() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 10h4M8 14h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function IconHeart() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconTag() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 12V4h8l10 10-8 8L3 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8.5" cy="7.5" r="1.2" stroke="currentColor" strokeWidth="1.8" /></svg>; }
function IconSchool() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="m12 3 9 5-9 5-9-5 9-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M5 11v5c0 2 3.1 4 7 4s7-2 7-4v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function IconMap() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="m9 18 6-12M9 6l-6 3v12l6-3 6 3 6-3V6l-6 3-6-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconBuilding() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 21V7a2 2 0 0 1 2-2h6v16M14 21V5h4a2 2 0 0 1 2 2v14M8 9h2M8 13h2M8 17h2M16 9h2M16 13h2M16 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconWorld() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconUserCheck() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 2 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconLink() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconPhone() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 4h3l2 5-2 2a15 15 0 0 0 7 7l2-2 5 2v3a2 2 0 0 1-2 2A18 18 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconBriefcase() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm0 0a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconSpark() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="m12 2 1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>; }
