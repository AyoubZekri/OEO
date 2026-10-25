import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Applink } from '../../../LinkApi';
import { downloadTemplate, payloadOf, readMatchesFile, type ExcelLists, type ImportRow } from './matchExcel';
import './ImportMatchesDialog.css';

const STAFF_ROLES = ['مدرب', 'مساعد مدرب', 'مدرب حراس', 'موظف', 'إداري', 'طبيب'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lists come untyped from the API
const listOf = (res: any): any[] => (Array.isArray(res?.data) ? res.data : res?.data?.data || []);

/**
 * Many matches at once from Excel: download the template (its dropdowns hold the app's categories and coaches),
 * fill it, upload it, check the preview (each line's problems), then add the valid lines.
 */
export const ImportMatchesDialog: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const [lists, setLists] = useState<ExcelLists | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'template' | 'read' | 'import' | null>(null);
  const [progress, setProgress] = useState({ done: 0, failed: 0 });
  // The server's reason for each line it refused
  const [refused, setRefused] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const get = (url: string) => axios.get(url, { headers }).catch(() => null);
    Promise.all([get(Applink.teams), get(Applink.individuals), get(Applink.users)]).then(([teamsRes, indRes, usersRes]) => {
      const people = listOf(indRes);
      const staff = people.filter(p => p.role?.name && STAFF_ROLES.includes(String(p.role.name).trim()));
      setLists({
        teams: listOf(teamsRes).map(t => ({ id: String(t.id), name: String(t.name || '').trim() })).filter(t => t.name),
        coaches: (staff.length ? staff : people.filter(p => p.type !== 'player'))
          .map(p => ({ id: String(p.id), name: `${p.first_name || ''} ${p.last_name || ''}`.trim() }))
          .filter(c => c.name),
        admins: listOf(usersRes).map(u => ({ id: String(u.id), name: String(u.name || '').trim() })).filter(u => u.name),
      });
    });
  }, []);

  const template = async () => {
    if (!lists) return;
    setBusy('template');
    try { await downloadTemplate(lists); } catch { setError('تعذر إنشاء النموذج'); } finally { setBusy(null); }
  };

  const read = async (file?: File) => {
    if (!file || !lists) return;
    setBusy('read'); setError(''); setRows(null); setFinished(false); setProgress({ done: 0, failed: 0 }); setRefused({});
    setFileName(file.name);
    try {
      const list = await readMatchesFile(file, lists);
      if (!list.length) setError('الملف لا يحتوي على أي مباراة');
      setRows(list);
    } catch (e) {
      setError((e as Error).message || 'تعذر قراءة الملف');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  };

  const valid = (rows || []).filter(r => !r.errors.length);
  const invalid = (rows || []).length - valid.length;

  const importAll = async () => {
    setBusy('import');
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    let done = 0; let failed = 0;
    const reasons: Record<number, string> = {};
    for (const r of valid) {
      try {
        const res = await axios.post(Applink.createMatch, payloadOf(r), { headers });
        if (res.data?.status === 'success') done += 1;
        else { failed += 1; reasons[r.line] = res.data?.message || 'رفضها الخادم'; }
      } catch (e) {
        failed += 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios errors are untyped
        const data = (e as any)?.response?.data;
        const first = data?.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
        reasons[r.line] = first || data?.message || data?.error || 'تعذر الاتصال بالخادم';
      }
      setProgress({ done, failed });
      setRefused({ ...reasons });
    }
    setBusy(null);
    setFinished(true);
    if (done) onDone();
  };

  return createPortal(
    <div className="imx-overlay" onClick={busy === 'import' ? undefined : onClose}>
      <div className="imx-dialog" role="dialog" aria-modal="true" aria-label="استيراد المباريات من Excel" onClick={e => e.stopPropagation()}>
        <header className="imx-head">
          <span className="imx-head-icon"><FileSpreadsheet size={22} /></span>
          <div>
            <h3>استيراد المباريات من Excel</h3>
          </div>
          <button type="button" className="imx-close" onClick={onClose} disabled={busy === 'import'} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="imx-body">
          {/* Step 1: the template */}
          <section className="imx-step">
            <span className="imx-num">1</span>
            <div className="imx-step-text">
              <strong>حمّل النموذج</strong>
            </div>
            <button type="button" className="imx-btn" onClick={template} disabled={!lists || busy !== null}>
              {busy === 'template' ? <Loader2 size={17} className="imx-spin" /> : <Download size={17} />} تحميل النموذج
            </button>
          </section>

          {/* Step 2: the filled file */}
          <section className="imx-step">
            <span className="imx-num">2</span>
            <div className="imx-step-text">
              <strong>ارفع الملف المملوء</strong>
              {fileName && <small>{fileName}</small>}
            </div>
            <button type="button" className="imx-btn primary" onClick={() => input.current?.click()} disabled={!lists || busy !== null}>
              {busy === 'read' ? <Loader2 size={17} className="imx-spin" /> : <Upload size={17} />} اختيار الملف
            </button>
            <input ref={input} type="file" accept=".xlsx" hidden onChange={e => read(e.target.files?.[0])} />
          </section>

          {error && <p className="imx-error"><AlertTriangle size={16} /> {error}</p>}

          {/* Step 3: the preview */}
          {rows && rows.length > 0 && (
            <section className="imx-preview">
              <div className="imx-summary">
                <span className="ok"><CheckCircle2 size={15} /> {valid.length} صالحة</span>
                {invalid > 0 && <span className="bad"><AlertTriangle size={15} /> {invalid} فيها أخطاء (لن تُضاف)</span>}
              </div>
              <div className="imx-table-wrap">
                <table className="imx-table">
                  <thead>
                    <tr><th>السطر</th><th>المنافسة</th><th>الخصم</th><th>التاريخ والساعة</th><th>المكان</th><th>الفئة</th><th>الحالة</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.line} className={r.errors.length ? 'bad' : ''}>
                        <td data-label="السطر">{r.line}</td>
                        <td data-label="المنافسة">{r.competition || '—'}</td>
                        <td data-label="الخصم">{r.opponent || '—'}</td>
                        <td data-label="التاريخ والساعة"><span dir="ltr">{r.date ? `${r.date.split('-').reverse().join('/')} ${r.time}` : '—'}</span></td>
                        <td data-label="المكان">{r.location || '—'}</td>
                        <td data-label="الفئة">{r.team || '—'}</td>
                        <td data-label="الحالة">
                          {r.errors.length ? <span className="imx-bad">{r.errors.join('، ')}</span>
                            : refused[r.line] ? <span className="imx-bad">رفضها الخادم: {refused[r.line]}</span>
                              : <span className="imx-ok"><CheckCircle2 size={14} /> {finished ? 'أُضيفت' : 'صالحة'}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {(busy === 'import' || finished) && (
            <p className={`imx-result ${finished && !progress.failed ? 'ok' : ''}`}>
              {busy === 'import' && <Loader2 size={16} className="imx-spin" />}
              {finished ? `تمت إضافة ${progress.done} مباراة${progress.failed ? ` — تعذرت ${progress.failed}` : ''}` : `جاري الإضافة... ${progress.done + progress.failed} / ${valid.length}`}
            </p>
          )}
        </div>

        <footer className="imx-foot">
          <button type="button" className="imx-btn ghost" onClick={onClose} disabled={busy === 'import'}>{finished ? 'إغلاق' : 'إلغاء'}</button>
          {!finished && (
            <button type="button" className="imx-btn primary" onClick={importAll} disabled={!valid.length || busy !== null}>
              <CheckCircle2 size={17} /> إضافة {valid.length || ''} مباراة
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
};
