import React, { useState } from 'react';
import { X, RefreshCw, Package, ChevronDown } from 'lucide-react';
import './EquipmentOperations.css';
import { useAuth } from '../../../core/context/AuthContext';

interface OperationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: any | null;
  onReturnEquipment: (movementId: string, returnDate: string, condition: string) => void;
  onUndoReturnEquipment?: (movementId: string) => void;
}

export const OperationDetailsDialog: React.FC<OperationDetailsDialogProps> = ({ 
  isOpen, 
  onClose, 
  operation,
  onReturnEquipment,
  onUndoReturnEquipment
}) => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const [returningMovId, setReturningMovId] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnCondition, setReturnCondition] = useState('جيد');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen || !operation) return null;

  return (
    <div className="eq-dialog-overlay" onClick={onClose}>
      <div className="eq-dialog-content form-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        
        <div className="eq-dialog-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', background: 'var(--card-bg)' }}>
          <div className="header-title">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '2px', color: 'var(--text-h)' }}>تفاصيل العملية</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>مرجع رقم #{operation.id}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="eq-dialog-body" style={{ padding: '16px', background: 'var(--card-bg)' }}>
          
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '16px', background: 'var(--accent, #3b82f6)', borderRadius: '4px' }}></span>
            العتاد المستلم
          </h3>

          <div className="epic-cards-container">
            {operation.movements && operation.movements.length > 0 ? (
              operation.movements.map((mov: any) => (
                <div key={mov.id} className={`epic-eq-card ${mov.return_date ? 'returned' : 'available'}`}>
                  
                  <div className="epic-eq-header">
                    <div className="epic-header-info" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <div className="epic-icon-box">
                        <Package size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="epic-title">{mov.equipment?.name || 'غير معروف'}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="epic-grid">
                    <div className="epic-stat-box">
                      <span className="epic-stat-label">الكمية</span>
                      <span className="epic-stat-value">{mov.quantity}</span>
                    </div>
                    
                    <div className="epic-stat-box">
                      <span className="epic-stat-label">حالة الاستلام</span>
                      <span className="epic-stat-value green">
                        {(mov.condition || mov.delivery_condition) || 'غير محدد'}
                      </span>
                    </div>

                    {mov.return_date ? (
                      <>
                        <div className="epic-stat-box">
                          <span className="epic-stat-label">تاريخ الإرجاع</span>
                          <span className="epic-stat-value">
                            {new Date(mov.return_date).toLocaleDateString('ar-EG', { numberingSystem: 'latn', day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="epic-stat-box">
                          <span className="epic-stat-label">حالة الإرجاع</span>
                          <span className="epic-stat-value red">
                            {mov.return_condition || 'مكتمل'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="epic-stat-box full-width">
                        <span className="epic-stat-label">حالة الإرجاع</span>
                        <span className="epic-stat-value yellow">لا توجد عملية إرجاع مسجلة</span>
                      </div>
                    )}
                  </div>

                  {!mov.return_date ? (
                    hasAccess(permissions.equipmentOperations.return) && (
                      <button 
                        className="epic-btn return"
                        onClick={() => {
                          setReturningMovId(mov.id);
                          setReturnDate(new Date().toISOString().split('T')[0]);
                          setReturnCondition('جيد');
                        }} 
                      >
                        <RefreshCw size={18} />
                        إرجاع العتاد
                      </button>
                    )
                  ) : (
                    hasAccess(permissions.equipmentOperations.edit) && (
                      <button 
                        className="epic-btn undo"
                        onClick={() => {
                          if (onUndoReturnEquipment && window.confirm('هل أنت متأكد من التراجع عن هذا الإرجاع؟')) {
                            onUndoReturnEquipment(mov.id);
                          }
                        }} 
                      >
                        التراجع عن الإرجاع
                        <RefreshCw size={18} />
                      </button>
                    )
                  )}
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-hover)', borderRadius: '16px', border: '2px dashed var(--border)' }}>
                لا يوجد عتاد مسجل في هذه العملية
              </div>
            )}
          </div>
        </div>
      </div>

      {returningMovId && (
        <div className="glass-dialog-overlay" onClick={() => setReturningMovId(null)}>
          <div className="glass-dialog-content" onClick={e => e.stopPropagation()}>
            <div className="glass-dialog-header">
              <div className="glass-dialog-title">
                <RefreshCw size={24} className="glass-dialog-icon" />
                تأكيد الإرجاع
              </div>
              <button className="eq-close-btn" onClick={() => setReturningMovId(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="glass-dialog-body">
              <div className="glass-input-group">
                <label>تاريخ الإرجاع</label>
                <input 
                  type="date" 
                  className="glass-input" 
                  value={returnDate} 
                  onChange={(e) => setReturnDate(e.target.value)} 
                />
              </div>

              <div className="glass-input-group" style={{ position: 'relative' }}>
                <label>حالة العتاد عند الإرجاع</label>
                <div 
                  className="glass-input" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{returnCondition}</span>
                  <ChevronDown size={18} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                
                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--card-bg, #ffffff)',
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {['ممتاز', 'جيد', 'مقبول', 'سيء', 'تالف'].map(cond => (
                      <div 
                        key={cond}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: returnCondition === cond ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                          color: returnCondition === cond ? '#f59e0b' : 'var(--text-h, #1e293b)',
                          fontWeight: returnCondition === cond ? '700' : '500',
                          borderBottom: cond !== 'تالف' ? '1px solid var(--border, #e2e8f0)' : 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => {
                          setReturnCondition(cond);
                          setIsDropdownOpen(false);
                        }}
                        onMouseEnter={(e) => {
                           if (returnCondition !== cond) e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8fafc)';
                        }}
                        onMouseLeave={(e) => {
                           if (returnCondition !== cond) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {cond}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-dialog-footer">
              <button type="button" className="glass-btn-secondary" onClick={() => setReturningMovId(null)}>
                إلغاء
              </button>
              <button type="button" className="glass-btn-primary" onClick={() => {
                onReturnEquipment(returningMovId, returnDate, returnCondition);
                setReturningMovId(null);
              }}>
                تأكيد الإرجاع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
