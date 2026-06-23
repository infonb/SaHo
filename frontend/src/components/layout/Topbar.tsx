import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import '../../styles/Topbar.css'

export const LeafLogo = () => (
  <svg className="brandMark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M24 42C13 32 11 19 24 7c13 12 11 25 0 35Z" fill="var(--br-100)" />
    <path d="M24 42c0-11 0-22 0-35" stroke="var(--br-500)" strokeWidth="3" />
    <path d="M24 23c-5-1-9-4-12-9 7 0 12 3 12 9Z" fill="var(--green-bg)" />
    <path d="M24 25c6-1 10-4 13-10-8 0-13 4-13 10Z" fill="var(--green-border)" />
  </svg>
);

export default function Topbar({
  sidebarOpen,
  onSidebarToggle,
  onAiOpen,
}: {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onAiOpen: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const goDashboard = () => {
    window.location.href = dashboardPath;
  };

  const displayName = studentProfile?.studentName || studentProfile?.full_name || user?.username || (user?.role === 'student' ? `Student ${user?.student_id}` : 'Admin');

  return (
    <header className={`dashboard-header topbar${headerClassName ? ` ${headerClassName}` : ''}`}>
      <div className="topbarLeft">
        {typeof sidebarOpen === 'boolean' && (
          <button className={`sidebarToggle headerSidebarToggle ${sidebarOpen ? 'closeIcon' : 'menuIcon'}`} type="button" aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} aria-expanded={sidebarOpen} title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} onClick={onSidebarToggle}>
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
        )}
        <div className="topbarBrand">
          <button type="button" className="brandLogoButton" aria-label="Go to dashboard" onClick={goDashboard}>
            <img className="brandLogo" src={logo} alt="SaHo" />
          </button>
        </div>
        <div className="divider">
        </div>
        <div className="topbarTitle">{title}</div>
      </div>

      {/* <div ref={ref} style={{ position: 'relative' }}>
        <button className="userIconButton" aria-label="User menu" onClick={() => setOpen(value => !value)}>
          <Avatar name={displayName} size="md" />
        </button>
        {open && (
          <div className="dropdown">
            <div className="rowFlex">
              <Avatar name={displayName} />
              <div>
                <div className="strong">{displayName}</div>
                <div className="sub">{user?.email_id}</div>
              </div>
            </div>
            <div style={{ margin: '12px 0' }}>
              <Badge variant="admin">{user?.role}</Badge>
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--color-border)' }} />
            <Button variant="ghost" onClick={signOut}>Sign Out</Button>
          </div>
        )}
      </div> */}

      <div className="topbarActions">
        <button className="topbarAiButton" type="button" aria-label="Open AI assistant" onClick={onAiOpen}>
          <svg className="topbarAiSparkle" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.8 2.5 5.7 13.1h5.1l-1.3 8.4 8.8-11.8h-5.5l1-7.2Z" />
          </svg>
          <span>Ask AI</span>
        </button>

        <div className="userTooltipWrapper">
          <button className="userIconButton" aria-label="User menu">
            <Avatar name={user?.username ?? 'Admin'} size="md" />
          </button>

          <div className="userTooltip">
            <div className="tooltipName">
              {user?.username || 'Admin User'}
            </div>

            <div className="tooltipEmail">
              {user?.email_id}
            </div>

            <button
              className="tooltipLogout"
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

    </header>
  );
}
