import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import {
  FiHome, FiBookOpen, FiMessageSquare, FiBookmark, FiBell,
  FiUser, FiLogOut, FiCode, FiStar, FiVideo, FiPlayCircle,
  FiHelpCircle, FiFileText, FiGrid, FiCheckSquare, FiAlertCircle,
  FiMessageCircle, FiLayers
} from 'react-icons/fi';

/* ── Graduation Cap SVG (inline, no external dependency) ── */
const GraduationCapIcon = ({ size = 22, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const NAV_SECTIONS = [
  {
    label: 'Discover',
    items: [
      { to: '/for-you',        icon: <FiStar size={17}/>,        label: 'For You'        },
      { to: '/feed',           icon: <FiHome size={17}/>,        label: 'Feed'           },
      { to: '/saved',          icon: <FiBookmark size={17}/>,    label: 'Saved'          },
    ]
  },

  {
    label: 'Account',
    items: [
      { to: '/profile', icon: <FiUser size={17}/>,        label: 'Profile',     isProfile: true },
      { to: '/messages', icon: <FiMessageSquare size={17}/>, label: 'Messages' },
      
    ]
  }
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchN = async () => {
      try {
        const { data } = await userAPI.getNotifications();
        setUnread(data.filter(n => !n.isRead).length);
      } catch {}
    };
    fetchN();
    const t = setInterval(fetchN, 30000);
    return () => clearInterval(t);
  }, []);

  const avatarUrl = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2D6A4F&color=fff&size=64`;

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo" onClick={() => navigate('/for-you')}>
        <div className="sidebar-logo-icon">
          <GraduationCapIcon size={21} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">
            <span style={{ color: 'var(--text)' }}>KNOW</span>
            <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>va</span>
          </div>
          <div className="sidebar-logo-sub">University Portal</div>
        </div>
      </div>

      {/* ── Navigation sections ── */}
      {NAV_SECTIONS.map(section => (
        <React.Fragment key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          <nav className="sidebar-nav">
            {section.items.map(item => {
              const to = item.isProfile ? `/profile/${user?.username}` : item.to;
              return (
                <NavLink
                  key={item.label}
                  to={to}
                  end={item.label === 'All Saved'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              );
            })}
            {/* Developer link — only in Account section */}
            {section.label === 'Account' && user?.role === 'developer' && (
              <NavLink to="/developer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="sidebar-icon"><FiCode size={17}/></span>
                <span className="sidebar-label">Dev Dashboard</span>
              </NavLink>
            )}
          </nav>
        </React.Fragment>
      ))}

      {/* ── Bottom user bar ── */}
      <div className="sidebar-user">
        {/* Avatar → profile */}
        <img
          src={avatarUrl} alt={user?.name}
          className="sidebar-user-avatar"
          onClick={() => navigate(`/profile/${user?.username}`)}
          title="View your profile"
        />
        {/* Name + handle → profile */}
        <div className="sidebar-user-info"
          onClick={() => navigate(`/profile/${user?.username}`)}>
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-handle">@{user?.username}</div>
        </div>
        {/* Notifications bell with badge */}
        <div className="sidebar-bottom-actions">
          <button
            className="sidebar-bottom-btn"
            onClick={() => navigate('/notifications')}
            title="Notifications"
          >
            <FiBell size={17} />
            {unread > 0 && <span className="sidebar-notif-dot">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {/* Logout */}
          <button
            className="sidebar-logout"
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout"
          >
            <FiLogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
