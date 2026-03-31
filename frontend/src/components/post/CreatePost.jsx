import React, { useState, useRef } from 'react';
import { postAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MentionInput from '../common/MentionInput';
import toast from 'react-hot-toast';
import { FiFile, FiBarChart2, FiX, FiCpu, FiLink, FiImage, FiVideo } from 'react-icons/fi';

const MATERIAL_TYPES = ['Lecture Note','Tutorial','Past Paper','Lab Sheet','Reference Material'];

const CreatePost = ({ onPostCreated, defaultType = 'post' }) => {
  const { user } = useAuth();
  const fileRef  = useRef(null);
  const [content,      setContent]      = useState('');
  const [visibility,   setVisibility]   = useState('public');
  const [postType,     setPostType]     = useState(defaultType);
  const [files,        setFiles]        = useState([]);
  const [links,        setLinks]        = useState([]);
  const [linkInput,    setLinkInput]    = useState('');
  const [moduleCode,   setModuleCode]   = useState('');
  const [materialType, setMaterialType] = useState('');
  const [semester,     setSemester]     = useState('');
  const [tags,         setTags]         = useState([]);
  const [tagInput,     setTagInput]     = useState('');
  const [showPoll,     setShowPoll]     = useState(false);
  const [pollQ,        setPollQ]        = useState('');
  const [pollOpts,     setPollOpts]     = useState(['','']);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiSug,        setAiSug]        = useState(null);
  const [similar,      setSimilar]      = useState([]);
  const [loading,      setLoading]      = useState(false);

  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=2D6A4F&color=fff&size=64`;

  const isValidModuleCode = (code) => /^[A-Za-z]{2}\d{4}$/.test(code);
  
  const handleFiles = (e) => setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeFile  = (i)  => setFiles(prev => prev.filter((_,j) => j !== i));
  const addLink = () => { if (linkInput.trim()) { setLinks(prev => [...prev, linkInput.trim()]); setLinkInput(''); } };
  const addTag  = (e) => { if (e.key === 'Enter' && tagInput.trim()) { setTags(prev => [...new Set([...prev, tagInput.trim()])]); setTagInput(''); e.preventDefault(); } };

  const handleAI = async () => {
    if (!content.trim()) return toast.error('Write some content first');
    setAiLoading(true);
    try {
      const [cl, sim] = await Promise.all([
        aiAPI.classify(content),
        postType === 'study_material' ? aiAPI.checkSimilarity(content) : Promise.resolve({ data: [] })
      ]);
      setAiSug(cl.data);
      setSimilar(sim.data || []);
      if (cl.data.moduleCode  && !moduleCode)    setModuleCode(cl.data.moduleCode);
      if (cl.data.category    && !materialType)  setMaterialType(cl.data.category);
      if (cl.data.tags?.length) setTags(prev => [...new Set([...prev, ...cl.data.tags])]);
      toast.success('AI suggestions applied!');
    } catch { toast.error('AI classify failed'); }
    setAiLoading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0 && links.length === 0 && !showPoll)
      return toast.error('Post cannot be empty');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content',    content);
      fd.append('visibility', visibility);
      fd.append('postType',   postType);
      fd.append('links',      JSON.stringify(links));
      fd.append('tags',       JSON.stringify(tags));
      files.forEach(f => fd.append('media', f));

      if (postType === 'study_material') {
        fd.append('moduleCode',   moduleCode);
        fd.append('materialType', materialType);
        if (semester) fd.append('semester', semester);
      }
      if (showPoll && pollQ) {
        fd.append('poll', JSON.stringify({ question: pollQ, options: pollOpts.filter(o => o.trim()) }));
      }
      if (aiSug?.moduleCode) fd.append('aiModuleCode', aiSug.moduleCode);
      if (aiSug?.category)   fd.append('aiCategory',   aiSug.category);
      if (postType === 'study_material' && !isValidModuleCode(moduleCode)) {
        return toast.error('Module code must be 2 letters followed by 4 digits (e.g. CS3040)');
      }
      const { data } = await postAPI.createPost(fd);
      onPostCreated?.(data);
      setContent(''); setFiles([]); setLinks([]); setTags([]);
      setModuleCode(''); setMaterialType(''); setSemester('');
      setShowPoll(false); setPollQ(''); setPollOpts(['','']);
      setAiSug(null); setSimilar([]);
      toast.success('Posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    }
    setLoading(false);
  };

  return (
    <div className="create-post-card">
      <div className="create-post-header">
        <img src={avatarUrl} alt={user?.name} className="create-post-avatar" />
        <div className="create-post-type-tabs">
          <button className={`type-tab ${postType === 'post' ? 'active' : ''}`} onClick={() => setPostType('post')}>Post</button>
          <button className={`type-tab ${postType === 'study_material' ? 'active' : ''}`} onClick={() => setPostType('study_material')}>Study Material</button>
        </div>
      </div>

      <MentionInput value={content} onChange={setContent}
        placeholder={postType === 'study_material' ? 'Share lecture notes, past papers, tutorials...' : "What's on your mind? Type @ to mention someone"}
        rows={4} />

      {postType === 'study_material' && (
        <div className="study-material-fields">
          <div className="field-row">
            {/* <input type="text" placeholder="Module Code (e.g. CS3040)" value={moduleCode}
              onChange={e => setModuleCode(e.target.value.toUpperCase())} className="input-field module-code-input" /> */}
              <input
                type="text"
                placeholder="Module Code (e.g. CS3040)"
                value={moduleCode}
                onChange={e => setModuleCode(e.target.value.toUpperCase())}
                className={`input-field module-code-input ${
                  moduleCode && !isValidModuleCode(moduleCode) ? 'error' : ''
                }`}
              />
              {moduleCode && !isValidModuleCode(moduleCode) && (
                <span className="error-text">
                  Format must be like CS3040
                </span>
              )}      
            <select value={materialType} onChange={e => setMaterialType(e.target.value)} className="input-field">
              <option value="">Material Type</option>
              {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={semester} onChange={e => setSemester(e.target.value)} className="input-field">
              <option value="">Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div className="field-row" style={{ alignItems: 'center', gap: 8 }}>
            <input type="text" placeholder="Add tags (Enter to add)" value={tagInput}
              onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} className="input-field" />
          </div>
          {tags.length > 0 && (
            <div className="tags-list">
              {tags.map(t => (
                <span key={t} className="tag-chip">{t}<FiX onClick={() => setTags(tags.filter(x => x !== t))} /></span>
              ))}
            </div>
          )}
        </div>
      )}

      {aiSug && (
        <div className="ai-suggestion-banner">
          <FiCpu size={14} /> AI: <strong>{aiSug.moduleCode || 'Unknown'}</strong> · {aiSug.category} · {aiSug.confidence}% confidence
        </div>
      )}
      {similar.length > 0 && (
        <div className="similarity-warning">
          ⚠️ Similar material exists by {similar[0].post?.author?.name} ({similar[0].score}% match). Please verify before uploading.
        </div>
      )}

      {files.length > 0 && (
        <div className="file-preview-list">
          {files.map((f, i) => (
            <div key={i} className="file-preview-item">
              <span>📎 {f.name} <span style={{ color: '#9CA3AF', fontSize: 11 }}>({(f.size/1024).toFixed(0)} KB)</span></span>
              <FiX size={14} onClick={() => removeFile(i)} style={{ cursor: 'pointer' }} />
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="links-list">
          {links.map((l, i) => (
            <div key={i} className="link-item">
              <a href={l} target="_blank" rel="noopener noreferrer" className="url-link" style={{ fontSize: 13 }}>{l}</a>
              <FiX size={13} onClick={() => setLinks(links.filter((_,j) => j !== i))} style={{ cursor: 'pointer', color: '#9CA3AF' }} />
            </div>
          ))}
        </div>
      )}

      {showPoll && (
        <div className="poll-builder">
          <input type="text" placeholder="Poll question..." value={pollQ} onChange={e => setPollQ(e.target.value)} className="input-field" />
          {pollOpts.map((opt, i) => (
            <div key={i} className="poll-option-row">
              <input type="text" placeholder={`Option ${i+1}`} value={opt}
                onChange={e => { const c = [...pollOpts]; c[i] = e.target.value; setPollOpts(c); }} className="input-field" />
              {i > 1 && <FiX size={14} onClick={() => setPollOpts(pollOpts.filter((_,j) => j !== i))} style={{ cursor: 'pointer', flexShrink: 0 }} />}
            </div>
          ))}
          {pollOpts.length < 6 && (
            <button className="add-option-btn" onClick={() => setPollOpts([...pollOpts, ''])}>+ Add option</button>
          )}
        </div>
      )}

      <div className="link-input-row">
        <input type="url" placeholder="Paste a link and press Enter..." value={linkInput}
          onChange={e => setLinkInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addLink()} className="input-field link-input" style={{ fontSize: 13 }} />
        {linkInput && <button className="btn-primary btn-small" onClick={addLink}>Add</button>}
      </div>

      <div className="create-post-toolbar">
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={() => fileRef.current?.click()} title="Attach files">
            <FiFile size={16} /> Attach
          </button>
          <button className={`toolbar-btn ${showPoll ? 'active' : ''}`} onClick={() => setShowPoll(!showPoll)} title="Create poll">
            <FiBarChart2 size={16} /> Poll
          </button>
          <button className={`toolbar-btn ai-btn ${aiLoading ? 'loading' : ''}`} onClick={handleAI} disabled={aiLoading}>
            <FiCpu size={15} /> {aiLoading ? 'Thinking...' : 'AI Suggest'}
          </button>
          <input ref={fileRef} type="file" multiple hidden onChange={handleFiles}
            accept="image/*,video/*,audio/*,.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls" />
        </div>
        <div className="toolbar-right">
          <select value={visibility} onChange={e => setVisibility(e.target.value)} className="visibility-select">
            <option value="public">Public</option>
            <option value="private">Followers only</option>
          </select>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CreatePost;
