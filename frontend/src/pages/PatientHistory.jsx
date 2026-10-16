import React, { useEffect, useState } from 'react';
import { Eye, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/api';

function PatientHistory() {
  const [patients, setPatients] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  useEffect(() => { patientService.listPatients().then(setPatients).catch(err => setError(err.response?.data?.detail || err.message)); }, []);
  const filtered = patients.filter(patient => `${patient.name} ${patient.email}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">STEP 7 · PATIENT HISTORY</p><h1>Patient history</h1><p className="muted">View and manage patient records used by the prediction workflow.</p></div><button className="primary-button" onClick={() => navigate('/prediction')}><Plus size={13} /> New analysis</button></div>{error && <div className="login-error">{error}</div>}<section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={14} /><input placeholder="Search patients" value={query} onChange={event => setQuery(event.target.value)} /></div><span className="panel-sub">{filtered.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Patient</th><th>Age / Gender</th><th>Email</th><th>Created</th><th>Action</th></tr></thead><tbody>{filtered.map(patient => <tr key={patient._id}><td><strong>{patient.name}</strong><small>{patient._id}</small></td><td>{patient.age} · {patient.gender}</td><td>{patient.email}</td><td>{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}</td><td><button className="table-action" onClick={() => navigate(`/patients/${patient._id}`)}><Eye size={13} /> View</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan="5" className="empty-table"><Users size={22} />No patient records yet. Create one from Patient Analysis.</td></tr>}</tbody></table></div></section></main>;
}
export default PatientHistory;
