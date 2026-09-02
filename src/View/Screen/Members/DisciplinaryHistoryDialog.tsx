import React from 'react';
import { AlertTriangle, FileWarning, MessageSquare, CheckCircle2, Calendar, MapPin, X, Clock, Scale } from 'lucide-react';
import './Disciplinary.css';
import './Members.css';

interface DisciplinaryHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  history: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string | number) => void;
}

export const DisciplinaryHistoryDialog: React.FC<DisciplinaryHistoryDialogProps> = ({
  isOpen,
  onClose,
  member,
  history,
  onEdit,
  onDelete
}) => {
  const [printingId, setPrintingId] = React.useState<number | string | null>(null);

  if (!isOpen || !member) return null;

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'تنبيه': return 'type-warning';
      case 'إنذار': return 'type-alert';
      case 'طلب توضيح': return 'type-clarification';
      case 'إحالة على الجهة التأديبية المختصة': return 'type-referral';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'تنبيه': return <AlertTriangle size={20} />;
      case 'إنذار': return <AlertTriangle size={20} />;
      case 'طلب توضيح': return <MessageSquare size={20} />;
      case 'إحالة على الجهة التأديبية المختصة': return <Scale size={20} />;
      default: return <FileWarning size={20} />;
    }
  };

  return (
    <div className="dialog-overlay printable-overlay" onClick={onClose}>
      <div className="dialog-content history-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header no-print">
          <div className="dialog-title">
            <FileWarning size={24} color="#f59e0b" />
            <h2>سجل الإجراءات التأديبية - {member.first_name} {member.last_name}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dialog-body printable-area" style={{ padding: '0', background: '#f8fafc' }}>
          
          <div className="print-header only-print">
            <h2>نادي أولمبيك - السجل التأديبي</h2>
            <h3>{member.first_name} {member.last_name}</h3>
            <p>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-DZ').format(new Date())}</p>
          </div>

          <div className="history-timeline">
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 16px', color: '#10b981', opacity: 0.5 }} />
                <h3>لا توجد أي إجراءات تأديبية</h3>
                <p>سجل هذا العضو نظيف تماماً.</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} id={`history-card-${item.id}`} className={`history-card ${printingId && printingId !== item.id ? 'no-print' : ''}`}>
                  <div className="history-card-header">
                    <div className={`history-card-type ${getTypeClass(item.actionType)}`}>
                      {getTypeIcon(item.actionType)}
                      {item.actionType}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="history-card-date">
                        <Clock size={14} />
                        {new Date(item.incidentDate).toLocaleDateString('ar-DZ')}
                      </div>
                      <div className="history-actions no-print" style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => {
                          setPrintingId(item.id);
                          setTimeout(() => {
                            window.print();
                            setPrintingId(null);
                          }, 100);
                        }} title="طباعة" style={{ color: 'var(--text-p)', background: 'var(--bg-body)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        </button>
                        <button className="btn-icon" onClick={() => {
                          onClose();
                          setTimeout(() => onEdit(item), 100);
                        }} title="تعديل" style={{ color: 'var(--primary)', background: 'var(--primary-light, rgba(249, 115, 22, 0.1))', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button className="btn-icon" onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذا السجل؟')) onDelete(item.id); }} title="حذف" style={{ color: '#ef4444', background: '#fef2f2', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="history-card-content">
                    <p className="incident-text-clean">
                      {item.incident}
                    </p>

                    <div className="history-meta-clean">
                      <span className="meta-badge-clean">
                        <MapPin size={14} /> {item.location}
                      </span>
                      
                      {item.ruleViolated && (
                        <span className="meta-badge-clean danger">
                          <FileWarning size={14} /> {item.ruleViolated}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <div className="notes-box-clean">
                        <strong>ملاحظات الإدارة:</strong> {item.notes}
                      </div>
                    )}

                    <div className="requirements-section-clean">
                      <span className="req-title-clean">المطلوب من العضو:</span>
                      <div className="req-tags-clean">
                        {item.requirements?.commitment && <span className="clean-tag"><CheckCircle2 size={14} /> الالتزام مستقبلاً</span>}
                        {item.requirements?.clarification && <span className="clean-tag"><FileWarning size={14} /> تقديم توضيح كتابي</span>}
                        {item.requirements?.hearing && (
                          <span className="clean-tag hearing-tag">
                            <Calendar size={14} /> حضور جلسة استماع ({item.requirements.hearing})
                          </span>
                        )}
                        {item.requirements?.other && (
                          <span className="clean-tag">
                            {item.requirements.other}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dialog-footer no-print">
          <button className="btn-cancel" onClick={onClose}>إغلاق</button>
          {history.length > 0 && (
            <button className="btn-primary" onClick={() => window.print()}>
              طباعة السجل
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
