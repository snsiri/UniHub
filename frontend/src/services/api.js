import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UniHub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('UniHub_token');
      localStorage.removeItem('UniHub_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
};

export const userAPI = {
  getProfile:            (username) => api.get(`/users/${username}`),
  updateProfile:         (data)     => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleFollow:          (userId)   => api.post(`/users/${userId}/follow`),
  searchUsers:           (q)        => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getSavedPosts:         ()         => api.get('/users/saved'),
  getNotifications:      ()         => api.get('/users/notifications'),
  markNotificationsRead: ()         => api.put('/users/notifications/read'),
};

export const postAPI = {
  createPost:        (data)              => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFeed:           (page = 1)          => api.get(`/posts/feed?page=${page}`),
  getStudyMaterials: (params)            => api.get('/posts/study-materials', { params }),
  getPost:           (id)                => api.get(`/posts/${id}`),
  getUserPosts:      (userId, page = 1)  => api.get(`/posts/user/${userId}?page=${page}`),
  editPost:          (id, data)          => api.put(`/posts/${id}`, data),
  deletePost:        (id)                => api.delete(`/posts/${id}`),
  toggleLike:        (id)                => api.post(`/posts/${id}/like`),
  toggleSave:        (id)                => api.post(`/posts/${id}/save`),
  votePoll:          (id, optIdx)        => api.post(`/posts/${id}/vote`, { optionIndex: optIdx }),
  addComment:        (id, text)          => api.post(`/posts/${id}/comments`, { text }),
  replyComment:      (id, cId, text)     => api.post(`/posts/${id}/comments/${cId}/replies`, { text }),
  downloadPost:      (id)                => api.post(`/posts/${id}/download`),
};

export const chatAPI = {
  accessChat:      (userId)        => api.post('/chats', { userId }),
  createGroup:     (data)          => api.post('/chats/group', data),
  getMyChats:      ()              => api.get('/chats'),
  renameGroup:     (chatId, name)  => api.put(`/chats/${chatId}/rename`, { name }),
  addToGroup:      (chatId, userId)=> api.put(`/chats/${chatId}/add`, { userId }),
  removeFromGroup: (chatId, userId)=> api.put(`/chats/${chatId}/remove`, { userId }),
};

export const messageAPI = {
  sendMessage: (data)           => api.post('/messages', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMessages: (chatId, page=1) => api.get(`/messages/${chatId}?page=${page}`),
};

export const aiAPI = {
  classify:        (text) => api.post('/ai/classify',   { text }),
  checkSimilarity: (text) => api.post('/ai/similarity', { text }),
  getModules:      ()     => api.get('/ai/modules'),
  addModule:       (data) => api.post('/ai/modules', data),
  deleteModule:    (id)   => api.delete(`/ai/modules/${id}`),
  getStats:        ()     => api.get('/ai/stats'),
};

export default api;

// Additional exports added in v4
export const trendingAPI = {
  getTrending: () => api.get('/posts/trending'),
  getEvents:   () => api.get('/ai/events'),
};

export const groupAPI = {
  getDetails:     (chatId)         => api.get(`/chats/${chatId}/details`),
  addMember:      (chatId, userId) => api.put(`/chats/${chatId}/add`,    { userId }),
  removeMember:   (chatId, userId) => api.put(`/chats/${chatId}/remove`, { userId }),
  leaveGroup:     (chatId)         => api.put(`/chats/${chatId}/leave`),
  rename:         (chatId, name)   => api.put(`/chats/${chatId}/rename`, { name }),
};
