import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import MainLayout from '../components/layout/MainLayout';
import { format } from 'timeago.js';

const ICONS = { like:'❤️', comment:'💬', follow:'👤', mention:'🏷️', repost:'↩️', reply:'💬' };

const NotificationsPage = () => {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userAPI.getNotifications();
        setNotifs(data);
        await userAPI.markNotificationsRead();
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const getMessage = (n) => {
    const name = n.sender?.name || 'Someone';
    const msgs  = { like:'liked your post', comment:'commented on your post', follow:'started following you', mention:'mentioned you in a post', repost:'reposted your post', reply:'replied to your comment' };
    return `${name} ${msgs[n.type] || 'interacted with you'}`;
  };

  return (
    <MainLayout>
      <div className="notifications-page">
        <div className="page-header">
          <h1>Notifications</h1>
          <p>{notifs.filter(n => !n.isRead).length} unread</p>
        </div>
        {loading ? (
          <div className="loading-spinner">Loading notifications...</div>
        ) : notifs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p>No notifications yet. Start engaging with posts!</p>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => n.post && navigate(`/post/${n.post._id || n.post}`)}>
              <div className="notif-icon">{ICONS[n.type] || '🔔'}</div>
              <img src={n.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.sender?.name||'U')}&background=2D6A4F&color=fff&size=40`}
                alt="" className="notif-avatar" />
              <div className="notif-body">
                <div className="notif-message">{getMessage(n)}</div>
                <div className="notif-time">{format(n.createdAt)}</div>
              </div>
              {!n.isRead && <div className="notif-dot" />}
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
};
export default NotificationsPage;
