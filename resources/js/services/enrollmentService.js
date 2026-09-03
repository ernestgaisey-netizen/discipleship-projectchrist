import api from './apiClient';

const enrollmentService = {
  enroll:       (courseId) => api.post(`/courses/${courseId}/enroll`).then(r => r.data),
  unenroll:     (courseId) => api.delete(`/courses/${courseId}/unenroll`),
  status:       (courseId) => api.get(`/courses/${courseId}/enrollment`).then(r => r.data),
  myEnrollments:()         => api.get('/my-enrollments').then(r => r.data),
};

export default enrollmentService;
