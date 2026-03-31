import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import PostCard   from '../components/post/PostCard';
import MainLayout from '../components/layout/MainLayout';

const SavedPage = () => {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await userAPI.getSavedPosts(); setPosts(data); }
      catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <MainLayout>
      <div className="saved-page">
        <div className="page-header">
          <h1>Saved</h1>
          <p>Posts and materials you've saved for later</p>
        </div>
        {loading ? (
          <div className="loading-spinner">Loading saved posts...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔖</div>
            <p>You haven't saved any posts yet.<br />Tap the bookmark icon on any post to save it.</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <PostCard key={post._id} post={post} onDelete={id => setPosts(prev => prev.filter(p => p._id !== id))} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
export default SavedPage;
