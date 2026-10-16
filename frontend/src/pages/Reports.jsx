import React, { useEffect, useState } from 'react';
import { Eye, FileText, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';

function Reports() {
  const [reports, setReports] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  useEffect(() => { reportService.listReports().then(setReports).catch(err => setError(err.response?.data?.detail || err.message)); }, []);
  const filtered = reports.filter(report => `${report._id} ${report.generated_report}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">STEP 6 · AI-ASSISTED REPORTS</p><h1>Generated reports</h1><p className="muted">Reports created by the Python LLM and RAG pipeline.</p></div></div>{error && <div className="login-error">{error}</div>}<section className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={14} /><input placeholder="Search reports" value={query} onChange={event => setQuery(event.target.value)} /></div><span className="panel-sub">{filtered.length} reports</span></div><div className="table-wrap"><table><thead><tr><th>Report ID</th><th>Summary</th><th>References</th><th>Action</th></tr></thead><tbody>{filtered.map(report => <tr key={report._id}><td><strong>{report._id.slice(-8)}</strong></td><td>{report.generated_report.slice(0, 80)}...</td><td>{report.retrieved_references.length} sources</td><td><button className="table-action" onClick={() => navigate(`/report/${report._id}`)}><Eye size={13} /> Open</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan="4" className="empty-table"><FileText size={22} />No reports have been generated yet.</td></tr>}</tbody></table></div></section></main>;
}
export default Reports;
