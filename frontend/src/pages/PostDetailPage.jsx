import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import PostCard   from '../components/post/PostCard';
import MainLayout from '../components/layout/MainLayout';
import { FiArrowLeft } from 'react-icons/fi';

const PostDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [post,     setPost]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try { const { data } = await postAPI.getPost(id); setPost(data); }
      catch (err) { setError(err.response?.data?.message || 'Post not found'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  return (
    <MainLayout>
      <div className="post-detail-page">
        <button className="btn-secondary btn-small" onClick={() => navigate(-1)} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiArrowLeft size={14} /> Back
        </button>
        {loading && <div className="loading-spinner">Loading post...</div>}
        {error   && <div className="error-state">{error}</div>}
        {post    && <PostCard post={post} />}
      </div>
    </MainLayout>
  );
};
export default PostDetailPage;
