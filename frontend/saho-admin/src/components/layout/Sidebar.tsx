import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const groups = [
  { title: 'Overview', items: [{ icon: 'H', label: 'Dashboard', to: '/dashboard' }] },
  {
    title: 'Modules',
    items: [
      { icon: 'St', label: 'Students', to: '/students', children: [{ label: 'View Students', to: '/students' }, { label: 'Add Student', to: '/students/add' }] },
      { icon: 'Sp', label: 'Sponsors', to: '/sponsors', children: [{ label: 'View Sponsors', to: '/sponsors' }, { label: 'Add Sponsor', to: '/sponsors/add' }, { label: 'Assign to Student', to: '/sponsors/assign' }] },
      { icon: 'R', label: 'Reminders', to: '/reminders' },
      { icon: 'A', label: 'Admin Access', to: '/admins' },
    ],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebarLogo">
        <span className="sidebarLogoText">SaHo</span>
        <span className="sidebarLogoSprout" />
      </div>
      {groups.map(group => (
        <div key={group.title}>
          <div className="navSection">{group.title}</div>
          {group.items.map(item => {
            const active = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(`${item.to}/`));
            return (
              <div key={item.label}>
                <Link className={`${item.children ? 'navParent' : 'navItem'} ${active ? 'active' : ''}`} to={item.to}>
                  <span className="navIcon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.children && <span className="navChevron" />}
                </Link>
                {item.children && active && item.children.map(sub => (
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
      <button className="sidebarSignOut" onClick={signOut}>
        <span className="navIcon">S</span>
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
