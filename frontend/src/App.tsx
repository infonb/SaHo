import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import StudentLayout from './components/layout/StudentLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/dashboard';
import StudentListPage from './pages/Students/StudentListPage';
import StudentFormPage from './pages/Students/StudentFormPage';
import SponsorListPage from './pages/Sponsors/SponsorListPage';
import SponsorFormPage from './pages/Sponsors/SponsorFormPage';
import AssignSponsorPage from './pages/Sponsors/AssignSponsorPage';
import VolunteerListPage from './pages/Volunteers/VolunteerListPage';
import VolunteerFormPage from './pages/Volunteers/VolunteerFormPage';
import AdminsPage from './pages/Admins/AdminsPage';
import ToastContainer from './components/common/ToastContainer';
import ViewEvents from './pages/Reminders/ViewEvents';
import EventFormPage from './pages/Reminders/EventFormPage';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';

function isTokenValid(): boolean {
  const token = localStorage.getItem('saho_token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function Guard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (!isAuthenticated || !isTokenValid()) {
    localStorage.removeItem('saho_token');
    localStorage.removeItem('saho_user');
    return <Navigate to="/login" replace />;
  }
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <>{children}</>;
}

function StudentGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (!isAuthenticated || !isTokenValid()) {
    localStorage.removeItem('saho_token');
    localStorage.removeItem('saho_user');
    return <Navigate to="/login" replace />;
  }
  if (role !== 'student') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Guard><AppLayout /></Guard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="view-students" element={<StudentListPage />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="add-student" element={<StudentFormPage />} />
            <Route path="students/add" element={<StudentFormPage />} />
            <Route path="students/edit/:id" element={<StudentFormPage />} />
            <Route path="sponsors" element={<SponsorListPage />} />
            <Route path="sponsors/add" element={<SponsorFormPage />} />
            <Route path="sponsors/edit/:id" element={<SponsorFormPage />} />
            <Route path="sponsors/view/:id" element={<SponsorFormPage />} />
            <Route path="sponsors/assign" element={<AssignSponsorPage />} />
            <Route path="reminders" element={<ViewEvents />} />
            <Route path="reminders/create" element={<EventFormPage />} />
            <Route path="reminders/view/:id" element={<EventFormPage mode="view" />} />
            <Route path="volunteers" element={<VolunteerListPage />} />
            <Route path="volunteers/add" element={<VolunteerFormPage />} />
            <Route path="volunteers/edit/:id" element={<VolunteerFormPage />} />
            <Route path="admins" element={<AdminsPage />} />
          </Route>
          <Route path="student/dashboard" element={<StudentGuard><StudentLayout /></StudentGuard>}>
            <Route index element={<StudentDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
