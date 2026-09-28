import React, { useState, useRef } from 'react';
import { X, Printer, ArrowLeftRight, RefreshCw } from 'lucide-react';

import { PrintableEquipmentReceipt } from './PrintableReceipt/PrintableEquipmentReceipt';
import { buildEquipmentReceipt } from './equipmentReceipt';
import './EquipmentOperations.css';

interface EquipmentPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: any;
  members?: any[];
}

export const EquipmentPrintDialog: React.FC<EquipmentPrintDialogProps> = ({ isOpen, onClose, operation, members = [] }) => {
  const [printType, setPrintType] = useState<'handover' | 'return'>('handover');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !operation) return null;

  const receipt = buildEquipmentReceipt(operation, members, printType);
  const memberName = receipt.playerName;
  const itemsToPrint = receipt.items;

  return (
    <div className="glass-dialog-overlay" onClick={onClose}>
      <div className="glass-dialog-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="glass-dialog-header">
          <div className="glass-dialog-title">
            <Printer size={24} className="glass-dialog-icon" />
            طباعة محضر معدات
          </div>
          <button className="eq-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="glass-dialog-body">
          <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
            الرجاء اختيار نوع المحضر المراد طباعته للاعب <strong>{memberName}</strong>:
          </p>

          <div className="print-options-grid" style={{ gap: '16px', marginBottom: '24px' }}>
            <div 
              className="print-option-card"
              onClick={() => setPrintType('handover')}
              style={{
                border: `2px solid ${printType === 'handover' ? 'var(--accent)' : 'var(--border)'}`,
                background: printType === 'handover' ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)',
              }}
            >
              <div className="print-option-icon" style={{ background: printType === 'handover' ? 'var(--accent)' : 'var(--bg-hover)', color: printType === 'handover' ? 'white' : 'var(--text-muted)' }}>
                <ArrowLeftRight size={24} />
              </div>
              <span className="print-option-title">محضر تسليم</span>
              <span className="print-option-desc">طباعة قائمة المعدات المسلمة للاعب</span>
            </div>

            <div 
              className="print-option-card"
              onClick={() => setPrintType('return')}
              style={{
                border: `2px solid ${printType === 'return' ? '#f59e0b' : 'var(--border)'}`,
                background: printType === 'return' ? 'rgba(245, 158, 11, 0.05)' : 'var(--card-bg)',
              }}
            >
              <div className="print-option-icon" style={{ background: printType === 'return' ? '#f59e0b' : 'var(--bg-hover)', color: printType === 'return' ? 'white' : 'var(--text-muted)' }}>
                <RefreshCw size={24} />
              </div>
              <span className="print-option-title">محضر استرجاع</span>
              <span className="print-option-desc">طباعة قائمة المعدات المسترجعة فقط</span>
            </div>
          </div>

          {printType === 'return' && itemsToPrint.length === 0 && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger, #ef4444)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
              لا يوجد عتاد مسترجع في هذه العملية لطباعته!
            </div>
          )}

          {/* Hidden printable component */}
          <div className="print-only-receipt" ref={printRef}>
            <PrintableEquipmentReceipt clubName="أولمبي أرزيو" {...receipt} />
          </div>
        </div>

        <div className="glass-dialog-footer">
          <button type="button" className="glass-btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button 
            type="button" 
            className="glass-btn-primary" 
            onClick={() => handlePrint()}
            disabled={printType === 'return' && itemsToPrint.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={18} />
            طباعة المحضر
          </button>
        </div>
      </div>
    </div>
  );
};
