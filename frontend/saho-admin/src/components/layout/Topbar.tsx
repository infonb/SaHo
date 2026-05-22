import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export const LeafLogo = () => (
  <svg className="brandMark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M24 42C13 32 11 19 24 7c13 12 11 25 0 35Z" fill="var(--br-100)" />
    <path d="M24 42c0-11 0-22 0-35" stroke="var(--br-500)" strokeWidth="3" />
    <path d="M24 23c-5-1-9-4-12-9 7 0 12 3 12 9Z" fill="var(--green-bg)" />
    <path d="M24 25c6-1 10-4 13-10-8 0-13 4-13 10Z" fill="var(--green-border)" />
  </svg>
);

export default function Topbar({ sidebarOpen, onToggleSidebar }: { sidebarOpen: boolean; onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <button className="sidebarToggle topbarSidebarToggle" type="button" aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} onClick={onToggleSidebar}>
          <span />
          <span />
          <span />
        </button>
        <div className="topbarTitle">Admin Dashboard</div>
      </div>
      <div ref={ref} style={{ position: 'relative' }}>
        <button className="userPill" onClick={() => setOpen(value => !value)}>
          <Avatar name={user?.username ?? 'Admin'} size="sm" />
          {user?.username}
        </button>
        {open && (
          <div className="dropdown">
            <div className="rowFlex">
              <Avatar name={user?.username ?? 'Admin'} />
              <div>
                <div className="strong">{user?.username}</div>
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
      </div>
    </header>
  );
}
