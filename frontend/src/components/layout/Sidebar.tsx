import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuHouse,
  LuLayoutDashboard,
  LuGraduationCap,
  LuHandHeart,
  LuBell,
  LuShieldCheck,
} from "react-icons/lu";

const DashboardIcon = () => <LuHouse size={18} />;
const MyDashboardIcon = () => <LuLayoutDashboard size={18} />;
const StudentsIcon = () => <LuGraduationCap size={18} />;
const SponsorsIcon = () => <LuHandHeart size={18} />;
const RemindersIcon = () => <LuBell size={18} />;
const AdminIcon = () => <LuShieldCheck size={18} />;

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
