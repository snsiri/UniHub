import React from 'react';
import { useNavigate } from 'react-router-dom';

const parseText = (text) => {
  if (!text) return [];
  const regex = /(@\w+|#\w+|https?:\/\/[^\s]+)/g;
  const parts = [];
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    if (match[0].startsWith('@'))      parts.push({ type: 'mention', value: match[0] });
    else if (match[0].startsWith('#')) parts.push({ type: 'hashtag', value: match[0] });
    else                               parts.push({ type: 'link',    value: match[0] });
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
};

const RichText = ({ text, className = '' }) => {
  const navigate = useNavigate();
  const parts = parseText(text);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.type === 'mention')
          return <span key={i} className="mention-link" onClick={e => { e.stopPropagation(); navigate(`/profile/${p.value.slice(1)}`); }}>{p.value}</span>;
        if (p.type === 'hashtag')
          return <span key={i} className="hashtag-link">{p.value}</span>;
        if (p.type === 'link')
          return <a key={i} href={p.value} target="_blank" rel="noopener noreferrer" className="url-link" onClick={e => e.stopPropagation()}>{p.value}</a>;
        return <span key={i}>{p.value}</span>;
      })}
    </span>
  );
};
export default RichText;
