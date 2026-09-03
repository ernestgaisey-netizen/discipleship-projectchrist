import api from './apiClient';

const courseService = {
  list:           ()           => api.get('/courses').then(r => r.data),
  get:            (id)         => api.get(`/courses/${id}`).then(r => r.data),
  create:         (data)       => api.post('/courses', data).then(r => r.data),
  update:         (id, data)   => api.patch(`/courses/${id}`, data).then(r => r.data),
  remove:         (id)         => api.delete(`/courses/${id}`),
  uploadThumbnail:(id, file)   => {
    const fd = new FormData();
    fd.append('thumbnail', file);
    return api.upload(`/courses/${id}/thumbnail`, fd).then(r => r.data);
  },

  // Modules
  getModule:      (id)         => api.get(`/modules/${id}`).then(r => r.data),
  createModule:   (courseId, data) => api.post(`/courses/${courseId}/modules`, data).then(r => r.data),
  updateModule:   (id, data)   => api.patch(`/modules/${id}`, data).then(r => r.data),
  deleteModule:   (id)         => api.delete(`/modules/${id}`),
  duplicateModule:(id)         => api.post(`/modules/${id}/duplicate`).then(r => r.data),
  reorderModule:  (id, order)  => api.patch(`/modules/${id}/reorder`, { order_index: order }),
  uploadMaterial: (id, file)   => {
    const fd = new FormData();
    fd.append('material', file);
    return api.upload(`/modules/${id}/material`, fd).then(r => r.data);
  },
  extractContent: (file)       => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload('/modules/extract-content', fd).then(r => r.data);
  },

  // AI course drafting — returns course + module data to pre-fill the create form
  generateWithAI: (prompt, moduleCount) =>
    api.post('/ai/generate-course', { prompt, module_count: moduleCount }).then(r => r.data),
};

export default courseService;
