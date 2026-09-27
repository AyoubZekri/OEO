import React, { useState } from 'react';
import {
  LogOut, ShieldCheck, Trophy, Stethoscope, Banknote, Package, PenTool, CheckCircle, AlertTriangle,
  Lock, ChevronLeft, Trash2, Save, Calendar, FileText, HelpCircle,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileSelect } from '../widgets/MobileSelect';
import { useClearance, CLEARANCE_REASON_OPTIONS, type ClearanceStageId } from '../../Screen/Members/useClearance';
import type { MemberModel } from '../../Screen/Members/member_model';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileClearance.css';

interface MobileClearanceProps {
  player: MemberModel;
  onClose: () => void;
  onUpdate?: () => void;
}

const STAGES: { id: ClearanceStageId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'general', label: 'البيانات الأساسية', icon: LogOut },
  { id: 'admin', label: 'الشؤون الإدارية', icon: ShieldCheck },
  { id: 'sporting', label: 'الإدارة الرياضية', icon: Trophy },
  { id: 'medical', label: 'القسم الطبي', icon: Stethoscope },
  { id: 'financial', label: 'الإدارة المالية', icon: Banknote },
  { id: 'equipment', label: 'مخزن العتاد', icon: Package },
  { id: 'player', label: 'إقرار اللاعب', icon: PenTool },
];

type StageStatus = 'done' | 'warning' | 'danger' | 'locked' | 'pending';

const STATUS_LABELS: Record<StageStatus, string> = {
  done: 'مكتمل',
  warning: 'مستحقات أو سلف',
  danger: 'عتاد لم يُعد',
  locked: 'مقفل',
  pending: 'بانتظار التوقيع',
};

