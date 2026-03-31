// import React, { useState, useEffect, useCallback } from 'react';
// import { postAPI } from '../services/api';
// import CreatePost from '../components/post/CreatePost';
// import PostCard   from '../components/post/PostCard';
// import MainLayout from '../components/layout/MainLayout';
// import { FiFilter, FiX } from 'react-icons/fi';

// const FeedPage = () => {
//   const [posts,   setPosts]   = useState([]);
//   const [page,    setPage]    = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
// const [filters, setFilters] = useState({
//     postType: '',
//     semester: '',
//     moduleCode: ''
//   });

  

//   useEffect(() => {
//     loadPosts(1, filters);
//   }, []);

//   const applyFilters = () => {
//     setPage(1);
//     loadPosts(1, filters);
//   };

//   const clearFilters = () => {
//     const empty = { postType:'', semester:'', moduleCode:'' };
//     setFilters(empty);
//     setPage(1);
//     loadPosts(1, empty);
//   };

//   const hasActive = filters.postType || filters.semester || filters.moduleCode;

//   const loadPosts = useCallback(async (p = 1) => {
//     setLoading(true);
//     try {
//       const { data } = await postAPI.getFeed(p);
//       if (p === 1) setPosts(data);
//       else setPosts(prev => [...prev, ...data]);
//       setHasMore(data.length === 20);
//     } catch {}
//     setLoading(false);
//   }, []);

//   useEffect(() => { loadPosts(1); }, []);

//   const handleCreated = (p) => setPosts(prev => [p, ...prev]);
//   const handleDeleted = (id) => setPosts(prev => prev.filter(p => p._id !== id));

//   return (
//     <MainLayout showRightSidebar={true}>
//       <div className="feed-page">
//         <div className="page-header">
//           <h1>Feed</h1>
//           <p>Latest posts from your university network</p>
//         </div>
//         <div className="filter-bar">
//           <div className="filter-title">
//             <FiFilter size={14} /> Filters
//           </div>

//           <select
//             value={filters.postType}
//             onChange={e => setFilters({ ...filters, postType: e.target.value })}
//             className="filter-select"
//           >
//             <option value="">All Types</option>
//             <option value="post">Posts only</option>
//             <option value="study_material">Study Materials</option>
//           </select>

//           <select
//             value={filters.semester}
//             onChange={e => setFilters({ ...filters, semester: e.target.value })}
//             className="filter-select"
//           >
//             <option value="">All Semesters</option>
//             {[1,2,3,4,5,6,7,8].map(s => (
//               <option key={s} value={s}>Semester {s}</option>
//             ))}
//           </select>

//           <input
//             type="text"
//             placeholder="Module code..."
//             value={filters.moduleCode}
//             onChange={e => setFilters({ ...filters, moduleCode: e.target.value.toUpperCase() })}
//             className="filter-input"
//           />

//           <button className="btn-primary btn-small" onClick={applyFilters}>
//             Apply
//           </button>

//           {hasActive && (
//             <button className="btn-icon" onClick={clearFilters} title="Clear filters">
//               <FiX size={14} />
//             </button>
//           )}
//         </div>
//         <div className="feed-content">
//           <CreatePost onPostCreated={handleCreated} />
//           {posts.map(post => <PostCard key={post._id} post={post} onDelete={handleDeleted} />)}
//           {loading && <div className="loading-spinner">Loading posts...</div>}
//           {!loading && posts.length === 0 && (
//             <div className="empty-state">
//               <div className="empty-state-icon">📭</div>
//               <p>No posts yet. Be the first to share something!</p>
//             </div>
//           )}
//           {hasMore && !loading && posts.length > 0 && (
//             <button className="load-more-btn" onClick={() => { const n = page + 1; setPage(n); loadPosts(n); }}>
//               Load more posts
//             </button>
//           )}
//         </div>
//       </div>
//     </MainLayout>
//   );
// };
// export default FeedPage;
import React, { useState, useCallback } from 'react';
import { postAPI } from '../services/api';
import CreatePost from '../components/post/CreatePost';
import PostCard   from '../components/post/PostCard';
import MainLayout from '../components/layout/MainLayout';
import { FiFilter, FiX, FiGlobe } from 'react-icons/fi';

const FeedPage = () => {
  const [posts,   setPosts]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ postType:'', semester:'', moduleCode:'' });

  const loadPosts = useCallback(async (p = 1, f = {}) => {
    setLoading(true);
    try {
      const { data } = await postAPI.getFeedFiltered(p, f);
      if (p === 1) setPosts(data);
      else setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === 20);
    } catch {}
    setLoading(false);
  }, []);

  // Load on mount with empty filters
  React.useEffect(() => { loadPosts(1, {}); }, []);

  const applyFilters = () => {
    setPage(1);
    loadPosts(1, filters);
  };

  const clearFilters = () => {
    const empty = { postType:'', semester:'', moduleCode:'' };
    setFilters(empty);
    setPage(1);
    loadPosts(1, empty);
  };

  const hasActive = filters.postType || filters.semester || filters.moduleCode;

  return (
    <MainLayout showRightSidebar={true}>
      <div className="feed-page">
        <div className="page-header">
          <h1><FiGlobe size={20}/> Feed</h1>
          <p>All public posts from the KNOWva community</p>
        </div>

        <div className="filter-bar">
          <FiFilter size={14} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
          <select value={filters.postType}
            onChange={e => setFilters({...filters, postType: e.target.value})}
            className="filter-select">
            <option value="">All Types</option>
            <option value="post">Posts only</option>
            <option value="study_material">Study Materials</option>
          </select>
          <select value={filters.semester}
            onChange={e => setFilters({...filters, semester: e.target.value})}
            className="filter-select">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <input type="text" placeholder="Module code..."
            value={filters.moduleCode}
            onChange={e => setFilters({...filters, moduleCode: e.target.value.toUpperCase()})}
            className="filter-input"/>
          <button className="btn-primary btn-small" onClick={applyFilters}>Apply</button>
          {hasActive && (
            <button className="btn-icon" onClick={clearFilters} title="Clear filters">
              <FiX size={14}/>
            </button>
          )}
        </div>

        <div className="feed-content">
          <CreatePost onPostCreated={p => setPosts(prev => [p, ...prev])}/>
          {posts.map(post => (
            <PostCard key={post._id} post={post}
              onDelete={id => setPosts(prev => prev.filter(p => p._id !== id))}/>
          ))}
          {loading && <div className="loading-spinner">Loading posts...</div>}
          {!loading && posts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>No posts found. Try different filters.</p>
            </div>
          )}
          {hasMore && !loading && posts.length > 0 && (
            <button className="load-more-btn"
              onClick={() => { const n = page+1; setPage(n); loadPosts(n, filters); }}>
              Load more posts
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
export default FeedPage;