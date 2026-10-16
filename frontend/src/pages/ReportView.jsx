import React, { useEffect, useState } from 'react';
import { Download, FileText, Printer, ShieldAlert } from 'lucide-react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { reportService } from '../services/api';

function ReportView() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { reportService.getReport(reportId).then(setReport).catch(err => setError(err.message)); }, [reportId]);
  if (error) return <main className="page-content"><div className="login-error">Failed to load report: {error}</div></main>;
  if (!report) return <main className="page-content"><div className="panel empty-panel">Loading report...</div></main>;
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">STEP 6 · AI-ASSISTED REPORT</p><h1>Clinical report</h1><p className="muted">Detailed analysis with retrieved evidence · Generated today</p></div><div className="toolbar"><button className="outline-button" onClick={() => window.print()}><Printer size={13} /> Print</button><button className="primary-button" onClick={() => reportService.downloadPdf(reportId)}><Download size={13} /> Download PDF</button></div></div><section className="panel report-panel"><div className="report-summary"><div><div className="panel-title">Patient summary</div><div className="summary-grid"><span>Name<strong>Patient record</strong></span><span>Report ID<strong>{reportId.slice(-8)}</strong></span><span>Analysis date<strong>{new Date().toLocaleDateString()}</strong></span></div></div><div className="report-risk"><small>Final diagnosis</small><strong>Model-ranked finding</strong><span>Review required</span></div></div><div className="report-body"><article><div className="panel-title"><FileText size={14} /> Model findings</div><ReactMarkdown>{report.generated_report}</ReactMarkdown></article><aside><div className="panel-title"><ShieldAlert size={14} /> Medical safety notice</div><p>{report.disclaimer}</p><div className="panel-title" style={{ marginTop: 22 }}>Retrieved evidence</div><ul>{report.retrieved_references.map(ref => <li key={ref}>{ref}</li>)}</ul></aside></div></section></main>;
}
export default ReportView;
