import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, postAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard   from '../components/post/PostCard';
import MainLayout from '../components/layout/MainLayout';
import api        from '../services/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiMessageSquare, FiLock, FiCamera } from 'react-icons/fi';

const ProfilePage = () => {
  const { username }             = useParams();
  const { user: me, updateUser } = useAuth();
  const navigate                 = useNavigate();
  const [profile,      setProfile]      = useState(null);
  const [posts,        setPosts]        = useState([]);
  const [following,    setFollowing]    = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [showPwdForm,  setShowPwdForm]  = useState(false);
  const [editForm,     setEditForm]     = useState({ name:'', bio:'', semester:'', year:'', department:'' });
  const [avatarFile,   setAvatarFile]   = useState(null);
  const [avatarPreview,setAvatarPreview]= useState(null);
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pwdForm,      setPwdForm]      = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [loading,      setLoading]      = useState(true);
  const [savingPwd,    setSavingPwd]    = useState(false);
  const isMe = me?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: prof } = await userAPI.getProfile(username);
        setProfile(prof);
        setFollowing(prof.followers?.some(f => (f._id||f) === me?._id));
        setEditForm({ name: prof.name, bio: prof.bio||'', semester: prof.semester||'', year: prof.year||'', department: prof.department||'' });
        const { data: userPosts } = await postAPI.getUserPosts(prof._id);
        setPosts(userPosts);
      } catch { toast.error('Profile not found'); }
      setLoading(false);
    };
    load();
  }, [username]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
    // Auto-save avatar immediately
    try {
      const fd = new FormData(); fd.append('avatar', file);
      const { data } = await userAPI.updateAvatar(fd);
      updateUser(data); setProfile(data);
      toast.success('Profile photo updated!');
    } catch { toast.error('Failed to update profile photo'); }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
    // Auto-save cover immediately
    try {
      const fd = new FormData(); fd.append('cover', file);
      const { data } = await userAPI.updateCover(fd);
      updateUser(data); setProfile(data);
      toast.success('Cover photo updated!');
    } catch { toast.error('Failed to update cover photo'); }
  };

  const handleEditSave = async () => {
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k,v]) => { if (v !== undefined) fd.append(k, v); });
      if (avatarFile) fd.append('avatar', avatarFile);
      if (coverFile)  fd.append('cover',  coverFile);
      const { data } = await userAPI.updateProfile(fd);
      updateUser(data); setProfile(data); setEditing(false);
      setAvatarFile(null); setAvatarPreview(null);
      setCoverFile(null);  setCoverPreview(null);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwdForm.newPassword.length < 6) return toast.error('Min 6 characters');
    setSavingPwd(true);
    try {
      await api.put('/users/password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setShowPwdForm(false); toast.success('Password updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSavingPwd(false);
  };

  const handleFollow = async () => {
    try {
      await userAPI.toggleFollow(profile._id);
      setFollowing(!following);
      setProfile(p => ({
        ...p,
        followers: following ? p.followers.filter(f=>(f._id||f)!==me._id) : [...p.followers, {_id:me._id}]
      }));
    } catch {}
  };

  const handleMessage = async () => {
    try { const { data: chat } = await chatAPI.accessChat(profile._id); navigate('/messages', { state: { openChat: chat } }); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <MainLayout><div className="loading-spinner">Loading profile...</div></MainLayout>;
  if (!profile) return <MainLayout><div className="error-state">Profile not found</div></MainLayout>;

  const displayAvatar   = avatarPreview  || profile.avatar   || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=E8672A&color=fff&size=128`;
  const displayCover    = coverPreview   || profile.coverPhoto;

  return (
    <MainLayout>
      <div className="profile-page">

        {/* ── Cover photo ── */}
        <div className="profile-cover-wrap">
          {displayCover
            ? <img src={displayCover} alt="cover" className="profile-cover-img"/>
            : <div className="profile-cover-default"/>
          }
          {isMe && (
            <label className="profile-cover-edit-btn">
              <input type="file" accept="image/*" hidden onChange={handleCoverChange}/>
              <FiCamera size={14}/> {displayCover ? 'Change cover' : 'Add cover photo'}
            </label>
          )}
        </div>

        {/* ── Profile header ── */}
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            <img src={displayAvatar} alt={profile.name} className="profile-avatar"/>
            {isMe && (
              <label className="avatar-edit-label" title="Change photo">
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange}/>
                <FiCamera size={12}/>
              </label>
            )}
          </div>

          <div className="profile-info">
            {editing ? (
              <div className="edit-profile-form">
                <input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} placeholder="Full name" className="input-field"/>
                <textarea value={editForm.bio} onChange={e=>setEditForm({...editForm,bio:e.target.value})} placeholder="Tell us about yourself..." className="input-field" rows={2} style={{resize:'none'}}/>
                <div className="form-row">
                  <input value={editForm.department} onChange={e=>setEditForm({...editForm,department:e.target.value})} placeholder="Department" className="input-field"/>
                  <select value={editForm.year} onChange={e=>setEditForm({...editForm,year:e.target.value})} className="input-field">
                    <option value="">Year</option>
                    {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
                  </select>
                  <select value={editForm.semester} onChange={e=>setEditForm({...editForm,semester:e.target.value})} className="input-field">
                    <option value="">Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                {(avatarFile || coverFile) && (
                  <div style={{fontSize:13,color:'var(--primary)',background:'var(--primary-bg)',padding:'8px 12px',borderRadius:8,border:'1px solid rgba(232,103,42,0.2)'}}>
                    {avatarFile && <div>📷 New avatar: {avatarFile.name}</div>}
                    {coverFile  && <div>🖼️ New cover: {coverFile.name}</div>}
                  </div>
                )}
                <div className="edit-btns">
                  <button className="btn-primary btn-small" onClick={handleEditSave}>Save changes</button>
                  <button className="btn-secondary btn-small" onClick={()=>{ setEditing(false); setAvatarFile(null); setAvatarPreview(null); setCoverFile(null); setCoverPreview(null); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-name">{profile.name}</div>
                <div className="profile-username">@{profile.username}</div>
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                <div className="profile-details">
                  {profile.department && <span>🏛 {profile.department}</span>}
                  {profile.year       && <span>📅 Year {profile.year}</span>}
                  {profile.semester   && <span>📚 Semester {profile.semester}</span>}
                </div>
                <div className="profile-stats">
                  <span><strong>{profile.followers?.length||0}</strong> Followers</span>
                  <span><strong>{profile.following?.length||0}</strong> Following</span>
                  <span><strong>{posts.length}</strong> Posts</span>
                </div>
              </>
            )}
          </div>

          {!editing && (
            <div className="profile-actions">
              {isMe ? (
                <>
                  <button className="btn-secondary btn-small" onClick={()=>setEditing(true)}><FiEdit2 size={14}/> Edit</button>
                  <button className="btn-secondary btn-small" onClick={()=>setShowPwdForm(!showPwdForm)}><FiLock size={14}/> Password</button>
                </>
              ) : (
                <>
                  <button className={following?'btn-outline btn-small':'btn-primary btn-small'} onClick={handleFollow}>
                    {following ? 'Following' : 'Follow'}
                  </button>
                  <button className="btn-secondary btn-small" onClick={handleMessage}><FiMessageSquare size={14}/> Message</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Password form ── */}
        {showPwdForm && isMe && (
          <div className="password-form-card">
            <h3><FiLock size={15}/> Change Password</h3>
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={pwdForm.currentPassword} onChange={e=>setPwdForm({...pwdForm,currentPassword:e.target.value})} placeholder="Enter current password" className="input-field" required/>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwdForm.newPassword} onChange={e=>setPwdForm({...pwdForm,newPassword:e.target.value})} placeholder="Minimum 6 characters" className="input-field" required/>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwdForm.confirmPassword} onChange={e=>setPwdForm({...pwdForm,confirmPassword:e.target.value})} placeholder="Re-enter new password" className="input-field" required/>
              </div>
              <div className="edit-btns">
                <button type="submit" className="btn-primary btn-small" disabled={savingPwd}>{savingPwd?'Saving...':'Update Password'}</button>
                <button type="button" className="btn-secondary btn-small" onClick={()=>{setShowPwdForm(false);setPwdForm({currentPassword:'',newPassword:'',confirmPassword:''});}}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Posts ── */}
        <div style={{marginTop:24}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:16}}>Posts</h2>
          {posts.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><p>No posts yet.</p></div>
          ) : (
            <div className="posts-list">
              {posts.map(post=>(
                <PostCard key={post._id} post={post} onDelete={id=>setPosts(prev=>prev.filter(p=>p._id!==id))}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
export default ProfilePage;
