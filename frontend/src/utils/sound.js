// src/utils/sound.js
// Notifikasi suara: memutar file MP3 milik Anda sendiri, dengan fallback
// ke beep sintetis (Web Audio API) kalau file MP3-nya gagal dimuat/diputar
// (mis. lupa taruh file, path salah, atau browser memblokir).
//
// Taruh file suara Anda di folder public, misalnya:
//   public/sounds/success.mp3
//   public/sounds/error.mp3
// lalu diakses lewat path "/sounds/success.mp3" (tanpa "public").

let audioCtx = null;

function getContext() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctx();
    }
    return audioCtx;
}

function beep({ frequency = 880, duration = 0.15, type = "sine", volume = 0.2 }) {
    try {
        const ctx = getContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    } catch (err) {
        console.warn("Tidak bisa memutar suara notifikasi (beep):", err);
    }
}

// Cache instance <audio> per src supaya tidak bikin elemen baru tiap kali
// dipanggil, dan supaya file sudah "siap" (preloaded) sebelum dibutuhkan.
const audioCache = new Map();

function getAudio(src) {
    if (!audioCache.has(src)) {
        const el = new Audio(src);
        el.preload = "auto";
        audioCache.set(src, el);
    }
    return audioCache.get(src);
}

// Memutar file MP3. Kalau gagal (file tidak ada / diblokir browser),
// otomatis fallback ke beep sintetis lewat `fallback`.
function playFile(src, volume, fallback) {
    try {
        const el = getAudio(src);
        el.currentTime = 0; // biar bisa diklik berkali-kali cepat tanpa nunggu selesai
        el.volume = volume;
        const playPromise = el.play();
        if (playPromise?.catch) {
            playPromise.catch((err) => {
                console.warn(`Gagal memutar ${src}, pakai beep sebagai fallback:`, err);
                fallback();
            });
        }
    } catch (err) {
        console.warn(`Gagal memutar ${src}, pakai beep sebagai fallback:`, err);
        fallback();
    }
}

// Ganti path di bawah ini sesuai nama file MP3 Anda.
const SUCCESS_SOUND_SRC = "public/sounds/success.mp3";
const ERROR_SOUND_SRC = "public/sounds/error.mp3";

export function playSuccessSound() {
    playFile(SUCCESS_SOUND_SRC, 0.6, () => {
        beep({ frequency: 880, duration: 0.12, type: "sine", volume: 0.2 });
        setTimeout(() => {
            beep({ frequency: 1175, duration: 0.15, type: "sine", volume: 0.2 });
        }, 100);
    });
}

export function playErrorSound() {
    playFile(ERROR_SOUND_SRC, 0.6, () => {
        beep({ frequency: 220, duration: 0.2, type: "square", volume: 0.15 });
    });
}