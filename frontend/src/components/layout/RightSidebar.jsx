import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trendingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiTrendingUp, FiCalendar, FiRefreshCw, FiHeart, FiMessageSquare } from 'react-icons/fi';

const RightSidebar = () => {
  const { user }         = useAuth();
  const navigate         = useNavigate();
  const [trending,       setTrending]       = useState([]);
  const [events,         setEvents]         = useState([]);
  const [loadingTrend,   setLoadingTrend]   = useState(true);
  const [loadingEvents,  setLoadingEvents]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await trendingAPI.getTrending();
        setTrending(data);
      } catch {}
      setLoadingTrend(false);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await trendingAPI.getEvents();
        setEvents(data);
      } catch {}
      setLoadingEvents(false);
    };
    load();
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const getDaysLabel = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const getUrgencyColor = (days) => {
    if (days <= 2)  return '#EF4444';
    if (days <= 7)  return '#F59E0B';
    return '#2D6A4F';
  };

  return (
    <aside className="right-sidebar">
      {/* Trending */}
      <div className="sidebar-widget">
        <div className="widget-header">
          <div className="widget-title"><FiTrendingUp size={15}/> Trending</div>
          <button className="btn-icon" onClick={async () => {
            setLoadingTrend(true);
            try { const { data } = await trendingAPI.getTrending(); setTrending(data); } catch {}
            setLoadingTrend(false);
          }}><FiRefreshCw size={13}/></button>
        </div>

        {loadingTrend ? (
          <div className="widget-loading">Loading...</div>
        ) : trending.length === 0 ? (
          <div className="widget-empty">No trending posts yet</div>
        ) : (
          <div className="trending-list">
            {trending.map((p, i) => (
              <div key={p._id} className="trending-item" onClick={() => navigate(`/post/${p._id}`)}>
                <div className="trending-rank">{i + 1}</div>
                <div className="trending-content">
                  <div className="trending-meta">
                    {p.moduleCode && <span className="trending-module">{p.moduleCode}</span>}
                    <span className="trending-author">{p.author?.name}</span>
                  </div>
                  <div className="trending-text">{p.content || '(no text)'}</div>
                  <div className="trending-stats">
                    <span><FiHeart size={11}/> {p.likes}</span>
                    <span><FiMessageSquare size={11}/> {p.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI-personalized events */}
      <div className="sidebar-widget">
        <div className="widget-header">
          <div className="widget-title"><FiCalendar size={15}/> Upcoming Events</div>
          <span className="widget-badge">AI</span>
        </div>
        {user?.semester && (
          <div className="widget-semester-tag">Personalized for Semester {user.semester}</div>
        )}

        {loadingEvents ? (
          <div className="widget-loading">Extracting from your materials...</div>
        ) : events.length === 0 ? (
          <div className="widget-empty">
            <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
            Upload study materials to see AI-detected events
          </div>
        ) : (
          <div className="events-list">
            {events.map((ev, i) => (
              <div key={i} className="event-item">
                <div className="event-emoji">{ev.emoji}</div>
                <div className="event-details">
                  <div className="event-title">{ev.title}</div>
                  <div className="event-date">{formatDate(ev.date)}</div>
                </div>
                <div className="event-urgency" style={{ color: getUrgencyColor(ev.daysAhead) }}>
                  {getDaysLabel(ev.daysAhead)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="widget-footer-note">
          Events extracted by AI from your semester's study materials
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
