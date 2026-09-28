import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './lib/api.js';
import { AuthContext, PageLoader, Toaster, useAuth } from './components/ui.jsx';
import { StudentLayout, AdminLayout } from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/student/Onboarding.jsx';
import Dashboard from './pages/student/Dashboard.jsx';
import Diagnose from './pages/student/Diagnose.jsx';
import PlanBuilding from './pages/student/PlanBuilding.jsx';
import Topic from './pages/student/Topic.jsx';
import Practice from './pages/student/Practice.jsx';
import Script from './pages/student/Script.jsx';
import AdminOverview from './pages/admin/Overview.jsx';
import Courses from './pages/admin/Courses.jsx';
import CourseDetail from './pages/admin/CourseDetail.jsx';
import StudentDetail from './pages/admin/StudentDetail.jsx';
import DiagnoseTasks from './pages/admin/DiagnoseTasks.jsx';
import PracticeTasks from './pages/admin/PracticeTasks.jsx';
import TaskEditor from './pages/admin/TaskEditor.jsx';
import ScriptEditor from './pages/admin/ScriptEditor.jsx';
import Topics from './pages/admin/Topics.jsx';
import Events from './pages/admin/Events.jsx';
import SettingsPage from './pages/admin/Settings.jsx';

function RequireStudent({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (!user.onboarded && loc.pathname !== '/start') return <Navigate to="/start" replace />;
  return children;
}
function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [state, setState] = useState({ loading: true, user: null, chatbotUrl: '' });

  const refresh = () => api.get('/me').then((d) => setState({ loading: false, user: d.user, chatbotUrl: d.chatbotUrl })).catch(() => setState({ loading: false, user: null, chatbotUrl: '' }));
  useEffect(() => { refresh(); }, []);

  const ctx = { ...state, setUser: (user) => setState((s) => ({ ...s, user })), refresh };
  if (state.loading) return <PageLoader />;

  return (
    <AuthContext.Provider value={ctx}>
      <Routes>
        <Route path="/login" element={state.user ? <Navigate to={state.user.role === 'admin' ? '/admin' : '/'} replace /> : <Login />} />
        <Route element={<RequireStudent><StudentLayout /></RequireStudent>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/start" element={<Onboarding />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/auswertung" element={<PlanBuilding />} />
          <Route path="/thema/:id" element={<Topic />} />
          <Route path="/ueben/:id" element={<Practice />} />
          <Route path="/skript/:topicId" element={<Script />} />
        </Route>
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminOverview />} />
          <Route path="kurse" element={<Courses />} />
          <Route path="kurse/:id" element={<CourseDetail />} />
          <Route path="kinder/:id" element={<StudentDetail />} />
          <Route path="diagnose" element={<DiagnoseTasks />} />
          <Route path="uebungen" element={<PracticeTasks />} />
          <Route path="aufgabe/:id" element={<TaskEditor />} />
          <Route path="skript" element={<ScriptEditor />} />
          <Route path="skript/:topicId" element={<ScriptEditor />} />
          <Route path="themen" element={<Topics />} />
          <Route path="termine" element={<Events />} />
          <Route path="einstellungen" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </AuthContext.Provider>
  );
}
