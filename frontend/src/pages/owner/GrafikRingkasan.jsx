import {
    ResponsiveContainer, ComposedChart, Line, Area,
    XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';

// Ubah tanggal ISO (YYYY-MM-DD) jadi label pendek buat sumbu-X, misal "14 Agu".
function formatLabelTanggal(isoDate) {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * Grafik gabungan: Pendapatan (area, sumbu kiri) + Petugas & Kendaraan (line, sumbu kanan).
 *
 * Props:
 * - data: hasil mentah dari GET /transaksi/rekap-harian, array of
 *   { tanggal, jumlah_transaksi, pendapatan, jumlah_user, jumlah_kendaraan }
 */
export default function GrafikRingkasan({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-sm text-[#8A8A8A]">
                Belum ada data untuk ditampilkan.
            </div>
        );
    }

    const dataChart = data.map((d) => ({
        tanggal: formatLabelTanggal(d.tanggal),
        pendapatan: d.pendapatan ?? 0,
        userBaru: d.jumlah_user ?? 0,
        kendaraan: d.jumlah_kendaraan ?? 0,
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="tanggal" tick={{ fill: '#8A8A8A', fontSize: 12 }} />

                    {/* Sumbu kiri: Rupiah */}
                    <YAxis
                        yAxisId="left"
                        tick={{ fill: '#8A8A8A', fontSize: 11 }}
                        tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}rb`}
                    />
                    {/* Sumbu kanan: jumlah (petugas & kendaraan) */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#8A8A8A', fontSize: 11 }}
                        allowDecimals={false}
                    />

                    <Tooltip
                        contentStyle={{
                            background: '#1A1D24',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                        }}
                        labelStyle={{ color: '#FFFFFF' }}
                        formatter={(value, name) => {
                            if (name === 'Pendapatan') {
                                return [`Rp ${Number(value).toLocaleString('id-ID')}`, name];
                            }
                            return [value, name];
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8A8A8A' }} />

                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="pendapatan"
                        fill="#35C48D"
                        stroke="#35C48D"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        name="Pendapatan"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="userBaru"
                        stroke="#DC2626"
                        strokeWidth={2}
                        dot={false}
                        name="User Baru"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="kendaraan"
                        stroke="#DC2626"
                        strokeWidth={2}
                        dot={false}
                        name="Kendaraan"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}