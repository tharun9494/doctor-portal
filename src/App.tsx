import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DoctorAuthProvider, useDoctorAuth } from './contexts/DoctorAuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Features from './pages/Features';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientAnalytics from './pages/admin/PatientAnalytics';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSettings from './pages/admin/AdminSettings';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import TimeSlots from './pages/doctor/TimeSlots';
import Appointments from './pages/doctor/Appointments';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Protected Route Components
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  return currentUser && userRole === 'admin' ? <>{children}</> : <Navigate to="/login" replace />;
};

const DoctorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { doctorUser } = useDoctorAuth();
  
  return doctorUser ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();
  const { doctorUser } = useDoctorAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  // Redirect authenticated users to their respective dashboards
  if (currentUser && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (doctorUser) {
    return <Navigate to="/doctor/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <DoctorAuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicRoute>
                <div className="min-h-screen bg-white">
                  <Navbar />
                  <main><Home /></main>
                  <Footer />
                </div>
              </PublicRoute>
            } />
            
            <Route path="/services" element={
              <PublicRoute>
                <div className="min-h-screen bg-white">
                  <Navbar />
                  <main><Services /></main>
                  <Footer />
                </div>
              </PublicRoute>
            } />
            
            <Route path="/features" element={
              <PublicRoute>
                <div className="min-h-screen bg-white">
                  <Navbar />
                  <main><Features /></main>
                  <Footer />
                </div>
              </PublicRoute>
            } />
            
            <Route path="/about" element={
              <PublicRoute>
                <div className="min-h-screen bg-white">
                  <Navbar />
                  <main><About /></main>
                  <Footer />
                </div>
              </PublicRoute>
            } />
            
            <Route path="/contact" element={
              <PublicRoute>
                <div className="min-h-screen bg-white">
                  <Navbar />
                  <main><Contact /></main>
                  <Footer />
                </div>
              </PublicRoute>
            } />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            <Route path="/admin/doctors" element={
              <AdminRoute>
                <DoctorManagement />
              </AdminRoute>
            } />
            
            <Route path="/admin/analytics" element={
              <AdminRoute>
                <PatientAnalytics />
              </AdminRoute>
            } />
            
            <Route path="/admin/profile" element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
            } />
            
            <Route path="/admin/settings" element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            } />

            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <DoctorRoute>
                <DoctorDashboard />
              </DoctorRoute>
            } />

            <Route path="/doctor/slots" element={
              <DoctorRoute>
                <TimeSlots />
              </DoctorRoute>
            } />

            <Route path="/doctor/appointments" element={
              <DoctorRoute>
                <Appointments />
              </DoctorRoute>
            } />

            <Route path="/doctor/profile" element={
              <DoctorRoute>
                <DoctorProfile />
              </DoctorRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DoctorAuthProvider>
    </AuthProvider>
  );
}

export default App;