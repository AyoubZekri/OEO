import React, { useState } from 'react';
import { 
  X, CheckCircle, User, Stethoscope, Banknote, PenTool, LogOut, Trash2, 
  ShieldCheck, Trophy, Package, AlertTriangle, Printer, Lock, ChevronLeft, Save, Calendar
} from 'lucide-react';
import type { PlayerClearance } from './member_model';
import { useClearance, CLEARANCE_REASON_OPTIONS as REASON_OPTIONS } from './useClearance';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

interface ClearanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
  onUpdate?: () => void;
}

const STAGES = [
  { id: 'general', label: 'البيانات الأساسية', icon: <LogOut size={20} /> },
  { id: 'admin', label: 'الشؤون الإدارية', icon: <ShieldCheck size={20} /> },
  { id: 'sporting', label: 'الإدارة الرياضية', icon: <Trophy size={20} /> },
  { id: 'medical', label: 'القسم الطبي', icon: <Stethoscope size={20} /> },
  { id: 'financial', label: 'الإدارة المالية', icon: <Banknote size={20} /> },
  { id: 'equipment', label: 'مخزن العتاد', icon: <Package size={20} /> },
  { id: 'player', label: 'إقرار اللاعب', icon: <PenTool size={20} /> },
];

const modalStyles = `
  .cl-overlay {
    backdrop-filter: blur(4px);
    background: rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.2s ease;
  }
  .cl-modal {
    background: var(--bg);
    border: 1px solid var(--border);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    color: var(--text-h);
    animation: slideUp 0.3s ease;
  }
  .cl-sidebar {
    background: var(--card-bg);
    border-left: 1px solid var(--border);
  }
  .cl-content {
    background: var(--bg);
  }
  .stage-btn {
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-h);
  }
  .stage-btn:hover:not(:disabled):not(.active) {
    background: var(--border);
  }
  .stage-btn.active {
    background: #f97316;
    color: white;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
  }
  .stage-btn.completed {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  .stage-btn.warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }
  .stage-btn.danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger, #ef4444);
  }
  .cl-input {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-h);
    padding: 12px 16px;
    border-radius: 8px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  .cl-input:focus {
    border-color: #f97316;
  }
  .cl-btn-primary {
    background: #f97316;
    border: none;
    color: white;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }
  .cl-btn-primary:hover:not(:disabled) {
    background: #ea580c;
  }
  .cl-btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .cl-btn-secondary {
    background: var(--card-bg);
    border: 1px solid var(--border);
    color: var(--text-h);
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }
  .cl-btn-secondary:hover {
    background: var(--border);
  }
  .cl-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const ClearanceDialog: React.FC<ClearanceDialogProps> = ({ isOpen, onClose, player, onUpdate }) => {
  // The dialog is mounted on each open, so it always starts on the first tab
  const [activeTab, setActiveTab] = useState('general');
  const {
    formData, setFormData, isSaving, equipmentData, loansData, remainingPayments,
    checkIsComplete, hasCard, completedCount, progressPercent, handleSign, handleDelete, getSigneeName,
  } = useClearance(player, isOpen, { onUpdate, onClose, onGeneralSaved: () => setActiveTab('admin') });

  if (!isOpen) return null;

  return (
    <div className="cl-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)' }}>
      <style>{modalStyles}</style>
      
      <div className="cl-modal" onClick={(e) => e.stopPropagation()} style={{ width: '90vw', maxWidth: '1000px', height: '85vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-p)' }}>
              <User size={24} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>بطاقة الإخلاء والمغادرة</h2>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-p)', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 'bold' }}>{player?.first_name} {player?.last_name}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-p)' }}>نسبة الاكتمال</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>{progressPercent}% ({completedCount} من {STAGES.length})</span>
            </div>
            
            <button onClick={() => window.print()} className="cl-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} /> طباعة
            </button>
            <button onClick={onClose} className="cl-btn-secondary" style={{ padding: '10px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Sidebar */}
          <div className="cl-sidebar" style={{ width: '280px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            
            {STAGES.map((stage) => {
              const isActive = activeTab === stage.id;
              const isComplete = checkIsComplete(stage.id);
              const isLocked = !hasCard && stage.id !== 'general';
              
              let statusClass = '';
              let statusIcon = null;
              
              if (isActive) statusClass = 'active';
              else if (isComplete) {
                statusClass = 'completed';
                statusIcon = <CheckCircle size={16} />;
              } else if (stage.id === 'financial' && (loansData.length > 0 || remainingPayments.length > 0)) {
                statusClass = 'warning';
                statusIcon = <AlertTriangle size={16} />;
              } else if (stage.id === 'equipment' && equipmentData.length > 0) {
                statusClass = 'danger';
                statusIcon = <AlertTriangle size={16} />;
              } else if (isLocked) {
                statusIcon = <Lock size={16} />;
              }

              return (
                <button
                  key={stage.id}
                  onClick={() => !isLocked && setActiveTab(stage.id)}
                  disabled={isLocked}
                  className={`stage-btn ${statusClass}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', cursor: isLocked ? 'not-allowed' : 'pointer', width: '100%', textAlign: 'right',
                    opacity: isLocked ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {stage.icon}
                    <span style={{ fontWeight: isActive ? 700 : 600, fontSize: '0.95rem' }}>{stage.label}</span>
                  </div>
                  {statusIcon}
                </button>
              );
            })}
            
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button onClick={handleDelete} disabled={isSaving || !hasCard} className="cl-btn-secondary" style={{ width: '100%', color: 'var(--danger, #ef4444)', borderColor: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Trash2 size={18} /> إلغاء الإخلاء وحذف البطاقة
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="cl-content" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            
            {activeTab === 'general' && (
              <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>البيانات الأساسية</h3>
                  <p style={{ margin: 0, color: 'var(--text-p)' }}>معلومات فك الارتباط والمغادرة.</p>
                </div>

                <div className="cl-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <CustomInput 
                    label="تاريخ المغادرة *" 
                    type="date" 
                    value={formData.exit_date || ''} 
                    onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })} 
                  />
                  
                  <CustomDropdown
                    label="السبب *"
                    value={formData.exit_reason || ''}
                    onChange={(val) => setFormData({ ...formData, exit_reason: val })}
                    options={REASON_OPTIONS}
                    placeholder="اختر السبب..."
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <label style={{ fontWeight: 600, color: 'var(--text-h, #1f2937)' }}>ملاحظات</label>
                    <textarea className="cl-input" rows={4} value={formData.general_notes || ''} onChange={(e) => setFormData({ ...formData, general_notes: e.target.value })} placeholder="أضف أية ملاحظات..."></textarea>
                  </div>
                </div>

                <button 
                  onClick={() => handleSign('general')}
                  disabled={isSaving}
                  className="cl-btn-primary"
                  style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Save size={20} /> {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            )}
            
            {['admin', 'sporting', 'medical', 'financial', 'equipment', 'player'].includes(activeTab) && (
              <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{STAGES.find(s => s.id === activeTab)?.label}</h3>
                  <p style={{ margin: 0, color: 'var(--text-p)' }}>مراجعة وتوقيع قسم {STAGES.find(s => s.id === activeTab)?.label}.</p>
                </div>

                {activeTab === 'financial' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="cl-card" style={{ padding: '16px', background: loansData.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderColor: loansData.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.8rem', color: loansData.length > 0 ? 'var(--danger, #ef4444)' : '#10b981' }}>{loansData.length}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-p)' }}>سلف غير مسددة</span>
                      </div>
                      <div className="cl-card" style={{ padding: '16px', background: remainingPayments.length > 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderColor: remainingPayments.length > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.8rem', color: remainingPayments.length > 0 ? '#f59e0b' : '#10b981' }}>{remainingPayments.length}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-p)' }}>دفعات متبقية</span>
                      </div>
                    </div>
                    {(loansData.length > 0 || remainingPayments.length > 0) && (
                      <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--danger, #ef4444)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <AlertTriangle size={20} /> 
                        تنبيه: يجب على المسؤول المالي تسوية المستحقات والسلف قبل توقيع إخلاء الطرف المالي.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'equipment' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(() => {
                      // Extract all movements from all operations
                      const allMovements = equipmentData.flatMap(op => op.movements || []);
                      const returnedMovements = allMovements.filter(mov => !!mov.return_date);
                      const unreturnedMovements = allMovements.filter(mov => !mov.return_date);

                      return (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div className="cl-card" style={{ padding: '12px', textAlign: 'center', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent, #3b82f6)' }}>{allMovements.length}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-p)' }}>إجمالي المستلم</div>
                            </div>
                            <div className="cl-card" style={{ padding: '12px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#10b981' }}>{returnedMovements.length}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-p)' }}>تم إرجاعه</div>
                            </div>
                            <div className="cl-card" style={{ padding: '12px', textAlign: 'center', background: unreturnedMovements.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderColor: unreturnedMovements.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: unreturnedMovements.length > 0 ? 'var(--danger, #ef4444)' : '#10b981' }}>{unreturnedMovements.length}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-p)' }}>لم يُعد</div>
                            </div>
                          </div>

                          {unreturnedMovements.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger, #ef4444)', fontWeight: 700, fontSize: '0.95rem' }}>
                                <AlertTriangle size={20} />
                                اللاعب يمتلك {unreturnedMovements.length} عنصر لم يرجعه بعد!
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {unreturnedMovements.map((mov: any, i: number) => (
                                  <div key={i} className="cl-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--text-h)' }}>
                                        {mov.equipment?.name || mov.equipment_name || mov.name || `عتاد #${i + 1}`}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        الكمية: {mov.quantity || 1}
                                      </span>
                                    </div>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger, #ef4444)', fontWeight: 700, fontSize: '0.8rem' }}>لم يُعد</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', justifyContent: 'center' }}>
                              <CheckCircle size={24} />
                              <span style={{ fontWeight: 700, fontSize: '1rem' }}>اللاعب أرجع جميع العتاد</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="cl-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                  {checkIsComplete(activeTab) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <CheckCircle size={48} color="#10b981" />
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '1.2rem' }}>تم التوقيع بنجاح</h4>
                        <p style={{ margin: 0, color: 'var(--text-p)' }}>بواسطة: {getSigneeName(
                          formData[(
                            activeTab === 'admin' ? 'admin_id' :
                            activeTab === 'sporting' ? 'sporting_director_id' :
                            activeTab === 'financial' ? 'finance_manager_id' :
                            activeTab === 'equipment' ? 'equipment_manager_id' :
                            activeTab === 'medical' ? 'medical_staff_id' : ''
                          ) as keyof PlayerClearance]?.toString()
                        ) || 'المسؤول'}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <PenTool size={48} color="var(--text-p)" />
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>بانتظار التوقيع</h4>
                        <p style={{ margin: 0, color: 'var(--text-p)' }}>يرجى مراجعة حالة اللاعب قبل التوقيع.</p>
                      </div>

                      <button 
                        onClick={() => handleSign(activeTab)}
                        disabled={isSaving}
                        className="cl-btn-primary"
                        style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}
                      >
                        <PenTool size={20} /> {isSaving ? 'جاري التوقيع...' : 'توقيع القسم'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
