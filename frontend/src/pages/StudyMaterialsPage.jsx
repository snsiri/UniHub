import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreatePost from '../components/post/CreatePost';
import PostCard   from '../components/post/PostCard';
import MainLayout from '../components/layout/MainLayout';
import { FiFilter, FiPlus, FiX } from 'react-icons/fi';

const MATERIAL_TYPES = ['Lecture Note','Tutorial','Past Paper','Lab Sheet','Reference Material'];

const StudyMaterialsPage = () => {
  const { user }    = useAuth();
  const location    = useLocation();
  const queryType   = new URLSearchParams(location.search).get('type') || '';

  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filters,    setFilters]    = useState({
    semester:     user?.semester || '',
    moduleCode:   '',
    materialType: queryType,
  });

  useEffect(() => {
    setFilters(f => ({ ...f, materialType: queryType }));
  }, [queryType]);

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.semester)     params.semester     = filters.semester;
      if (filters.moduleCode)   params.moduleCode   = filters.moduleCode;
      if (filters.materialType) params.materialType = filters.materialType;
      const { data } = await postAPI.getStudyMaterials(params);
      setPosts(data);
    } catch {}
    setLoading(false);
  };

  const upd = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));
  const clearFilters = () => setFilters({ semester: '', moduleCode: '', materialType: '' });

  return (
    <MainLayout showRightSidebar={true}>
      <div className="study-page">
        <div className="study-header">
          <div>
            <h1>Study Materials</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {filters.materialType || 'All resources'} · {posts.length} items
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? <><FiX size={15} /> Cancel</> : <><FiPlus size={15} /> Upload</>}
          </button>
        </div>

        {showCreate && (
          <CreatePost defaultType="study_material"
            onPostCreated={(p) => { setPosts(prev => [p, ...prev]); setShowCreate(false); }} />
        )}



        {loading ? (
          <div className="loading-spinner">Loading materials...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p>No study materials found. Be the first to upload!</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <PostCard key={post._id} post={post}
                onDelete={id => setPosts(prev => prev.filter(p => p._id !== id))} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
export default StudyMaterialsPage;
