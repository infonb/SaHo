import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('saho-sidebar-open') === 'true');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem('saho-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => setSidebarOpen(value => !value);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`appShell ${sidebarOpen ? 'sidebarExpanded sidebar-open' : 'sidebarCollapsed'}`}>
      <Topbar sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />
      <button className="sidebar-overlay" type="button" aria-label="Close sidebar" onClick={closeSidebar} />
      <Sidebar open={sidebarOpen} />
      <main className="layoutMain">
        <div key={location.pathname} className="page-enter"><Outlet /></div>
      </main>
    </div>
  );
}
