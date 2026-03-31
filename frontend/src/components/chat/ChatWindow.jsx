import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import RichText from '../common/RichText';
import GroupInfoPanel from './GroupInfoPanel';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';
import {
  FiSend, FiPaperclip, FiX, FiDownload, FiEdit2, FiTrash2,
  FiMoreHorizontal, FiShare2, FiInfo, FiExternalLink
} from 'react-icons/fi';

const getFileIcon = (mime) => {
  if (!mime) return '📎';
  if (mime.startsWith('image/'))  return '🖼️';
  if (mime.startsWith('video/'))  return '🎬';
  if (mime.startsWith('audio/'))  return '🎵';
  if (mime === 'application/pdf') return '📄';
  if (mime.includes('word'))      return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  return '📎';
};

const ChatWindow = ({ chat, allChats = [], onLeft }) => {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const navigate   = useNavigate();
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const typingTimer= useRef(null);

  const [messages,   setMessages]   = useState([]);
  const [text,       setText]       = useState('');
  const [file,       setFile]       = useState(null);
  const [typing,     setTyping]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText,   setEditText]   = useState('');
  const [msgMenu,    setMsgMenu]    = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [fwdSearch,  setFwdSearch]  = useState('');
  const [viewMedia,  setViewMedia]  = useState(null);
  const [showInfo,   setShowInfo]   = useState(false);

  const otherMember = chat.isGroup ? null : chat.members?.find(m => m._id !== user._id);
  const chatName    = chat.isGroup ? chat.name : (otherMember?.name || 'Unknown');
  const chatAvatar  = chat.isGroup
    ? null
    : (otherMember?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherMember?.name||'U')}&background=2D6A4F&color=fff&size=64`);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await messageAPI.getMessages(chat._id); setMessages(data); } catch {}
    };
    load();
    socket?.emit('join_chat', chat._id);
  }, [chat._id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.chat === chat._id || msg.chat?._id === chat._id)
    setMessages(prev => {
      // Prevent duplicates by checking _id
      if (prev.find(m => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
    };
    socket.on('receive_message', handler);
    socket.on('typing',       () => setTyping(true));
    socket.on('stop_typing',  () => setTyping(false));
    return () => { socket.off('receive_message', handler); socket.off('typing'); socket.off('stop_typing'); };
  }, [socket, chat._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleTyping = (e) => {
    setText(e.target.value);
    socket?.emit('typing', chat._id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('stop_typing', chat._id), 1500);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('chatId', chat._id);
      fd.append('text', text);
      if (file) fd.append('media', file);
      const { data } = await messageAPI.sendMessage(fd);
      socket?.emit('send_message', { chatId: chat._id, message: data });
      // Add to local state immediately (socket only goes to OTHER users via server)
      setMessages(prev => {
        if (prev.find(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
      setText(''); setFile(null);
    } catch { toast.error('Failed to send'); }
    setLoading(false);
  };

  const saveEdit = (msgId) => {
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, text: editText } : m));
    setEditingMsg(null);
    toast.success('Message updated');
  };

  const deleteMessage = (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    setMessages(prev => prev.filter(m => m._id !== msgId));
    setMsgMenu(null);
    toast.success('Message deleted');
  };

  const forwardToChat = async (targetChatId) => {
    if (!forwardMsg) return;
    try {
      const fd = new FormData();
      fd.append('chatId', targetChatId);
      fd.append('text', forwardMsg.text ? `↪ Forwarded: ${forwardMsg.text}` : '↪ Forwarded message');
      if (forwardMsg.sharedPost) fd.append('sharedPostId', forwardMsg.sharedPost._id || forwardMsg.sharedPost);
      const { data } = await messageAPI.sendMessage(fd);
      socket?.emit('send_message', { chatId: targetChatId, message: data });
      toast.success('Forwarded!');
      setForwardMsg(null);
    } catch { toast.error('Failed to forward'); }
  };

  const handleDownload = async (url, fileName) => {
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const bUrl = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = bUrl; a.download = fileName || 'download';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(bUrl);
    } catch { window.open(url, '_blank'); }
  };

  const filteredChats = allChats.filter(c => {
    const name = c.isGroup ? c.name : c.members?.find(m => m._id !== user._id)?.name || '';
    return fwdSearch ? name.toLowerCase().includes(fwdSearch.toLowerCase()) : true;
  });

  const getChatDisplayName = (c) => {
    if (c.isGroup) return c.name;
    return c.members?.find(m => m._id !== user._id)?.name || 'Unknown';
  };

  return (
    <div className="chat-window" onClick={() => setMsgMenu(null)}>
      {/* Media viewer */}
      {viewMedia && (
        <div className="media-modal-overlay" onClick={() => setViewMedia(null)}>
          <div className="media-modal-content" onClick={e => e.stopPropagation()}>
            <button className="media-modal-close" onClick={() => setViewMedia(null)}><FiX size={20}/></button>
            {viewMedia.type === 'image' && <img src={viewMedia.url} alt="full" className="media-modal-img"/>}
            {viewMedia.type === 'video' && <video src={viewMedia.url} controls autoPlay className="media-modal-video"/>}
            {viewMedia.type === 'pdf' && (
              <div className="media-modal-pdf">
                <iframe src={viewMedia.url} title={viewMedia.name} className="media-modal-iframe"/>
                <div className="media-modal-actions">
                  <a href={viewMedia.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-small"><FiExternalLink size={14}/> Open</a>
                  <button className="btn-primary btn-small" onClick={() => handleDownload(viewMedia.url, viewMedia.name)}><FiDownload size={14}/> Download</button>
                </div>
              </div>
            )}
            {viewMedia.type === 'doc' && (
              <div className="media-modal-doc">
                <div className="doc-preview-icon">{getFileIcon(viewMedia.mime)}</div>
                <div className="doc-preview-name">{viewMedia.name}</div>
                <div className="doc-preview-actions">
                  <a href={viewMedia.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-small"><FiExternalLink size={14}/> Open</a>
                  <button className="btn-primary btn-small" onClick={() => handleDownload(viewMedia.url, viewMedia.name)}><FiDownload size={14}/> Download</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forward modal */}
      {forwardMsg && (
        <div className="media-modal-overlay" onClick={() => setForwardMsg(null)}>
          <div className="forward-modal" onClick={e => e.stopPropagation()}>
            <div className="forward-modal-header">
              <h3>Forward to...</h3>
              <button className="btn-icon" onClick={() => setForwardMsg(null)}><FiX size={16}/></button>
            </div>
            <div style={{ padding:'8px 16px' }}>
              <input type="text" placeholder="Search chats..." value={fwdSearch}
                onChange={e => setFwdSearch(e.target.value)} className="input-field" style={{ fontSize:13 }}/>
            </div>
            <div className="forward-chat-list">
              {filteredChats.map(c => (
                <div key={c._id} className="forward-chat-item" onClick={() => forwardToChat(c._id)}>
                  <div className="forward-chat-icon">{c.isGroup ? '👥' : '👤'}</div>
                  <span>{getChatDisplayName(c)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Group Info Panel */}
      {showInfo && chat.isGroup && (
        <div className="group-info-overlay" onClick={() => setShowInfo(false)}>
          <div onClick={e => e.stopPropagation()}>
            <GroupInfoPanel chat={chat} onClose={() => setShowInfo(false)} onLeft={() => { setShowInfo(false); onLeft?.(); }} />
          </div>
        </div>
      )}

      {/* Header — clickable to open group info */}
      <div className="chat-window-header" style={{ cursor: 'pointer' }}
          onClick={() => {
            if (chat.isGroup) setShowInfo(true);
            else if (otherMember?.username) navigate(`/profile/${otherMember.username}`);
          }}>
            <button className="mobile-back-btn" onClick={() => window.history.back()} 
              style={{display:'none', marginRight:4}}>
              ←
            </button>
        {chatAvatar
          ? <img src={chatAvatar} alt={chatName} className="chat-header-avatar"/>
          : <div className="chat-header-avatar-group">{chatName?.[0]?.toUpperCase() || 'G'}</div>
        }
        <div style={{ flex:1 }}>
          <div className="chat-header-name">{chatName}</div>
          {chat.isGroup
            ? <div className="chat-header-sub">{chat.members?.length} members · Click to manage</div>
            : <div className="chat-header-sub">@{otherMember?.username}</div>
          }
        </div>
        {chat.isGroup && <FiInfo size={18} style={{ color:'var(--text-muted)' }}/>}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const isMe   = msg.sender?._id === user._id || msg.sender === user._id;
          const sender = msg.sender;
          const mime   = msg.media?.mimeType || msg.media?.resourceType || '';
          const isPdf  = mime === 'application/pdf' || msg.media?.fileName?.endsWith('.pdf');
          const isImg  = msg.media?.resourceType === 'image' || mime.startsWith('image/');
          const isVid  = msg.media?.resourceType === 'video' || mime.startsWith('video/');

          return (
            <div key={msg._id || idx} className={`message-bubble ${isMe ? 'mine' : ''}`}>
              {!isMe && (
                <img src={sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.name||'U')}&background=2D6A4F&color=fff&size=40`}
                  alt="" className="msg-avatar"/>
              )}
              <div className="message-content">
                {chat.isGroup && !isMe && (
                  <div className="msg-sender-name" onClick={() => navigate(`/profile/${sender?.username}`)}>
                    {sender?.name}
                  </div>
                )}

                {msg.sharedPost && (
                  <div className="shared-post-preview" onClick={() => navigate(`/post/${msg.sharedPost._id || msg.sharedPost}`)}>
                    <div className="shared-post-label">📌 Shared Post</div>
                    <div className="shared-post-author">{msg.sharedPost.author?.name}</div>
                    <div className="shared-post-text">{msg.sharedPost.content?.slice(0,120)}{msg.sharedPost.content?.length > 120 ? '…' : ''}</div>
                    {msg.sharedPost.moduleCode && <span className="module-badge small" style={{marginTop:6,display:'inline-block'}}>{msg.sharedPost.moduleCode}</span>}
                  </div>
                )}

                {editingMsg === msg._id ? (
                  <div className="msg-edit-wrap">
                    <input value={editText} onChange={e => setEditText(e.target.value)}
                      className="msg-edit-input" onKeyDown={e => e.key==='Enter' && saveEdit(msg._id)}/>
                    <button className="btn-primary btn-small" onClick={() => saveEdit(msg._id)}>Save</button>
                    <button className="btn-secondary btn-small" onClick={() => setEditingMsg(null)}>Cancel</button>
                  </div>
                ) : (
                  msg.text && <div className="msg-text"><RichText text={msg.text}/></div>
                )}

                {msg.media?.url && (
                  <div className="msg-media-wrap">
                    {isImg ? (
                      <img src={msg.media.url} alt="media" className="msg-image"
                        onClick={() => setViewMedia({ type:'image', url: msg.media.url, name: msg.media.fileName })}/>
                    ) : isVid ? (
                      <video src={msg.media.url} controls className="msg-video"/>
                    ) : (
                      <div className="msg-file-card" onClick={() => setViewMedia({ type: isPdf?'pdf':'doc', url: msg.media.url, name: msg.media.fileName, mime })}>
                        <span style={{fontSize:20}}>{getFileIcon(mime)}</span>
                        <span className="msg-file-name">{msg.media.fileName || 'File'}</span>
                        <button className="btn-icon" title="Download" onClick={e => { e.stopPropagation(); handleDownload(msg.media.url, msg.media.fileName); }}>
                          <FiDownload size={14}/>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <span className="msg-time">{format(msg.createdAt)}</span>
              </div>

              <div className="msg-menu-wrap" onClick={e => e.stopPropagation()}>
                <button className="msg-menu-btn" onClick={() => setMsgMenu(msgMenu===msg._id ? null : msg._id)}>
                  <FiMoreHorizontal size={14}/>
                </button>
                {msgMenu === msg._id && (
                  <div className={`msg-dropdown ${isMe ? 'left' : 'right'}`}>
                    {isMe && <button onClick={() => { setEditingMsg(msg._id); setEditText(msg.text||''); setMsgMenu(null); }}><FiEdit2 size={13}/> Edit</button>}
                    <button onClick={() => { setForwardMsg(msg); setMsgMenu(null); }}><FiShare2 size={13}/> Forward</button>
                    {msg.media?.url && (
                      <button onClick={() => { handleDownload(msg.media.url, msg.media.fileName); setMsgMenu(null); }}>
                        <FiDownload size={13}/> Download
                      </button>
                    )}
                    {isMe && <button onClick={() => deleteMessage(msg._id)} className="danger"><FiTrash2 size={13}/> Delete</button>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {typing && <div className="typing-indicator"><span/><span/><span/></div>}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <form className="chat-input-area" onSubmit={handleSend}>
        {file && (
          <div className="file-attached-preview">
            📎 {file.name}
            <button type="button" onClick={() => setFile(null)} style={{marginLeft:6,display:'flex'}}><FiX size={13}/></button>
          </div>
        )}
        <input type="file" ref={fileRef} hidden onChange={e => setFile(e.target.files[0])}
          accept="image/*,video/*,audio/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"/>
        <button type="button" className="chat-attach-btn" onClick={() => fileRef.current?.click()}>
          <FiPaperclip size={18}/>
        </button>
        <textarea placeholder="Type a message... (@mention)" value={text} onChange={handleTyping}
          className="chat-text-input" rows={1}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}/>
        <button type="submit" className="chat-send-btn" disabled={loading || (!text.trim() && !file)}>
          <FiSend size={16}/>
        </button>
      </form>
    </div>
  );
};
export default ChatWindow;

