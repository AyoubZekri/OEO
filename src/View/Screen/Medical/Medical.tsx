import React from 'react';
import { Plus, HeartPulse, Activity, User, Calendar, Stethoscope, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { useMedicalController } from './MedicalController';
import { AddMedicalRecordDialog } from './AddMedicalRecordDialog';
import '../Members/Members.css';
import './Medical.css';

export const Medical: React.FC = () => {
  const {
    records,
    loading,
    error,
    fetchRecords,
    isAddDialogOpen,
    selectedRecord,
    openAddDialog,
    openEditDialog,
    closeDialogs,
    handleDelete
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
    <div className="members-container" style={{ margin: '0' }}>
      <div className="members-header">
        <div>
          <h2>العيادة والطاقم الطبي</h2>
          <p>إدارة السجلات الطبية وتقارير الإصابات للاعبين</p>
        </div>
        <div className="header-actions">
          <button className="add-btn" onClick={openAddDialog}>
            <Plus size={20} /> إضافة ملف إصابة
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">جاري تحميل السجلات الطبية...</div>
      ) : records.length === 0 ? (
        <div className="no-data">
          <HeartPulse size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p>لا توجد سجلات طبية حالياً</p>
        </div>
      ) : (
        <div className="mc-grid">
          {records.map((record) => (
            <div key={record.id} className="mc-card" style={{ borderTop: `4px solid ${record.record_status === 'مفتوح/مصاب' ? '#ef4444' : '#10b981'}` }}>
              <div className="mc-header" style={{ alignItems: 'flex-start' }}>
                <div className="mc-title-group">
                  <div className="mc-title-icon" style={{ background: record.record_status === 'مفتوح/مصاب' ? '#fef2f2' : '#ecfdf5', color: record.record_status === 'مفتوح/مصاب' ? '#ef4444' : '#10b981' }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="mc-title">{record.player?.first_name} {record.player?.last_name}</h3>
                    <span className="mc-opponent">{record.injury_nature}</span>
                    <div style={{ marginTop: '8px' }}>
                      {getStatusBadge(record.record_status)}
                    </div>
                  </div>
                </div>
                <div className="mc-top-actions">
                  <button className="mc-icon-btn" onClick={() => openEditDialog(record)} title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button className="mc-icon-btn mc-delete" onClick={() => handleDelete(record.id)} title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mc-details">
                <div className="mc-detail-row">
                  <Calendar size={16} />
                  <span>تاريخ الإصابة: {record.injury_date ? new Date(record.injury_date).toLocaleDateString('ar-SA') : '-'}</span>
                </div>
                <div className="mc-detail-row">
                  <AlertCircle size={16} />
                  <span>طبيعة الإصابة: {record.injury_nature || '-'}</span>
                </div>
                <div className="mc-detail-row">
                  <Stethoscope size={16} />
                  <span>القرار: <strong style={{ color: 'var(--text-h)' }}>{record.medical_decision || '-'}</strong></span>
                </div>
                {record.next_exam_date && (
                  <div className="mc-detail-row" style={{ color: '#f59e0b', fontWeight: 600 }}>
                    <Calendar size={16} />
                    <span>الفحص القادم: {new Date(record.next_exam_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddMedicalRecordDialog
        isOpen={isAddDialogOpen}
        onClose={closeDialogs}
        onSave={fetchRecords}
        recordData={selectedRecord}
      />
    </div>
  );
};
