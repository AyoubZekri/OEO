import React from 'react';
import { Edit2, Trash2, FileText, Calendar, Stethoscope, Activity, ClipboardList, ArrowRight } from 'lucide-react';
import type { PlayerMedicalRecord } from './medical_model';

interface ViewInitialExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recordData: PlayerMedicalRecord | null;
  onEdit: (record: PlayerMedicalRecord) => void;
  onDelete: (record: PlayerMedicalRecord) => void;
}

export const ViewInitialExamDialog: React.FC<ViewInitialExamDialogProps> = ({ 
  isOpen, 
  onClose, 
  recordData, 
  onEdit, 
  onDelete 
}) => {
  if (!isOpen || !recordData) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(15, 23, 42, 0.4)', animation: 'fadeIn 0.3s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div className="task-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '550px', width: '95%', minHeight: '500px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', background: '#ffffff', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid #f3f4f6', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        
        {/* App Bar */}
        <div className="dialog-app-bar" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', position: 'relative' }}>
          
          <button type="button" onClick={onClose} style={{ position: 'absolute', right: '24px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', zIndex: 10 }} onMouseOver={e => {e.currentTarget.style.background = '#f1f5f9';}} onMouseOut={e => {e.currentTarget.style.background = 'white';}}>
            <ArrowRight size={18} />
          </button>

          <h2 style={{ margin: '0 auto', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', lineHeight: 1, textAlign: 'center' }}>
            التشخيص والفحص الأولي
          </h2>
          
          <div className="desktop-actions" style={{ position: 'absolute', left: '24px', display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10 }}>
            <button onClick={() => { onClose(); onEdit(recordData); }} style={{ background: 'white', border: '1px solid #e2e8f0', color: '#3b82f6', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} title="تعديل التشخيص" onMouseOver={e => {e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe';}} onMouseOut={e => {e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0';}}>
              <Edit2 size={16} />
            </button>
            <button onClick={() => { onClose(); onDelete(recordData); }} style={{ background: 'white', border: '1px solid #e2e8f0', color: '#ef4444', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} title="حذف التشخيص" onMouseOver={e => {e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca';}} onMouseOut={e => {e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0';}}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="dialog-content-section" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '75vh', flex: 1 }}>
          
          {/* Diagnosis Block */}
          <div style={{ background: '#fafafa', borderRadius: '16px', border: '1px solid #f3f4f6', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: 'white', padding: '8px', borderRadius: '10px', border: '1px solid #e5e7eb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>التشخيص الطبي</h3>
            </div>
            <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.8', fontWeight: 600, background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              {recordData.diagnosis || <span style={{ color: '#94a3b8' }}>لم يتم إدخال تشخيص.</span>}
            </div>
          </div>

          {/* Recommendation Block */}
          <div style={{ background: '#fafafa', borderRadius: '16px', border: '1px solid #f3f4f6', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: 'white', padding: '8px', borderRadius: '10px', border: '1px solid #e5e7eb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 800 }}>التوصية المبدئية</h3>
            </div>
            <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.8', fontWeight: 600, background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              {recordData.initial_recommendation || <span style={{ color: '#94a3b8' }}>لم يتم إدخال توصية.</span>}
            </div>
          </div>

          {/* Next Exam Block (if available) */}
          {recordData.next_exam_date && (
            <div style={{ background: '#fafafa', borderRadius: '16px', border: '1px solid #f3f4f6', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={24} />
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 700 }}>موعد الفحص القادم</div>
                <div style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 900 }}>{new Date(recordData.next_exam_date).toLocaleDateString('en-CA').replace(/-/g, '/')}</div>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Mobile Actions Footer */}
        <div className="mobile-actions" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'none', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => { onClose(); onEdit(recordData); }} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <Edit2 size={18} /> تعديل
          </button>
          <button onClick={() => { onClose(); onDelete(recordData); }} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <Trash2 size={18} /> حذف
          </button>
        </div>

      </div>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 768px) {
          .task-dialog {
            width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .desktop-actions { display: none !important; }
          .mobile-actions { display: flex !important; }
          .dialog-app-bar {
            padding: 16px !important;
          }
          .dialog-app-bar button {
            right: 16px !important;
            padding: 8px !important;
          }
          .dialog-app-bar button svg {
            width: 16px !important;
            height: 16px !important;
          }
          .dialog-app-bar h2 {
            font-size: 1.1rem !important;
          }
          .dialog-title-section {
            flex-wrap: wrap;
            gap: 12px !important;
          }
          .dialog-content-section {
            padding: 16px !important;
            gap: 12px !important;
          }
          .dialog-content-section h3 {
            font-size: 1rem !important;
          }
          .dialog-content-section > div > div:first-child > div {
            padding: 6px !important;
          }
          .dialog-content-section > div > div:first-child > div svg {
            width: 14px !important;
            height: 14px !important;
          }
          .dialog-content-section > div > div:nth-child(2) {
            font-size: 0.85rem !important;
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};
