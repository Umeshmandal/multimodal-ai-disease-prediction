import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Activity, BarChart3, BookOpen, FileText, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Users, X } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PredictionPage from './pages/PredictionPage';
import ReportView from './pages/ReportView';
import PatientHistory from './pages/PatientHistory';
import Analytics from './pages/Analytics';
import ExplainableAI from './pages/ExplainableAI';
import Reports from './pages/Reports';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Patient History', path: '/patients', icon: Users },
  { label: 'Patient Analysis', path: '/prediction', icon: Activity },
  { label: 'Explainable AI', path: '/xai', icon: Sparkles },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function Placeholder({ title }) {
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">MULTIMODAL AI DISEASE PREDICTION</p><h1>{title}</h1><p className="muted">Workspace configuration is available here.</p></div></div><section className="panel empty-panel"><Activity size={30} /><h2>{title}</h2><p>This module is ready for configuration.</p></section></main>;
}

function Shell({ children, onLogout }) {
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Activity size={17} /></span><div><strong>MULTIMODAL AI</strong><small>Disease Prediction</small></div><button className="mobile-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
      <nav>{navItems.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Icon size={15} /><span>{label}</span></NavLink>)}</nav>
      <div className="user-card"><span className="avatar">AD</span><div><strong>Administrator</strong><small>Authenticated user</small></div><button onClick={onLogout} aria-label="Logout"><LogOut size={15} /></button></div>
    </aside>
    <div className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)}><Menu size={21} /></button><div className="breadcrumb">Multimodal AI Disease Prediction <span>/</span> Clinical workspace</div><div className="top-actions"><span className="status-dot" /> System operational <button className="icon-button" aria-label="Notifications">●</button></div></header>{children}</div>
  </div>;
}

function App() {
  const [authenticated, setAuthenticated] = useState(!!localStorage.getItem('token'));
  const logout = () => { localStorage.removeItem('token'); setAuthenticated(false); };
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={authenticated ? <Navigate to="/dashboard" /> : <Login onLogin={() => setAuthenticated(true)} />} />
        <Route path="*" element={authenticated ? <Shell onLogout={logout}><Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/prediction" element={<PredictionPage />} /><Route path="/xai" element={<ExplainableAI />} /><Route path="/report/:reportId" element={<ReportView />} /><Route path="/patients" element={<PatientHistory />} /><Route path="/reports" element={<Reports />} /><Route path="/analytics" element={<Analytics />} /><Route path="/knowledge" element={<Placeholder title="Knowledge base" />} /><Route path="/settings" element={<Placeholder title="Settings" />} /><Route path="*" element={<Navigate to="/dashboard" />} /></Routes></Shell> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;