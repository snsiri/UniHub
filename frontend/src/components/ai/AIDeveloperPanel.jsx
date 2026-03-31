import React, { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiRefreshCw, FiCpu } from 'react-icons/fi';

const AIDeveloperPanel = () => {
  const [modules,  setModules]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [newMod,   setNewMod]   = useState({ moduleCode: '', moduleName: '', keywords: '', semester: '', year: '', department: '' });
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modsRes, statsRes] = await Promise.all([aiAPI.getModules(), aiAPI.getStats()]);
      setModules(modsRes.data);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const handleAddModule = async () => {
    if (!newMod.moduleCode || !newMod.moduleName) return toast.error('Code and name required');
    try {
      await aiAPI.addModule({ ...newMod, keywords: newMod.keywords.split(',').map(k => k.trim()).filter(Boolean) });
      toast.success('Module added/updated!');
      setNewMod({ moduleCode: '', moduleName: '', keywords: '', semester: '', year: '', department: '' });
      fetchData();
    } catch { toast.error('Failed to save module'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this module?')) return;
    try { await aiAPI.deleteModule(id); fetchData(); toast.success('Deleted'); } catch {}
  };

  const handleTest = async () => {
    if (!testText.trim()) return;
    try {
      const { data } = await aiAPI.classify(testText);
      setTestResult(data);
    } catch { toast.error('Classification failed'); }
  };

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <FiCpu className="dev-panel-icon" />
        <h1>AI Developer Panel</h1>
        <button className="btn-icon" onClick={fetchData}><FiRefreshCw /></button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-num">{stats.total}</div><div className="stat-label">Study Materials</div></div>
          <div className="stat-card"><div className="stat-num">{stats.withAICode}</div><div className="stat-label">AI Classified</div></div>
          <div className="stat-card"><div className="stat-num">{stats.mismatch}</div><div className="stat-label">Misclassified</div></div>
          <div className="stat-card accent"><div className="stat-num">{stats.accuracy}%</div><div className="stat-label">Accuracy</div></div>
        </div>
      )}

      {/* Test Classifier */}
      <div className="dev-section">
        <h2>🧪 Test Classifier</h2>
        <textarea rows={4} placeholder="Paste content to test classification..."
          value={testText} onChange={e => setTestText(e.target.value)} className="dev-textarea" />
        <button className="btn-primary" onClick={handleTest}>Run Classification</button>
        {testResult && (
          <div className="test-result">
            <div><strong>Module Code:</strong> {testResult.moduleCode || 'Not detected'}</div>
            <div><strong>Category:</strong>    {testResult.category}</div>
            <div><strong>Confidence:</strong>  {testResult.confidence}%</div>
            <div><strong>Suggested Tags:</strong> {testResult.tags?.join(', ')}</div>
          </div>
        )}
      </div>

      {/* Add / Update Module */}
      <div className="dev-section">
        <h2>➕ Add / Update Module</h2>
        <div className="module-form">
          <input placeholder="Module Code*" value={newMod.moduleCode}
            onChange={e => setNewMod({ ...newMod, moduleCode: e.target.value.toUpperCase() })} className="input-field" />
          <input placeholder="Module Name*" value={newMod.moduleName}
            onChange={e => setNewMod({ ...newMod, moduleName: e.target.value })} className="input-field" />
          <input placeholder="Keywords (comma-separated)" value={newMod.keywords}
            onChange={e => setNewMod({ ...newMod, keywords: e.target.value })} className="input-field" />
          <input placeholder="Semester (1-8)" type="number" value={newMod.semester}
            onChange={e => setNewMod({ ...newMod, semester: e.target.value })} className="input-field" />
          <input placeholder="Year (1-4)" type="number" value={newMod.year}
            onChange={e => setNewMod({ ...newMod, year: e.target.value })} className="input-field" />
          <input placeholder="Department" value={newMod.department}
            onChange={e => setNewMod({ ...newMod, department: e.target.value })} className="input-field" />
          <button className="btn-primary" onClick={handleAddModule}><FiPlus /> Save Module</button>
        </div>
      </div>

      {/* Module Dataset Table */}
      <div className="dev-section">
        <h2>📚 Module Dataset ({modules.length} modules)</h2>
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>Sem</th><th>Year</th><th>Keywords</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {modules.map(m => (
                <tr key={m._id}>
                  <td><span className="module-badge">{m.moduleCode}</span></td>
                  <td>{m.moduleName}</td>
                  <td>{m.semester || '-'}</td>
                  <td>{m.year || '-'}</td>
                  <td className="keywords-cell">{m.keywords?.slice(0, 4).join(', ')}{m.keywords?.length > 4 ? '...' : ''}</td>
                  <td>
                    <button className="btn-icon danger" onClick={() => handleDelete(m._id)}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIDeveloperPanel;
