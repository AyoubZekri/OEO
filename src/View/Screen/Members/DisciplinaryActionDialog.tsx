import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Handshake, FileSignature, Gavel, MoreHorizontal } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';
import './Disciplinary.css';
import './Members.css';

interface DisciplinaryActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  onSave: (data: any) => void;
  editData?: any;
}

export const DisciplinaryActionDialog: React.FC<DisciplinaryActionDialogProps> = ({
  isOpen,
  onClose,
  member,
  onSave,
  editData
}) => {
  const [actionType, setActionType] = useState('تنبيه');
  const [incident, setIncident] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [ruleViolated, setRuleViolated] = useState('');
  const [notes, setNotes] = useState('');

  // Checkboxes state
  const [reqCommitment, setReqCommitment] = useState(false);
  const [reqClarification, setReqClarification] = useState(false);
  const [reqHearing, setReqHearing] = useState(false);
  const [hearingDate, setHearingDate] = useState('');
  const [reqOther, setReqOther] = useState(false);
  const [otherAction, setOtherAction] = useState('');

  React.useEffect(() => {
    if (editData && isOpen) {
      setActionType(editData.actionType || 'تنبيه');
      setIncident(editData.incident || '');
      setIncidentDate(editData.incidentDate || new Date().toISOString().split('T')[0]);
      setLocation(editData.location || '');
      setRuleViolated(editData.ruleViolated || '');
      setNotes(editData.notes || '');
      setReqCommitment(!!editData.requirements?.commitment);
      setReqClarification(!!editData.requirements?.clarification);
      setReqHearing(!!editData.requirements?.hearing);
      setHearingDate(editData.requirements?.hearing || '');
      setReqOther(!!editData.requirements?.other);
      setOtherAction(editData.requirements?.other || '');
    } else if (isOpen && !editData) {
      // Reset
      setActionType('تنبيه');
      setIncident('');
      setIncidentDate(new Date().toISOString().split('T')[0]);
      setLocation('');
      setRuleViolated('');
      setNotes('');
      setReqCommitment(false);
      setReqClarification(false);
      setReqHearing(false);
      setHearingDate('');
      setReqOther(false);
      setOtherAction('');
    }
  }, [editData, isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      id: editData?.id, // Keep the id if editing
      memberId: member.id,
      actionType,
      incident,
      incidentDate,
      location,
      ruleViolated,
      notes,
      requirements: {
        commitment: reqCommitment,
        clarification: reqClarification,
        hearing: reqHearing ? hearingDate : null,
        other: reqOther ? otherAction : null,
      }
    };
    onSave(data);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content disciplinary-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <ShieldAlert size={24} color="#ef4444" />
            <h2>{editData ? 'تعديل الإجراء - ' : 'إجراء تأديبي جديد - '}{member.first_name} {member.last_name}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dialog-body">
          <form id="disciplinaryForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CustomDropdown<string>
              label="نوع الإجراء *"
              value={actionType}
              options={[
                { value: 'تنبيه', label: 'تنبيه' },
                { value: 'إنذار', label: 'إنذار' },
                { value: 'طلب توضيح', label: 'طلب توضيح' },
                { value: 'إحالة على الجهة التأديبية المختصة', label: 'إحالة على الجهة التأديبية المختصة' },
              ]}
              onChange={(val) => setActionType(val)}
            />

            <div className="form-group">
              <label>الواقعة *</label>
              <textarea 
                className="form-control" 
                rows={3}
                required
                value={incident}
                onChange={e => setIncident(e.target.value)}
                placeholder="وصف الواقعة بالتفصيل..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <CustomInput
                type="date"
                label="تاريخ الواقعة *"
                required
                value={incidentDate}
                onChange={e => setIncidentDate(e.target.value)}
              />
              <CustomInput
                type="text"
                label="المكان *"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="مكان حدوث الواقعة"
              />
            </div>

            <CustomInput
              type="text"
              label="المادة أو القاعدة التنظيمية محل المخالفة"
              value={ruleViolated}
              onChange={e => setRuleViolated(e.target.value)}
              placeholder="مثال: المادة 12 من النظام الداخلي"
            />

            <div className="form-group">
              <label>ملاحظات الإدارة/الطاقم</label>
              <textarea 
                className="form-control" 
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '8px' }}>
              <label style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: '8px', display: 'block' }}>المطلوب من العضو/اللاعب:</label>
              
              <div className="req-cards-grid">
                
                <div className={`req-card ${reqCommitment ? 'active' : ''}`} onClick={() => setReqCommitment(!reqCommitment)}>
                  <div className="req-card-icon"><Handshake size={20} /></div>
                  <div className="req-card-content">
                    <h4>الالتزام مستقبلاً</h4>
                  </div>
                  <div className="req-check">{reqCommitment && <CheckCircle2 size={18} />}</div>
                </div>

                <div className={`req-card ${reqClarification ? 'active' : ''}`} onClick={() => setReqClarification(!reqClarification)}>
                  <div className="req-card-icon"><FileSignature size={20} /></div>
                  <div className="req-card-content">
                    <h4>تقديم توضيح كتابي</h4>
                  </div>
                  <div className="req-check">{reqClarification && <CheckCircle2 size={18} />}</div>
                </div>

                <div className="req-card-wrapper">
                  <div className={`req-card ${reqHearing ? 'active' : ''}`} onClick={() => setReqHearing(!reqHearing)}>
                    <div className="req-card-icon"><Gavel size={20} /></div>
                    <div className="req-card-content">
                      <h4>جلسة استماع</h4>
                    </div>
                    <div className="req-check">{reqHearing && <CheckCircle2 size={18} />}</div>
                  </div>
                  {reqHearing && (
                    <div className="conditional-input-wrapper">
                      <CustomInput
                        type="date"
                        label="تاريخ الجلسة *"
                        required
                        value={hearingDate}
                        onChange={e => setHearingDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="req-card-wrapper">
                  <div className={`req-card ${reqOther ? 'active' : ''}`} onClick={() => setReqOther(!reqOther)}>
                    <div className="req-card-icon"><MoreHorizontal size={20} /></div>
                    <div className="req-card-content">
                      <h4>إجراء آخر</h4>
                    </div>
                    <div className="req-check">{reqOther && <CheckCircle2 size={18} />}</div>
                  </div>
                  {reqOther && (
                    <div className="conditional-input-wrapper">
                      <CustomInput
                        type="text"
                        label="تفاصيل الإجراء الآخر *"
                        required
                        value={otherAction}
                        onChange={e => setOtherAction(e.target.value)}
                        placeholder="حدد الإجراء المطلوب..."
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

          </form>
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>إلغاء</button>
          <button type="submit" form="disciplinaryForm" className="btn-primary">
            <CheckCircle2 size={18} />
            حفظ الإجراء
          </button>
        </div>
      </div>
    </div>
  );
};
