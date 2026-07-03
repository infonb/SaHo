import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentPhoto from '../common/StudentPhoto';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile } from '../../api/studentApi';
import type { StudentView } from '../../types';
import logo from '../../assets/logo.png';
import '../../styles/Topbar.css';

export const LeafLogo = () => (
  <svg className="brandMark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M24 42C13 32 11 19 24 7c13 12 11 25 0 35Z" fill="var(--br-100)" />
    <path d="M24 42c0-11 0-22 0-35" stroke="var(--br-500)" strokeWidth="3" />
    <path d="M24 23c-5-1-9-4-12-9 7 0 12 3 12 9Z" fill="var(--green-bg)" />
    <path d="M24 25c6-1 10-4 13-10-8 0-13 4-13 10Z" fill="var(--green-border)" />
  </svg>
);

type TopbarProps = {
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  onAiOpen?: () => void;
  title?: string;
  dashboardPath?: string;
  headerClassName?: string;
};

export default function Topbar({
  sidebarOpen,
  onSidebarToggle,
  onAiOpen,
  title = 'Admin Dashboard',
  dashboardPath = '/dashboard',
  headerClassName = '',
}: TopbarProps) {
  const { user, logout } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentView | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user?.student_id || userRole !== 'student') {
      setStudentProfile(null);
      return;
    }

    getMyProfile(user.user_id)
      .then((data) => {
        if (data) {
          setStudentProfile(data);
        }
      })
      .catch(() => {});
  }, [user?.user_id, userRole, user?.student_id]);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const goDashboard = () => {
    window.location.href = dashboardPath;
  };

  const displayName =
    studentProfile?.studentName ||
    studentProfile?.full_name ||
    user?.username ||
    (userRole === 'student' ? `Student ${user?.student_id}` : 'Admin');

  return (
    <header className={`dashboard-header topbar${headerClassName ? ` ${headerClassName}` : ''}`}>
      <div className="topbarLeft">
        {typeof sidebarOpen === 'boolean' && onSidebarToggle ? (
          <button
            className={`sidebarToggle headerSidebarToggle ${sidebarOpen ? 'closeIcon' : 'menuIcon'}`}
            type="button"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? (
              <svg className="sidebarCancelIcon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <>
                <span />
                <span />
                <span />
              </>
            )}
          </button>
        ) : null}

        <div className="topbarBrand">
          <button type="button" className="brandLogoButton" aria-label="Go to dashboard" onClick={goDashboard}>
            <img className="brandLogo" src={logo} alt="SaHo" />
          </button>
        </div>

        <div className="divider" />
        <div className="topbarTitle">{title}</div>
      </div>

      <div className="topbarActions">
        {onAiOpen ? (
          <button className="topbarAiButton" type="button" aria-label="Open AI assistant" onClick={onAiOpen}>
            <svg className="topbarAiSparkle" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13.8 2.5 5.7 13.1h5.1l-1.3 8.4 8.8-11.8h-5.5l1-7.2Z" />
            </svg>
            <span>Ask AI</span>
          </button>
        ) : null}

        <div ref={ref} className="userTooltipWrapper">
          <button
            className="userIconButton"
            aria-label="User menu"
            type="button"
            onClick={() => setOpen((value) => !value)}
          >
            <StudentPhoto name={displayName} src={studentProfile?.image_url} size="md" />
          </button>

          <div
            className="sdProfileDropdown"
            style={
              open
                ? { opacity: 1, visibility: 'visible', transform: 'translateY(0)' }
                : { pointerEvents: 'none' }
            }
          >
            <div className="sdDropdownHeader">
              {/* <Avatar name={displayName} size="sm" /> */}
              <div className="sdDropdownInfo">
                <div className="sdDropdownName">{displayName}</div>
                <div className="sdDropdownId">
                  {user?.role === 'student'
                    ? `Student ID: ${studentProfile?.student_id ?? user?.student_id}`
                    : user?.email_id}
                </div>
              </div>
            </div>
            <div className="sdDropdownDivider" />
            <button className="sdDropdownSignOut" type="button" onClick={signOut}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
