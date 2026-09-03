import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import authService from './services/authService';
import api from './services/apiClient';

// Layouts
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';

// Pages
import HomePage           from './pages/HomePage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import ResetPasswordPage   from './pages/ResetPasswordPage';
import CoursesPage        from './pages/CoursesPage';
import CourseDetailPage   from './pages/CourseDetailPage';
import ModulePage         from './pages/ModulePage';
import ExamPage           from './pages/ExamPage';
import MyLearningPage     from './pages/MyLearningPage';
import ProfilePage        from './pages/ProfilePage';
import CertificatesPage   from './pages/CertificatesPage';
import CommunityPage      from './pages/CommunityPage';
import CommunityPostPage  from './pages/CommunityPostPage';
import MentorshipPage     from './pages/MentorshipPage';
import NotificationsPage  from './pages/NotificationsPage';
import AdminDashboardPage   from './pages/AdminDashboardPage';
import AdminUsersPage       from './pages/AdminUsersPage';
import AdminCommunityPage   from './pages/AdminCommunityPage';
import AdminBadgesPage      from './pages/AdminBadgesPage';
import AdminCoursesPage     from './pages/AdminCoursesPage';
import AdminQuestionsPage   from './pages/AdminQuestionsPage';
import AdminMentorshipPage  from './pages/AdminMentorshipPage';
import AdminLogsPage        from './pages/AdminLogsPage';
import AdminExceptionsPage  from './pages/AdminExceptionsPage';
import AdminAnalyticsPage   from './pages/AdminAnalyticsPage';
import MentorDashboardPage   from './pages/MentorDashboardPage';
import NotFoundPage           from './pages/NotFoundPage';

// ── Guards ──────────────────────────────────────────────────────────────────

function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireAdmin({ user, children }) {
  if (!user || !['admin', 'pastor'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// ── Certificate verify (public, no auth) ────────────────────────────────────

function CertVerifyPage() {
  const { code }           = useParams();
  const [data, setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState(null);

  useEffect(() => {
    api.get(`/certificates/verify/${code}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="dp-card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="dp-card__body" style={{ padding: 40 }}>
          {loading
            ? <div className="dp-spinner" style={{ margin: '0 auto' }} />
            : error
              ? <><div style={{ fontSize: 48 }}>❌</div><h2>Invalid Certificate</h2><p style={{ color: 'var(--dp-gray)' }}>This certificate code could not be found.</p></>
              : <>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
                  <h2 style={{ color: 'var(--dp-green)', marginBottom: 8 }}>✅ Verified</h2>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: '0 0 4px' }}>
                    <strong>{data.holder}</strong> successfully completed
                  </p>
                  <h3 style={{ color: 'var(--dp-blue)', marginBottom: 12 }}>{data.course}</h3>
                  <p style={{ color: 'var(--dp-gray)', fontSize: 13, margin: '0 0 12px' }}>
                    Issued: {new Date(data.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--dp-gray)', background: 'var(--dp-light)', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
                    {data.certificate_code}
                  </div>
                </>
          }
        </div>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(() => authService.getUser());

  const handleLogin      = useCallback((u) => setUser(u), []);
  const handleLogout     = useCallback(() => setUser(null), []);
  const handleUserUpdate = useCallback((u) => {
    setUser(u);
    localStorage.setItem('dp_user', JSON.stringify(u));
  }, []);

  return (
    <BrowserRouter>
      <AppInner user={user} onLogin={handleLogin} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
    </BrowserRouter>
  );
}

const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

function AppInner({ user, onLogin, onLogout, onUserUpdate }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const hideChrome = AUTH_ONLY_PATHS.includes(location.pathname);

  // Token was rejected as invalid/expired/revoked by the API (apiClient clears
  // localStorage and fires this) — reset auth state and send the user to login.
  useEffect(() => {
    const handler = () => {
      onLogout();
      navigate('/login');
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [onLogout, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideChrome && <Navbar user={user} onLogout={onLogout} />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<HomePage user={user} />} />
          <Route path="/login"           element={<LoginPage onLogin={onLogin} />} />
          <Route path="/register"        element={<RegisterPage onLogin={onLogin} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/courses"         element={<CoursesPage user={user} />} />
          <Route path="/courses/:id"     element={<CourseDetailPage user={user} />} />
          <Route path="/community"       element={<CommunityPage user={user} />} />
          <Route path="/community/:id"   element={<CommunityPostPage user={user} />} />
          <Route path="/certificates/verify/:code" element={<CertVerifyPage />} />

          {/* Protected — students */}
          <Route path="/my-learning"    element={<RequireAuth user={user}><MyLearningPage user={user} /></RequireAuth>} />
          <Route path="/modules/:id"    element={<RequireAuth user={user}><ModulePage user={user} /></RequireAuth>} />
          <Route path="/exam/:moduleId" element={<RequireAuth user={user}><ExamPage user={user} /></RequireAuth>} />
          <Route path="/profile"        element={<RequireAuth user={user}><ProfilePage user={user} onUserUpdate={onUserUpdate} /></RequireAuth>} />
          <Route path="/certificates"   element={<RequireAuth user={user}><CertificatesPage user={user} /></RequireAuth>} />
          <Route path="/notifications"  element={<RequireAuth user={user}><NotificationsPage user={user} /></RequireAuth>} />
          <Route path="/mentorship"     element={<RequireAuth user={user}><MentorshipPage user={user} /></RequireAuth>} />

          {/* Admin */}
          {/* Mentor hub */}
          <Route path="/mentor"  element={<RequireAuth user={user}><MentorDashboardPage user={user} /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin"              element={<RequireAdmin user={user}><AdminDashboardPage  user={user} /></RequireAdmin>} />
          <Route path="/admin/users"        element={<RequireAdmin user={user}><AdminUsersPage      user={user} /></RequireAdmin>} />
          <Route path="/admin/community"    element={<RequireAdmin user={user}><AdminCommunityPage  user={user} /></RequireAdmin>} />
          <Route path="/admin/badges"       element={<RequireAdmin user={user}><AdminBadgesPage /></RequireAdmin>} />
          <Route path="/admin/courses"      element={<RequireAdmin user={user}><AdminCoursesPage    user={user} /></RequireAdmin>} />
          <Route path="/admin/questions"    element={<RequireAdmin user={user}><AdminQuestionsPage  user={user} /></RequireAdmin>} />
          <Route path="/admin/mentorship"   element={<RequireAdmin user={user}><AdminMentorshipPage user={user} /></RequireAdmin>} />
          <Route path="/admin/logs"         element={<RequireAdmin user={user}><AdminLogsPage        user={user} /></RequireAdmin>} />
          <Route path="/admin/exceptions"   element={<RequireAdmin user={user}><AdminExceptionsPage  user={user} /></RequireAdmin>} />
          <Route path="/admin/analytics"    element={<RequireAdmin user={user}><AdminAnalyticsPage   user={user} /></RequireAdmin>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!hideChrome && <Footer />}
    </div>
  );
}
