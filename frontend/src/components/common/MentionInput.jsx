import React, { useState, useRef } from 'react';
import { userAPI } from '../../services/api';

const MentionInput = ({ value, onChange, placeholder, rows = 3, className = '' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const [cursor, setCursor] = useState(0);
  const ref = useRef(null);
  const timer = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    onChange(val);
    setCursor(pos);
    const match = val.slice(0, pos).match(/@(\w*)$/);
    if (match) {
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        if (match[1].length >= 1) {
          try { const { data } = await userAPI.searchUsers(match[1]); setSuggestions(data); setShow(true); }
          catch { setSuggestions([]); }
        } else { setSuggestions([]); setShow(false); }
      }, 280);
    } else { setShow(false); }
  };

  const insert = (username) => {
    const before = value.slice(0, cursor).replace(/@\w*$/, `@${username} `);
    const after  = value.slice(cursor);
    onChange(before + after);
    setShow(false);
    ref.current?.focus();
  };

  return (
    <div style={{ position: 'relative' }}>
      <textarea ref={ref} value={value} onChange={handleChange} placeholder={placeholder} rows={rows} className={`mention-textarea ${className}`} />
      {show && suggestions.length > 0 && (
        <div className="mention-suggestions">
          {suggestions.map(u => (
            <div key={u._id} className="mention-suggestion-item" onMouseDown={e => { e.preventDefault(); insert(u.username); }}>
              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2D6A4F&color=fff&size=40`} alt={u.name} className="mention-avatar" />
              <div>
                <div className="mention-name">{u.name}</div>
                <div className="mention-username">@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MentionInput;
