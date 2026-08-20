import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://backend-apk-parkir-production-ec0c.up.railway.app/api',
    headers: {
        Accept: 'application/json',
    },
});

// Selipkan token Sanctum ke setiap request otomatis.
// Pakai sessionStorage (bukan localStorage) supaya token otomatis hilang
// saat tab/browser ditutup -- user wajib login ulang di sesi berikutnya.
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Kalau token invalid/expired, otomatis lempar ke halaman login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;