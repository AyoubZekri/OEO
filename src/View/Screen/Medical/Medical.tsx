import React from 'react';
import { Plus, HeartPulse, Activity, User, Calendar, Stethoscope, AlertCircle, Edit2, Trash2, CheckCircle, FileText, Clock, Check } from 'lucide-react';
import { useMedicalController } from './MedicalController';
import { AddMedicalRecordDialog } from './AddMedicalRecordDialog';
import { ViewInitialExamDialog } from './ViewInitialExamDialog';
import { ViewFinalDecisionDialog } from './ViewFinalDecisionDialog';
import '../Members/Members.css';
import './Medical.css';

export const Medical: React.FC = () => {
  const {
    records,
    loading,
    error,
    fetchRecords,
    isAddDialogOpen,
    isViewInitialExamDialogOpen,
    isViewFinalDecisionDialogOpen,
    selectedRecord,
    dialogMode,
    openAddDialog,
    openEditDialog,
    openViewInitialExamDialog,
    openViewFinalDecisionDialog,
    closeDialogs,
    handleDelete,
    handleDeleteInitialExam,
    handleDeleteFinalDecision
  } = useMedicalController();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'مفتوح/مصاب':
        return <span className="mc-badge mc-badge-danger">مفتوح / مصاب</span>;
      case 'قيد التأهيل':
        return <span className="mc-badge mc-badge-warning">قيد التأهيل</span>;
      case 'مغلق/متعافي':
        return <span className="mc-badge mc-badge-success">مغلق / متعافي</span>;
      default:
        return <span className="mc-badge mc-badge-default">{status}</span>;
    }
  };

  return (
    <div className="members-container" style={{ margin: '0', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="members-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-h)', margin: '0', fontWeight: 800 }}>العيادة والطاقم الطبي</h2>
        </div>
        <div className="header-actions">
          <button className="add-btn" onClick={openAddDialog} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)',
            color: 'white', border: 'none', padding: '0 24px', height: '44px', borderRadius: '12px',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 16px -4px var(--accent-bg)', transition: 'all 0.3s ease'
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} /> إضافة ملف إصابة
          </button>
        </div>
      </div>

      {error && <div className="error-message" style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>{error}</div>}

      {loading ? (
        <div className="loading" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-p)' }}>جاري تحميل السجلات الطبية...</div>
      ) : records.length === 0 ? (
        <div className="no-data" style={{ padding: '80px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <HeartPulse size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>لا توجد سجلات طبية حالياً</p>
        </div>
      ) : (
        <div className="mc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', padding: '0 0 24px 0' }}>
          {records.map((record) => (
            <div className="mc-card" key={record.id} style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #f3f4f6',
              padding: '32px',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              position: 'relative'
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0,0,0,0.1)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.05)' }}
            >

              {/* Header */}
              <div className="mc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Right side -> Status */}
                <div style={{ 
                  padding: '8px 16px', 
                  borderRadius: '24px', 
                  background: record.record_status === 'مغلق/متعافي' ? '#ecfdf5' : record.record_status === 'قيد التأهيل' ? '#fffbeb' : '#fef2f2', 
                  color: record.record_status === 'مغلق/متعافي' ? '#059669' : record.record_status === 'قيد التأهيل' ? '#d97706' : '#ef4444', 
                  fontSize: '0.9rem', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  border: `1px solid ${record.record_status === 'مغلق/متعافي' ? '#a7f3d0' : record.record_status === 'قيد التأهيل' ? '#fde68a' : '#fecaca'}`
                }}>
                  <Check size={16} /> {record.record_status} <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: record.record_status === 'مغلق/متعافي' ? '#059669' : record.record_status === 'قيد التأهيل' ? '#d97706' : '#ef4444' }}></div>
                </div>

                {/* Left side -> Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => openEditDialog(record, 'injury')} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f9fafb'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(record.id)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fef2f2'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Main Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: 900, color: '#111827' }}>
                    {record.player?.name || (record.player?.first_name ? `${record.player.first_name} ${record.player.last_name}` : 'لاعب غير معروف')}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: '#3b82f6', background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                      الطبيب: {record.doctor?.name || (record.doctor?.first_name ? `${record.doctor.first_name} ${record.doctor.last_name}` : 'غير معروف')} <User size={14} />
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#ef4444', background: '#fef2f2', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={14} /> {record.injury_nature || 'إصابة غير محددة'}
                    </span>
                  </div>
                </div>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={32} />
                </div>
              </div>

              {/* Info Boxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Date Box */}
                <div style={{ border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 min-content' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                      <Calendar size={20} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>تاريخ الإصابة</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{record.injury_date ? new Date(record.injury_date).toLocaleDateString('en-CA').replace(/-/g, '/') : '-'}</div>
                    </div>
                  </div>
                  <span style={{ background: '#e5e7eb', color: '#4b5563', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>سجل سابق</span>
                </div>

              </div>

              {/* Action Buttons - Exact Design based on Stages */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, marginBottom: '8px', textAlign: 'right' }}>مسار الخطة العلاجية والتعافي</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Stage 1: Initial Exam */}
                  <button 
                    onClick={() => record.record_status !== 'مفتوح/مصاب' ? openViewInitialExamDialog(record) : openEditDialog(record, 'initial_exam')}
                    style={{ background: '#f9fafb', border: record.record_status !== 'مفتوح/مصاب' ? '1px solid #e5e7eb' : '1px dashed #cbd5e1', borderRadius: '10px', padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#f9fafb'; }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {record.record_status !== 'مفتوح/مصاب' ? <Check size={10} color="#374151" strokeWidth={3} /> : <Clock size={10} color="#6b7280" />}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#374151', margin: '0' }}>التشخيص الأولي</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: record.record_status !== 'مفتوح/مصاب' ? '#10b981' : '#f59e0b' }}>
                      {record.record_status !== 'مفتوح/مصاب' ? 'مكتمل' : 'بانتظار الفحص'}
                    </div>
                  </button>

                  {/* Stage 2: Final Exam */}
                  <button 
                    onClick={() => (record.record_status === 'بانتظار قرار العودة' || record.record_status === 'مغلق/متعافي' || record.record_status === 'قيد التأهيل') ? openViewFinalDecisionDialog(record) : openEditDialog(record, 'final_exam')}
                    style={{ background: '#f9fafb', border: (record.record_status === 'بانتظار قرار العودة' || record.record_status === 'مغلق/متعافي' || record.record_status === 'قيد التأهيل') ? '1px solid #e5e7eb' : '1px dashed #cbd5e1', borderRadius: '10px', padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#f9fafb'; }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(record.record_status === 'بانتظار قرار العودة' || record.record_status === 'مغلق/متعافي' || record.record_status === 'قيد التأهيل') ? <Check size={10} color="#374151" strokeWidth={3} /> : <Clock size={10} color="#6b7280" />}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#374151', margin: '0' }}>القرار النهائي</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: (record.record_status === 'بانتظار قرار العودة' || record.record_status === 'مغلق/متعافي' || record.record_status === 'قيد التأهيل') ? '#10b981' : '#f59e0b' }}>
                      {(record.record_status === 'بانتظار قرار العودة' || record.record_status === 'مغلق/متعافي' || record.record_status === 'قيد التأهيل') ? 'مكتمل' : 'بانتظار القرار'}
                    </div>
                  </button>

                  {/* Stage 3: Return Decision */}
                  <button 
                    onClick={() => openEditDialog(record, 'return_decision')}
                    style={{ background: record.record_status === 'مغلق/متعافي' ? '#ecfdf5' : '#f9fafb', border: record.record_status === 'مغلق/متعافي' ? '2px solid #10b981' : '1px dashed #cbd5e1', borderRadius: '10px', padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
                    onMouseOver={e => { e.currentTarget.style.background = record.record_status === 'مغلق/متعافي' ? '#d1fae5' : '#f3f4f6'; }}
                    onMouseOut={e => { e.currentTarget.style.background = record.record_status === 'مغلق/متعافي' ? '#ecfdf5' : '#f9fafb'; }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: record.record_status === 'مغلق/متعافي' ? '#10b981' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {record.record_status === 'مغلق/متعافي' ? <Check size={10} color="#fff" strokeWidth={3} /> : <Clock size={10} color="#6b7280" />}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: record.record_status === 'مغلق/متعافي' ? '#065f46' : '#374151', margin: '0' }}>مراحل العلاج</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: record.record_status === 'مغلق/متعافي' ? '#059669' : '#f59e0b' }}>
                      {record.record_status === 'مغلق/متعافي' ? '100% تعافي' : 'قيد العلاج'}
                    </div>
                  </button>
                </div>
              </div>


            </div>
          ))}
        </div>
      )}

      {isAddDialogOpen && (
        <AddMedicalRecordDialog
          isOpen={isAddDialogOpen}
          onClose={closeDialogs}
          recordData={selectedRecord}
          mode={dialogMode}
          onSave={fetchRecords}
        />
      )}

      {isViewInitialExamDialogOpen && (
        <ViewInitialExamDialog
          isOpen={isViewInitialExamDialogOpen}
          onClose={closeDialogs}
          recordData={selectedRecord}
          onEdit={(record) => openEditDialog(record, 'initial_exam')}
          onDelete={handleDeleteInitialExam}
        />
      )}

      {isViewFinalDecisionDialogOpen && (
        <ViewFinalDecisionDialog
          isOpen={isViewFinalDecisionDialogOpen}
          onClose={closeDialogs}
          recordData={selectedRecord}
          onEdit={(record) => openEditDialog(record, 'final_exam')}
          onDelete={(record) => handleDeleteFinalDecision(record)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mc-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .mc-card {
            padding: 20px !important;
            gap: 20px !important;
          }
          .mc-card-header {
            flex-wrap: wrap;
            gap: 12px;
          }
          .mc-card-header > div:first-child {
            font-size: 0.8rem !important;
            padding: 6px 12px !important;
          }
          .mc-card-header > div:first-child svg {
            width: 14px !important;
            height: 14px !important;
          }
          .mc-card-header button {
            width: 36px !important;
            height: 36px !important;
          }
          .mc-card-header button svg {
            width: 16px !important;
            height: 16px !important;
          }
          .mc-card h3 {
            font-size: 1.4rem !important;
            margin-bottom: 8px !important;
          }
          .mc-card span {
            font-size: 0.75rem !important;
            padding: 4px 8px !important;
          }
          .mc-card span svg {
            width: 12px !important;
            height: 12px !important;
          }
          .mc-card > div:nth-child(3) {
            gap: 12px !important;
          }
          .mc-card > div:nth-child(3) button {
            padding: 12px !important;
            gap: 6px !important;
          }
          .mc-card > div:nth-child(3) button > div:nth-child(2) {
            font-size: 0.75rem !important;
          }
          .mc-card > div:nth-child(3) button > div:nth-child(3) {
            font-size: 0.65rem !important;
          }
        }
      `}</style>
    </div>
  );
};
