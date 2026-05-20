import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const location = useLocation();
  return <><Topbar /><Sidebar /><main className="layoutMain"><div key={location.pathname} className="page-enter"><Outlet /></div></main></>;
}
