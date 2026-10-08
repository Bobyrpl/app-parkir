import axios from 'axios';

//  {#2a6,7}
const api = axios.create({
    // Sekarang React di-serve dari domain yang sama dengan Laravel,
    // jadi path relatif "/api" sudah cukup - tidak perlu URL absolut lagi.
    baseURL: import.meta.env.VITE_API_URL || '/api',
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
//  {#93c,12}
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