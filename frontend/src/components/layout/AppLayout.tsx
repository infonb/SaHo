import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AiSidebar from './AiSidebar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('saho-sidebar-open') === 'true');
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
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
  const closeMobileSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const toggleAiSidebar = () => setAiSidebarOpen((value) => !value);
  const closeAiSidebar = () => setAiSidebarOpen(false);

  return (
    <div className={`appShell ${sidebarOpen ? 'sidebarExpanded sidebar-open' : 'sidebarCollapsed'} ${aiSidebarOpen ? 'aiSidebarOpen' : ''}`}>
      <Topbar sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} onAiOpen={toggleAiSidebar} />
      <button className="sidebar-overlay" type="button" aria-label="Close sidebar" onClick={closeSidebar} />
      <Sidebar open={sidebarOpen} onMobileNavigate={closeMobileSidebar} />
      <AiSidebar open={aiSidebarOpen} onClose={closeAiSidebar} />
      <main className="layoutMain">
        <div key={location.pathname} className="page-enter"><Outlet /></div>
      </main>
    </div>
  );
}
