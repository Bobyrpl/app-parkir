import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Bantuan from "./pages/Bantuan";

import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Users from "./pages/admin/Users";
import Tarif from "./pages/admin/Tarif";
import PengaturanDenda from "./pages/admin/PengaturanDenda";
import AreaParkir from "./pages/admin/AreaParkir";
import Kendaraan from "./pages/admin/Kendaraan";
import LogAktivitas from "./pages/admin/LogAktivitas";
import Komentar from "./pages/admin/Komentar";
import PermintaanAktivasi from "./pages/admin/PermintaanAktivasi";

import DashboardPetugas from "./pages/petugas/DashboardPetugas";
import TambahKendaraan from "./pages/petugas/TambahKendaraan";
import KendaraanMasuk from "./pages/petugas/KendaraanMasuk";
import KendaraanKeluar from "./pages/petugas/KendaraanKeluar";
import Transaksi from "./pages/petugas/Transaksi";
import BookingPetugas from "./pages/petugas/Booking";

import DashboardOwner from "./pages/owner/DashboardOwner";
import Rekap from "./pages/owner/Rekap";

import Booking from "./pages/pelanggan/Booking";
import RiwayatBooking from "./pages/pelanggan/RiwayatBooking";

function Beranda() {
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/bantuan" element={<Bantuan />} />
            <Route path="/" element={<Beranda />} />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <DashboardAdmin />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tarif"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <Tarif />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pengaturan-denda"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <PengaturanDenda />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/area"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <AreaParkir />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/kendaraan"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <Kendaraan />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/log"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <LogAktivitas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/komentar"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <Komentar />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/permintaan-aktivasi"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Layout>
                    <PermintaanAktivasi />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* PETUGAS */}
            <Route
              path="/petugas"
              element={
                <ProtectedRoute allowedRoles={["petugas"]}>
                  <Layout>
                    <DashboardPetugas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/petugas/kendaraan"
              element={
                <ProtectedRoute allowedRoles={["petugas"]}>
                  <Layout>
                    <TambahKendaraan />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/petugas/masuk"
              element={
                <ProtectedRoute allowedRoles={["petugas"]}>
                  <Layout>
                    <KendaraanMasuk />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/petugas/keluar"
              element={
                <ProtectedRoute allowedRoles={["petugas"]}>
                  <Layout>
                    <KendaraanKeluar />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/petugas/transaksi"
              element={
                <ProtectedRoute allowedRoles={["petugas"]}>
                  <Layout>
                    <Transaksi />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/petugas/booking"
              element={
                <ProtectedRoute allowedRoles={["petugas", "admin"]}>
                  <Layout>
                    <BookingPetugas />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* PELANGGAN */}
            <Route
              path="/pelanggan"
              element={
                <ProtectedRoute allowedRoles={["pelanggan"]}>
                  <Layout>
                    <Booking />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pelanggan/riwayat"
              element={
                <ProtectedRoute allowedRoles={["pelanggan"]}>
                  <Layout>
                    <RiwayatBooking />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* OWNER */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <Layout>
                    <DashboardOwner />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/rekap"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <Layout>
                    <Rekap />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
