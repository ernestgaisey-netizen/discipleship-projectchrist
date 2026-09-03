import api from './apiClient';

const adminService = {
  dashboard:        ()           => api.get('/admin/dashboard').then(r => r.data),
  stats:            ()           => api.get('/admin/stats').then(r => r.data),

  // Users
  users:            (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/users${q ? '?' + q : ''}`).then(r => r.data);
  },
  getUser:          (id)         => api.get(`/admin/users/${id}`).then(r => r.data),
  createUser:       (data)       => api.post('/admin/users', data).then(r => r.data),
  updateUser:       (id, data)   => api.patch(`/admin/users/${id}`, data).then(r => r.data),
  deactivateUser:   (id)         => api.post(`/admin/users/${id}/deactivate`),
  reactivateUser:   (id)         => api.post(`/admin/users/${id}/reactivate`),
  deleteUser:       (id)         => api.delete(`/admin/users/${id}`),

  // Badges
  badges:           ()           => api.get('/badges').then(r => r.data),
  createBadge:      (data)       => api.post('/badges', data).then(r => r.data),
  updateBadge:      (id, data)   => api.patch(`/badges/${id}`, data).then(r => r.data),
  deleteBadge:      (id)         => api.delete(`/badges/${id}`),

  // Community moderation
  pendingContent:   ()           => api.get('/admin/community/pending').then(r => r.data),
  moderatePost:     (id, action) => api.post(`/admin/community/posts/${id}/moderate`, { action }),
  moderateComment:  (id, action) => api.post(`/admin/community/comments/${id}/moderate`, { action }),

  // Certificates
  issueCertificate: (userId, courseId) => api.post('/certificates/issue', { user_id: userId, course_id: courseId }).then(r => r.data),

  // Mentorship (admin)
  pendingMentorshipRequests: () => api.get('/mentorship/pending-requests').then(r => r.data),
  allMentorshipRequests:     () => api.get('/mentorship/pending-requests').then(r => r.data),
  assignMentor:    (requestId, mentorId) => api.post(`/mentorship/requests/${requestId}/assign`, { mentor_id: mentorId }).then(r => r.data),
  approveRequest:  (requestId, notes)    => api.post(`/mentorship/requests/${requestId}/assign`, { status: 'approved', admin_notes: notes }).then(r => r.data),
  rejectRequest:   (requestId)           => api.post(`/mentorship/requests/${requestId}/assign`, { status: 'rejected' }).then(r => r.data),
  allMentors:      ()                    => api.get('/mentors').then(r => r.data),
  approveMentor:   (userId, action)      => api.post('/mentorship/approve', { userId, action }).then(r => r.data),
  allSessions:     (params = {})         => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/mentorship/all-sessions${q ? '?' + q : ''}`).then(r => r.data);
  },

  // Logs
  auditLogs:        (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/audit-logs${q ? '?' + q : ''}`).then(r => r.data);
  },
  exceptionLogs:    (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/exception-logs${q ? '?' + q : ''}`).then(r => r.data);
  },
  resolveException: (id)         => api.post(`/admin/exception-logs/${id}/resolve`),
};

export default adminService;
