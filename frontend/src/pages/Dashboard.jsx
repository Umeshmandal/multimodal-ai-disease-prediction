import React from 'react';
import { Activity, AlertTriangle, ClipboardList, FileText, Plus, ShieldCheck, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const activity = [
  ['P-1042', 'Patient registered · High risk (72%)', '2 hours ago', AlertTriangle],
  ['P-1041', 'Report generated', '4 hours ago', FileText],
  ['P-1040', 'New analysis started', '5 hours ago', Activity],
  ['P-1039', 'Analysis completed · Low risk (18%)', '7 hours ago', ShieldCheck],
];

function Dashboard() {
  const navigate = useNavigate();
  return <main className="page-content">
    <div className="page-heading"><div><p className="eyebrow">TUESDAY, APRIL 26, 2025</p><h1>Welcome back</h1><p className="muted">Here is your project overview for today.</p></div><button className="primary-button" onClick={() => navigate('/prediction')}><Plus size={14} /> New analysis</button></div>
    <section className="kpi-grid">
      <div className="panel kpi-card"><div className="kpi-label"><span className="kpi-icon"><ClipboardList size={14} /></span> Total patients</div><div className="kpi-value">48</div><span className="trend">↗ 12% from last month</span></div>
      <div className="panel kpi-card"><div className="kpi-label"><span className="kpi-icon" style={{ color: '#14a579', background: '#e6f8f1' }}><Activity size={14} /></span> Predictions made</div><div className="kpi-value">42</div><span className="trend">↗ 8% from last month</span></div>
      <div className="panel kpi-card"><div className="kpi-label"><span className="kpi-icon" style={{ color: '#ed5e65', background: '#fff0f1' }}><AlertTriangle size={14} /></span> High risk cases</div><div className="kpi-value">7</div><span className="trend" style={{ color: '#ed5e65' }}>↗ 2 from last month</span></div>
      <div className="panel kpi-card"><div className="kpi-label"><span className="kpi-icon" style={{ color: '#8065e8', background: '#f0edff' }}><FileText size={14} /></span> Reports generated</div><div className="kpi-value">38</div><span className="trend">↗ 5% from last month</span></div>
    </section>
    <section className="dashboard-grid">
      <div className="panel"><div className="panel-header"><div><div className="panel-title">Recent activity</div><div className="panel-sub">Latest updates from your workspace</div></div><button className="icon-button">•••</button></div><div className="activity-list">{activity.map(([id, text, time, Icon]) => <div className="activity-row" key={id}><span className="activity-badge"><Icon size={13} /></span><div><strong>Patient {id}</strong><small>{text}</small></div><span className="time">{time}</span></div>)}</div></div>
      <div className="panel"><div className="panel-header"><div><div className="panel-title">Prediction overview</div><div className="panel-sub">Risk distribution over the last 7 days</div></div><TrendingUp size={15} color="#1a7de6" /></div><div className="chart"><div className="bar" style={{ height: '42%' }} data-day="Mon" /><div className="bar green" style={{ height: '61%' }} data-day="Tue" /><div className="bar" style={{ height: '50%' }} data-day="Wed" /><div className="bar green" style={{ height: '74%' }} data-day="Thu" /><div className="bar" style={{ height: '58%' }} data-day="Fri" /><div className="bar green" style={{ height: '83%' }} data-day="Sat" /><div className="bar" style={{ height: '66%' }} data-day="Sun" /></div><div className="legend"><span><i />Low risk</span><span><i className="green" />Medium risk</span><span><i className="red" />High risk</span></div></div>
    </section>
    <section className="panel" style={{ marginTop: 12 }}><div className="panel-header"><div><div className="panel-title">Common diseases detected</div><div className="panel-sub">Across all completed predictions</div></div></div><div className="kpi-grid" style={{ padding: '6px 16px 18px', gridTemplateColumns: 'repeat(4, 1fr)' }}><div><div className="kpi-label">Brain tumor</div><div className="kpi-value" style={{ fontSize: 17 }}>18%</div></div><div><div className="kpi-label">Pneumonia</div><div className="kpi-value" style={{ fontSize: 17 }}>14%</div></div><div><div className="kpi-label">Brain stroke</div><div className="kpi-value" style={{ fontSize: 17 }}>12%</div></div><div><div className="kpi-label">Heart disease</div><div className="kpi-value" style={{ fontSize: 17 }}>10%</div></div></div></section>
  </main>;
}
export default Dashboard;
