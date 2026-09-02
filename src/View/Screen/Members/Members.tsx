import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMembersController } from './MembersController';
import { Eye, X, Search, Plus, UserPlus, FileSignature, CheckCircle2, Landmark, Wallet, Edit2, Trash2, Camera, RefreshCw, TrendingUp, ClipboardList, AlertTriangle, MapPin, FileWarning, Calendar, FileText, Mail, ArrowDownLeft, ArrowUpRight, Hash } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { EvaluationDialog } from './Evaluation/EvaluationDialog';
import { EvaluationHistoryDialog } from './Evaluation/EvaluationHistoryDialog';

import { useAuth } from '../../../core/context/AuthContext';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { MemberModel } from './member_model';
import './Members.css';
import '../Disciplinary/Disciplinary.css';
import heic2any from 'heic2any';

const processImage = async (file: File, maxSizeKB: number): Promise<File> => {
  let fileToProcess = file;

  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    try {
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Error converting HEIC image:', error);
      return file;
    }
  }

  return new Promise((resolve) => {
    if (fileToProcess.size <= maxSizeKB * 1024) {
      resolve(fileToProcess);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileToProcess);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const checkSize = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.2) {
                const newFile = new File([blob], fileToProcess.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                quality -= 0.1;
                checkSize();
              }
            } else {
              resolve(fileToProcess);
            }
          }, 'image/jpeg', quality);
        };
        checkSize();
      };
      img.onerror = () => {
        resolve(fileToProcess);
      };
    };
  });
};

