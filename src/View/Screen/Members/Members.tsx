import React, { useState } from 'react';
import { Applink } from '../../../LinkApi';
import { useTranslation } from 'react-i18next';
import { useMembersController } from './MembersController';
import { Eye, X, Search, Plus, UserPlus, CheckCircle2, Edit2, Trash2, Camera, RefreshCw, TrendingUp, ClipboardList, LogOut, UploadCloud } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { EvaluationDialog } from './Evaluation/EvaluationDialog';
import { EvaluationHistoryDialog } from './Evaluation/EvaluationHistoryDialog';
import { ClearanceDialog } from './ClearanceDialog';
import { MobileMembers } from '../../Mobile/MobileMembers/MobileMembers';
import { ActionsMenu } from '../../widget/ActionsMenu';
import { MobileMemberForm } from '../../Mobile/MobileMembers/MobileMemberForm';
import { MobileEvaluationForm } from '../../Mobile/MobileMembers/MobileEvaluationForm';
import { MobileEvaluationHistory } from '../../Mobile/MobileEvaluations/MobileEvaluationHistory';
import { MobileClearance } from '../../Mobile/MobileMembers/MobileClearance';
import { MobileTrackingRecord } from '../../Mobile/MobileMembers/MobileTrackingRecord';
import { TrackingRecordDialog } from './TrackingRecordDialog';
import { useIsMobile } from '../../../core/functions/useIsMobile';

import { useAuth } from '../../../core/context/AuthContext';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { MemberModel } from './member_model';
import './Members.css';
import '../Disciplinary/Disciplinary.css';
import { processImage } from '../../../core/functions/processImage';

