import axios from 'axios';

const urlBase = import.meta.env.VITE_API_URL || 'https://saas-barbearia-t2gz.onrender.com/api';
// const urlBase = 'http://localhost:3000/api';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('Env VITE_API_URL não está definido');
}

const api = axios.create({
  baseURL: urlBase,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('barber_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("🚨 INTERCEPTOR API RECEBEU ERRO:", error.response);
    if (error.response && error.response.status === 403) {
      console.log("⛔ Detectado 403 - Iniciando protocolo de logout...");
      const msg = error.response.data.error;
      alert(`Sua conta está bloqueada: ${msg}`);
      localStorage.removeItem('barber_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;