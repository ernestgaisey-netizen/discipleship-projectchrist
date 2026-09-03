import api from './apiClient';

const mentorshipService = {
  mentors:             ()          => api.get('/mentors').then(r => r.data),
  myProfile:           ()          => api.get('/mentorship/my-profile').then(r => r.data),
  upsertProfile:       (data)      => api.put('/mentorship/my-profile', data).then(r => r.data),
  request:             (data)      => api.post('/mentorship/request', data).then(r => r.data),
  myRequests:          ()          => api.get('/mentorship/my-requests').then(r => r.data),
  sessions:            ()          => api.get('/mentorship/sessions').then(r => r.data),
  createSession:       (data)      => api.post('/mentorship/sessions', data).then(r => r.data),
  completeSession:     (id, data)  => api.post(`/mentorship/sessions/${id}/complete`, data).then(r => r.data),
  goals:               (requestId) => api.get(`/mentorship/goals/${requestId}`).then(r => r.data),
  createGoal:          (data)      => api.post('/mentorship/goals', data).then(r => r.data),
  updateGoal:          (id, data)  => api.patch(`/mentorship/goals/${id}`, data).then(r => r.data),
  addActionPoint:      (goalId, data) => api.post(`/mentorship/goals/${goalId}/action-points`, data).then(r => r.data),
  completeActionPoint: (id)        => api.post(`/mentorship/action-points/${id}/complete`).then(r => r.data),
  messages:            (requestId) => api.get(`/mentorship/requests/${requestId}/messages`).then(r => r.data),
  sendMessage:         (requestId, body) => api.post(`/mentorship/requests/${requestId}/messages`, { body }).then(r => r.data),

  // Admin
  pendingRequests:     ()          => api.get('/mentorship/pending-requests').then(r => r.data),
  assignMentor:        (reqId, mentorId) => api.post(`/mentorship/requests/${reqId}/assign`, { mentor_id: mentorId }).then(r => r.data),
};

export default mentorshipService;
