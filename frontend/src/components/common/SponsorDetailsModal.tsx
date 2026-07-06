import type { SponsorView } from '../../types';
import Modal from './Modal';

interface SponsorDetailsModalProps {
  open: boolean;
  sponsor: SponsorView | null;
  onClose: () => void;
}

const contribution = (value?: string | null, nationality?: string) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '-';
  if (/^[\u20b9\u0024\u20ac\u00a3\u00a5]/.test(trimmed) || /^[A-Z]{3}\s?\d/.test(trimmed)) return trimmed;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const currency = nationality?.toLowerCase() === 'indian' ? 'INR' : 'USD';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(trimmed));
  }
  return trimmed;
};

const sponsorInitials = (name?: string | null) =>
  String(name || 'SP')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'SP';

const formatSponsorDate = (value?: string | null) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '-';
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function SponsorProfileViewItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="studentProfileViewItem">
      <div className="studentProfileViewLabel">{label}</div>
      <div className="studentProfileViewValue">{value || '-'}</div>
    </div>
  );
}

function SponsorProfileViewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 12a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function SponsorDetailsModal({ open, sponsor, onClose }: SponsorDetailsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sponsor Details"
      width={800}
    >
      {sponsor ? (
        <div className="studentWizardForm isViewMode sponsorProfileViewMode">
          <section className="studentProfileViewCard sponsorProfileViewCard" aria-label="Sponsor profile">
            <div className="studentProfileViewHeader sponsorProfileViewHeader">
              <h2><SponsorProfileViewIcon /> Sponsor Details</h2>
              <div className="sponsorProfileViewHeaderActions">
                <button type="button" className="studentWizardClose studentProfileViewClose" onClick={onClose} aria-label="Close">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="studentProfileViewBanner sponsorProfileViewBanner">
              <div className="studentProfileViewAvatar sponsorProfileViewAvatar" aria-hidden="true">
                {sponsor.image_url ? (
                  <img src={sponsor.image_url} alt="" />
                ) : (
                  sponsorInitials(sponsor.sponsorName)
                )}
              </div>
              <div className="studentProfileViewBannerText">
                <div className="studentProfileViewBannerName">{sponsor.sponsorName || '-'}</div>
                <div className="studentProfileViewBannerMeta">
                  Sponsor ID: {sponsor.sponsor_id ?? '-'} | {sponsor.type || '-'}
                </div>
              </div>
            </div>

            <div className="studentProfileViewGrid sponsorProfileViewGrid">
              <SponsorProfileViewItem label="Full Name" value={sponsor.sponsorName} />
              <SponsorProfileViewItem label="Date of Birth / Founded On" value={formatSponsorDate(sponsor.dob)} />
              <SponsorProfileViewItem label="Type" value={sponsor.type} />
              <SponsorProfileViewItem label="Email" value={sponsor.email} />
              <SponsorProfileViewItem label="Phone Number" value={sponsor.ph_no} />
              <SponsorProfileViewItem label="Nationality" value={sponsor.nationality} />
              <SponsorProfileViewItem label="Sponsored Students" value={sponsor.students_count} />
              <SponsorProfileViewItem label="Contribution Amount" value={contribution(sponsor.contrib, sponsor.nationality)} />
              <SponsorProfileViewItem label="Location" value={sponsor.loc} />
            </div>
          </section>
        </div>
      ) : (
        <div className="empty">No sponsor information available</div>
      )}
    </Modal>
  );
}