export const Members: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useMembersController();
  const isMobile = useIsMobile();
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
    nationalIdFile,
    setNationalIdFile,
    medicalFile,
    setMedicalFile,
    insuranceFile,
    setInsuranceFile,
    handleFormDataChange,
    handleSaveMember,
    openAddMemberDialog,
    openEditMemberDialog,
    closeAddMemberDialog,
    handleDeleteMember,
    openExpensesDialog, 
    closeDialog, 
    isClearanceDialogOpen,
    selectedClearanceMember,
    openClearanceDialog,
    closeClearanceDialog,
  } = controller;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [evalMember, setEvalMember] = useState<MemberModel | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<{player: MemberModel, data: any} | null>(null);


  const closeEvaluationForm = () => {
    setEvalMember(null);
    setEditingEvaluation(null);
  };

  // Shared by the desktop dialog and the phone form
  const saveEvaluationForm = (data: any) => {
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
  };

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
    { value: 'physical_trainer', label: 'محضر بدني' },
    { value: 'employee', label: 'موظف' },
    { value: 'admin', label: 'إداري' },
    { value: 'doctor', label: 'طبيب' }
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
      {/* Phone layout */}
      <div className="members-mobile">
        <MobileMembers
          controller={controller}
          canAdd={hasAccess(permissions.members.add)}
          canEdit={hasAccess(permissions.members.edit)}
          canDelete={hasAccess(permissions.members.delete)}
          canViewRecord={hasAccess(permissions.members.viewFinancialRecord)}
          onAddEvaluation={setEvalMember}
        />
      </div>

      {/* Desktop layout (unchanged) */}
      <div className="members-desktop">
      <div className="members-header">

        
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
              {controller.isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div className="loading-container">
                      <div className="premium-loader">
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-dot"></div>
                      </div>
                      <p className="loading-text">جاري تحميل الأعضاء...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedMembers.map(member => (
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
                    {member.type === 'player' ? 'لاعب' : member.type === 'coach' ? 'مدرب' : member.type === 'assistant_coach' ? 'مساعد مدرب' : member.type === 'goalkeeper_coach' ? 'مدرب حراس' : member.type === 'physical_trainer' ? 'محضر بدني' : member.type === 'admin' ? 'إداري' : member.type === 'doctor' ? 'طبيب' : member.type === 'employee' ? 'موظف' : member.type}
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
                    <ActionsMenu
                      label="إجراءات العضو"
                      items={[
                        ...(member.type === 'player' ? [
                          ...(hasAccess(permissions.members.evaluate) ? [{ key: 'eval', label: 'إضافة تقييم', icon: TrendingUp, color: '#8b5cf6', onClick: () => setEvalMember(member) }] : []),
                          { key: 'evals', label: 'عرض التقييمات', icon: ClipboardList, color: '#0ea5e9', onClick: () => controller.openEvalHistory(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.viewFinancialRecord) ? [
                          { key: 'record', label: 'سجل المتابعة', icon: Eye, color: '#10b981', onClick: () => openExpensesDialog(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.edit) ? [
                          { key: 'edit', label: 'تعديل', icon: Edit2, color: '#3b82f6', onClick: () => openEditMemberDialog(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.clearance) ? [
                          { key: 'clearance', label: 'الإخلاء والمغادرة', icon: LogOut, color: '#f59e0b', onClick: () => openClearanceDialog(member) },
                        ] : []),
                        ...(hasAccess(permissions.members.delete) ? [
                          { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => handleDeleteMember(member.id) },
                        ] : []),
                      ]}
                    />
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
      </div>

      {/* Add/Edit Member: full-screen form on phones */}
      {isAddMemberOpen && isMobile && <MobileMemberForm controller={controller} />}

      {/* Add/Edit Member Modal */}
      {isAddMemberOpen && !isMobile && (
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
                
                {/* Basic Info Section */}
                <div className="form-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                  <div className="photo-upload-container" style={{ margin: 0, flexShrink: 0 }}>
                    <div className={`photo-upload-card ${photoFile || (memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default')) ? 'has-image' : ''}`} onClick={() => document.getElementById('photo-upload-input')?.click()} title="اختيار صورة">
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
                          <RefreshCw size={32} className="photo-placeholder-icon" style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
                          <span style={{ color: '#3b82f6' }}>جاري المعالجة...</span>
                          <style>{`
                            @keyframes spin { 100% { transform: rotate(360deg); } }
                          `}</style>
                        </div>
                      ) : photoFile ? (
                        <>
                          <img src={URL.createObjectURL(photoFile)} alt="Preview" className="photo-preview-image" />
                          <Camera size={32} className="hover-edit-icon" />
                        </>
                      ) : memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default') ? (
                        <>
                          <img src={memberToEdit.photo} alt="Current" className="photo-preview-image" />
                          <Camera size={32} className="hover-edit-icon" />
                        </>
                      ) : (
                        <div className="photo-placeholder-ui">
                          <Camera size={36} className="photo-placeholder-icon" />
                          <span>رفع صورة</span>
                        </div>
                      )}
                    </div>
                    {(photoFile || (memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default'))) && (
                      <button type="button" className="btn-remove-photo" onClick={(e) => { e.stopPropagation(); setPhotoFile(null); if (memberToEdit) memberToEdit.photo = ''; }}>
                        <X size={14} /> إزالة
                      </button>
                    )}
                  </div>

                  <div className="form-grid" style={{ width: '100%' }}>
                    <div className="form-group">
                      <label>{t('members.form_firstname', 'الاسم')} <span className="text-red-500">*</span></label>
                      <input type="text" name="first_name" required value={formData.first_name} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>{t('members.form_lastname', 'اللقب')} <span className="text-red-500">*</span></label>
                      <input type="text" name="last_name" required value={formData.last_name} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>{t('members.form_id_number', 'رقم الهوية الوطنية')}</label>
                      <input type="text" name="national_id" value={formData.national_id} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>{t('members.form_phone', 'رقم الهاتف')}</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleFormDataChange} className="form-control" dir="ltr" />
                    </div>
                  </div>
                </div>

                {/* Professional Info Section */}
                <div className="form-section">
                  <h3 className="form-section-title">المعلومات الرياضية والمهنية</h3>
                  <div className="form-grid">
                    <div className="form-group" style={{ zIndex: 4 }}>
                      <CustomDropdown<string>
                        label={t('members.form_type', 'المنصب / نوع العقد') + ' *'}
                        value={formData.type}
                        options={typeOptions}
                        onChange={(val) => setFormData((prev: any) => ({ ...prev, type: val }))}
                      />
                    </div>
                    <div className="form-group" style={{ zIndex: 4 }}>
                      <CustomDropdown<string>
                        label="المركز"
                        value={formData.position || ''}
                        options={[
                          { value: '', label: '-- بدون مركز --' },
                          { value: 'GK', label: 'GK — حارس مرمى' },
                          { value: 'CB', label: 'CB — قلب دفاع' },
                          { value: 'SW', label: 'SW — ليبرو (قشاش)' },
                          { value: 'RB', label: 'RB — ظهير أيمن' },
                          { value: 'LB', label: 'LB — ظهير أيسر' },
                          { value: 'RWB', label: 'RWB — ظهير جناح أيمن' },
                          { value: 'LWB', label: 'LWB — ظهير جناح أيسر' },
                          { value: 'CDM', label: 'CDM — وسط دفاعي (ارتكاز)' },
                          { value: 'CM', label: 'CM — وسط محوري' },
                          { value: 'CAM', label: 'CAM — صانع ألعاب (وسط هجومي)' },
                          { value: 'RM', label: 'RM — وسط أيمن' },
                          { value: 'LM', label: 'LM — وسط أيسر' },
                          { value: 'RW', label: 'RW — جناح أيمن' },
                          { value: 'LW', label: 'LW — جناح أيسر' },
                          { value: 'SS', label: 'SS — مهاجم ثانٍ' },
                          { value: 'CF', label: 'CF — قلب هجوم' },
                          { value: 'ST', label: 'ST — رأس حربة' }
                        ]}
                        onChange={(val) => setFormData((prev: any) => ({ ...prev, position: val }))}
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
                    <div className="form-group">
                      <label>{t('members.form_jersey', 'رقم القميص (اختياري)')}</label>
                      <input type="number" name="Shirt_number" value={formData.Shirt_number || ''} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group" style={{ zIndex: 2 }}>
                      <CustomDropdown<string>
                        label="القدم المفضلة"
                        value={formData.preferred_foot || ''}
                        options={[
                          { value: '', label: '-- اختر القدم المفضلة --' },
                          { value: 'يمين', label: 'يمين' },
                          { value: 'يسار', label: 'يسار' },
                          { value: 'كلتاهما', label: 'كلتاهما' }
                        ]}
                        onChange={(val) => setFormData((prev: any) => ({ ...prev, preferred_foot: val }))}
                      />
                    </div>
                    <div className="form-group" style={{ zIndex: 1 }}>
                      <CustomDropdown<string>
                        label={t('members.form_status', 'الحالة') + ' *'}
                        value={formData.status}
                        options={statusOptions}
                        onChange={(val) => setFormData((prev: any) => ({ ...prev, status: val }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Personal & Emergency Info Section */}
                <div className="form-section">
                  <h3 className="form-section-title">معلومات شخصية وطوارئ</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{t('members.form_dob', 'تاريخ الميلاد')}</label>
                      <input type="date" name="birth_date" value={formData.birth_date} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>{t('members.form_pob', 'مكان الميلاد')}</label>
                      <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>البريد الإلكتروني</label>
                      <input type="email" name="email" value={formData.email || ''} onChange={handleFormDataChange} className="form-control" dir="ltr" />
                    </div>
                    <div className="form-group">
                      <label>شخص للاتصال عند الضرورة</label>
                      <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name || ''} onChange={handleFormDataChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>هاتف حالة الطوارئ</label>
                      <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone || ''} onChange={handleFormDataChange} className="form-control" dir="ltr" />
                    </div>
                    <div className="form-group">
                      <label>رقم الحساب الجاري (CCP)</label>
                      <input type="text" name="bank_account_number" value={formData.bank_account_number || ''} onChange={handleFormDataChange} className="form-control" dir="ltr" />
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="form-section">
                  <h3 className="form-section-title">المستندات والوثائق</h3>
                  <div className="form-grid">
                    {/* National ID */}
                    <div className="form-group">
                      <label>البطاقة الوطنية (PDF/صورة)</label>
                      <div className="modern-upload-box">
                        <UploadCloud size={32} className="upload-icon" />
                        <span>{nationalIdFile ? nationalIdFile.name : 'اسحب أو اضغط لرفع الملف'}</span>
                        <input type="file" onChange={(e) => setNationalIdFile(e.target.files ? e.target.files[0] : null)} accept="image/*,.pdf" />
                      </div>
                      {memberToEdit && memberToEdit.national_id_document && !nationalIdFile && (
                        <div className="uploaded-file-card">
                          <div className="uploaded-file-info">
                            <CheckCircle2 size={18} />
                            <span>ملف مرفق مسبقاً</span>
                          </div>
                          <div className="uploaded-file-actions">
                            <a href={`${Applink.image}/${memberToEdit.national_id_document}`} target="_blank" rel="noreferrer" className="action-icon-btn" title="عرض">
                              <Eye size={16} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Medical Certificate */}
                    <div className="form-group">
                      <label>الشهادة الطبية (PDF/صورة)</label>
                      <div className="modern-upload-box">
                        <UploadCloud size={32} className="upload-icon" />
                        <span>{medicalFile ? medicalFile.name : 'اسحب أو اضغط لرفع الملف'}</span>
                        <input type="file" onChange={(e) => setMedicalFile(e.target.files ? e.target.files[0] : null)} accept="image/*,.pdf" />
                      </div>
                      {memberToEdit && memberToEdit.medical_certificate && !medicalFile && (
                        <div className="uploaded-file-card">
                          <div className="uploaded-file-info">
                            <CheckCircle2 size={18} />
                            <span>ملف مرفق مسبقاً</span>
                          </div>
                          <div className="uploaded-file-actions">
                            <a href={`${Applink.image}/${memberToEdit.medical_certificate}`} target="_blank" rel="noreferrer" className="action-icon-btn" title="عرض">
                              <Eye size={16} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Insurance Certificate */}
                    <div className="form-group">
                      <label>شهادة التأمين (PDF/صورة)</label>
                      <div className="modern-upload-box">
                        <UploadCloud size={32} className="upload-icon" />
                        <span>{insuranceFile ? insuranceFile.name : 'اسحب أو اضغط لرفع الملف'}</span>
                        <input type="file" onChange={(e) => setInsuranceFile(e.target.files ? e.target.files[0] : null)} accept="image/*,.pdf" />
                      </div>
                      {memberToEdit && memberToEdit.insurance_document && !insuranceFile && (
                        <div className="uploaded-file-card">
                          <div className="uploaded-file-info">
                            <CheckCircle2 size={18} />
                            <span>ملف مرفق مسبقاً</span>
                          </div>
                          <div className="uploaded-file-actions">
                            <a href={`${Applink.image}/${memberToEdit.insurance_document}`} target="_blank" rel="noreferrer" className="action-icon-btn" title="عرض">
                              <Eye size={16} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
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

      {/* Tracking Record: full-screen page on phones */}
      {isDialogOpen && selectedMember && isMobile && (
        <MobileTrackingRecord member={selectedMember} controller={controller} onClose={closeDialog} />
      )}

      {/* Tracking Record Dialog */}
      {isDialogOpen && selectedMember && !isMobile && (
        <TrackingRecordDialog member={selectedMember} controller={controller} onClose={closeDialog} />
      )}

      {/* Evaluation Dialog */}
      {(evalMember || editingEvaluation) && (isMobile ? (
        // Full-screen form on phones
        <MobileEvaluationForm
          player={(evalMember || editingEvaluation?.player)!}
          initialData={editingEvaluation?.data}
          onClose={closeEvaluationForm}
          onSave={saveEvaluationForm}
        />
      ) : (
        <EvaluationDialog
          player={evalMember || editingEvaluation?.player}
          initialData={editingEvaluation?.data}
          onClose={closeEvaluationForm}
          onSave={saveEvaluationForm}
        />
      ))}

      {/* Evaluation History Dialog */}
      {controller.evalHistoryMember && (isMobile ? (
        // Full-screen archive on phones
        <MobileEvaluationHistory
          player={controller.evalHistoryMember}
          evaluations={controller.evaluations}
          onClose={controller.closeEvalHistory}
          onEdit={(ev) => setEditingEvaluation({ player: controller.evalHistoryMember!, data: ev })}
          onDelete={(id) => controller.deleteEvaluation(id)}
        />
      ) : (
        <EvaluationHistoryDialog 
          player={controller.evalHistoryMember}
          evaluations={controller.evaluations}
          onClose={controller.closeEvalHistory}
          onEdit={(ev) => setEditingEvaluation({ player: controller.evalHistoryMember!, data: ev })}
          onDelete={(id) => controller.deleteEvaluation(id)}
        />
      ))}

      {isClearanceDialogOpen && selectedClearanceMember && (isMobile ? (
        // Full-screen clearance card on phones
        <MobileClearance
          player={selectedClearanceMember}
          onClose={closeClearanceDialog}
          onUpdate={controller.fetchMembers}
        />
      ) : (
        <ClearanceDialog
          isOpen={isClearanceDialogOpen}
          onClose={closeClearanceDialog}
          player={selectedClearanceMember}
          onUpdate={controller.fetchMembers}
        />
      ))}

    </div>
  );
};
