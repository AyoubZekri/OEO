import React, { useState, useRef, useEffect } from 'react';

import { useCorrespondencesController } from './CorrespondencesController';
import { Search, Eye, Trash2, Edit2, Plus, Calendar, User, FileText, Tag, ChevronDown, Check } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';

import { CorrespondenceDialog } from './CorrespondenceDialog';
import './Correspondences.css';
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
    { value: 'pending', label: 'بانتظار الرد', colorClass: 'pending' },
    { value: 'delivered', label: 'تم التبليغ', colorClass: 'delivered' },
    { value: 'closed', label: 'مغلقة', colorClass: 'closed' }
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

export const Correspondences: React.FC = () => {
  // const { t } = useTranslation();
  const controller = useCorrespondencesController();

  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'pending', label: 'بانتظار الرد' },
    { value: 'delivered', label: 'تم التبليغ' },
    { value: 'closed', label: 'مغلقة' }
  ];



  return (
    <div className="members-container">
      <div className="members-header">
        <h1 className="page-title">إدارة المراسلات الرسمية</h1>
        
        <div className="members-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="ابحث برقم المراسلة، اللاعب..."
              className="search-input"
              value={controller.searchQuery}
              onChange={(e) => controller.setSearchQuery(e.target.value)}
            />
          </div>
          <CustomDropdown<string>
            value={controller.filterStatus}
            options={statusOptions}
            onChange={(val) => controller.setFilterStatus(val)}
            placeholder="جميع الحالات"
          />
          <button className="btn-primary" onClick={controller.openAddDialog}>
            <Plus size={18} />
            إضافة مراسلة
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-wrapper" style={{ marginTop: '20px' }}>
        
        <div className="correspondences-grid">
          {controller.correspondences.map(c => (
            <div key={c.id} className="correspondence-card premium-card">
              <div className="card-header-premium">
                <div className="card-badge-wrap">
                  <span className="corr-num-premium">#{c.correspondenceNumber}</span>
                </div>
                <div className="card-date-wrap">
                  <Calendar size={14} className="icon-subtle" />
                  <span className="corr-date">{c.date}</span>
                </div>
              </div>
              
              <div className="card-body-premium">
                <div className="premium-info-group">
                  <div className="info-icon-container user-icon-bg">
                    <User size={18} />
                  </div>
                  <div className="info-content-right">
                    <span className="info-label">اللاعب المعني</span>
                    <span className="info-value text-bold">{controller.getMemberName(c.memberId)}</span>
                  </div>
                </div>

                <div className="premium-info-group">
                  <div className="info-icon-container subject-icon-bg">
                    <FileText size={18} />
                  </div>
                  <div className="info-content-right">
                    <span className="info-label">الموضوع</span>
                    <span className="info-value text-medium">{c.subject}</span>
                  </div>
                </div>

                <div className="premium-info-group">
                  <div className="info-icon-container type-icon-bg">
                    <Tag size={18} />
                  </div>
                  <div className="info-content-right">
                    <span className="info-label">النوع</span>
                    <span className="info-value">{c.type === 'أخرى' ? c.otherType : c.type}</span>
                  </div>
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
                  <button className="btn-action-premium view-btn" onClick={() => controller.openViewDialog(c)} title="عرض وطباعة">
                    <Eye size={16} />
                  </button>
                  <button className="btn-action-premium edit-btn" onClick={() => {}} title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-action-premium delete-btn" onClick={() => controller.handleDelete(c.id)} title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {controller.correspondences.length === 0 && (
            <div className="no-data-message">
              لا توجد مراسلات مطابقة للبحث
            </div>
          )}
        </div>
      </div>

      {/* View/Print Dialog */}
      {controller.isDialogOpen && controller.selectedCorrespondence && (
        <CorrespondenceDialog
          isOpen={controller.isDialogOpen}
          onClose={controller.closeViewDialog}
          member={controller.getMember(controller.selectedCorrespondence.memberId)}
          existingData={controller.selectedCorrespondence}
          viewOnly={true}
        />
      )}

      {/* Add Dialog */}
      {controller.isAddDialogOpen && (
        <CorrespondenceDialog
          isOpen={controller.isAddDialogOpen}
          onClose={controller.closeAddDialog}
          members={controller.members}
          onSave={controller.handleAddCorrespondence}
        />
      )}
    </div>
  );
};
