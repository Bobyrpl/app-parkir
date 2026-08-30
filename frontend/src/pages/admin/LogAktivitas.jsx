import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { PageHeader, Table, Badge, Button } from '../../components/ui';
import {
    Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell,
    TextRun, HeadingLevel, WidthType, AlignmentType,
} from 'docx';

export default function LogAktivitas() {
    const [data, setData] = useState([]);

    useEffect(() => {
        async function load() {
            const res = await api.get('/log-aktivitas');
            setData(res.data.data ?? res.data);
        }
        load();
    }, []);

    async function handleDownloadWord() {
        const headerCell = (text) =>
            new TableCell({
                shading: { fill: '1F1F1F' },
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
            });

        const bodyCell = (text) => new TableCell({ children: [new Paragraph({ text: text ?? '-' })] });

        const rows = [
            new TableRow({
                children: [
                    headerCell('Waktu'),
                    headerCell('Pengguna'),
                    headerCell('Role'),
                    headerCell('Aktivitas'),
                ],
            }),
            ...data.map((item) =>
                new TableRow({
                    children: [
                        bodyCell(new Date(item.waktu_aktivitas).toLocaleString('id-ID')),
                        bodyCell(item.user?.nama_lengkap ?? '-'),
                        bodyCell(item.user?.role ?? '-'),
                        bodyCell(item.aktivitas),
                    ],
                })
            ),
        ];

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Log Aktivitas Pengguna' }),
                        new Paragraph({ text: 'Riwayat aktivitas seluruh pengguna sistem.', spacing: { after: 200 } }),
                        new DocxTable({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
                        new Paragraph({ text: '', spacing: { before: 200 } }),
                        new Paragraph({ text: `Dicetak pada: ${new Date().toLocaleString('id-ID')}` }),
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `log-aktivitas-${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <PageHeader
                    eyebrow="AUDIT"
                    title="Log Aktivitas"
                    description="Riwayat aktivitas seluruh pengguna sistem."
                />
                <Button variant="ghost" onClick={handleDownloadWord} disabled={data.length === 0}>
                    Download Word
                </Button>
            </div>

            <Table columns={['Waktu', 'Pengguna', 'Role', 'Aktivitas']}>
                {data.map((item) => (
                    <tr key={item.id_log}>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                            {new Date(item.waktu_aktivitas).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3">{item.user?.nama_lengkap ?? '-'}</td>
                        <td className="px-4 py-3">
                            <Badge tone="neutral">{item.user?.role ?? '-'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{item.aktivitas}</td>
                    </tr>
                ))}
                {data.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-secondary)] text-sm">
                            Belum ada aktivitas tercatat.
                        </td>
                    </tr>
                )}
            </Table>
            <footer className="border-t border-[var(--color-border)]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-xs text-[var(--color-text-secondary)] text-center sm:text-left">
                    <span>
                        © {new Date().getFullYear()} Parkir Pelabuhan Tanjung
                        Perak
                    </span>
                    <span className="font-mono">SISTEM MANAJEMEN PARKIR</span>
                </div>
            </footer>
        </div>
    );
}