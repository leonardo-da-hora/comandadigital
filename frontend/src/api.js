const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Token ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const login = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login inválido');
  return res.json();
};

export const register = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/register/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Falha ao criar conta');
  }
  return res.json();
};

export const getMe = async () => {
  const res = await fetch(`${API_URL}/auth/me/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
};

export const getProducts = async () => {
  const res = await fetch(`${API_URL}/products/`, { headers: getHeaders() });
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${API_URL}/categories/`, { headers: getHeaders() });
  return res.json();
};

export const createCategory = async (data) => {
  const res = await fetch(`${API_URL}/categories/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const createProduct = async (formData) => {
  const res = await fetch(`${API_URL}/products/`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  return res.json();
};

export const updateProduct = async (productId, formData) => {
  const res = await fetch(`${API_URL}/products/${productId}/`, {
    method: 'PATCH',
    headers: getHeaders(true),
    body: formData,
  });
  return res.json();
};

export const deleteProduct = async (productId) => {
  await fetch(`${API_URL}/products/${productId}/`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};

export const getTables = async () => {
  const res = await fetch(`${API_URL}/tables/`, { headers: getHeaders() });
  return res.json();
};

export const createTable = async (data) => {
  const res = await fetch(`${API_URL}/tables/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const addTableItem = async (tableId, data) => {
  const res = await fetch(`${API_URL}/tables/${tableId}/add_item/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const closeTable = async (tableId, paymentMethod) => {
  const res = await fetch(`${API_URL}/tables/${tableId}/close_table/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
  return res.json();
};
