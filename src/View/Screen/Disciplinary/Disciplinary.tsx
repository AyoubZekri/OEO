import React, { useState, useRef, useEffect } from 'react';


import { useAuth } from '../../../core/context/AuthContext';

import { Search, Trash2, Edit2, Plus, Scale, AlertTriangle, MessageSquare, User, Calendar, ChevronDown, Check, Eye, PenTool, CheckCircle, Printer } from 'lucide-react';
import { useDisciplinaryController } from './DisciplinaryController';
import { DisciplinaryDialog } from './DisciplinaryDialog';
import { IncidentDecisionDialog } from './Dialogs/IncidentDecisionDialog';
import { ClarificationResponseDialog } from './Dialogs/ClarificationResponseDialog';
import { HearingResponseDialog } from './Dialogs/HearingResponseDialog';
import { DisciplinaryDetailsDialog } from './Dialogs/DisciplinaryDetailsDialog';
import { ViewReplyDialog } from './Dialogs/ViewReplyDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { IncidentPrintDialog } from './Dialogs/IncidentPrintDialog';


import './Disciplinary.css';
import '../Members/Members.css';


const StatusDropdown = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'مفتوح', label: 'مفتوح', colorClass: 'pending' },
    { value: 'منفذ', label: 'منفذ', colorClass: 'delivered' },
    { value: 'ملغى', label: 'ملغى', colorClass: 'closed' }
  ];

  const currentOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="status-dropdown-container" ref={ref}>
      <div 
        className={`status-select-modern ${currentOption.colorClass}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentOption.label}</span>
        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>

      {isOpen && (
        <div className="status-dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`status-dropdown-item ${opt.colorClass} ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Disciplinary: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const controller = useDisciplinaryController();
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingReplyItem, setViewingReplyItem] = useState<any>(null);
  const [printingIncident, setPrintingIncident] = useState<any>(null);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'طلب توضيح': return <MessageSquare size={16} />;
      case 'استدعاء جلسة': return <Calendar size={16} />;
      case 'إحالة على الجهة التأديبية المختصة': return <AlertTriangle size={16} />;
      case 'واقعة': return <Scale size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  // const getStatusBadge = (status: string) => {
  //   if (status === 'مفتوح') return <span className="badge badge-purple">{status}</span>;
  //   if (status === 'منفذ') return <span className="badge badge-green">{status}</span>;
  //   if (status === 'ملغى') return <span className="badge badge-red">{status}</span>;
  //   return <span>{status}</span>;
  // };

  const statusOptions = [
    { value: 'الكل', label: 'جميع الحالات' },
    { value: 'مفتوح', label: 'مفتوح' },
    { value: 'منفذ', label: 'منفذ' },
    { value: 'ملغى', label: 'ملغى' }
  ];

  const typeOptions = [
    { value: 'الكل', label: 'جميع الأنواع' },
    { value: 'طلب توضيح', label: 'طلب توضيح' },
    { value: 'استدعاء جلسة', label: 'استدعاء جلسة' },
    { value: 'واقعة', label: 'واقعة' }
  ];

  return (
    <div className="members-container">
      {/* Header section */}
      <div className="members-header">
          <h1 className="page-title">الإجراءات التأديبية</h1>
          
          <div className="members-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="ابحث باسم اللاعب أو السبب..."
                className="search-input"
                value={controller.searchQuery}
                onChange={(e) => controller.setSearchQuery(e.target.value)}
              />
            </div>
          
          <CustomDropdown<string>
            value={controller.filterType}
            options={typeOptions}
            onChange={(val) => controller.setFilterType(val)}
            placeholder="جميع الأنواع"
          />

          <CustomDropdown<string>
            value={controller.filterStatus}
            options={statusOptions}
            onChange={(val) => controller.setFilterStatus(val)}
            placeholder="جميع الحالات"
          />

          {hasAccess(permissions.disciplinary.add) && (
            <button className="btn-primary" onClick={controller.openAddDialog}>
              <Plus size={18} />
              إضافة إجراء
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ marginTop: '20px' }}>
        <div className="disciplinary-grid">
          {controller.disciplinaryList.map(c => (
            <div key={c.id} className="disciplinary-premium-card">
              <div className="card-header-premium">
                <div className={`action-type-pill ${c.actionType.replace(/ /g, '-')}`}>
                  {getTypeIcon(c.actionType)}
                  <span>{c.actionType}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="card-subtitle-premium">#{c.id.substring(0, 6)}</span>
                  {hasAccess(permissions.disciplinary.print) && (
                    <button className="btn-action-premium" style={{ width: '32px', height: '32px', padding: 0 }} onClick={() => setPrintingIncident(c)} title="طباعة المحضر/القرار">
                      <Printer size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body-premium">
                <div className="player-info-premium">
                  <div className="player-avatar-premium">
                    <User size={24} />
                  </div>
                  <div className="player-details-premium">
                    <span className="player-name-premium">{c.memberName}</span>
                    <span className="incident-date-premium">
                      <Calendar size={14} /> {new Date(c.incidentDate).toLocaleDateString('ar-DZ')}
                    </span>
                  </div>
                </div>
                
                <div className="incident-reason-premium">
                  <p>{c.reason}</p>
                </div>

                {hasAccess(permissions.disciplinary.sign) && (
                  <button 
                    className={`full-width-sign-btn ${c.is_acknowledged ? 'signed' : 'unsigned'}`}
                    onClick={() => !c.is_acknowledged && controller.handleAcknowledge(c)} 
                    disabled={c.is_acknowledged}
                  >
                    {c.is_acknowledged ? (
                      <>
                        <CheckCircle size={18} />
                        <span>موقع بالاستلام {c.acknowledged_at ? `في ${new Date(c.acknowledged_at).toLocaleDateString('ar-DZ')}` : ''}</span>
                      </>
                    ) : (
                      <>
                        <PenTool size={18} />
                        <span>توقيع اللاعب بالاستلام</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="card-footer-premium">
                <div className="status-control-modern" style={{ opacity: hasAccess(permissions.disciplinary.changeStatus) ? 1 : 0.6, pointerEvents: hasAccess(permissions.disciplinary.changeStatus) ? 'auto' : 'none' }}>
                  <StatusDropdown 
                    value={c.status} 
                    onChange={(val) => controller.handleUpdateStatus(c.id, val as any)} 
                  />
                </div>
                <div className="card-actions-premium">
                  {!['تنبيه', 'إنذار'].includes(c.actionType) && hasAccess(permissions.disciplinary.viewReply) && (
                    <button className="btn-action-premium respond-btn" onClick={() => setViewingReplyItem(c)} title="عرض الرد والقرارات">
                      <MessageSquare size={16} />
                    </button>
                  )}
                  {hasAccess(permissions.disciplinary.view) && (
                    <button className="btn-action-premium view-btn" onClick={() => setViewingItem(c)} title="عرض التفاصيل">
                      <Eye size={16} />
                    </button>
                  )}
                  {hasAccess(permissions.disciplinary.edit) && (
                    <button className="btn-action-premium edit-btn" onClick={() => controller.openEditDialog(c)} title="تعديل">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {hasAccess(permissions.disciplinary.delete) && (
                    <button className="btn-action-premium delete-btn" onClick={() => controller.handleDelete(c.id)} title="حذف">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {controller.disciplinaryList.length === 0 && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
               <Scale size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
               <h3>لا توجد إجراءات تأديبية</h3>
               <p>لم يتم العثور على أي إجراءات تأديبية تطابق بحثك.</p>
             </div>
          )}
        </div>
      </div>

      <DisciplinaryDialog
        isOpen={controller.isAddDialogOpen}
        onClose={controller.closeDialog}
        onSave={controller.handleSave}
        editingItem={controller.editingItem}
        members={controller.members}
      />

      <IncidentDecisionDialog
        isOpen={controller.isResponseDialogOpen && controller.editingItem?.actionType === 'واقعة'}
        onClose={controller.closeDialog}
        onSave={controller.handleSave}
        editingItem={controller.editingItem}
      />
      
      <ClarificationResponseDialog
        isOpen={controller.isResponseDialogOpen && controller.editingItem?.actionType === 'طلب توضيح'}
        onClose={controller.closeDialog}
        onSave={controller.handleSave}
        editingItem={controller.editingItem}
      />

      <HearingResponseDialog
        isOpen={controller.isResponseDialogOpen && ['استدعاء جلسة', 'إحالة على الجهة التأديبية المختصة'].includes(controller.editingItem?.actionType || '')}
        onClose={controller.closeDialog}
        onSave={controller.handleSave}
        editingItem={controller.editingItem}
      />

      <DisciplinaryDetailsDialog
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
      />

      <ViewReplyDialog
        isOpen={!!viewingReplyItem}
        onClose={() => setViewingReplyItem(null)}
        item={viewingReplyItem}
        onEdit={(item) => {
          setViewingReplyItem(null);
          controller.openResponseDialog(item);
        }}
      />

      <IncidentPrintDialog 
        isOpen={!!printingIncident}
        onClose={() => setPrintingIncident(null)}
        incident={printingIncident}
      />
    </div>
  );

};