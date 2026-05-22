import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 11L12 4l8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12v7a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

const groups = [
  { title: 'Overview', items: [{ icon: <DashboardIcon />, label: 'Dashboard', to: '/dashboard' }] },
  {
    title: 'Modules',
    items: [
      { icon: <StudentsIcon />, label: 'Students', to: '/students', children: [{ label: 'View Students', to: '/students' }, { label: 'Add Student', to: '/students/add' }] },
      { icon: <SponsorsIcon />, label: 'Sponsors', to: '/sponsors', children: [{ label: 'View Sponsor', to: '/sponsors' }, { label: 'Add Sponsor', to: '/sponsors/add' }, { label: 'Assign to Student', to: '/sponsors/assign' }] },
      { icon: <RemindersIcon />, label: 'Reminders', to: '/reminders', children: [{ label: 'View Events', to: '/reminders' }, { label: 'Create Events', to: '/reminders/create' }] },
      { icon: <AdminIcon />, label: 'Admin Access', to: '/admins' },
    ],
  },
];

export default function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [submenuOpen, setSubmenuOpen] = useState<Record<string, boolean>>(() => ({
    Students: pathname.startsWith('/students'),
    Sponsors: pathname.startsWith('/sponsors'),
    Reminders: pathname.startsWith('/reminders'),
  }));

  useEffect(() => {
    setSubmenuOpen({
      Students: pathname.startsWith('/students'),
      Sponsors: pathname.startsWith('/sponsors'),
      Reminders: pathname.startsWith('/reminders'),
    });
  }, [pathname]);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${open ? 'expanded' : 'collapsed'}`}>
      <div className="sidebarLogo">
        <button className="sidebarToggle sidebarToggleInline" type="button" aria-label={open ? 'Close sidebar' : 'Open sidebar'} title={open ? 'Close sidebar' : 'Open sidebar'} onClick={onToggle}>
          <span />
          <span />
          <span />
        </button>
        <div className="sidebarBrand">
          <span className="sidebarLogoText">SaHo</span>
          <span className="sidebarLogoSprout" />
        </div>
      </div>
      {groups.map(group => (
        <div key={group.title}>
          <div className="navSection">{group.title}</div>
          {group.items.map(item => {
            const active = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(`${item.to}/`));
            const hasChildren = Boolean(item.children?.length);
            const submenuIsOpen = item.children ? submenuOpen[item.label] : false;
            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    className={`navParent ${active ? 'active' : ''}`}
                    type="button"
                    title={!open ? item.label : undefined}
                    onClick={() => {
                      if (open) {
                        setSubmenuOpen(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                      } else {
                        navigate(item.to);
                      }
                    }}
                  >
                    <span className="navIcon">{item.icon}</span>
                    <span className="navLabel">{item.label}</span>
                    {open && <span className={`navChevron ${submenuIsOpen ? 'open' : ''}`} />}
                  </button>
                ) : (
                  <Link className={`navItem ${active ? 'active' : ''}`} to={item.to} title={!open ? item.label : undefined}>
                    <span className="navIcon">{item.icon}</span>
                    <span className="navLabel">{item.label}</span>
                  </Link>
                )}
                {item.children && open && submenuIsOpen && item.children.map(sub => (
                  <Link key={sub.to} className={`navSub ${pathname === sub.to ? 'active' : ''}`} to={sub.to}>
                    <span className="dot" />
                    {sub.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      ))}
      <button className="sidebarSignOut" onClick={signOut} title={!open ? 'Sign Out' : undefined}>
        <span className="navIcon">S</span>
        <span className="navLabel">Sign Out</span>
      </button>
    </aside>
  );
}