// Phone version of the clearance card: progress + list of stages; each stage opens its own page
export const MobileClearance: React.FC<MobileClearanceProps> = ({ player, onClose, onUpdate }) => {
  const [stage, setStage] = useState<ClearanceStageId | null>(null);
  const cl = useClearance(player, true, { onUpdate, onClose, onGeneralSaved: () => setStage('admin') });

  const movements = cl.equipmentData.flatMap(op => op.movements || []);
  const unreturned = movements.filter(m => !m.return_date);

  const statusOf = (id: ClearanceStageId): StageStatus => {
    if (cl.checkIsComplete(id)) return 'done';
    if (id === 'financial' && (cl.loansData.length > 0 || cl.remainingPayments.length > 0)) return 'warning';
    if (id === 'equipment' && cl.equipmentData.length > 0) return 'danger';
    if (!cl.hasCard && id !== 'general') return 'locked';
    return 'pending';
  };

  const photo = player.photo && !player.photo.includes('ui-avatars.com') ? player.photo : defaultAvatar;
  const current = STAGES.find(s => s.id === stage);

  return (
    <>
      <MobileScreen
        title="الإخلاء والمغادرة"
        onBack={onClose}
        footer={cl.hasCard && !cl.isLoading && (
          <button type="button" className="me-btn danger" onClick={cl.handleDelete} disabled={cl.isSaving}>
            <Trash2 size={18} /> إلغاء الإخلاء وحذف البطاقة
          </button>
        )}
      >
        {cl.isLoading ? (
          <MobileLoader text="جاري تحميل البطاقة..." />
        ) : (
          <>
            {/* Player + progress */}
            <section className="me-card mc-progress">
              <div className="mc-player">
                <img src={photo} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
                <div>
                  <strong>{player.first_name} {player.last_name}</strong>
                  <span>{cl.formData.exit_reason || 'لم يُحدد سبب المغادرة بعد'}</span>
                </div>
              </div>
              <div className="mc-progress-head">
                <span>نسبة الاكتمال</span>
                <strong>{cl.progressPercent}%</strong>
              </div>
              <div className="mc-progress-track"><div style={{ width: `${cl.progressPercent}%` }} /></div>
              <span className="mc-progress-note">{cl.completedCount} من {STAGES.length} مراحل مكتملة</span>
            </section>

            {!cl.hasCard && (
              <div className="mc-hint">
                <HelpCircle size={18} />
                ابدأ بتعبئة البيانات الأساسية لفتح بقية المراحل.
              </div>
            )}

            {/* Stages */}
            <section className="mc-stages">
              {STAGES.map(({ id, label, icon: Icon }, i) => {
                const status = statusOf(id);
                // Same rule as desktop: nothing but the basic data opens before the card exists
                const locked = !cl.hasCard && id !== 'general';
                return (
                  <button
                    key={id}
                    type="button"
                    className={`mc-stage ${status} ${locked ? 'is-locked' : ''}`}
                    disabled={locked}
                    onClick={() => setStage(id)}
                  >
                    <span className="mc-stage-icon"><Icon size={19} /></span>
                    <span className="mc-stage-text">
                      <strong>{i + 1}. {label}</strong>
                      <small>
                        {status === 'done' && <CheckCircle size={13} />}
                        {(status === 'warning' || status === 'danger') && <AlertTriangle size={13} />}
                        {status === 'locked' && <Lock size={13} />}
                        {STATUS_LABELS[status]}
                      </small>
                    </span>
                    {!locked && <ChevronLeft size={18} className="mc-stage-chevron" />}
                  </button>
                );
              })}
            </section>
          </>
        )}
      </MobileScreen>

      {current && (
        <MobileScreen
          title={current.label}
          onBack={() => setStage(null)}
          layer={2}
          footer={current.id === 'general' ? (
            <button type="button" className="me-btn primary" onClick={() => cl.handleSign('general')} disabled={cl.isSaving}>
              <Save size={18} /> {cl.isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          ) : !cl.checkIsComplete(current.id) && (
            <button type="button" className="me-btn primary" onClick={() => cl.handleSign(current.id)} disabled={cl.isSaving}>
              <PenTool size={18} /> {cl.isSaving ? 'جاري التوقيع...' : current.id === 'player' ? 'إقرار وتوقيع اللاعب' : 'توقيع القسم'}
            </button>
          )}
        >
          {current.id === 'general' ? (
            <section className="me-card">
              <h3 className="me-section-title"><span><LogOut size={16} /></span>معلومات فك الارتباط والمغادرة</h3>
              <label className="me-field">
                <span className="me-label"><Calendar size={14} /> تاريخ المغادرة *</span>
                <input
                  className="me-input"
                  type="date"
                  dir="ltr"
                  value={cl.formData.exit_date || ''}
                  onChange={e => cl.setFormData({ ...cl.formData, exit_date: e.target.value })}
                />
              </label>
              <MobileSelect
                label="السبب *"
                icon={FileText}
                value={cl.formData.exit_reason || ''}
                options={CLEARANCE_REASON_OPTIONS}
                onChange={v => cl.setFormData({ ...cl.formData, exit_reason: v })}
                placeholder="اختر السبب"
              />
              <label className="me-field">
                <span className="me-label"><FileText size={14} /> ملاحظات</span>
                <textarea
                  className="me-textarea"
                  value={cl.formData.general_notes || ''}
                  onChange={e => cl.setFormData({ ...cl.formData, general_notes: e.target.value })}
                  placeholder="أضف أية ملاحظات..."
                />
              </label>
            </section>
          ) : (
            <>
              {current.id === 'financial' && (
                <>
                  <div className="mc-tiles">
                    <div className={cl.loansData.length > 0 ? 'bad' : 'good'}>
                      <strong>{cl.loansData.length}</strong><span>سلف غير مسددة</span>
                    </div>
                    <div className={cl.remainingPayments.length > 0 ? 'warn' : 'good'}>
                      <strong>{cl.remainingPayments.length}</strong><span>دفعات متبقية</span>
                    </div>
                  </div>
                  {(cl.loansData.length > 0 || cl.remainingPayments.length > 0) && (
                    <div className="mc-alert bad">
                      <AlertTriangle size={18} />
                      يجب تسوية المستحقات والسلف قبل توقيع إخلاء الطرف المالي.
                    </div>
                  )}
                </>
              )}

              {current.id === 'equipment' && (
                <>
                  <div className="mc-tiles three">
                    <div className="info"><strong>{movements.length}</strong><span>إجمالي المستلم</span></div>
                    <div className="good"><strong>{movements.length - unreturned.length}</strong><span>تم إرجاعه</span></div>
                    <div className={unreturned.length > 0 ? 'bad' : 'good'}><strong>{unreturned.length}</strong><span>لم يُعد</span></div>
                  </div>
                  {unreturned.length > 0 ? (
                    <section className="me-card">
                      <div className="mc-alert bad">
                        <AlertTriangle size={18} />
                        اللاعب يمتلك {unreturned.length} عنصر لم يرجعه بعد
                      </div>
                      {unreturned.map((m, i) => (
                        <div key={i} className="mc-item">
                          <div>
                            <strong>{m.equipment?.name || m.equipment_name || m.name || `عتاد #${i + 1}`}</strong>
                            <span>الكمية: {m.quantity || 1}</span>
                          </div>
                          <span className="mc-badge bad">لم يُعد</span>
                        </div>
                      ))}
                    </section>
                  ) : (
                    <div className="mc-alert good">
                      <CheckCircle size={18} />
                      اللاعب أرجع جميع العتاد
                    </div>
                  )}
                </>
              )}

              {/* Signature */}
              <section className={`me-card mc-sign ${cl.checkIsComplete(current.id) ? 'done' : ''}`}>
                {cl.checkIsComplete(current.id) ? (
                  <>
                    <CheckCircle size={44} />
                    <strong>تم التوقيع بنجاح</strong>
                    {current.id !== 'player'
                      ? <span>بواسطة: {cl.signeeOf(current.id)}</span>
                      : <span>{cl.formData.player_signed_at ? `بتاريخ ${cl.formData.player_signed_at}` : 'تم الإقرار'}</span>}
                  </>
                ) : (
                  <>
                    <PenTool size={40} />
                    <strong>بانتظار التوقيع</strong>
                    <span>
                      {current.id === 'player'
                        ? 'بتوقيع اللاعب تُغلق البطاقة ويصبح العضو غير نشط.'
                        : 'راجع حالة اللاعب ثم اضغط على "توقيع القسم" في الأسفل.'}
                    </span>
                  </>
                )}
              </section>
            </>
          )}
        </MobileScreen>
      )}
    </>
  );
};
