import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI, chatAPI, messageAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import RichText from '../common/RichText';
import { format } from 'timeago.js';
import toast from 'react-hot-toast';
import {
  FiHeart, FiMessageSquare, FiRepeat, FiBookmark, FiDownload,
  FiMoreHorizontal, FiEye, FiEdit2, FiTrash2, FiShare2, FiLock,
  FiGlobe, FiX, FiLink, FiSend, FiSearch, FiExternalLink, FiMaximize2
} from 'react-icons/fi';
import { FaWhatsapp, FaTwitter } from 'react-icons/fa';
import { SiGmail } from 'react-icons/si';
import { HiOutlineMail } from 'react-icons/hi';

const getMaterialColor = (type) => ({
  'Lecture Note':'#2D6A4F','Tutorial':'#0369A1','Past Paper':'#B45309',
  'Lab Sheet':'#6B21A8','Reference Material':'#BE185D'
}[type] || '#6B7280');

const getFileIcon = (mime) => {
  if (!mime) return '📎';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime === 'application/pdf') return '📄';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📋';
  return '📎';
};

const formatSize = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};

const MediaViewer = ({ media, onClose }) => {
  const handleDownload = async () => {
    try {
      const res  = await fetch(media.url);
      const blob = await res.blob();
      const bUrl = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = bUrl; a.download = media.name || 'download';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(bUrl);
      toast.success('Download started');
    } catch { window.open(media.url, '_blank'); }
  };

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal-content" onClick={e => e.stopPropagation()}>
        <button className="media-modal-close" onClick={onClose}><FiX size={20}/></button>
        {media.type === 'image' && <img src={media.url} alt="full view" className="media-modal-img"/>}
        {media.type === 'video' && <video src={media.url} controls autoPlay className="media-modal-video"/>}
        {media.type === 'audio' && (
          <div className="media-modal-audio-wrap">
            <div style={{fontSize:64,marginBottom:16}}>🎵</div>
            <div style={{fontWeight:600,marginBottom:16}}>{media.name}</div>
            <audio src={media.url} controls autoPlay style={{width:'100%'}}/>
          </div>
        )}
        {media.type === 'pdf' && (
          <div className="media-modal-pdf">
            <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(media.url)}&embedded=true`} title={media.name} className="media-modal-iframe"/>
            <div className="media-modal-actions">
              <a href={media.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-small">
                <FiExternalLink size={14}/> Open in new tab
              </a>
              <button className="btn-primary btn-small" onClick={handleDownload}>
                <FiDownload size={14}/> Download
              </button>
            </div>
          </div>
        )}
        {media.type === 'doc' && (
          <div className="media-modal-doc">
            <div className="doc-preview-icon">{getFileIcon(media.mime)}</div>
            <div className="doc-preview-name">{media.name}</div>
            <div className="doc-preview-size">{media.size}</div>
            <p className="doc-preview-hint">This file type cannot be previewed inline. Use Google Docs Viewer or download it.</p>
            <div className="doc-preview-actions">
              <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(media.url)}&embedded=true`}
                target="_blank" rel="noopener noreferrer" className="btn-secondary btn-small">
                <FiExternalLink size={14}/> Google Docs Viewer
              </a>
              <button className="btn-primary btn-small" onClick={handleDownload}>
                <FiDownload size={14}/> Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PostCard = ({ post: init, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post,         setPost]         = useState(init);
  const [showMenu,     setShowMenu]     = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [replyTexts,   setReplyTexts]   = useState({});
  const [replyingTo,   setReplyingTo]   = useState(null);
  const [editing,      setEditing]      = useState(false);
  const [editContent,  setEditContent]  = useState(post.content);
  const [dmSearch,     setDmSearch]     = useState('');
  const [dmResults,    setDmResults]    = useState([]);
  const [chats,        setChats]        = useState([]);
  const [showDmPanel,  setShowDmPanel]  = useState(false);
  const [viewMedia,    setViewMedia]    = useState(null);

  const isOwner = post.author?._id === user?._id || post.author === user?._id;
  const liked   = post.likes?.includes(user?._id);
  const [isSaved, setIsSaved] = useState(
    user?.savedPosts?.some(id => id?.toString() === post._id?.toString())
  );
  const postUrl = `${window.location.origin}/post/${post._id}`;

  const openMedia = (m) => {
     let viewUrl = m.url;
    // Prevent Cloudinary from forcing PDF download
    if (m.mimeType === 'application/pdf' && viewUrl.includes('cloudinary.com')) {
      viewUrl = viewUrl.replace('/upload/', '/upload/fl_attachment:false/');
    }
    setViewMedia({
      url:  m.url,
      name: m.fileName || 'File',
      mime: m.mimeType || '',
      size: formatSize(m.fileSize),
      type: m.resourceType === 'image' ? 'image'
          : m.resourceType === 'video' ? 'video'
          : m.resourceType === 'audio' ? 'audio'
          : m.mimeType === 'application/pdf' ? 'pdf'
          : 'doc',
    });
  };

  const handleDownload = async (url, fileName, e) => {
    e?.stopPropagation();
    try {
      await postAPI.downloadPost(post._id);
      const response = await fetch(url);
      const blob     = await response.blob();
      const blobUrl  = window.URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href = blobUrl; a.download = fileName || 'download';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started');
    } catch { window.open(url, '_blank'); }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const { data } = await postAPI.toggleLike(post._id);
      setPost(p => ({ ...p, likes: data.liked ? [...p.likes, user._id] : p.likes.filter(id => id !== user._id) }));
    } catch {}
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    try { 
      await postAPI.toggleSave(post._id); 
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Removed from saved' : 'Saved!'); 
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try { await postAPI.deletePost(post._id); onDelete?.(post._id); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleEdit = async () => {
    try {
      const { data } = await postAPI.editPost(post._id, { content: editContent });
      setPost(data); setEditing(false); toast.success('Updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleComment = async (e) => {
  e.preventDefault();
  if (!commentText.trim()) return;
  try {
    await postAPI.addComment(post._id, commentText);
    // Re-fetch so comment author is fully populated
    const { data } = await postAPI.getPost(post._id);
    setPost(data);
    setCommentText('');
  } catch { toast.error('Failed to comment'); }
};

  const handleReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text?.trim()) return;
    try {
      await postAPI.replyComment(post._id, commentId, text);
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
      const { data } = await postAPI.getPost(post._id);
      setPost(data);
    } catch { toast.error('Failed to reply'); }
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    const note = window.prompt('Add a note (optional):') || '';
    try {
      const fd = new FormData();
      fd.append('postType','repost'); fd.append('originalPostId', post._id);
      fd.append('repostNote', note); fd.append('content', note);
      await postAPI.createPost(fd);
      toast.success('Reposted!');
    } catch { toast.error('Failed to repost'); }
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(postUrl);
    toast.success('Link copied!');
    setShowShare(false);
  };

  const handleShareExternal = (platform, e) => {
    e.stopPropagation();
    const text = `Check out this post on UniHub: ${postUrl}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      gmail:    `mailto:?subject=UniHub Post&body=${encodeURIComponent(text)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    };
    window.open(urls[platform], '_blank');
    setShowShare(false);
  };

  const openSharePanel = async (e) => {
    e.stopPropagation();
    setShowDmPanel(!showDmPanel);
    if (!showDmPanel) {
      try {
        const { chatAPI: cAPI } = await import('../../services/api');
        const { data } = await cAPI.getMyChats();
        setChats(data);
      } catch {}
    }
  };

  const handleDmSearch = async (q) => {
    setDmSearch(q);
    if (q.length < 2) { setDmResults([]); return; }
    try { const { data } = await userAPI.searchUsers(q); setDmResults(data.filter(u => u._id !== user._id)); } catch {}
  };

  const shareToChat = async (chatId, e) => {
    e?.stopPropagation();
    try {
      const fd = new FormData();
      fd.append('chatId', chatId); fd.append('sharedPostId', post._id); fd.append('text', '');
      await messageAPI.sendMessage(fd);
      toast.success('Shared!');
      setShowShare(false); setShowDmPanel(false);
    } catch { toast.error('Failed to share'); }
  };

  const shareToDmUser = async (targetUserId, e) => {
    e?.stopPropagation();
    try {
      const { data: chat } = await chatAPI.accessChat(targetUserId);
      await shareToChat(chat._id, e);
    } catch { toast.error('Failed to share'); }
  };

  const getChatName = (c) => {
    if (c.isGroup) return c.name;
    return c.members?.find(m => m._id !== user._id)?.name || 'Unknown';
  };

  const cardClick = (e) => {
    if (e.target.closest('button,a,input,textarea,select,.post-menu-wrap,.share-dropdown,.share-panel,.comments-section,.post-media-grid,.media-modal-overlay')) return;
    navigate(`/post/${post._id}`);
  };

  return (
    <div className="post-card" onClick={cardClick}>

      {viewMedia && <MediaViewer media={viewMedia} onClose={() => setViewMedia(null)}/>}

      {post.postType === 'repost' && (
        <div className="repost-indicator"><FiRepeat size={13}/> Reposted</div>
      )}

      <div className="post-header">
        <img
          src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name||'U')}&background=2D6A4F&color=fff&size=64`}
          alt={post.author?.name} className="post-avatar"
          onClick={e => { e.stopPropagation(); navigate(`/profile/${post.author?.username}`); }}
        />
        <div className="post-meta">
          <span className="post-author" onClick={e => { e.stopPropagation(); navigate(`/profile/${post.author?.username}`); }}>{post.author?.name}</span>
          <span className="post-meta-dot">·</span>
          <span className="post-username">@{post.author?.username}</span>
          <span className="post-meta-dot">·</span>
          <span className="post-time">{format(post.createdAt)}</span>
          <span className={`visibility-badge ${post.visibility}`}>
            {post.visibility === 'private' ? <><FiLock size={10}/> Followers</> : <><FiGlobe size={10}/> Public</>}
          </span>
        </div>
        {isOwner && (
          <div className="post-menu-wrap" onClick={e => e.stopPropagation()}>
            <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}><FiMoreHorizontal size={18}/></button>
            {showMenu && (
              <div className="post-dropdown">
                <button onClick={() => { setEditing(true); setShowMenu(false); }}><FiEdit2 size={14}/> Edit</button>
                <div className="dropdown-divider"/>
                <button onClick={handleDelete} className="danger"><FiTrash2 size={14}/> Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.postType === 'study_material' && (
        <div className="study-material-badges">
          {post.moduleCode   && <span className="module-badge">{post.moduleCode}</span>}
          {post.materialType && <span className="material-type-badge" style={{ backgroundColor: getMaterialColor(post.materialType) }}>{post.materialType}</span>}
          {post.semester     && <span className="semester-badge">Y{post.author?.year||'?'}·S{post.semester}</span>}
          {post.aiModuleCode && <span className="ai-tagged-badge">✦ AI-tagged</span>}
        </div>
      )}

      {editing ? (
        <div className="edit-content-wrap" onClick={e => e.stopPropagation()}>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="edit-textarea" rows={4}/>
          <div className="edit-actions">
            <button className="btn-primary btn-small" onClick={handleEdit}>Save</button>
            <button className="btn-secondary btn-small" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        post.content && <div className="post-content"><RichText text={post.content}/></div>
      )}

      {post.originalPost && (
        <div className="original-post-embed" onClick={e => { e.stopPropagation(); navigate(`/post/${post.originalPost._id}`); }}>
          <div className="original-post-author">↩ {post.originalPost.author?.name}</div>
          <div className="original-post-content">{post.originalPost.content?.slice(0,180)}{post.originalPost.content?.length > 180 ? '…' : ''}</div>
        </div>
      )}

      {post.media?.length > 0 && (
        <div className={`post-media-grid media-count-${Math.min(post.media.length,4)}`}>
          {post.media.map((m, i) => {
            const isImg = m.resourceType === 'image';
            const isVid = m.resourceType === 'video';
            const isAud = m.resourceType === 'audio';
            return (
              <div key={i} className="post-media-item">
                {isImg ? (
                  <div className="post-image-wrap">
                    <img src={m.url} alt="media" className="post-image" onClick={() => openMedia(m)}/>
                    <button className="img-download-btn" onClick={e => handleDownload(m.url, m.fileName, e)} title="Download">
                      <FiDownload size={14}/>
                    </button>
                  </div>
                ) : isVid ? (
                  <video src={m.url} controls className="post-video" onClick={e => e.stopPropagation()}/>
                ) : isAud ? (
                  <audio src={m.url} controls className="post-audio" onClick={e => e.stopPropagation()}/>
                ) : (
                  <div className="post-file-card">
                    <div className="file-icon-wrap">{getFileIcon(m.mimeType)}</div>
                    <div className="file-info">
                      <div className="file-name">{m.fileName || 'File'}</div>
                      <div className="file-meta">{formatSize(m.fileSize)}</div>
                    </div>
                    <div className="file-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" title="View" onClick={() => openMedia(m)}><FiMaximize2 size={15}/></button>
                      <button className="btn-icon" title="Download" onClick={e => handleDownload(m.url, m.fileName, e)}><FiDownload size={15}/></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {post.links?.length > 0 && (
        <div className="post-links">
          {post.links.map((l,i) => (
            <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="post-link-preview" onClick={e => e.stopPropagation()}>
              <FiLink size={14} className="link-icon"/> <span className="url-link">{l}</span>
            </a>
          ))}
        </div>
      )}

      {post.poll?.question && (
        <div className="post-poll" onClick={e => e.stopPropagation()}>
          <div className="poll-question">{post.poll.question}</div>
          {post.poll.options?.map((opt,i) => {
            const total = post.poll.options.reduce((s,o) => s+(o.votes?.length||0), 0);
            const pct   = total ? Math.round((opt.votes?.length||0)/total*100) : 0;
            const voted = opt.votes?.includes(user?._id);
            return (
              <div key={i} className={`poll-option ${voted?'voted':''}`} onClick={async () => {
                try { const {data} = await postAPI.votePoll(post._id, i); setPost(p => ({...p, poll:data})); } catch {}
              }}>
                <div className="poll-bar" style={{width:`${pct}%`}}/>
                <span className="poll-option-text">{opt.text}</span>
                <span className="poll-pct">{pct}%</span>
              </div>
            );
          })}
          <div className="poll-total">{post.poll.options?.reduce((s,o) => s+(o.votes?.length||0),0)} votes</div>
        </div>
      )}

      {post.tags?.length > 0 && (
        <div className="post-tags">{post.tags.map(t => <span key={t} className="tag-chip small">#{t}</span>)}</div>
      )}

      <div className="post-actions" onClick={e => e.stopPropagation()}>
        <button className={`action-btn ${liked?'liked':''}`} onClick={handleLike}><FiHeart size={15}/> <span>{post.likes?.length||0}</span></button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}><FiMessageSquare size={15}/> <span>{post.comments?.length||0}</span></button>
        <button className="action-btn" onClick={handleRepost}><FiRepeat size={15}/> <span>{post.reposts?.length||0}</span></button>
        <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
          <FiBookmark size={15}/>
        </button>

        <div className="share-wrap" style={{position:'relative', marginLeft:'auto'}}>
          <button className="action-share-btn" onClick={() => setShowShare(!showShare)}><FiShare2 size={15}/> Share</button>
          {showShare && (
            <div className="share-dropdown" onClick={e => e.stopPropagation()}>
              <div className="post-link-copy"><input value={postUrl} readOnly/><button onClick={handleCopyLink}>Copy</button></div>
              <div className="share-option" onClick={handleCopyLink}>
  <div className="share-icon" style={{background:'#F0FDF4'}}>
    <FiLink size={16} />
  </div>
  Copy link
        </div>

        <div className="share-option" onClick={e => handleShareExternal('whatsapp',e)}>
          <div className="share-icon" style={{background:'#DCFCE7'}}>
            <FaWhatsapp size={16} color="#25D366" />
          </div>
          WhatsApp
        </div>

        <div className="share-option" onClick={e => handleShareExternal('gmail',e)}>
          <div className="share-icon" style={{background:'#FEE2E2'}}>
            <SiGmail size={16} color="#EA4335" />
          </div>
          Gmail
        </div>

        <div className="share-option" onClick={e => handleShareExternal('twitter',e)}>
          <div className="share-icon" style={{background:'#EFF6FF'}}>
            <FaTwitter size={16} color="#1DA1F2" />
          </div>
          Twitter / X
        </div>

        <div className="share-option" onClick={openSharePanel}>
          <div className="share-icon" style={{background:'#EDE9FE'}}>
            <HiOutlineMail size={16} />
          </div>
          Send to Chat / DM
        </div>
              {showDmPanel && (
                <div className="share-panel">
                  <div style={{padding:'6px 10px 4px',fontWeight:700,fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Your Chats</div>
                  {chats.slice(0,6).map(c => (
                    <div key={c._id} className="share-option" onClick={e => shareToChat(c._id,e)}>
                      <div className="share-icon" style={{background:'var(--primary-bg)'}}>{c.isGroup ? '👥' : '👤'}</div>
                      {getChatName(c)}
                    </div>
                  ))}
                  <div style={{height:1,background:'var(--border-light)',margin:'4px 8px'}}/>
                  <div style={{padding:'6px 10px 4px',fontWeight:700,fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Search People</div>
                  <div style={{padding:'0 8px 8px',position:'relative'}}>
                    <FiSearch size={13} style={{position:'absolute',left:18,top:'50%',transform:'translateY(-60%)',color:'#9CA3AF'}}/>
                    <input type="text" placeholder="Search..." value={dmSearch}
                      onChange={e => handleDmSearch(e.target.value)}
                      className="chat-search-input" style={{paddingLeft:30}}
                      onClick={e => e.stopPropagation()}/>
                  </div>
                  {dmResults.map(u => (
                    <div key={u._id} className="share-option" onClick={e => shareToDmUser(u._id,e)}>
                      <img src={u.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2D6A4F&color=fff&size=40`} alt={u.name} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}}/>
                      {u.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <span className="action-views"><FiEye size={13}/> {post.views?.length||0}</span>
      </div>

      {showComments && (
        <div className="comments-section" onClick={e => e.stopPropagation()}>
          <form onSubmit={handleComment} className="comment-form">
            <img src={user?.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=2D6A4F&color=fff&size=40`} alt="" className="comment-avatar"/>
            <input type="text" placeholder="Write a comment... (@mention)" value={commentText}
              onChange={e => setCommentText(e.target.value)} className="comment-input"/>
            <button type="submit" className="btn-primary btn-small">Reply</button>
          </form>

          <div className="comments-list">
            {post.comments?.map(c => {
              const cAuthor   = typeof c.user === 'object' ? c.user : null;
              const cName     = cAuthor?.name     || 'Unknown';
              const cUsername = cAuthor?.username || null;
              const cAvatar   = cAuthor?.avatar   || `https://ui-avatars.com/api/?name=${encodeURIComponent(cName)}&background=2D6A4F&color=fff&size=40`;

              return (
                <div key={c._id} className="comment-item">
                  <img src={cAvatar} alt={cName} className="comment-avatar"
                    style={{ cursor: cUsername ? 'pointer' : 'default' }}
                    onClick={() => cUsername && navigate(`/profile/${cUsername}`)}/>
                  <div className="comment-body">
                    <div className="comment-bubble">
                      <div className="comment-header">
                        <span className="comment-author"
                          style={{ cursor: cUsername ? 'pointer' : 'default' }}
                          onClick={() => cUsername && navigate(`/profile/${cUsername}`)}>
                          {cName}
                        </span>
                        <span className="comment-time">{format(c.createdAt)}</span>
                      </div>
                      <div className="comment-text"><RichText text={c.text}/></div>
                    </div>
                    <button className="reply-toggle-btn" onClick={() => setReplyingTo(replyingTo===c._id ? null : c._id)}>Reply</button>
                    {replyingTo === c._id && (
                      <div className="reply-form">
                        <input type="text" placeholder="Write a reply..." value={replyTexts[c._id]||''}
                          onChange={e => setReplyTexts(p => ({...p,[c._id]:e.target.value}))}
                          className="comment-input" onKeyDown={e => e.key==='Enter' && handleReply(c._id)}/>
                        <button className="btn-primary btn-small" onClick={() => handleReply(c._id)}>Send</button>
                      </div>
                    )}
                    {c.replies?.map(r => {
                      const rAuthor   = typeof r.user === 'object' ? r.user : null;
                      const rName     = rAuthor?.name     || 'Unknown';
                      const rUsername = rAuthor?.username || null;
                      const rAvatar   = rAuthor?.avatar   || `https://ui-avatars.com/api/?name=${encodeURIComponent(rName)}&background=2D6A4F&color=fff&size=40`;
                      return (
                        <div key={r._id} className="reply-item">
                          <img src={rAvatar} alt={rName} className="comment-avatar small"
                            style={{ cursor: rUsername ? 'pointer' : 'default' }}
                            onClick={() => rUsername && navigate(`/profile/${rUsername}`)}/>
                          <div className="comment-body">
                            <div className="comment-bubble">
                              <div className="comment-header">
                                <span className="comment-author"
                                  style={{ cursor: rUsername ? 'pointer' : 'default' }}
                                  onClick={() => rUsername && navigate(`/profile/${rUsername}`)}>
                                  {rName}
                                </span>
                              </div>
                              <div className="comment-text"><RichText text={r.text}/></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
