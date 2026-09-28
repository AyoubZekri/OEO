import React, { useState } from 'react';
import { Printer, ArrowLeftRight, RefreshCw, AlertCircle } from 'lucide-react';
import { MobileSheet } from '../widgets/MobileSheet';
import { PrintableEquipmentReceipt } from '../../Screen/Equipment/PrintableReceipt/PrintableEquipmentReceipt';
import { buildEquipmentReceipt, type EquipmentPrintType } from '../../Screen/Equipment/equipmentReceipt';
import '../../Screen/Equipment/EquipmentOperations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- operations come untyped from the API */

// Phone version of the receipt print dialog: choose handover or return receipt, then print
export const MobileEquipmentPrint: React.FC<{ operation: any; members: any[]; onClose: () => void }> = ({ operation, members, onClose }) => {
  const [type, setType] = useState<EquipmentPrintType>('handover');
  const receipt = buildEquipmentReceipt(operation, members, type);
  const empty = type === 'return' && receipt.items.length === 0;

  return (
    <MobileSheet
      title="طباعة محضر معدات"
      onClose={onClose}
      footer={(
        <div className="meq-sheet-actions">
          <button type="button" className="me-btn" onClick={onClose}>إلغاء</button>
          <button type="button" className="me-btn primary" onClick={() => window.print()} disabled={empty}>
            <Printer size={17} /> طباعة المحضر
          </button>
        </div>
      )}
    >
      <div className="meq-print">
        <p>نوع المحضر للاعب <b>{receipt.playerName}</b>:</p>
        <div className="meq-print-options">
          <button type="button" className={type === 'handover' ? 'on' : ''} onClick={() => setType('handover')}>
            <span><ArrowLeftRight size={22} /></span>
            <strong>محضر تسليم</strong>
            <small>المعدات المسلمة للاعب</small>
          </button>
          <button type="button" className={`amber ${type === 'return' ? 'on' : ''}`} onClick={() => setType('return')}>
            <span><RefreshCw size={22} /></span>
            <strong>محضر استرجاع</strong>
            <small>المعدات المسترجعة فقط</small>
          </button>
        </div>
        {empty && <p className="meq-banner"><AlertCircle size={15} /> لا يوجد عتاد مسترجع في هذه العملية لطباعته!</p>}
      </div>

      {/* Hidden printable component */}
      <div className="print-only-receipt">
        <PrintableEquipmentReceipt clubName="أولمبي أرزيو" {...receipt} />
      </div>
    </MobileSheet>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
