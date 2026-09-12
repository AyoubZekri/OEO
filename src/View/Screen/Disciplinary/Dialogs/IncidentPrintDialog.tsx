import React, { useRef } from 'react';
import { X, Printer, Scale, AlertTriangle, Calendar, FileText, HelpCircle } from 'lucide-react';
import { PrintableIncidentReport } from '../Printable/PrintableIncidentReport';
import { PrintableHearingSummons } from '../Printable/PrintableHearingSummons';
import { PrintableHearingReport } from '../Printable/PrintableHearingReport';
import { PrintableClarificationRequest } from '../Printable/PrintableClarificationRequest';
import { PrintableClarificationReply } from '../Printable/PrintableClarificationReply';
import '../../Equipment/EquipmentOperations.css'; // To reuse the dialog styles and print-only-receipt

interface IncidentPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incident: any;
}

export const IncidentPrintDialog: React.FC<IncidentPrintDialogProps> = ({ isOpen, onClose, incident }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const [printType, setPrintType] = React.useState<'incident' | 'decision' | 'summons' | 'hearing' | 'clarification_request' | 'clarification_reply'>('incident');

  React.useEffect(() => {
    if (incident?.actionType === 'استدعاء جلسة') {
      setPrintType('summons');
    } else if (incident?.actionType === 'طلب توضيح') {
      setPrintType('clarification_request');
    } else {
      setPrintType('incident');
    }
  }, [incident]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !incident) return null;

  return (
    <div className="glass-dialog-overlay" onClick={onClose}>
      <div className="glass-dialog-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="glass-dialog-header">
          <div className="glass-dialog-title">
            <Printer size={24} className="glass-dialog-icon" />
            طباعة المحضر / القرار
          </div>
          <button className="eq-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="glass-dialog-body">
          <p style={{ marginBottom: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
            هل أنت متأكد من طباعة محضر الواقعة الخاص باللاعب <strong>{incident.memberName}</strong>؟
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {incident.actionType !== 'استدعاء جلسة' && incident.actionType !== 'طلب توضيح' && (
              <>
                <div 
                  onClick={() => setPrintType('incident')}
                  style={{
                    padding: '15px 10px',
                    borderRadius: '12px',
                    border: `2px solid ${printType === 'incident' ? 'var(--accent)' : 'var(--border)'}`,
                    background: printType === 'incident' ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ padding: '10px', background: printType === 'incident' ? 'var(--accent)' : 'var(--bg-hover)', color: printType === 'incident' ? 'white' : 'var(--text-muted)', borderRadius: '50%' }}>
                    <Scale size={20} />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.9rem' }}>محضر واقعة</span>
                </div>

                <div 
                  onClick={() => setPrintType('decision')}
                  style={{
                    padding: '15px 10px',
                    borderRadius: '12px',
                    border: `2px solid ${printType === 'decision' ? '#f59e0b' : 'var(--border)'}`,
                    background: printType === 'decision' ? 'rgba(245, 158, 11, 0.05)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ padding: '10px', background: printType === 'decision' ? '#f59e0b' : 'var(--bg-hover)', color: printType === 'decision' ? 'white' : 'var(--text-muted)', borderRadius: '50%' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.9rem' }}>قرار تأديبي</span>
                </div>
              </>
            )}

            {incident.actionType === 'استدعاء جلسة' && (
              <>
                <div 
                  onClick={() => setPrintType('summons')}
                  style={{
                    padding: '15px 10px',
                    borderRadius: '12px',
                    border: `2px solid ${printType === 'summons' ? 'var(--accent)' : 'var(--border)'}`,
                    background: printType === 'summons' ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ padding: '10px', background: printType === 'summons' ? 'var(--accent)' : 'var(--bg-hover)', color: printType === 'summons' ? 'white' : 'var(--text-muted)', borderRadius: '50%' }}>
                    <Calendar size={20} />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.9rem' }}>استدعاء جلسة</span>
                </div>

                <div 
                  onClick={() => setPrintType('hearing')}
                  style={{
                    padding: '15px 10px',
                    borderRadius: '12px',
                    border: `2px solid ${printType === 'hearing' ? '#f59e0b' : 'var(--border)'}`,
                    background: printType === 'hearing' ? 'rgba(245, 158, 11, 0.05)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ padding: '10px', background: printType === 'hearing' ? '#f59e0b' : 'var(--bg-hover)', color: printType === 'hearing' ? 'white' : 'var(--text-muted)', borderRadius: '50%' }}>
                    <FileText size={20} />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.9rem' }}>محضر جلسة</span>
                </div>
              </>
            )}

            {incident.actionType === 'طلب توضيح' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div 
                  onClick={() => setPrintType('clarification_request')}
                  style={{
                    padding: '15px 10px',
                    borderRadius: '12px',
                    border: `2px solid ${printType === 'clarification_request' ? 'var(--accent)' : 'var(--border)'}`,
                    background: printType === 'clarification_request' ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    maxWidth: '50%',
                    margin: '0 auto'
                  }}
                >
                  <div style={{ padding: '10px', background: printType === 'clarification_request' ? 'var(--accent)' : 'var(--bg-hover)', color: printType === 'clarification_request' ? 'white' : 'var(--text-muted)', borderRadius: '50%' }}>
                    <HelpCircle size={20} />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.9rem' }}>طلب توضيح</span>
                </div>
              </div>
            )}
          </div>

          {/* Hidden printable component - this uses exactly the same class as Equipment */}
          <div className="print-only-receipt" ref={printRef}>
            {printType === 'summons' ? (
              <PrintableHearingSummons incident={incident} />
            ) : printType === 'hearing' ? (
              <PrintableHearingReport incident={incident} />
            ) : printType === 'clarification_request' ? (
              <PrintableClarificationRequest incident={incident} />
            ) : printType === 'clarification_reply' ? (
              <PrintableClarificationReply incident={incident} />
            ) : (
              <PrintableIncidentReport incident={incident} printType={printType} />
            )}
          </div>
        </div>

        <div className="glass-dialog-footer">
          <button type="button" className="glass-btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button 
            type="button" 
            className="glass-btn-primary" 
            onClick={handlePrint}
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
