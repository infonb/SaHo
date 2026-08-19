import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LuHouse,
  LuLayoutDashboard,
  LuGraduationCap,
  LuHandHeart,
  LuBell,
  LuShieldCheck,
  LuMap,
  LuMapPin,
  LuClipboardList,
  LuFolderTree,
  LuSchool,
  LuBookOpen,
  LuLayers,
  LuBookMarked,
  LuFileText,
  LuCalendarDays,
  LuUsers,
  LuHeartHandshake,
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
  title: string;
  items: SidebarItem[];
};

const masterGroups: SidebarGroup[] = [
  {
    title: 'Location',
    items: [
      { icon: <LuFolderTree size={18} />, label: 'States', to: '/masters/state' },
      { icon: <LuMap size={18} />, label: 'Districts', to: '/masters/district' },
      { icon: <LuMapPin size={18} />, label: 'Mandals', to: '/masters/mandal' },
      { icon: <LuClipboardList size={18} />, label: 'Villages', to: '/masters/village' },
      { icon: <LuSchool size={18} />, label: 'Schools', to: '/masters/school' },
    ],
  },
  {
    title: 'Education',
    items: [
      { icon: <LuBookOpen size={18} />, label: 'Courses', to: '/masters/course' },
      { icon: <LuLayers size={18} />, label: 'Classes', to: '/masters/class' },
      { icon: <LuBookMarked size={18} />, label: 'Subjects', to: '/masters/subject' },
      { icon: <LuFileText size={18} />, label: 'Course Subjects', to: '/masters/courseSubject' },
    ],
  },
  {
    title: 'General',
    items: [
      { icon: <LuCalendarDays size={18} />, label: 'Academic Years', to: '/masters/academicYear' },
      { icon: <LuUsers size={18} />, label: 'Castes', to: '/masters/caste' },
      { icon: <LuHeartHandshake size={18} />, label: 'Relationships', to: '/masters/relationship' },
    ],
  },
];

export default function Sidebar({ open, onMobileNavigate }: { open: boolean; onMobileNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student' || user?.role === 'Student';

  const [mastersOpen, setMastersOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isItemActive = (item: SidebarItem): boolean => {
    if (item.label === 'My Dashboard') return pathname.startsWith('/student/dashboard');
    if (item.label === 'Dashboard') return pathname === '/dashboard';
    if (item.label === 'Students') return pathname === '/view-students' || pathname.startsWith('/students');
    return pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(`${item.to}/`));
  };

  const isMasterRoute = pathname.startsWith('/masters/');
  const activeMasterGroup = isMasterRoute
    ? masterGroups.find((g) => g.items.some((item) => isItemActive(item)))
    : undefined;
  const mastersRouteActive = !!activeMasterGroup;

  useEffect(() => {
    if (isMasterRoute) {
      setMastersOpen(true);
      if (activeMasterGroup) {
        setOpenGroups((prev) => ({ ...prev, [activeMasterGroup.title]: true }));
      }
    } else {
      setMastersOpen(false);
      setOpenGroups({});
    }
  }, [pathname]);

  const toggleMasters = () => setMastersOpen((v) => !v);
  const toggleGroup = (title: string) => setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  const mainItems: SidebarItem[] = isStudent
    ? [{ icon: <MyDashboardIcon />, label: 'My Dashboard', to: '/student/dashboard' }]
    : [
        { icon: <DashboardIcon />, label: 'Dashboard', to: '/dashboard' },
        { icon: <StudentsIcon />, label: 'Students', to: '/view-students' },
        { icon: <SponsorsIcon />, label: 'Sponsors', to: '/sponsors' },
        { icon: <RemindersIcon />, label: 'Reminders', to: '/reminders' },
      ];

  const adminItem: SidebarItem = { icon: <AdminIcon />, label: 'Admin Access', to: '/admins' };

  const signOut = () => {
    onMobileNavigate?.();
    logout();
    navigate('/login');
  };

  const sidebarState = open ? 'expanded' : 'collapsed';

  return (
    <aside className={`mobile-sidebar sidebar ${sidebarState}`} data-sidebar-state={sidebarState}>
      <div className="sidebarHead" />
      <div className="navGroup" key="main">
        {mainItems.map(item => {
          const active = isItemActive(item);
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

      {!isStudent && (
        <div className="navGroup" key="masters">
          <div className="nav-item">
            <div
              className={`nav-link navParent ${mastersOpen ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={toggleMasters}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMasters(); } }}
              title={!open ? 'Masters' : undefined}
            >
              <span className="navIcon"><LuFolderTree size={18} /></span>
              <span className="navLabel">Masters</span>
              <span className={`navChevron ${mastersOpen ? 'open' : ''}`} />
            </div>
            {mastersOpen && (
              <div className="navMastersBody">
                {masterGroups.map((group) => {
                  const groupOpen = !!openGroups[group.title];
                  const groupActive = group.items.some((item) => isItemActive(item));
                  return (
                    <div className="nav-item navMasterGroup" key={group.title}>
                      <div
                        className={`nav-link navParent navMasterGroupHead ${groupActive ? 'active' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleGroup(group.title)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(group.title); } }}
                        title={!open ? group.title : undefined}
                      >
                        <span className="navSection" aria-hidden={!open}>{group.title}</span>
                        <span className={`navChevron ${groupOpen ? 'open' : ''}`} />
                      </div>
                      {groupOpen && (
                        <div className="navMasterItems">
                          {group.items.map((item) => {
                            const active = isItemActive(item);
                            return (
                              <Link
                                key={item.label}
                                className={`nav-link navItem navMasterItem ${active ? 'active' : ''}`}
                                to={item.to}
                                title={!open ? item.label : undefined}
                                onClick={onMobileNavigate}
                              >
                                <span className="navIcon">{item.icon}</span>
                                <span className="navLabel">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!isStudent && (
        <div className="navGroup" key="admin">
          <div className="nav-item">
            <Link
              className={`nav-link navItem ${isItemActive(adminItem) ? 'active' : ''}`}
              to={adminItem.to}
              title={!open ? adminItem.label : undefined}
              onClick={onMobileNavigate}
            >
              <span className="navIcon">{adminItem.icon}</span>
              <span className="navLabel">{adminItem.label}</span>
            </Link>
          </div>
        </div>
      )}

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