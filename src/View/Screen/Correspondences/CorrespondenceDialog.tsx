import React, { useState, useEffect } from 'react';
import { X, Mail, Printer, Save } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';
import '../Members/Disciplinary.css';
import '../Members/Members.css';
import {type CorrespondenceModel } from './correspondence_model';

interface CorrespondenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member?: any; // Made optional for adding new
  members?: any[]; // List of members to choose from when adding
  onSave?: (data: Omit<CorrespondenceModel, 'id' | 'createdAt'>) => void;
  existingData?: CorrespondenceModel;
  viewOnly?: boolean;
}

export const CorrespondenceDialog: React.FC<CorrespondenceDialogProps> = ({
  isOpen,
  onClose,
  member,
  members = [],
  onSave,
  existingData,
  viewOnly = false
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [correspondenceNumber, setCorrespondenceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('استدعاء');
  const [otherType, setOtherType] = useState('');
  const [text, setText] = useState('');
  const [requiredAction, setRequiredAction] = useState('');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        setSelectedMemberId(existingData.memberId?.toString() || '');
        setCorrespondenceNumber(existingData.correspondenceNumber);
        setDate(existingData.date);
        setSubject(existingData.subject);
        setType(existingData.type);
        setOtherType(existingData.otherType || '');
        setText(existingData.text);
        setRequiredAction(existingData.requiredAction);
        setAdminName(existingData.adminName);
      } else {
        // Reset for new
        setSelectedMemberId(member ? member.id.toString() : '');
        setCorrespondenceNumber('');
        setDate(new Date().toISOString().split('T')[0]);
        setSubject('');
        setType('استدعاء');
        setOtherType('');
        setText('');
        setRequiredAction('');
        setAdminName('');
      }
    }
  }, [isOpen, existingData, member]);

  if (!isOpen) return null;
  const currentMember = member || members.find(m => String(m.id) === selectedMemberId);

  const handlePrint = () => {
    if (!currentMember) {
      alert("الرجاء اختيار العضو أولاً");
      return;
    }
    window.print();
  };

  const handleSaveAndPrint = () => {
    if (!currentMember) {
      alert("الرجاء اختيار العضو أولاً");
      return;
    }
    if (onSave && !viewOnly && !existingData) {
      onSave({
        memberId: currentMember.id,
        correspondenceNumber,
        date,
        subject,
        type,
        otherType: type === 'أخرى' ? otherType : undefined,
        text,
        requiredAction,
        adminName,
        status: 'pending'
      });
    }
    setTimeout(() => {
      window.print();
      if (!viewOnly && !existingData) onClose();
    }, 300);
  };

  const typeOptions = [
    { value: 'استدعاء', label: 'استدعاء' },
    { value: 'إشعار', label: 'إشعار' },
    { value: 'طلب توضيح', label: 'طلب توضيح' },
    { value: 'تبليغ قرار', label: 'تبليغ قرار' },
    { value: 'طلب وثيقة', label: 'طلب وثيقة' },
    { value: 'إعلام بموعد', label: 'إعلام بموعد' },
    { value: 'أخرى', label: 'أخرى' },
  ];

  return (
    <div className="dialog-overlay printable-overlay" onClick={onClose}>
      <div className="dialog-content disciplinary-dialog" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="dialog-header no-print">
          <div className="dialog-title">
            <Mail size={24} color="#3b82f6" />
            <h2>
              {viewOnly ? 'عرض وطباعة المراسلة' : 'مراسلة رسمية جديدة'} {currentMember ? `- ${currentMember.first_name} ${currentMember.last_name}` : ''}
            </h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dialog-body printable-area">
          {/* Print Only Header */}
          <div className="print-header only-print" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2>المراسلة الرسمية مع اللاعب</h2>
            <h3>نادي: أولمبيك أوراس باتنة (OEB) – فرع كرة القدم</h3>
          </div>

          <form className="no-print" style={{ display: viewOnly ? 'none' : 'flex', flexDirection: 'column', gap: '16px' }}>
            {!member && !existingData && (
              <CustomDropdown<string>
                label="اللاعب المعني *"
                value={selectedMemberId}
                options={[
                  { value: '', label: 'اختر اللاعب...' },
                  ...members.map(m => ({
                    value: m.id.toString(),
                    label: `${m.first_name} ${m.last_name}`
                  }))
                ]}
                onChange={(val) => setSelectedMemberId(val)}
              />
            )}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <CustomInput
                type="text"
                label="رقم المراسلة"
                value={correspondenceNumber}
                onChange={e => setCorrespondenceNumber(e.target.value)}
              />
              <CustomInput
                type="date"
                label="التاريخ *"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <CustomInput
              type="text"
              label="الموضوع *"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <CustomDropdown<string>
                label="نوع المراسلة *"
                value={type}
                options={typeOptions}
                onChange={(val) => setType(val)}
              />
              {type === 'أخرى' && (
                <CustomInput
                  type="text"
                  label="تحديد نوع المراسلة *"
                  required
                  value={otherType}
                  onChange={e => setOtherType(e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <label>نص المراسلة *</label>
              <textarea 
                className="form-control" 
                rows={5}
                required
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="اكتب نص المراسلة هنا..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <CustomInput
              type="text"
              label="الإجراء أو الأجل المطلوب إن وجد"
              value={requiredAction}
              onChange={e => setRequiredAction(e.target.value)}
            />

            <CustomInput
              type="text"
              label="الإدارة/المسؤول *"
              required
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
            />
          </form>

          {/* Print View Content (Always visible in viewOnly mode or when printing) */}
          <div className={viewOnly ? '' : 'only-print'} style={{ direction: 'rtl', fontSize: '14pt', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div><strong>رقم المراسلة:</strong> {correspondenceNumber || '...............'}</div>
              <div><strong>التاريخ:</strong> {date}</div>
            </div>

            <h3 style={{ textAlign: 'center', textDecoration: 'underline', marginBottom: '20px' }}>مراسلة رسمية للاعب</h3>
            
            <div style={{ marginBottom: '10px' }}><strong>إلى اللاعب:</strong> {currentMember ? `${currentMember.first_name} ${currentMember.last_name}` : '.........................'}</div>
            <div style={{ marginBottom: '10px' }}><strong>الموضوع:</strong> {subject || '....................................................................'}</div>
            
            <div style={{ marginBottom: '10px' }}>
              <strong>نوع المراسلة:</strong> {type === 'أخرى' ? (otherType || '................') : type}
            </div>

            <div style={{ marginTop: '20px', marginBottom: '10px' }}><strong>نص المراسلة:</strong></div>
            <div style={{ minHeight: '100px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc' }}>
              {text || '\n\n\n'}
            </div>

            <div style={{ marginTop: '20px', marginBottom: '10px' }}>
              <strong>الإجراء أو الأجل المطلوب إن وجد:</strong> {requiredAction || '....................................................................'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <div><strong>الإدارة/المسؤول:</strong> {adminName || '.........................'}</div>
              <div><strong>الإمضاء:</strong> .........................</div>
            </div>

            <hr style={{ margin: '40px 0', borderTop: '2px dashed #000' }} />

            <h4 style={{ textAlign: 'center' }}>إثبات التبليغ</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <div>استلمت نسخة من هذه المراسلة بتاريخ: ...............</div>
              <div>الساعة: ...............</div>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'left', paddingLeft: '50px' }}>
              <strong>إمضاء اللاعب:</strong> .........................
            </div>
          </div>

        </div>

        <div className="dialog-footer no-print">
          <button type="button" className="btn-cancel" onClick={onClose}>إلغاء</button>
          
          {viewOnly ? (
            <button type="button" className="btn-primary" onClick={handlePrint}>
              <Printer size={18} />
              طباعة
            </button>
          ) : (
            <>
              <button type="button" className="btn-primary" style={{ backgroundColor: '#64748b' }} onClick={handlePrint}>
                <Printer size={18} />
                طباعة فقط
              </button>
              <button type="button" className="btn-primary" onClick={handleSaveAndPrint}>
                <Save size={18} />
                حفظ وطباعة
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
