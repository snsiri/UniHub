import React, { useState } from 'react';
import { chatAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';
import { FiSearch, FiUsers, FiPlus, FiX, FiEdit3 } from 'react-icons/fi';

const ChatList = ({ chats, selectedChat, onSelectChat, onNewChat }) => {
  const { user }         = useAuth();
  const { onlineUsers }  = useSocket();
  const [search,         setSearch]         = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [showGroup,      setShowGroup]      = useState(false);
  const [groupName,      setGroupName]      = useState('');
  const [groupMembers,   setGroupMembers]   = useState([]);
  const [memberSearch,   setMemberSearch]   = useState('');
  const [memberResults,  setMemberResults]  = useState([]);

  const handleSearch = async (q) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try { const { data } = await userAPI.searchUsers(q); setSearchResults(data.filter(u => u._id !== user._id)); }
    catch {}
  };

  const startDM = async (userId) => {
    try {
      const { data } = await chatAPI.accessChat(userId);
      onNewChat(data); onSelectChat(data);
      setSearch(''); setSearchResults([]);
    } catch { toast.error('Failed to start chat'); }
  };

  const handleMemberSearch = async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    try { const { data } = await userAPI.searchUsers(q); setMemberResults(data.filter(u => u._id !== user._id && !groupMembers.find(m => m._id === u._id))); }
    catch {}
  };

  const addMember = (u) => {
    setGroupMembers(prev => [...prev, u]);
    setMemberSearch(''); setMemberResults([]);
  };

  const createGroup = async () => {
    if (!groupName.trim())        return toast.error('Enter a group name');
    if (groupMembers.length < 1)  return toast.error('Add at least 1 member');
    try {
      const { data } = await chatAPI.createGroup({ name: groupName, members: groupMembers.map(m => m._id) });
      onNewChat(data); onSelectChat(data);
      setShowGroup(false); setGroupName(''); setGroupMembers([]);
      toast.success('Group created!');
    } catch { toast.error('Failed to create group'); }
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    const other = chat.members?.find(m => m._id !== user._id);
    return other?.name || 'Unknown';
  };
  const getChatAvatar = (chat) => {
    if (chat.isGroup) return `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name||'G')}&background=52B788&color=fff&size=64`;
    const other = chat.members?.find(m => m._id !== user._id);
    return other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name||'U')}&background=2D6A4F&color=fff&size=64`;
  };
  const isOnline = (chat) => {
    if (chat.isGroup) return false;
    const other = chat.members?.find(m => m._id !== user._id);
    return onlineUsers?.includes(other?._id);
  };
  const getLastMsg = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    if (chat.lastMessage.sharedPost) return '📌 Shared a post';
    if (chat.lastMessage.media?.url) return '📎 Media';
    return chat.lastMessage.text || '';
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <div className="chat-list-actions">
          <button className="btn-icon" onClick={() => setShowGroup(!showGroup)} title="New group chat">
            <FiUsers size={17} />
          </button>
        </div>
      </div>

      {/* Search users for DM */}
      <div className="chat-search-wrap">
        <FiSearch size={13} className="search-icon-inner" />
        <input type="text" placeholder="Search people to message..." value={search}
          onChange={e => handleSearch(e.target.value)} className="chat-search-input" />
      </div>
      {searchResults.length > 0 && (
        <div className="user-search-results">
          {searchResults.map(u => (
            <div key={u._id} className="user-result-item" onClick={() => startDM(u._id)}>
              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2D6A4F&color=fff&size=40`} alt={u.name} className="result-avatar" />
              <div><div className="result-name">{u.name}</div><div className="result-username">@{u.username}</div></div>
              <FiPlus size={15} className="start-dm-icon" />
            </div>
          ))}
        </div>
      )}

      {/* Group creator */}
      {showGroup && (
        <div className="group-creator-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>New Group Chat</h3>
            <button className="btn-icon" onClick={() => setShowGroup(false)}><FiX size={14} /></button>
          </div>
          <input type="text" placeholder="Group name..." value={groupName}
            onChange={e => setGroupName(e.target.value)} className="input-field" />
          {groupMembers.length > 0 && (
            <div className="selected-members-row">
              {groupMembers.map(m => (
                <span key={m._id} className="selected-member-chip">
                  {m.name}
                  <button onClick={() => setGroupMembers(prev => prev.filter(x => x._id !== m._id))}><FiX size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input type="text" placeholder="Add members..." value={memberSearch}
              onChange={e => handleMemberSearch(e.target.value)}
              className="input-field" style={{ paddingLeft: 30, fontSize: 13 }} />
          </div>
          {memberResults.map(u => (
            <div key={u._id} className="user-result-item" onClick={() => addMember(u)} style={{ background: 'none', padding: '6px 0' }}>
              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2D6A4F&color=fff&size=40`} alt={u.name} className="result-avatar" />
              <div><div className="result-name">{u.name}</div><div className="result-username">@{u.username}</div></div>
              <FiPlus size={14} className="start-dm-icon" />
            </div>
          ))}
          <button className="btn-primary btn-full" onClick={createGroup}>
            Create Group ({groupMembers.length + 1} members)
          </button>
        </div>
      )}

      {/* Chat list */}
      <div className="chat-items">
        {chats.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '30px 16px', fontSize: 13 }}>
            No conversations yet.<br />Search for someone to message.
          </div>
        )}
        {chats.map(chat => (
          <div key={chat._id} className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`} onClick={() => onSelectChat(chat)}>
            <div className="chat-avatar-wrap">
              <img src={getChatAvatar(chat)} alt={getChatName(chat)} className="chat-item-avatar" />
              {isOnline(chat) && <span className="online-dot" />}
            </div>
            <div className="chat-item-info">
              <div className="chat-item-name">{getChatName(chat)}</div>
              <div className="chat-item-last">{getLastMsg(chat)}</div>
            </div>
            <div className="chat-item-time">{chat.updatedAt ? format(chat.updatedAt) : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ChatList;
