/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Partners from './pages/Partners';
import Trainees from './pages/Trainees';
import Management from './pages/Management';
import Finance from './pages/Finance';
import ProjectDetails from './pages/ProjectDetails';
import Login from './pages/Login';
import FinancialGoal from './pages/FinancialGoal';
import FinancialHistory from './pages/FinancialHistory';
import Expenses from './pages/Expenses';
import TeamDashboard from './pages/TeamDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/team" element={<Team />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/trainees" element={<Trainees />} />
        <Route path="/management" element={<Management />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/goals" element={<FinancialGoal />} />
        <Route path="/financial-history" element={<FinancialHistory />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/team-dashboard" element={<TeamDashboard />} />
        <Route path="/partner-dashboard" element={<PartnerDashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
