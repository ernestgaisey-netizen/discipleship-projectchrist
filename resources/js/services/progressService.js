import api from './apiClient';

const progressService = {
  start:          (moduleId)   => api.post(`/progress/${moduleId}/start`).then(r => r.data),
  complete:       (moduleId, timeSpent) =>
    api.post(`/progress/${moduleId}/complete`, { time_spent: timeSpent }).then(r => r.data),
  courseProgress: (courseId)   => api.get(`/progress/course/${courseId}`).then(r => r.data),
  dashboard:      ()           => api.get('/progress/dashboard').then(r => r.data),
  saveNotes:      (moduleId, notes) => api.patch(`/progress/${moduleId}/notes`, { notes }).then(r => r.data),
};

export default progressService;
