import React, { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, HeartPulse, Filter, ChevronDown, Users, Activity, Calendar } from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useMedicalController } from '../../Screen/Medical/MedicalController';
import type { PlayerMedicalRecord } from '../../Screen/Medical/medical_model';
import { recovered, stageOf, toneOf, personName, personPhoto, daysSince, daysText } from './medicalUtils';
import { MobileMedicalDetails } from './MobileMedicalDetails';
import { MobileMedicalForm } from './MobileMedicalForm';
import './MobileMedical.css';

// Phone version of the medical records page: summary, member filter, short cards, details with the recovery path
export const MobileMedical: React.FC<{ c: ReturnType<typeof useMedicalController> }> = ({ c }) => {
  const [memberId, setMemberId] = useState('');
  const [detailsId, setDetailsId] = useUrlDetails('record');

  // Same filter as desktop: the member is the player or the doctor
  const list = (memberId
    ? c.records.filter(r => r.player?.id?.toString() === memberId || r.doctor?.id?.toString() === memberId)
    : c.records
  ).slice().sort((a, b) => Number(recovered(a)) - Number(recovered(b)) || (b.injury_date || '').localeCompare(a.injury_date || ''));

  const open = c.records.filter(r => !recovered(r)).length;
  const done = c.records.length - open;
  const selected = c.members.find(m => String(m.id) === memberId);
  const details = detailsId ? c.records.find(r => String(r.id) === detailsId) : undefined;

  const menuItems = (r: PlayerMedicalRecord): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض التفاصيل', icon: Eye, color: '#f97316', onClick: () => setDetailsId(r.id) },
    { key: 'edit', label: 'تعديل الإصابة', icon: Pencil, color: '#f97316', onClick: () => c.openEditDialog(r, 'injury') },
    { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.handleDelete(r.id) },
  ];

  return (
    <div className="mmd2-page">
      <MobileAppBar title="التقرير الطبي" />

      {c.loading ? (
        <MobileLoader text="جاري تحميل السجلات الطبية..." />
      ) : (
        <>
          <section className="mmd2-hero">
            <div className="mmd2-hero-top">
              <span className="mmd2-hero-icon"><HeartPulse size={26} /></span>
              <div>
                <small>الملفات الطبية</small>
                <strong>{c.records.length}</strong>
              </div>
            </div>
            <div className="mmd2-stats">
              <div className="red"><strong>{open}</strong><small>إصابات مفتوحة</small></div>
              <div className="green"><strong>{done}</strong><small>تعافوا</small></div>
              <div><strong>{c.records.filter(r => stageOf(r) === 1).length}</strong><small>بانتظار الفحص</small></div>
            </div>
          </section>

          {c.error && <p className="mmd2-error">{c.error}</p>}

          {c.members.length > 0 && (
            <MobileSelect
              label="تصفية حسب العضو"
              icon={Users}
              value={memberId}
              options={[{ value: '', label: 'كل الأعضاء' }, ...c.members.map(m => ({ value: String(m.id), label: personName(m) }))]}
              onChange={setMemberId}
              searchable
              renderTrigger={openSheet => (
                <button type="button" className={`mmd2-filter ${selected ? 'active' : ''}`} onClick={openSheet}>
                  <Filter size={17} />
                  <span><small>العضو</small><strong>{selected ? personName(selected) : 'كل الأعضاء'}</strong></span>
                  <ChevronDown size={18} />
                </button>
              )}
            />
          )}

          {list.length === 0 ? (
            <div className="mmd2-empty">
              <span className="mmd2-empty-icon"><HeartPulse size={36} /></span>
              <strong>{c.records.length ? 'لا توجد ملفات لهذا العضو' : 'لا توجد سجلات طبية حالياً'}</strong>
              {!c.records.length && <p>أضف ملف إصابة جديد بالزر +</p>}
            </div>
          ) : (
            <div className="mmd2-list">
              {list.map(r => {
                const photo = personPhoto(r.player);
                const since = daysSince(r.injury_date);
                const stage = stageOf(r);
                const openDetails = () => setDetailsId(r.id);
                return (
                  <article
                    key={r.id}
                    className={`mmd2-card tone-${toneOf(r)}`}
                    role="button"
                    tabIndex={0}
                    onClick={openDetails}
                    onKeyDown={e => { if (e.key === 'Enter') openDetails(); }}
                  >
                    <div className="mmd2-card-top">
                      <img src={photo || defaultAvatar} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                      <span className="mmd2-card-text">
                        <strong>{personName(r.player, 'لاعب غير معروف')}</strong>
                        <small><Activity size={12} /> {r.injury_nature || 'إصابة غير محددة'}</small>
                      </span>
                      <MobileRowMenu items={menuItems(r)} label="إجراءات الملف" />
                    </div>
                    <div className="mmd2-card-foot">
                      <em className={`mmd2-status tone-${toneOf(r)}`}>{r.record_status}</em>
                      <span className="mmd2-steps" aria-label={`المرحلة ${stage} من 4`}>
                        {[1, 2, 3, 4].map(s => <i key={s} className={s <= stage ? 'on' : ''} />)}
                      </span>
                      {since !== null && !recovered(r) && <span className="mmd2-since"><Calendar size={12} /> منذ {since ? daysText(since) : 'اليوم'}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <button type="button" className="mmd2-fab" onClick={c.openAddDialog} aria-label="إضافة ملف إصابة" title="إضافة ملف إصابة">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {details && (
        <MobileMedicalDetails
          record={details}
          onEdit={mode => c.openEditDialog(details, mode)}
          onDeleteInitial={() => c.handleDeleteInitialExam(details)}
          onDeleteFinal={() => c.handleDeleteFinalDecision(details)}
          onDeleteTreatment={() => c.handleDeleteTreatmentPhase(details)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {c.isAddDialogOpen && (
        <MobileMedicalForm
          key={`${c.selectedRecord?.id ?? 'new'}-${c.dialogMode}`}
          record={c.selectedRecord}
          mode={c.dialogMode}
          onSave={c.fetchRecords}
          onClose={c.closeDialogs}
        />
      )}
    </div>
  );
};
