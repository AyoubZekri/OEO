import React, { useState } from 'react';
import { Plus, HeartPulse, Activity, User, Calendar, Stethoscope, AlertCircle, Edit2, Trash2, CheckCircle, FileText, Clock, Check } from 'lucide-react';
import { useMedicalController } from './MedicalController';
import { AddMedicalRecordDialog } from './AddMedicalRecordDialog';
import { ViewInitialExamDialog } from './ViewInitialExamDialog';
import { ViewFinalDecisionDialog } from './ViewFinalDecisionDialog';
import { ViewTreatmentPhaseDialog } from './ViewTreatmentPhaseDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';
import '../Members/Members.css';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileMedical } from '../../Mobile/MobileMedical/MobileMedical';
import { initialDone, finalDone, recovered, stageOf, toneOf, personName, personPhoto, daysSince, daysText } from '../../Mobile/MobileMedical/medicalUtils';
import './Medical.css';

export const Medical: React.FC = () => {
  const controller = useMedicalController();
  const {
    records,
    members,
    loading,
    error,
    fetchRecords,
    isAddDialogOpen,
    isViewInitialExamDialogOpen,
    isViewFinalDecisionDialogOpen,
    isViewTreatmentPhaseDialogOpen,
    selectedRecord,
    dialogMode,
    openAddDialog,
    openEditDialog,
    openViewInitialExamDialog,
    openViewFinalDecisionDialog,
    openViewTreatmentPhaseDialog,
    closeDialogs,
    handleDelete,
    handleDeleteInitialExam,
    handleDeleteFinalDecision,
    handleDeleteTreatmentPhase
  } = controller;

  const [memberFilter, setMemberFilter] = useState<string>('');
  const isMobile = useIsMobile();

  if (isMobile) return <MobileMedical c={controller} />;

  const filteredRecords = memberFilter
    ? records.filter(r => r.player?.id?.toString() === memberFilter || r.doctor?.id?.toString() === memberFilter)
    : records;

  return (
    <div className="members-container" style={{ margin: '0', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="members-header" style={{ marginBottom: '24px', justifyContent: 'flex-end' }}>
        <div className="header-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '200px' }}>
            <CustomDropdown
              options={[
                { value: '', label: 'الكل (جميع الأعضاء)' },
                ...members.map(m => ({ value: m.id.toString(), label: m.name || `${m.first_name} ${m.last_name}` }))
              ]}
              value={memberFilter}
              onChange={setMemberFilter}
              placeholder="تصفية حسب العضو"
            />
          </div>
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
        <div className="loading-container" style={{ gridColumn: '1 / -1', marginTop: '40px' }}>
          <div className="premium-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-dot"></div>
          </div>
          <p className="loading-text">جاري تحميل السجلات الطبية...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="no-data" style={{ padding: '80px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <HeartPulse size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>لا توجد سجلات طبية حالياً</p>
        </div>
      ) : (
        <div className="mc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', padding: '0 0 24px 0' }}>
          {filteredRecords.map((record) => {
            const tone = toneOf(record);
            const photo = personPhoto(record.player);
            const since = daysSince(record.injury_date);
            const stage = stageOf(record);
            // Recovery path: view a completed stage, or fill the next one (same actions as before)
            const steps = [
              {
                key: 'initial', icon: Stethoscope, title: 'التشخيص الأولي', done: initialDone(record),
                todo: 'بانتظار الفحص',
                onClick: () => initialDone(record) ? openViewInitialExamDialog(record) : openEditDialog(record, 'initial_exam'),
              },
              {
                key: 'final', icon: FileText, title: 'القرار النهائي', done: finalDone(record),
                todo: 'بانتظار القرار',
                onClick: () => finalDone(record) ? openViewFinalDecisionDialog(record) : openEditDialog(record, 'final_exam'),
              },
              {
                key: 'return', icon: CheckCircle, title: 'مراحل العلاج', done: recovered(record),
                todo: 'قيد العلاج',
                onClick: () => recovered(record) ? openViewTreatmentPhaseDialog(record) : openEditDialog(record, 'return_decision'),
              },
            ];
            return (
              <div className={`med-card tone-${tone}`} key={record.id}>
                <div className="med-card-glow" aria-hidden="true" />

                {/* Status + actions */}
                <div className="med-card-top">
                  <span className={`med-status tone-${tone}`}><i /> {record.record_status}</span>
                  <div className="med-card-actions">
                    <button type="button" onClick={() => openEditDialog(record, 'injury')} title="تعديل الإصابة"><Edit2 size={16} /></button>
                    <button type="button" className="danger" onClick={() => handleDelete(record.id)} title="حذف"><Trash2 size={16} /></button>
                  </div>
                </div>

                {/* Player */}
                <div className="med-player">
                  <div className="med-avatar">
                    {photo ? <img src={photo} alt="" /> : <User size={26} />}
                  </div>
                  <div className="med-player-text">
                    <h3>{personName(record.player, 'لاعب غير معروف')}</h3>
                    <div className="med-tags">
                      <span className="med-tag injury"><Activity size={13} /> {record.injury_nature || 'إصابة غير محددة'}</span>
                      <span className="med-tag"><Stethoscope size={13} /> {personName(record.doctor)}</span>
                    </div>
                  </div>
                </div>

                {/* Facts */}
                <div className="med-facts">
                  <div>
                    <Calendar size={16} />
                    <span><small>تاريخ الإصابة</small><strong>{record.injury_date ? new Date(record.injury_date).toLocaleDateString('en-CA').replace(/-/g, '/') : '-'}</strong></span>
                  </div>
                  <div>
                    <Clock size={16} />
                    <span>
                      <small>{recovered(record) ? 'الحالة' : 'مدة الإصابة'}</small>
                      <strong>{recovered(record) ? 'تعافى' : since !== null ? (since ? `${daysText(since)}` : 'اليوم') : '-'}</strong>
                    </span>
                  </div>
                  {record.incident_location && (
                    <div className="wide">
                      <AlertCircle size={16} />
                      <span><small>مكان الحدوث</small><strong>{record.incident_location}</strong></span>
                    </div>
                  )}
                </div>

                {/* Recovery path */}
                <div className="med-path">
                  <div className="med-path-head">
                    <span>مسار الخطة العلاجية والتعافي</span>
                    <b>{stage - 1}/3</b>
                  </div>
                  <div className="med-path-track"><div style={{ width: `${((stage - 1) / 3) * 100}%` }} /></div>
                  <div className="med-steps">
                    {steps.map(st => (
                      <button key={st.key} type="button" className={`med-step ${st.done ? 'done' : ''}`} onClick={st.onClick}>
                        <span className="med-step-icon">{st.done ? <Check size={15} strokeWidth={3} /> : <st.icon size={15} />}</span>
                        <strong>{st.title}</strong>
                        <small>{st.done ? 'مكتمل' : st.todo}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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

      {isViewTreatmentPhaseDialogOpen && (
        <ViewTreatmentPhaseDialog
          isOpen={isViewTreatmentPhaseDialogOpen}
          onClose={closeDialogs}
          recordData={selectedRecord}
          onEdit={(record) => openEditDialog(record, 'return_decision')}
          onDelete={(record) => handleDeleteTreatmentPhase(record)}
        />
      )}

    </div>
  );
};