export const Members: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useMembersController();
  const { 
    filteredMembers,
    searchQuery,
    setSearchQuery,
    filterTeamId,
    setFilterTeamId,
    teams,
    selectedMember, 
    isDialogOpen, 
    isAddMemberOpen,
    memberToEdit,
    formData,
    setFormData,
    photoFile,
    setPhotoFile,
    handleFormDataChange,
    handleSaveMember,
    openAddMemberDialog,
    openEditMemberDialog,
    closeAddMemberDialog,
    handleDeleteMember,
    openExpensesDialog, 
    closeDialog, 
    formatCurrency
  } = controller;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [evalMember, setEvalMember] = useState<MemberModel | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<{player: MemberModel, data: any} | null>(null);

  const [activeDialogTab, setActiveDialogTab] = useState<'financial' | 'equipment' | 'disciplinary' | 'correspondences'>('financial');

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="badge badge-green">{t('members.active', 'نشط')}</span>;
    if (status === 'suspended') return <span className="badge badge-red">{t('members.suspended', 'موقوف')}</span>;
    return <span className="badge badge-red">{t('members.inactive', 'غير نشط')}</span>;
  };

  const filterTeamOptions = [
    { value: '', label: t('members.all_teams', 'جميع الفئات (الفرق)') },
    ...teams.map(team => ({ value: team.id.toString(), label: team.name }))
  ];

  const typeOptions = [
    { value: 'player', label: 'لاعب' },
    { value: 'coach', label: 'مدرب' },
    { value: 'assistant_coach', label: 'مساعد مدرب' },
    { value: 'goalkeeper_coach', label: 'مدرب حراس' },
    { value: 'employee', label: 'موظف / إداري / طبيب' }
  ];

  const formTeamOptions = [
    { value: '', label: '-- بدون فريق --' },
    ...teams.map(team => ({ value: team.id.toString(), label: team.name }))
  ];

  const statusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
    { value: 'suspended', label: 'موقوف' }
  ];

  return (
    <div className="members-container">
      <div className="members-header">
        <h1 className="page-title">{t('members.title', 'قائمة الأعضاء')}</h1>
        
        <div className="members-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={t('members.search_placeholder', 'ابحث بالاسم أو المنصب...')} 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CustomDropdown<string>
            value={filterTeamId}
            options={filterTeamOptions}
            onChange={(val) => setFilterTeamId(val)}
            placeholder={t('members.all_teams', 'جميع الفئات (الفرق)')}
          />
          {hasAccess(permissions.members.add) && (
            <button className="btn-primary" onClick={openAddMemberDialog}>
              <Plus size={18} />
              {t('members.add_member', 'إضافة عضو')}
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="table-pagination-wrapper">
        <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
        <div className="members-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('members.photo', 'الصورة')}</th>
                <th>{t('members.name', 'الاسم واللقب')}</th>
                <th>{t('members.type', 'المنصب')}</th>
                <th>{t('members.jersey', 'رقم القميص')}</th>
                <th>{t('members.team', 'الفريق')}</th>
                <th>{t('members.status', 'الحالة')}</th>
                <th>{t('members.internal_system', 'النظام الداخلي')}</th>
                <th>{t('members.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map(member => (
                <tr key={member.id} className="member-row">
                  <td data-label={t('members.photo', 'الصورة')} className="avatar-cell">
                    {member.photo && member.photo !== '' && !member.photo.includes('default') ? (
                      <img src={member.photo} alt={member.first_name} className="member-avatar" />
                    ) : (
                      <div className="member-avatar placeholder">
                        {member.first_name?.charAt(0) || ''}{member.last_name?.charAt(0) || ''}
                      </div>
                    )}
                  </td>
                  <td data-label={t('members.name', 'الاسم واللقب')} className="member-name-cell">
                    {member.first_name} {member.last_name}
                  </td>
                  <td data-label={t('members.type', 'المنصب')}>
                    {member.type === 'player' ? 'لاعب' : member.type === 'coach' ? 'مدرب' : member.type === 'assistant_coach' ? 'مساعد مدرب' : member.type === 'goalkeeper_coach' ? 'مدرب حراس' : 'موظف/إداري'}
                  </td>
                  <td data-label={t('members.jersey', 'رقم القميص')} className="jersey-cell">
                    {member.Shirt_number ? <span className="jersey-number">{member.Shirt_number}</span> : '-'}
                  </td>
                  <td data-label={t('members.team', 'الفريق')}>{member.team_name || '-'}</td>
                  <td data-label={t('members.status', 'الحالة')}>{getStatusBadge(member.status)}</td>
                  <td data-label={t('members.internal_system', 'النظام الداخلي')}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {member.is_internal_system_printed ? (
                        <div 
                          title="تمت طباعة النظام الداخلي"
                          style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            backgroundColor: '#ecfdf5', color: '#10b981', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
                            border: '1px solid #a7f3d0'
                          }}>
                          <CheckCircle2 size={16} />
                        </div>
                      ) : (
                        <div 
                          title="لم تتم الطباعة"
                          style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            backgroundColor: '#f8fafc', color: '#cbd5e1', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px dashed #e2e8f0'
                          }}>
                          <X size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td data-label={t('members.actions', 'إجراءات')} className="actions-cell">
                    <div className="action-buttons-wrapper">
                      {member.type === 'player' && (
                        <>
                          <button className="btn-action" onClick={() => setEvalMember(member)} title="إضافة تقييم" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                            <TrendingUp size={18} />
                          </button>
                          <button className="btn-action" onClick={() => controller.openEvalHistory(member)} title="أرشيف التقييمات" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.2)' }}>
                            <ClipboardList size={18} />
                          </button>
                        </>
                      )}
                      
                      {hasAccess(permissions.members.viewFinancialRecord) && (
                        <button className="btn-action view-btn" onClick={() => openExpensesDialog(member)} title="كشف الحساب">
                          <Eye size={18} />
                        </button>
                      )}

                      {hasAccess(permissions.members.edit) && (
                        <button className="btn-action edit-btn" onClick={() => openEditMemberDialog(member)} title="تعديل">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {hasAccess(permissions.members.delete) && (
                        <button className="btn-action delete-btn" onClick={() => handleDeleteMember(member.id)} title="حذف">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '1.1rem' }}>
                    لا يوجد أعضاء مطابقين للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          totalItems={filteredMembers.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onItemsPerPageChange={setItemsPerPage} 
        />
      </div>

      {/* Add/Edit Member Modal */}
      {isAddMemberOpen && (
        <div className="dialog-overlay" onClick={closeAddMemberDialog}>
          <div className="dialog-content add-member-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <UserPlus size={24} />
                <h2>{memberToEdit ? 'تعديل عضو' : t('members.add_member_title', 'إضافة عضو جديد')}</h2>
              </div>
              <button className="close-btn" onClick={closeAddMemberDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <form id="memberForm" onSubmit={handleSaveMember} className="add-member-form">
                <div className="photo-upload-container">
                  <div className="photo-upload-card" onClick={() => document.getElementById('photo-upload-input')?.click()} title="اختيار صورة">
                    <input 
                      id="photo-upload-input"
                      type="file" 
                      accept="image/*,image/heic,image/heif,.heic,.heif,.HEIC,.HEIF" 
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          setIsProcessingImage(true);
                          try {
                            const processedFile = await processImage(file, 5000); // 5000 KB to be safely under 5120
                            setPhotoFile(processedFile);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsProcessingImage(false);
                          }
                        } else {
                          setPhotoFile(null);
                        }
                      }} 
                    />
                    {isProcessingImage ? (
                      <div className="photo-placeholder-ui">
                        <RefreshCw size={32} className="photo-placeholder-icon" style={{ animation: 'spin 1s linear infinite', color: '#f97316' }} />
                        <span style={{ color: '#f97316' }}>جاري المعالجة...</span>
                        <style>{`
                          @keyframes spin { 100% { transform: rotate(360deg); } }
                        `}</style>
                      </div>
                    ) : photoFile ? (
                      <img src={URL.createObjectURL(photoFile)} alt="Preview" className="photo-preview-image" />
                    ) : memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default') ? (
                      <img src={memberToEdit.photo} alt="Current" className="photo-preview-image" />
                    ) : (
                      <div className="photo-placeholder-ui">
                        <Camera size={32} className="photo-placeholder-icon" />
                        <span>الصورة</span>
                      </div>
                    )}
                  </div>
                  {(photoFile || (memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default'))) && (
                    <button type="button" className="btn-remove-photo" onClick={(e) => { e.stopPropagation(); setPhotoFile(null); if (memberToEdit) memberToEdit.photo = ''; }}>
                      <X size={14} /> إزالة
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('members.form_firstname', 'الاسم')} *</label>
                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleFormDataChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_lastname', 'اللقب')} *</label>
                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleFormDataChange} className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('members.form_id_number', 'رقم الهوية الوطنية')}</label>
                    <input type="text" name="national_id" value={formData.national_id} onChange={handleFormDataChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_phone', 'رقم الهاتف')}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleFormDataChange} className="form-control" dir="ltr" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('members.form_dob', 'تاريخ الميلاد')}</label>
                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleFormDataChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_pob', 'مكان الميلاد')}</label>
                    <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleFormDataChange} className="form-control" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group" style={{ zIndex: 3 }}>
                    <CustomDropdown<string>
                      label={t('members.form_type', 'المنصب / نوع العقد') + ' *'}
                      value={formData.type}
                      options={typeOptions}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, type: val }))}
                    />
                  </div>
                  <div className="form-group" style={{ zIndex: 3 }}>
                    <CustomDropdown<string>
                      label={t('members.form_team', 'الفريق')}
                      value={formData.team_id?.toString() || ''}
                      options={formTeamOptions}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, team_id: val }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ zIndex: 2 }}>
                    <CustomDropdown<string>
                      label={t('members.form_status', 'الحالة') + ' *'}
                      value={formData.status}
                      options={statusOptions}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, status: val }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_jersey', 'رقم القميص (اختياري للأنواع الأخرى)')}</label>
                    <input type="number" name="Shirt_number" value={formData.Shirt_number} onChange={handleFormDataChange} className="form-control" />
                  </div>
                </div>
              </form>
            </div>
            <div className="dialog-footer">
              <button className="btn-cancel" onClick={closeAddMemberDialog}>{t('members.cancel', 'إلغاء')}</button>
              <button type="submit" form="memberForm" className="btn-primary" disabled={controller.isLoading}>
                {controller.isLoading ? 'جاري الحفظ...' : (memberToEdit ? 'حفظ التعديلات' : t('members.save', 'حفظ العضو'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Record Dialog */}
      {isDialogOpen && selectedMember && (
        <div className="dialog-overlay printable-overlay" onClick={closeDialog}>
          <div className="dialog-content details-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header no-print">
              <div className="dialog-title">
                <ClipboardList size={24} />
                <h2>سجل متابعة اللاعب - {selectedMember.first_name} {selectedMember.last_name}</h2>
              </div>
              <button className="close-btn" onClick={closeDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-tabs no-print" style={{ display: 'flex', gap: '10px', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <button 
                className={`tab-btn ${activeDialogTab === 'financial' ? 'active' : ''}`}
                onClick={() => setActiveDialogTab('financial')}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeDialogTab === 'financial' ? 'var(--primary-color)' : 'var(--bg-body)', color: activeDialogTab === 'financial' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                كشف الحساب
              </button>
              <button 
                className={`tab-btn ${activeDialogTab === 'equipment' ? 'active' : ''}`}
                onClick={() => setActiveDialogTab('equipment')}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeDialogTab === 'equipment' ? 'var(--primary-color)' : 'var(--bg-body)', color: activeDialogTab === 'equipment' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                سجل المعدات
              </button>
              <button 
                className={`tab-btn ${activeDialogTab === 'disciplinary' ? 'active' : ''}`}
                onClick={() => setActiveDialogTab('disciplinary')}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeDialogTab === 'disciplinary' ? 'var(--primary-color)' : 'var(--bg-body)', color: activeDialogTab === 'disciplinary' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                الإجراءات التأديبية
              </button>
              <button 
                className={`tab-btn ${activeDialogTab === 'correspondences' ? 'active' : ''}`}
                onClick={() => setActiveDialogTab('correspondences')}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeDialogTab === 'correspondences' ? 'var(--primary-color)' : 'var(--bg-body)', color: activeDialogTab === 'correspondences' ? 'white' : 'var(--text-color)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                المراسلات
              </button>
            </div>

            <div className="dialog-body printable-area">
              {activeDialogTab === 'financial' && (
                <>
                  <div className="print-header only-print">
                    <h2>نادي أولمبيك - كشف حساب</h2>
                    <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                    <p>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-DZ').format(new Date())}</p>
                  </div>

              {/* Financial Summary Card */}
              <div className="financial-summary-card">
                <div className="card-header">
                  <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                  <span className="card-badge">{selectedMember.type === 'player' ? 'لاعب' : selectedMember.type === 'coach' ? 'مدرب' : selectedMember.type === 'assistant_coach' ? 'مساعد مدرب' : selectedMember.type === 'goalkeeper_coach' ? 'مدرب حراس' : 'عضو فريق'}</span>
                </div>
                
                {/* Contracts Loop */}
                {controller.getContractsForMember(selectedMember.id).map((contract, index) => {
                  const contractVal = Number(contract.contractValue) || Number(contract.Contract_value) || 0;
                  const contractPaid = controller.getPaidForContract(selectedMember.id, contract);
                  const contractRemaining = contractVal - contractPaid;
                  
                  return (
                    <div key={contract.id || index} style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-body)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--text-h)', fontSize: '1.1rem' }}>
                        عقد موسم: {contract.startDate || contract.start_date || 'غير محدد'}
                      </h4>
                      <div className="card-grid">
                        <div className="card-item contract">
                          <div className="card-icon"><FileSignature size={24} /></div>
                          <div className="card-content">
                            <span className="label">{t('members.contract', 'قيمة العقد:')}</span>
                            <span className="value">{formatCurrency(contractVal)}</span>
                          </div>
                        </div>
                        <div className="card-item paid">
                          <div className="card-icon"><CheckCircle2 size={24} /></div>
                          <div className="card-content">
                            <span className="label text-success">{t('members.paid', 'المدفوع من العقد:')}</span>
                            <span className="value text-success">{formatCurrency(contractPaid)}</span>
                          </div>
                        </div>
                        <div className="card-item highlight-item">
                          <div className="card-icon"><Wallet size={24} /></div>
                          <div className="card-content">
                            <span className="label">{t('members.remaining', 'المتبقي من العقد:')}</span>
                            <span className="value">{formatCurrency(contractRemaining)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Global Advances and Global Remaining (after advances) */}
                <div className="card-grid" style={{ marginTop: '20px' }}>
                  <div className="card-item advances">
                    <div className="card-icon"><Landmark size={24} /></div>
                    <div className="card-content">
                      <span className="label text-danger">{t('members.advances', 'إجمالي السلف:')}</span>
                      <span className="value text-danger">{formatCurrency(controller.getAdvances(selectedMember.id))}</span>
                    </div>
                  </div>
                  <div className="card-item" style={{ background: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                    <div className="card-icon" style={{ color: '#F97316' }}><Wallet size={24} /></div>
                    <div className="card-content">
                      <span className="label" style={{ color: '#F97316' }}>الرصيد النهائي المتبقي:</span>
                      <span className="value" style={{ color: '#F97316' }}>{formatCurrency(controller.getRemainingAmount(selectedMember.id))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Table */}
              <h3 className="timeline-title" style={{ marginTop: '32px', marginBottom: '16px' }}>{t('members.operations_timeline', 'سجل العمليات والمدفوعات')}</h3>
              <div className="table-responsive">
                <table className="custom-table premium-ops-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('members.op_date', 'التاريخ')}</th>
                      <th>{t('members.op_nature', 'النوع')}</th>
                      <th>{t('members.op_method', 'طريقة الدفع')}</th>
                      <th>{t('members.op_amount', 'المبلغ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controller.getMemberPayments(selectedMember.id).map((p: any) => (
                      <tr key={p.id}>
                        <td>{new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(p.paymentDate || p.created_at || new Date()))}</td>
                        <td>
                          <span className={`badge ${(p.amountNature === 'استقطاع' || p.amountNature === 'خصم') ? 'badge-red' : p.amountNature === 'سلفة' ? 'badge-blue' : 'badge-green'}`}>
                            {p.amountNature || 'دفع'}
                          </span>
                        </td>
                        <td>{p.paymentMethod}</td>
                        <td className={`amount-cell ${(p.amountNature === 'استقطاع' || p.amountNature === 'خصم') ? 'text-danger' : 'text-success'}`}>
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                    {controller.getMemberPayments(selectedMember.id).length === 0 && (
                      <tr>
                        <td colSpan={4} className="no-data" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          {t('members.no_expenses', 'لا توجد عمليات مسجلة حالياً')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </>
              )}
              {activeDialogTab === 'equipment' && (
                <>
                  <div className="print-header only-print">
                    <h2>نادي أولمبيك - سجل المعدات</h2>
                    <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                    <p>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-DZ').format(new Date())}</p>
                  </div>
                  <div className="financial-summary-card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                      <h3>حركة المعدات الخاصة باللاعب</h3>
                    </div>
                    <div className="users-table-container">
                      <table className="custom-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>العتاد</th>
                            <th>النوع</th>
                            <th>الكمية</th>
                            <th>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Mock Data for now */}
                          <tr>
                            <td data-label="العتاد">طقم رياضي</td>
                            <td data-label="النوع"><span className="op-type-badge badge-handover" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem' }}>تسليم</span></td>
                            <td data-label="الكمية"><span className="qty-badge-table" style={{ background: 'var(--bg-body)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>1</span></td>
                            <td data-label="التاريخ">2026-08-25</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {activeDialogTab === 'disciplinary' && (
                <>
                  <div className="print-header only-print">
                    <h2>نادي أولمبيك - السجل التأديبي</h2>
                    <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                    <p>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-DZ').format(new Date())}</p>
                  </div>
                  <div className="disciplinary-grid" style={{ marginTop: '20px' }}>
                    <div className="disciplinary-premium-card">
                      <div className="card-header-premium">
                        <div className="action-type-pill تنبيه">
                          <AlertTriangle size={16} />
                          <span>تنبيه</span>
                        </div>
                        <span className="card-subtitle-premium">#102938</span>
                      </div>
                      
                      <div className="card-body-premium">
                        <div className="info-row-premium">
                          <Calendar size={16} />
                          <span><strong>تاريخ الحدث:</strong> 2026-08-20</span>
                        </div>
                        <div className="info-row-premium" style={{ alignItems: 'flex-start' }}>
                          <FileText size={16} />
                          <span><strong>السبب:</strong> تأخر متكرر عن التدريبات بدون عذر مسبق.</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="disciplinary-premium-card">
                      <div className="card-header-premium">
                        <div className="action-type-pill إنذار">
                          <FileWarning size={16} />
                          <span>إنذار</span>
                        </div>
                        <span className="card-subtitle-premium">#394857</span>
                      </div>
                      
                      <div className="card-body-premium">
                        <div className="info-row-premium">
                          <Calendar size={16} />
                          <span><strong>تاريخ الحدث:</strong> 2026-08-10</span>
                        </div>
                        <div className="info-row-premium" style={{ alignItems: 'flex-start' }}>
                          <FileText size={16} />
                          <span><strong>السبب:</strong> سلوك غير رياضي تجاه أحد أعضاء الفريق الخصم أثناء مباراة ودية.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeDialogTab === 'correspondences' && (
                <>
                  <div className="print-header only-print">
                    <h2>نادي أولمبيك - سجل المراسلات</h2>
                    <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                    <p>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-DZ').format(new Date())}</p>
                  </div>
                  <div className="disciplinary-grid" style={{ marginTop: '20px' }}>
                    {/* Correspondence Card 1 - Outgoing */}
                    <div className="disciplinary-premium-card">
                      <div className="card-header-premium">
                        <div className="action-type-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          <ArrowUpRight size={16} />
                          <span>صادر</span>
                        </div>
                        <span className="card-subtitle-premium" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Hash size={14} />
                          م/2026/045
                        </span>
                      </div>
                      
                      <div className="card-body-premium">
                        <div className="info-row-premium">
                          <Calendar size={16} />
                          <span><strong>التاريخ:</strong> 2026-08-25</span>
                        </div>
                        <div className="info-row-premium" style={{ alignItems: 'flex-start' }}>
                          <Mail size={16} />
                          <span><strong>الموضوع:</strong> طلب إعارة لاعب إلى نادي شبيبة الساورة للموسم 2026/2027</span>
                        </div>
                        <div className="info-row-premium">
                          <MapPin size={16} />
                          <span><strong>الجهة:</strong> الرابطة الوطنية لكرة القدم</span>
                        </div>
                      </div>
                    </div>

                    {/* Correspondence Card 2 - Incoming */}
                    <div className="disciplinary-premium-card">
                      <div className="card-header-premium">
                        <div className="action-type-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          <ArrowDownLeft size={16} />
                          <span>وارد</span>
                        </div>
                        <span className="card-subtitle-premium" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Hash size={14} />
                          م/2026/032
                        </span>
                      </div>
                      
                      <div className="card-body-premium">
                        <div className="info-row-premium">
                          <Calendar size={16} />
                          <span><strong>التاريخ:</strong> 2026-08-15</span>
                        </div>
                        <div className="info-row-premium" style={{ alignItems: 'flex-start' }}>
                          <Mail size={16} />
                          <span><strong>الموضوع:</strong> استدعاء للمشاركة في تربص المنتخب الوطني للشباب</span>
                        </div>
                        <div className="info-row-premium">
                          <MapPin size={16} />
                          <span><strong>الجهة:</strong> الاتحادية الجزائرية لكرة القدم</span>
                        </div>
                      </div>
                    </div>

                    {/* Correspondence Card 3 - Outgoing */}
                    <div className="disciplinary-premium-card">
                      <div className="card-header-premium">
                        <div className="action-type-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          <ArrowUpRight size={16} />
                          <span>صادر</span>
                        </div>
                        <span className="card-subtitle-premium" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Hash size={14} />
                          م/2026/018
                        </span>
                      </div>
                      
                      <div className="card-body-premium">
                        <div className="info-row-premium">
                          <Calendar size={16} />
                          <span><strong>التاريخ:</strong> 2026-07-20</span>
                        </div>
                        <div className="info-row-premium" style={{ alignItems: 'flex-start' }}>
                          <Mail size={16} />
                          <span><strong>الموضوع:</strong> إخطار اللاعب بتجديد عقده لموسمين إضافيين</span>
                        </div>
                        <div className="info-row-premium">
                          <MapPin size={16} />
                          <span><strong>الجهة:</strong> داخلي - إدارة النادي</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="dialog-footer no-print">
              <button className="btn-cancel" onClick={closeDialog}>{t('members.close', 'إغلاق')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Dialog */}
      {(evalMember || editingEvaluation) && (
        <EvaluationDialog 
          player={evalMember || editingEvaluation?.player} 
          initialData={editingEvaluation?.data}
          onClose={() => {
            setEvalMember(null);
            setEditingEvaluation(null);
          }}
          onSave={(data) => {
            const date = new Date().toISOString().split('T')[0];
            if (editingEvaluation) {
              controller.updateEvaluation({
                id: editingEvaluation.data.id,
                member_id: Number(editingEvaluation.player.id),
                evalDate: editingEvaluation.data.evalDate,
                season: data.season,
                period: data.period,
                totalScore: data.totalScore,
                recommendation: data.recommendation,
                strengths: data.strengths,
                weaknesses: data.weaknesses,
                scores: data.scores
              });
              setEditingEvaluation(null);
            } else if (evalMember) {
              controller.saveEvaluation({
                member_id: Number(evalMember.id),
                season: data.season,
                period: data.period,
                evalDate: date,
                totalScore: data.totalScore,
                recommendation: data.recommendation,
                strengths: data.strengths,
                weaknesses: data.weaknesses,
                scores: data.scores
              });
              setEvalMember(null);
            }
          }}
        />
      )}
      
      {/* Evaluation History Dialog */}
      {controller.evalHistoryMember && (
        <EvaluationHistoryDialog 
          player={controller.evalHistoryMember}
          evaluations={controller.evaluations}
          onClose={controller.closeEvalHistory}
          onAddTest={() => controller.addTestEvaluation(Number(controller.evalHistoryMember!.id))}
          onEdit={(ev) => setEditingEvaluation({ player: controller.evalHistoryMember!, data: ev })}
          onDelete={(id) => controller.deleteEvaluation(id)}
        />
      )}

    </div>
  );
};
