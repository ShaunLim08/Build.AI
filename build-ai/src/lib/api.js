import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chatbot APIs
export const createChatbot = (data) => api.post('/api/chatbots', data);
export const getChatbots = () => api.get('/api/chatbots');
export const getChatbot = (id) => api.get(`/api/chatbots/${id}`);
export const deleteChatbot = (id) => api.delete(`/api/chatbots/${id}`);

// Document APIs
export const uploadDocument = (chatbotId, formData) => 
  api.post(`/api/chatbots/${chatbotId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const scrapeURL = (chatbotId, url) => 
  api.post(`/api/chatbots/${chatbotId}/scrape`, { url });

// Chat APIs
export const sendMessage = (chatbotId, message) =>
  api.post(`/api/chat/${chatbotId}`, { message });

// Authentication APIs
export const register = (data) =>
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const login = (data) =>
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json());

export const logout = () =>
  fetch('/api/auth/logout', {
    method: 'POST',
  }).then(res => res.json());

export const getCurrentUser = () =>
  fetch('/api/auth/me').then(res => res.json());