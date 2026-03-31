import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiX, FiUserPlus, FiUserMinus, FiLogOut, FiEdit3, FiShield } from 'react-icons/fi';

const GroupInfoPanel = ({ chat, onClose, onLeft }) => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [details,  setDetails]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState([]);
  const [editing,  setEditing]  = useState(false);
  const [newName,  setNewName]  = useState(chat.name || '');

  const isAdmin = details?.admins?.some(a => a._id === user._id || a === user._id);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await groupAPI.getDetails(chat._id); setDetails(data); } catch {}
    };
    load();
  }, [chat._id]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const { data } = await userAPI.searchUsers(q);
      const memberIds = details?.members?.map(m => m._id) || [];
      setResults(data.filter(u => !memberIds.includes(u._id) && u._id !== user._id));
    } catch {}
  };

  const addMember = async (userId) => {
    try {
      await groupAPI.addMember(chat._id, userId);
      const { data } = await groupAPI.getDetails(chat._id);
      setDetails(data);
      setSearch(''); setResults([]);
      toast.success('Member added!');
    } catch { toast.error('Failed to add member'); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await groupAPI.removeMember(chat._id, userId);
      const { data } = await groupAPI.getDetails(chat._id);
      setDetails(data);
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await groupAPI.leaveGroup(chat._id);
      toast.success('Left the group');
      onLeft?.();
    } catch { toast.error('Failed to leave'); }
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      await groupAPI.rename(chat._id, newName);
      setEditing(false);
      toast.success('Group renamed');
    } catch { toast.error('Failed to rename'); }
  };

  return (
    <div className="group-info-panel">
      <div className="group-info-header">
        <h3>Group Info</h3>
        <button className="btn-icon" onClick={onClose}><FiX size={16}/></button>
      </div>

      {/* Group name */}
      <div className="group-info-name-section">
        <div className="group-info-avatar">
          {chat.name?.[0]?.toUpperCase() || 'G'}
        </div>
        {editing ? (
          <div className="group-rename-form">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              className="input-field" placeholder="Group name" autoFocus/>
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <button className="btn-primary btn-small" onClick={handleRename}>Save</button>
              <button className="btn-secondary btn-small" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="group-info-name-row">
            <span className="group-info-name">{chat.name}</span>
            {isAdmin && (
              <button className="btn-icon" onClick={() => setEditing(true)} title="Rename group">
                <FiEdit3 size={14}/>
              </button>
            )}
          </div>
        )}
        <div className="group-info-count">{details?.members?.length || 0} members</div>
      </div>

      {/* Add member (admin only) */}
      {isAdmin && (
        <div className="group-add-member">
          <div className="group-section-title"><FiUserPlus size={13}/> Add Members</div>
          <input type="text" placeholder="Search users..." value={search}
            onChange={e => handleSearch(e.target.value)} className="input-field" style={{ fontSize: 13 }}/>
          {results.map(u => (
            <div key={u._id} className="group-member-result" onClick={() => addMember(u._id)}>
              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2D6A4F&color=fff&size=40`}
                alt={u.name} className="result-avatar"/>
              <div>
                <div className="result-name">{u.name}</div>
                <div className="result-username">@{u.username}</div>
              </div>
              <FiUserPlus size={14} style={{ marginLeft:'auto', color:'var(--primary)' }}/>
            </div>
          ))}
        </div>
      )}

      {/* Members list */}
      <div className="group-members-list">
        <div className="group-section-title">Members</div>
        {details?.members?.map(m => {
          const isAdm    = details.admins?.some(a => (a._id || a) === (m._id || m));
          const isSelf   = (m._id || m) === user._id;
          return (
            <div key={m._id || m} className="group-member-item">
              <img
                src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name||'U')}&background=2D6A4F&color=fff&size=40`}
                alt={m.name} className="result-avatar"
                style={{ cursor:'pointer' }}
                onClick={() => { navigate(`/profile/${m.username}`); onClose(); }}
              />
              <div style={{ flex:1, cursor:'pointer' }} onClick={() => { navigate(`/profile/${m.username}`); onClose(); }}>
                <div className="result-name">{m.name} {isSelf ? '(you)' : ''}</div>
                <div className="result-username">@{m.username}</div>
              </div>
              {isAdm && (
                <span className="admin-badge"><FiShield size={11}/> Admin</span>
              )}
              {isAdmin && !isSelf && (
                <button className="btn-icon danger" onClick={() => removeMember(m._id)} title="Remove member">
                  <FiUserMinus size={14}/>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Leave group */}
      <div className="group-danger-zone">
        <button className="btn-leave-group" onClick={handleLeave}>
          <FiLogOut size={14}/> Leave Group
        </button>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
