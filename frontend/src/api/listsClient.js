import API from './index';

// lists
export const getLists = () => API.get('/lists').then(r => r.data);
export const createList = (name, color) => API.post('/lists', { name, color }).then(r => r.data);
export const renameList = (id, name) => API.patch(`/lists/${id}`, { name }).then(r => r.data);
export const deleteList = (id) => API.delete(`/lists/${id}`).then(r => r.data);

// list detail (leads inside)
export const getList = (id) => API.get(`/lists/${id}`).then(r => r.data);

// membership
export const addLeadToList = (listId, leadId) => API.post(`/lists/${listId}/leads`, { leadId }).then(r => r.data);
export const removeLeadFromList = (listId, leadId) => API.delete(`/lists/${listId}/leads/${leadId}`).then(r => r.data);