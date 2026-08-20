import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Pakai sessionStorage: data sesi otomatis hilang saat tab/browser
    // ditutup, jadi user wajib login ulang di sesi browser berikutnya.
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    async function login(username, password) {
        const res = await api.post('/login', { username, password });
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
    }

    // Registrasi akun baru lewat form publik. Role TIDAK dikirim dari sini —
    // backend memaksa role jadi "pelanggan" untuk semua pendaftar lewat
    // endpoint ini. Setelah berhasil, langsung dianggap login (backend
    // juga mengembalikan token).
    async function register(namaLengkap, username, noTelp, password, passwordConfirmation) {
        const res = await api.post('/register', {
            nama_lengkap: namaLengkap,
            username,
            no_telp: noTelp,
            password,
            password_confirmation: passwordConfirmation,
        });
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
    }

    async function logout() {
        try {
            await api.post('/logout');
        } catch (e) {
            // tetap lanjut hapus sesi lokal walau request logout gagal
        }
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
    }

    // Update sebagian data user yang sedang login (dipakai setelah ganti
    // foto profil, ganti nama, dll) tanpa perlu login ulang.
    function updateUser(patch) {
        setUser((prev) => {
            const next = { ...prev, ...patch };
            sessionStorage.setItem('user', JSON.stringify(next));
            return next;
        });
    }

    // Upload / ganti foto profil milik sendiri. Bisa dipanggil dari role
    // manapun karena backend-nya ada di grup auth:sanctum umum, bukan
    // grup khusus admin.
    async function uploadFotoProfil(file) {
        const formData = new FormData();
        formData.append('foto_profil', file);

        const res = await api.post('/profile/foto', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        updateUser({ foto_profil_url: res.data.foto_profil_url });
        return res.data.foto_profil_url;
    }

    // Hapus foto profil sendiri, balik ke avatar inisial.
    async function hapusFotoProfil() {
        const res = await api.delete('/profile/foto');
        updateUser({ foto_profil_url: null });
        return res.data;
    }

    return (
        <AuthContext.Provider
            value={{ user, login, register, logout, updateUser, uploadFotoProfil, hapusFotoProfil }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}