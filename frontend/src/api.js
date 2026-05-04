// For Option B: Frontend on Firebase, Backend on Render
const RENDER_BACKEND_URL = 'https://node-js-backend-3l5m.onrender.com';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:5000/api' 
    : RENDER_BACKEND_URL + '/api';

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch (e) {
      throw new Error(res.statusText || 'Request failed');
    }
    throw new Error(errorData.error || errorData.message || 'Request failed');
  }
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  localStorage.setItem('token', data.token);
  return data;
};

export const getMe = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(res);
};

export const getEmployees = async ({ status = '', search = '', page = 0, size = 10, sortBy = 'employee_id', sortDir = 'asc' }) => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  queryParams.append('page', page);
  queryParams.append('size', size);
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortDir', sortDir);
  
  const url = `${API_URL}/employees?${queryParams.toString()}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(res);
};

export const createEmployee = async (employee) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  });
  return handleResponse(res);
};

export const updateEmployee = async (id, employee) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  });
  return handleResponse(res);
};

export const deleteEmployee = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete');
  }
};

export const uploadFile = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.text();
};

export const getAuditLogs = async (page = 0, size = 10) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/employees/audit-logs?page=${page}&size=${size}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(res);
};
