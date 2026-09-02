import React, { useState, useRef, useEffect } from 'react';

import { Search, Trash2, Edit2, Plus, Scale, AlertTriangle, MessageSquare, User, Calendar, FileText, ChevronDown, Check } from 'lucide-react';
import { useDisciplinaryController } from './DisciplinaryController';
import { DisciplinaryDialog } from './DisciplinaryDialog';
import { CustomDropdown } from '../../widget/CustomDropdown';


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
  // const { t } = useTranslation();
  const controller = useDisciplinaryController();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'تنبيه': return <AlertTriangle size={16} />;
      case 'إنذار': return <AlertTriangle size={16} />;
      case 'طلب توضيح': return <MessageSquare size={16} />;
      case 'إحالة على الجهة التأديبية المختصة': return <Scale size={16} />;
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
    { value: 'تنبيه', label: 'تنبيه' },
    { value: 'إنذار', label: 'إنذار' },
    { value: 'طلب توضيح', label: 'طلب توضيح' },
    { value: 'إحالة على الجهة التأديبية المختصة', label: 'إحالة' }
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

          <button className="btn-primary" onClick={controller.openAddDialog}>
            <Plus size={18} />
            إضافة إجراء
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ marginTop: '20px' }}>
        <div className="disciplinary-grid">
          {controller.disciplinaryList.map(c => (
            <div key={c.id} className="disciplinary-premium-card">
              <div className="card-header-premium">
                <div className={`action-type-pill ${c.actionType.replace(/ /g, '.')}`}>
                  {getTypeIcon(c.actionType)}
                  <span>{c.actionType}</span>
                </div>
                <span className="card-subtitle-premium">#{c.id.substring(0, 6)}</span>
              </div>

              <div className="card-body-premium">
                <div className="info-row-premium">
                  <User size={16} />
                  <span><strong>اللاعب:</strong> {c.memberName}</span>
                </div>
                <div className="info-row-premium">
                  <Calendar size={16} />
                  <span><strong>تاريخ الحدث:</strong> {new Date(c.incidentDate).toLocaleDateString('ar-DZ')}</span>
                </div>
                <div className="info-row-premium" style={{ alignItems: 'flex-start' }}>
                  <FileText size={16} />
                  <span><strong>السبب:</strong> {c.reason}</span>
                </div>
              </div>
              
              <div className="card-footer-premium">
                <div className="status-control-modern">
                  <StatusDropdown 
                    value={c.status} 
                    onChange={(val) => controller.handleUpdateStatus(c.id, val as any)} 
                  />
                </div>
                <div className="card-actions-premium">
                  <button className="btn-action-premium edit-btn" onClick={() => controller.openEditDialog(c)} title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-action-premium delete-btn" onClick={() => controller.handleDelete(c.id)} title="حذف">
                    <Trash2 size={16} />
                  </button>
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
      />
    </div>
  );

};