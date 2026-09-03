import api from './apiClient';

const communityService = {
  posts:         (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/community/posts${q ? '?' + q : ''}`).then(r => r.data);
  },
  getPost:       (id)          => api.get(`/community/posts/${id}`).then(r => r.data),
  createPost:    (data)        => api.post('/community/posts', data).then(r => r.data),
  updatePost:    (id, data)    => api.patch(`/community/posts/${id}`, data).then(r => r.data),
  deletePost:    (id)          => api.delete(`/community/posts/${id}`),
  addComment:    (postId, data)=> api.post(`/community/posts/${postId}/comments`, data).then(r => r.data),
  deleteComment: (id)          => api.delete(`/community/comments/${id}`),
  toggleLike:    (type, id)    => api.post(`/community/${type}/${id}/like`).then(r => r.data),
  report:        (data)        => api.post('/community/report', data),
};

export default communityService;
