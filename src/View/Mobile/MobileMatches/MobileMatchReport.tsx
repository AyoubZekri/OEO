import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FileText, MapPin, Users, Package, Home, ShieldAlert, AlertCircle, FileWarning, Gavel, ClipboardList, CheckCircle2,
  XCircle, Pencil, Calendar, Bus, Save, Loader2,
} from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import { Applink } from '../../../LinkApi';
import type { Match } from '../../Screen/Matches/match_model';
import { authHeaders, errorMessage } from './matchApi';
import { MatchStrip } from './MatchStrip';
import '../MobileEvaluations/MobileEvaluations.css';

/* eslint-disable @typescript-eslint/no-explicit-any -- the report comes untyped from the API */

type IconType = React.ComponentType<{ size?: number }>;

const Note: React.FC<{ icon: IconType; title: string; value?: string; tone?: string }> = ({ icon: Icon, title, value, tone = '' }) => (
  <div className={`mp-note ${tone}`}>
    <span className="mp-note-title"><Icon size={15} /> {title}</span>
    {value && value.trim()
      ? <p>{value}</p>
      : <p className="empty">لا توجد ملاحظات</p>}
  </div>
);

// ── Read-only administrative report (phone version of ViewAdministrativeReportDialog) ──
export const MobileMatchReport: React.FC<{ match: Match; onEdit: () => void; onClose: () => void }> = ({ match, onEdit, onClose }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    axios.get(Applink.getAdministrativeReport(match.id), { headers: authHeaders() })
      .then(res => {
        if (!active) return;
        if (res.data?.status === 'success' && res.data.data) setReport(res.data.data);
        else setError('لا يوجد تقرير إداري لهذه المباراة بعد.');
      })
      .catch(err => {
        if (active) setError(err.response?.status === 404 ? 'لا يوجد تقرير إداري لهذه المباراة بعد.' : 'حدث خطأ أثناء جلب التقرير. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  const yesNo = (value: any) => (value === true || value === 1
    ? <em className="ok"><CheckCircle2 size={14} /> نعم</em>
    : <em className="bad"><XCircle size={14} /> لا</em>);

  return (
    <MobileScreen
      title="تقرير المباراة"
      layer={2}
      onBack={onClose}
      footer={!loading && (
        <button type="button" className="me-btn primary" onClick={onEdit}>
          <Pencil size={18} /> {report ? 'تعديل التقرير' : 'إضافة التقرير'}
        </button>
      )}
    >
      <MatchStrip match={match} label="التقرير الإداري" icon={FileText}>
        {report && (
          <span className="mp-sub"><Calendar size={13} /> {new Date(report.report_date || report.created_at).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        )}
      </MatchStrip>

      {loading ? (
        <MobileLoader text="جاري تحميل التقرير..." />
      ) : !report ? (
        <div className="mp-empty">
          <FileText size={40} />
          <strong>{error}</strong>
          <p>يمكنك إضافة التقرير الإداري بالزر أدناه.</p>
        </div>
      ) : (
        <>
          <section className="mp-section">
            <h3 className="mp-section-title orange"><span><MapPin size={16} /></span> التقييم اللوجستي</h3>
            <div className="mp-tiles">
              <div><small><Bus size={13} /> التنقل حسب البرنامج</small>{yesNo(report.travel_as_planned)}</div>
              <div>
                <small><Users size={13} /> حالة الحضور</small>
                <em className={report.attendance_status === 'ناقص' ? 'warn' : 'ok'}>{report.attendance_status || 'غير محدد'}</em>
              </div>
              <div className="wide">
                <small><Package size={13} /> حالة المعدات</small>
                <em className={report.equipment_status === 'كاملة' ? 'ok' : 'warn'}>{report.equipment_status || 'غير محدد'}</em>
                {report.equipment_notes && <p className="mp-tile-note">{report.equipment_notes}</p>}
              </div>
            </div>
            <Note icon={Home} title="الإقامة والإعاشة" value={report.accommodation_catering_notes} />
          </section>

          <section className="mp-section">
            <h3 className="mp-section-title amber"><span><ShieldAlert size={16} /></span> الحوادث والملاحظات</h3>
            <Note icon={AlertCircle} title="الحوادث التنظيمية" value={report.organizational_incidents} tone="amber" />
            <Note icon={FileWarning} title="الحوادث الانضباطية" value={report.disciplinary_incidents} tone="red" />
            <Note icon={Gavel} title="ملاحظات التحكيم (إدارياً)" value={report.refereeing_notes} />
          </section>

          <section className="mp-section">
            <h3 className="mp-section-title green"><span><ClipboardList size={16} /></span> التوصيات والإجراءات المطلوبة</h3>
            <Note icon={ClipboardList} title="الإجراءات" value={report.required_actions} tone="green" />
          </section>
        </>
      )}
    </MobileScreen>
  );
};

// ── Administrative report form (phone version of AdministrativeReportDialog) ──
const EMPTY_REPORT = {
  travel_as_planned: true,
  attendance_status: 'كامل',
  equipment_status: 'كاملة',
  equipment_notes: '',
  accommodation_catering_notes: '',
  organizational_incidents: '',
  disciplinary_incidents: '',
  refereeing_notes: '',
  required_actions: '',
};

export const MobileMatchReportForm: React.FC<{ match: Match; onClose: () => void }> = ({ match, onClose }) => {
  const [form, setForm] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get(Applink.getAdministrativeReport(match.id), { headers: authHeaders() })
      .then(res => {
        const r = res.data?.status === 'success' ? res.data.data : null;
        if (active && r) {
          setForm({
            travel_as_planned: r.travel_as_planned !== 0 && r.travel_as_planned !== false,
            attendance_status: r.attendance_status || 'كامل',
            equipment_status: r.equipment_status || 'كاملة',
            equipment_notes: r.equipment_notes || '',
            accommodation_catering_notes: r.accommodation_catering_notes || '',
            organizational_incidents: r.organizational_incidents || '',
            disciplinary_incidents: r.disciplinary_incidents || '',
            refereeing_notes: r.refereeing_notes || '',
            required_actions: r.required_actions || '',
          });
        }
      })
      .catch(err => console.error('Error fetching report', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  const set = <K extends keyof typeof EMPTY_REPORT>(field: K, value: (typeof EMPTY_REPORT)[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await axios.post(Applink.saveAdministrativeReport, { ...form, match_id: match.id }, { headers: authHeaders() });
      if (res.data.status === 'success') {
        alert('تم حفظ التقرير الإداري بنجاح!');
        onClose();
      }
    } catch (error) {
      alert(`حدث خطأ أثناء حفظ التقرير\n${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const choice = (field: 'attendance_status' | 'equipment_status', options: [string, string][]) => (
    <div className="mp-seg">
      {options.map(([value, tone]) => (
        <button key={value} type="button" className={`${tone} ${form[field] === value ? 'active' : ''}`} onClick={() => set(field, value)}>
          {value}
        </button>
      ))}
    </div>
  );

  const area = (field: keyof typeof EMPTY_REPORT, placeholder: string) => (
    <textarea
      className="me-textarea"
      rows={3}
      value={form[field] as string}
      onChange={e => set(field, e.target.value as never)}
      placeholder={placeholder}
    />
  );

  return (
    <MobileScreen
      title="التقرير الإداري"
      layer={3}
      onBack={onClose}
      footer={(
        <button type="button" className="me-btn primary" onClick={save} disabled={saving || loading}>
          {saving ? <Loader2 size={18} className="mp-spin" /> : <Save size={18} />}
          {saving ? 'جاري الحفظ...' : 'حفظ التقرير'}
        </button>
      )}
    >
      <MatchStrip match={match} label="التقرير الإداري" icon={FileText} />

      {loading ? <MobileLoader text="جاري تحميل التقرير..." /> : (
        <>
          <section className="mp-section">
            <h3 className="mp-section-title orange"><span><MapPin size={16} /></span> التقييم اللوجستي</h3>
            <div className="me-field">
              <span className="me-label"><Bus size={14} /> هل تم التنقل حسب البرنامج؟</span>
              <div className="mp-seg">
                <button type="button" className={`ok ${form.travel_as_planned ? 'active' : ''}`} onClick={() => set('travel_as_planned', true)}>نعم</button>
                <button type="button" className={`bad ${!form.travel_as_planned ? 'active' : ''}`} onClick={() => set('travel_as_planned', false)}>لا</button>
              </div>
            </div>
            <div className="me-field">
              <span className="me-label"><Users size={14} /> حالة الحضور</span>
              {choice('attendance_status', [['كامل', 'ok'], ['ناقص', 'warn']])}
            </div>
            <div className="me-field">
              <span className="me-label"><Package size={14} /> حالة المعدات والعتاد</span>
              {choice('equipment_status', [['كاملة', 'ok'], ['بها نقص', 'warn']])}
            </div>
            {form.equipment_status === 'بها نقص' && (
              <input className="me-input" type="text" value={form.equipment_notes} onChange={e => set('equipment_notes', e.target.value)} placeholder="ما هو النقص في المعدات؟" />
            )}
            <label className="me-field">
              <span className="me-label"><Home size={14} /> ملاحظات الإقامة والإعاشة</span>
              {area('accommodation_catering_notes', 'الفندق، جودة الوجبات، الاستقبال...')}
            </label>
          </section>

          <section className="mp-section">
            <h3 className="mp-section-title amber"><span><ShieldAlert size={16} /></span> الحوادث والملاحظات</h3>
            <label className="me-field">
              <span className="me-label"><AlertCircle size={14} /> الحوادث التنظيمية (أمن، تنظيم، جماهير)</span>
              {area('organizational_incidents', 'أي خلل تنظيمي قبل أو أثناء أو بعد المباراة...')}
            </label>
            <label className="me-field">
              <span className="me-label"><FileWarning size={14} /> الحوادث الانضباطية</span>
              {area('disciplinary_incidents', 'بطاقات حمراء، تصرفات غير رياضية، غيابات...')}
            </label>
            <label className="me-field">
              <span className="me-label"><Gavel size={14} /> ملاحظات التحكيم (إدارياً)</span>
              {area('refereeing_notes', 'تأخر الحكام، قرارات أثرت على التنظيم...')}
            </label>
          </section>

          <section className="mp-section">
            <h3 className="mp-section-title green"><span><ClipboardList size={16} /></span> التوصيات والإجراءات</h3>
            {area('required_actions', 'مثال: خصم من راتب لاعب، شكوى للرابطة...')}
          </section>
        </>
      )}
    </MobileScreen>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */
