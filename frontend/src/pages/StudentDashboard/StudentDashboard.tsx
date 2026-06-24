import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile } from '../../api/studentApi';
import { getStudentSponsorAssignment } from '../../api/studentSponsorApi';
import { getSponsorById } from '../../api/sponsorApi';
import { getStudentReminders } from '../../api/remindersApi';
import Badge from '../../components/common/Badge';
import type { StudentView, SponsorView, StudentSponsor } from '../../types';
import type { ReminderDto } from '../../api/remindersApi';
import './StudentDashboard.css';

function isUpcoming(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentView | null>(null);
  const [sponsorAssign, setSponsorAssign] = useState<StudentSponsor | null>(null);
  const [sponsorDetail, setSponsorDetail] = useState<SponsorView | null>(null);
  const [events, setEvents] = useState<ReminderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await getMyProfile(user.user_id);
        if (!data) { setLoading(false); return; }
        setProfile(data);

        const sp = await getStudentSponsorAssignment(data.student_id).catch(() => null);
        setSponsorAssign(sp);
        if (sp) {
          const sd = await getSponsorById(sp.spn_id).catch(() => undefined);
          setSponsorDetail(sd ?? null);
        }

        const myEvents = await getStudentReminders(data.student_id).catch(() => []);
        setEvents(
          myEvents
            .filter(r => isUpcoming(r.eventDate))
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        );
      } catch (err) {
        console.error('Failed to load student dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (isPaused || events.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, events.length]);

  const goTo = (idx: number) => setActiveIndex(idx);
  const next = () => setActiveIndex(prev => (prev + 1) % events.length);
  const prev = () => setActiveIndex(prev => (prev - 1 + events.length) % events.length);

  if (loading) {
    return (
      <div className="studentDashboard">
        <div className="sdLoading">Loading your dashboard...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="studentDashboard">
        <div className="sdLoading">Unable to load your profile. Please try again later.</div>
      </div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAssigned = !!(sponsorAssign && sponsorDetail);
  const profileDob = profile.dob ? formatDate(profile.dob) : null;

  return (
    <div className="studentDashboard">

      {/* ─── A. Welcome Banner ─── */}
      <div className="sdWelcomeCard">
        <div className="sdWelcomeInner">
          <div className="sdWelcomeAvatar">{initials}</div>
          <div className="sdWelcomeInfo">
            <h2>Welcome, {profile.full_name}!</h2>
            <p className="sdWelcomeSub">
              Student ID: {profile.student_id}
             
            </p>
          </div>
        </div>
      </div>

      {/* ─── B. Quick Summary Cards ─── */}
      <div className="sdSummaryRow">
        <div className="sdSummaryCard">
          <div className="sdSummaryIcon sdSummaryIconSponsor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="sdSummaryBody">
            <span className="sdSummaryLabel">Sponsor</span>
            <span className="sdSummaryValue">
              {isAssigned ? sponsorDetail!.sponsorName : 'Not assigned'}
            </span>
          </div>
          <Badge variant={isAssigned ? 'success' : 'inactive'}>
            {isAssigned ? 'Assigned' : 'None'}
          </Badge>
        </div>

        <div className="sdSummaryCard">
          <div className="sdSummaryIcon sdSummaryIconEvent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="sdSummaryBody">
            <span className="sdSummaryLabel">Upcoming Events</span>
            <span className="sdSummaryValue">{events.length} event{events.length !== 1 ? 's' : ''}</span>
          </div>
          <Badge variant={events.length > 0 ? 'active' : 'inactive'}>
            {events.length > 0 ? 'Coming up' : 'None'}
          </Badge>
        </div>

        <div className="sdSummaryCard">
          <div className="sdSummaryIcon sdSummaryIconMsg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="sdSummaryBody">
            <span className="sdSummaryLabel">Messages</span>
            <span className="sdSummaryValue">No new messages</span>
          </div>
          <Badge variant="inactive">Inbox</Badge>
        </div>
      </div>

      {/* ─── C. Upcoming Events Carousel ─── */}
      {events.length > 0 ? (
        <div
          className="sdCard"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="sdCardHeader">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Upcoming Events
            <span className="sdEventCount">{events.length} scheduled</span>
          </div>
          <div className="sdCarouselBody">
            <div
              className="sdCarouselTrack"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {events.map(ev => {
                const { day, month, year } = formatDate(ev.eventDate);
                return (
                  <div className="sdCarouselSlide" key={ev.remId}>
                    <div className="sdCarouselSlideInner">
                      <div className="sdCarouselDateBox">
                        <span className="sdCarouselDay">{day}</span>
                        <span className="sdCarouselMonth">{month}</span>
                      </div>
                      <div className="sdCarouselInfo">
                        <h3 className="sdCarouselTitle">{ev.title}</h3>
                        <span className="sdCarouselDate">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {day} {month} {year}
                        </span>
                        {ev.venue && (
                          <span className="sdCarouselVenue">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {ev.venue}
                          </span>
                        )}
                        {ev.description && (
                          <p className="sdCarouselDesc">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {events.length > 1 && (
              <>
                <button className="sdCarouselPrev" onClick={prev} aria-label="Previous event">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button className="sdCarouselNext" onClick={next} aria-label="Next event">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <div className="sdCarouselIndicators">
                  {events.map((_, idx) => (
                    <button
                      key={idx}
                      className={`sdCarouselDot ${idx === activeIndex ? 'active' : ''}`}
                      onClick={() => goTo(idx)}
                      aria-label={`Go to event ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="sdCard">
          <div className="sdCardHeader">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Upcoming Events
          </div>
          <div className="sdCardBody">
            <div className="sdEmptyState">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No upcoming events available.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── D. My Profile + Sidebar (70/30) ─── */}
      <div className="sdContentRow">
        <div className="sdContentMain">
          <div className="sdCard">
            <div className="sdCardHeader">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Profile
            </div>
            <div className="sdCardBody">
              <div className="sdProfileGrid">
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Full Name</span>
                  <span className="sdFieldValue">{profile.full_name}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Student ID</span>
                  <span className="sdFieldValue">{profile.student_id}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Date of Birth</span>
                  <span className="sdFieldValue">{profileDob ? `${profileDob.day} ${profileDob.month} ${profileDob.year}` : '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Email</span>
                  <span className="sdFieldValue">{profile.email || '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Gender</span>
                  <span className="sdFieldValue"><span className="sdGenderBadge">{profile.gender || '-'}</span></span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Class</span>
                  <span className="sdFieldValue">{profile.class_id || '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">School</span>
                  <span className="sdFieldValue">{profile.sch_name || '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Guardian</span>
                  <span className="sdFieldValue">{profile.guardian_full_name || '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Guardian Phone</span>
                  <span className="sdFieldValue">{profile.guardian_phone || '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Address</span>
                  <span className="sdFieldValue">{[profile.vil_name, profile.mndl_name, profile.dist_name, profile.st_name].filter(Boolean).join(', ') || '-'}</span>
                </div>
                <div className="sdProfileField">
                  <span className="sdFieldLabel">Status</span>
                  <span className="sdFieldValue">
                    {profile.orphan_status ? (
                      <Badge variant={profile.orphan_status === 'Orphan' ? 'inactive' : 'active'}>
                        {profile.orphan_status}
                      </Badge>
                    ) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sdContentSide">
          <div className="sdCard">
            <div className="sdCardHeader">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              My Sponsor
            </div>
            <div className="sdCardBody">
              {isAssigned ? (
                <div className="sdSponsorDetail">
                  <div className="sdSponsorRow">
                    <span className="sdFieldLabel">Sponsor Name</span>
                    <span className="sdFieldValue">{sponsorDetail!.sponsorName}</span>
                  </div>
                  <div className="sdSponsorRow">
                    <span className="sdFieldLabel">Nationality</span>
                    <span className="sdFieldValue">{sponsorDetail!.nationality || '-'}</span>
                  </div>
                  <div className="sdSponsorRow">
                    <span className="sdFieldLabel">Type</span>
                    <span className="sdFieldValue">{sponsorDetail!.type || '-'}</span>
                  </div>
                  <div className="sdSponsorRow">
                    <span className="sdFieldLabel">Status</span>
                    <span className="sdFieldValue">
                      <Badge variant="success">Assigned</Badge>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="sdEmptyState">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <p>No sponsor assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── E. Messages ─── */}
      <div className="sdCard">
        <div className="sdCardHeader">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Messages
        </div>
        <div className="sdCardBody">
          <div className="sdEmptyState">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No messages yet.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
