// Parse @mentions and #hashtags and links from text and render as styled spans
export const parseTextWithMentions = (text) => {
  if (!text) return [];
  const regex = /(@\w+|#\w+|https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text',    value: text.slice(lastIndex, match.index) });
    if (match[0].startsWith('@')) parts.push({ type: 'mention', value: match[0] });
    else if (match[0].startsWith('#')) parts.push({ type: 'hashtag', value: match[0] });
    else parts.push({ type: 'link', value: match[0] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });
  return parts;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const getFileIcon = (mimeType) => {
  if (!mimeType) return '📎';
  if (mimeType.startsWith('image/'))   return '🖼️';
  if (mimeType.startsWith('video/'))   return '🎬';
  if (mimeType.startsWith('audio/'))   return '🎵';
  if (mimeType === 'application/pdf')  return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))   return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📋';
  return '📎';
};

export const getMaterialTypeColor = (type) => {
  const colors = {
    'Lecture Note':       '#3b82f6',
    'Tutorial':           '#10b981',
    'Past Paper':         '#f59e0b',
    'Lab Sheet':          '#8b5cf6',
    'Reference Material': '#ef4444',
  };
  return colors[type] || '#6b7280';
};
