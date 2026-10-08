import { useState } from 'react';
import ModalMidtrans from './ModalMidtrans';
import ModalQrisStatis from './ModalQrisStatis';

export default function ModalQris({ transaksiId, onLunas, onBatal }) {
    const [staticMode, setStaticMode] = useState(false);

    if (staticMode) {
        return <ModalQrisStatis transaksiId={transaksiId} onLunas={onLunas} onBatal={onBatal} />;
    }

    return (
        <ModalMidtrans
            transaksiId={transaksiId}
            onLunas={onLunas}
            onTimeout={() => setStaticMode(true)}
            onBatal={onBatal}
        />
    );
}