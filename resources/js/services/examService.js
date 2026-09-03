import api from './apiClient';

const examService = {
  getForModule:     (moduleId) => api.get(`/exams/module/${moduleId}`).then(r => r.data),
  answer:           (examId, questionId, answer) =>
    api.post(`/exams/${examId}/answer`, { question_id: questionId, answer }).then(r => r.data),
  back:             (examId)   => api.post(`/exams/${examId}/back`).then(r => r.data),
  finish:           (examId)   => api.post(`/exams/${examId}/finish`).then(r => r.data),
  attempts:         (examId)   => api.get(`/exams/${examId}/attempts`).then(r => r.data),

  // Admin
  questionBank:     (moduleId) => api.get(`/exams/bank/${moduleId}`).then(r => r.data),
  createQuestion:   (data)     => api.post('/exams/questions', data).then(r => r.data),
  updateQuestion:   (id, data) => api.patch(`/exams/questions/${id}`, data).then(r => r.data),
  deleteQuestion:   (id)       => api.delete(`/exams/questions/${id}`),
  approveQuestion:  (id)       => api.post(`/exams/questions/${id}/approve`),
  rejectQuestion:   (id)       => api.post(`/exams/questions/${id}/reject`),

  // AI
  generateQuestions:(moduleId, count) =>
    api.post('/ai/generate-questions', { module_id: moduleId, count }).then(r => r.data),
};

export default examService;
