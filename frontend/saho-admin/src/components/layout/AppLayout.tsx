import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('saho-sidebar-open') !== 'false');

  useEffect(() => {
    localStorage.setItem('saho-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  return <div className={`appShell ${sidebarOpen ? '' : 'sidebarClosed'}`}><Topbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(value => !value)} /><Sidebar open={sidebarOpen} /><main className="layoutMain"><div key={location.pathname} className="page-enter"><Outlet /></div></main></div>;
}
