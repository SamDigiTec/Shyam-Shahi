import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import { PortfolioDataProvider } from './hooks/usePortfolioData';
import { AuthProvider } from './hooks/useAuth';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { ContactPage } from './pages/ContactPage';
import { DynamicPage } from './pages/DynamicPage';
import {
  AdminForgotPasswordPage,
  AdminLoginPage,
  AdminSignupPage,
} from './admin/AdminAuthPages';
import { AdminDashboard } from './admin/AdminDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PortfolioDataProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Website Routes */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <HomePage />
                  </PublicLayout>
                }
              />
              <Route
                path="/about"
                element={
                  <PublicLayout>
                    <AboutPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/projects"
                element={
                  <PublicLayout>
                    <ProjectsPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/projects/:slug"
                element={
                  <PublicLayout>
                    <ProjectDetailPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/services"
                element={
                  <PublicLayout>
                    <ServicesPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/contact"
                element={
                  <PublicLayout>
                    <ContactPage />
                  </PublicLayout>
                }
              />

              {/* Admin Authentication & Protected CMS Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/signup" element={<AdminSignupPage />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Custom Dynamic CMS Pages */}
              <Route
                path="/:slug"
                element={
                  <PublicLayout>
                    <DynamicPage />
                  </PublicLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </PortfolioDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
