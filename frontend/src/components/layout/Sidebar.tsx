import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 11L12 4l8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12v7a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const MyDashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 15l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const StudentsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 10l8-5 8 5-8 5-8-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4 10v4c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 18V22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const SponsorsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12.5c0-1.88 1.52-3.4 3.4-3.4h2.6c1.88 0 3.4 1.52 3.4 3.4v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 12.5c0-1.88-1.52-3.4-3.4-3.4h-2.6c-1.88 0-3.4 1.52-3.4 3.4v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 16.5l4 2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const RemindersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 8a6 6 0 1 0-12 0c0 4.5-1 6-1 6h14s-1-1.5-1-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const AdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

type SidebarItem = {
  icon: JSX.Element;
  label: string;
  to: string;
};

type SidebarGroup = {
  title?: string;
  items: SidebarItem[];
};

export default function Sidebar({ open, onMobileNavigate }: { open: boolean; onMobileNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student' || user?.role === 'Student';

  const groups: SidebarGroup[] = [
    {
      items: isStudent
        ? [{ icon: <MyDashboardIcon />, label: 'My Dashboard', to: '/student/dashboard' }]
        : [
            { icon: <DashboardIcon />, label: 'Dashboard', to: '/dashboard' },
            { icon: <StudentsIcon />, label: 'Students', to: '/view-students' },
            { icon: <SponsorsIcon />, label: 'Sponsors', to: '/sponsors' },
            { icon: <RemindersIcon />, label: 'Reminders', to: '/reminders' },
            { icon: <AdminIcon />, label: 'Admin Access', to: '/admins' },
          ],
    },
  ];

  const signOut = () => {
    onMobileNavigate?.();
    logout();
    navigate('/login');
  };

  const sidebarState = open ? 'expanded' : 'collapsed';

  return (
    <aside className={`mobile-sidebar sidebar ${sidebarState}`} data-sidebar-state={sidebarState}>
      <div className="sidebarHead" />
      {groups.map(group => (
        <div className="navGroup" key={group.title ?? group.items[0].label}>
          {group.title && <div className="navSection" aria-hidden={!open}>{group.title}</div>}
          {group.items.map(item => {
            const active = item.label === 'My Dashboard'
              ? pathname.startsWith('/student/dashboard')
              : item.label === 'Dashboard'
                ? pathname === '/dashboard'
              : item.label === 'Students'
                ? pathname === '/view-students' || pathname.startsWith('/students')
              : pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(`${item.to}/`));
            return (
              <div className="nav-item" key={item.label}>
                <Link
                  className={`nav-link navItem ${active ? 'active' : ''}`}
                  to={item.to}
                  title={!open ? item.label : undefined}
                  onClick={onMobileNavigate}
                >
                  <span className="navIcon">{item.icon}</span>
                  <span className="navLabel">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      ))}
      <button
        className="sidebarSignOut"
        onClick={signOut}
        title={!open ? 'Sign Out' : undefined}
      >
        <span className="navIcon">S</span>
        <span className="navLabel">Sign Out</span>
      </button>
    </aside>
  );
}
