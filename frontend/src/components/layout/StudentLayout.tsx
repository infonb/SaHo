import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';

export default function StudentLayout() {
  return (
    <div className="appShell">
      <Topbar title="Student Dashboard" dashboardPath="/student/dashboard" headerClassName="topbarStudent" />
      <main className="layoutMain" style={{ marginLeft: 0, width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
