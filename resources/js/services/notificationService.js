import api from './apiClient';

const notificationService = {
  list:        ()    => api.get('/notifications').then(r => r.data),
  unreadCount: ()    => api.get('/notifications/unread-count').then(r => r.data.count),
  markRead:    (id)  => api.patch(`/notifications/${id}/read`),
  markAllRead: ()    => api.post('/notifications/read-all'),
  remove:      (id)  => api.delete(`/notifications/${id}`),
  broadcast:   (data) => api.post('/notifications/broadcast', data),
};

export default notificationService;
