import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StudentListPage from './pages/Students/StudentListPage';
import StudentFormPage from './pages/Students/StudentFormPage';
import SponsorListPage from './pages/Sponsors/SponsorListPage';
import SponsorFormPage from './pages/Sponsors/SponsorFormPage';
import AssignSponsorPage from './pages/Sponsors/AssignSponsorPage';
import VolunteerListPage from './pages/Volunteers/VolunteerListPage';
import VolunteerFormPage from './pages/Volunteers/VolunteerFormPage';
import AdminsPage from './pages/Admins/AdminsPage';
import ToastContainer from './components/common/ToastContainer';
import RemindersPage from './pages/Reminders/RemindersPage';

function Guard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
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
            <Route path="students" element={<StudentListPage />} />
            <Route path="students/add" element={<StudentFormPage />} />
            <Route path="students/edit/:id" element={<StudentFormPage />} />
            <Route path="sponsors" element={<SponsorListPage />} />
            <Route path="sponsors/add" element={<SponsorFormPage />} />
            <Route path="sponsors/edit/:id" element={<SponsorFormPage />} />
            <Route path="sponsors/assign" element={<AssignSponsorPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="volunteers" element={<VolunteerListPage />} />
            <Route path="volunteers/add" element={<VolunteerFormPage />} />
            <Route path="volunteers/edit/:id" element={<VolunteerFormPage />} />
            <Route path="admins" element={<AdminsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
