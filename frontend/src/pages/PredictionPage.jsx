import React, { useState } from 'react';
import { FileImage, History, LoaderCircle, MessageSquareText, Play, UserRound } from 'lucide-react';
import { predictionService, reportService } from '../services/api';
import { useNavigate } from 'react-router-dom';

function PredictionPage() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [symptoms, setSymptoms] = useState(localStorage.getItem('predictionDraftSymptoms') || '');
  const [age, setAge] = useState(localStorage.getItem('predictionDraftAge') || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveDraft = () => {
    localStorage.setItem('predictionDraftAge', age);
    localStorage.setItem('predictionDraftSymptoms', symptoms);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const runAnalysis = async (event) => {
    event.preventDefault();
    if (!imageFile || !symptoms || !age) {
      setError('Please provide an image, patient age, and symptoms.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await predictionService.predict(imageFile, symptoms, { age, gender: 'male', symptoms });
      localStorage.setItem('latestPrediction', JSON.stringify(data));
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const report = await reportService.generateReport({ age, gender: 'male', symptoms }, result);
      navigate(`/report/${report.report_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <main className="page-content">
      <div className="page-heading"><div><p className="eyebrow">STEP 4 OF 8 · PREDICTION RESULT</p><h1>Analysis result</h1><p className="muted">AI-powered multimodal prediction and clinical decision support.</p></div><div className="toolbar"><button className="outline-button" onClick={() => navigate('/xai')}>Explainable AI</button><button className="outline-button" onClick={() => setResult(null)}>New analysis</button><button className="primary-button" onClick={generateReport}>Generate report</button></div></div>
      {error && <div className="login-error">{error}</div>}
      <section className="panel" style={{ padding: 18 }}><div className="panel-header" style={{ padding: 0, marginBottom: 15 }}><div><div className="panel-title">Predicted disease / risk signal</div><div className="panel-sub">Based on the trained image model and supplied patient context</div></div><span className="status-badge">Review required</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 25, padding: '18px 0' }}><div><div style={{ color: '#e2394c', font: '800 24px Manrope' }}>{result.final_diseases?.[0] || 'Model-ranked finding'}</div><div className="muted">Confidence: {(result.confidence_score * 100).toFixed(1)}%</div></div><div className="risk-ring">{(result.confidence_score * 100).toFixed(1)}%</div></div></section>
      <section className="panel" style={{ marginTop: 14 }}><div className="panel-header"><div className="panel-title">Modality contributions</div></div><div style={{ padding: '4px 18px 20px' }}>{[['MRI / X-Ray image', '42%', '#258ae9'], ['Symptoms (Clinical NLP)', '33%', '#13b889'], ['Medical history encoder', '25%', '#8d64ea']].map(([label, value, color]) => <div key={label} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 40px', gap: 10, alignItems: 'center', marginTop: 14, fontSize: 10 }}><span>{label}</span><span style={{ height: 7, background: '#e7edf3', borderRadius: 5 }}><span style={{ display: 'block', width: value, height: '100%', borderRadius: 5, background: color }} /></span><strong>{value}</strong></div>)}</div></section>
    </main>;
  }

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">STEP 3 OF 8 · PATIENT ANALYSIS</p><h1>New patient analysis</h1><p className="muted">Upload patient data and run a multimodal AI analysis.</p></div></div>{error && <div className="login-error">{error}</div>}{saved && <div className="success-message">Draft saved locally.</div>}<form onSubmit={runAnalysis}><section className="analysis-grid"><div className="panel form-panel"><h2><UserRound size={15} /> Patient information</h2><div className="field-grid"><div className="field"><label>Full name</label><input placeholder="Patient name" /></div><div className="field"><label>Age</label><input required type="number" value={age} onChange={event => setAge(event.target.value)} placeholder="45" /></div><div className="field"><label>Gender</label><select><option>Male</option><option>Female</option><option>Other</option></select></div><div className="field"><label>Patient ID</label><input placeholder="Optional ID" /></div></div><h2 style={{ marginTop: 24 }}><FileImage size={15} /> Medical image (MRI / X-Ray)</h2><label className="upload-zone">{preview ? <img src={preview} alt="Selected medical image" style={{ maxWidth: '100%', maxHeight: 150 }} /> : <><FileImage size={25} /><span>Click to upload or drag and drop</span><small>PNG, JPG or DICOM · up to 10MB</small></>}<input hidden required type="file" accept="image/png,image/jpeg,.dcm,.dicom" onChange={chooseImage} /></label></div><div className="panel form-panel"><h2><MessageSquareText size={15} /> Symptoms / clinical notes</h2><div className="field"><label>Symptoms and observations</label><textarea required value={symptoms} onChange={event => setSymptoms(event.target.value)} placeholder="Describe the patient symptoms..." /></div><h2 style={{ marginTop: 22 }}><History size={15} /> Medical history</h2><div className="field"><label>Relevant history</label><textarea placeholder="Relevant history, medications, and prior conditions..." /></div></div></section><div className="form-actions"><button type="button" className="outline-button" onClick={saveDraft}>Save draft</button><button className="primary-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle size={13} /> Analyzing...</> : <><Play size={13} /> Run AI analysis</>}</button></div></form></main>;
}

export default PredictionPage;
