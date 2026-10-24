import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Settings2, ChevronRight, ChevronLeft, Flag, RotateCcw,
  CalendarDays, Trophy,
} from 'lucide-react';
import client from '../../../../core/api/client';
import { downloadEvaluationSheet, readEvaluationSheet, TOTAL_MAX, type EvaluationRow, type SheetPlayer } from './evaluationExcel';
import '../../Matches/ImportMatchesDialog.css';
import './BulkEvaluationDialog.css';

const pad = (n: number) => String(n).padStart(2, '0');

const PERIODS = [
  { value: 'مرحلة الذهاب', icon: Flag },
  { value: 'مرحلة الإياب', icon: RotateCcw },
  { value: 'شهري', icon: CalendarDays },
  { value: 'نهاية الموسم', icon: Trophy },
];
const MONTHS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** A season's twelve months, July to June: «2026-07» … «2027-06» */
const monthsOf = (season: string) => {
  const y = Number(season.slice(0, 4));
  return Array.from({ length: 12 }, (_, i) => {
    const m = (6 + i) % 12;
    const year = i < 6 ? y : y + 1;
    return { value: `${year}-${pad(m + 1)}`, label: MONTHS[m], year };
  });
};

/** This season: «2026-2027» from July on, else «2025-2026» */
const seasonNow = () => {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
};
const monthNow = () => `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}`;

/**
 * A group evaluation of the active players from Excel, like the matches' import: the season and the evaluation type
 * (and the month, for a monthly one), then the sheet of the active players to download, fill and upload; the
 * preview (each line's problems), then all the valid lines saved at once.
 */
export const BulkEvaluationDialog: React.FC<{ players: SheetPlayer[]; onClose: () => void; onDone: () => void }> = ({ players, onClose, onDone }) => {
  const [season, setSeason] = useState(seasonNow);
  const [period, setPeriod] = useState(PERIODS[0].value);
  const [month, setMonth] = useState(monthNow);
  const [rows, setRows] = useState<EvaluationRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'template' | 'read' | 'save' | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const monthly = period === 'شهري';
  // Another season: the same month in it (or its first)
  const moveSeason = (step: number) => {
    const y = Number(season.slice(0, 4)) + step;
    const next = `${y}-${y + 1}`;
    const months = monthsOf(next);
    setSeason(next);
    setMonth(months.find(m => m.value.slice(5) === month.slice(5))?.value || months[0].value);
    setSaved(null);
  };
  const heading = `${period}${monthly ? ` ${month}` : ''} ${season}`.trim();

  const template = async () => {
    setBusy('template'); setError('');
    try { await downloadEvaluationSheet(players, heading); } catch { setError('تعذر إنشاء النموذج'); } finally { setBusy(null); }
  };

  const read = async (file?: File) => {
    if (!file) return;
    setBusy('read'); setError(''); setRows(null); setSaved(null);
    setFileName(file.name);
    try {
      const list = await readEvaluationSheet(file, players);
      if (!list.length) setError('لا يوجد أي لاعب مُقيَّم في الملف');
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

  const save = async () => {
    if (!/^\d{4}-\d{4}$/.test(season)) return setError('اكتب الموسم بصيغة 2026-2027');
    // A monthly evaluation: its month (its first and last day); otherwise today
    const [y, m] = month.split('-').map(Number);
    const today = new Date();
    const periodStart = monthly ? `${y}-${pad(m)}-01` : `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const periodEnd = monthly ? `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}` : null;
    setBusy('save'); setError('');
    try {
      const res = await client.post('/player-evaluations/bulk', {
        season, evaluationType: period, periodStart, periodEnd,
        items: valid.map(r => ({
          playerId: Number(r.playerId), ...r.scores,
          strengths: r.strengths || null, weaknesses: r.weaknesses || null, recommendation: r.recommendation || null,
        })),
      });
      setSaved(res.data?.count ?? valid.length);
      onDone();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios errors are untyped
      const data = (e as any)?.response?.data;
      const first = data?.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null;
      setError(first || data?.message || 'تعذر حفظ التقييمات');
    } finally {
      setBusy(null);
    }
  };

  return createPortal(
    <div className="imx-overlay" onClick={busy === 'save' ? undefined : onClose}>
      <div className="imx-dialog" role="dialog" aria-modal="true" aria-label="تقييم جماعي من Excel" onClick={e => e.stopPropagation()}>
        <header className="imx-head">
          <span className="imx-head-icon"><FileSpreadsheet size={22} /></span>
          <div>
            <h3>تقييم جماعي من Excel</h3>
            <small>اللاعبون النشطون فقط · {players.length} لاعب</small>
          </div>
          <button type="button" className="imx-close" onClick={onClose} disabled={busy === 'save'} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="imx-body">
          {/* Step 1: what the evaluation is */}
          <section className="imx-step bev-settings">
            <span className="imx-num">1</span>
            <div className="imx-step-text">
              <strong><Settings2 size={15} /> التقييم</strong>
              <div className="bev-fields">
                {/* The season: one step back or forward */}
                <div className="bev-field">
                  <small>الموسم</small>
                  <div className="bev-season">
                    <button type="button" onClick={() => moveSeason(-1)} aria-label="الموسم السابق"><ChevronRight size={18} /></button>
                    <b dir="ltr">{season}</b>
                    <button type="button" onClick={() => moveSeason(1)} aria-label="الموسم التالي"><ChevronLeft size={18} /></button>
                  </div>
                </div>

                {/* The evaluation's type: four cards */}
                <div className="bev-field">
                  <small>نوع التقييم</small>
                  <div className="bev-types" role="radiogroup" aria-label="نوع التقييم">
                    {PERIODS.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        role="radio"
                        aria-checked={period === p.value}
                        className={period === p.value ? 'on' : ''}
                        onClick={() => { setPeriod(p.value); setSaved(null); }}
                      >
                        <span><p.icon size={17} /></span>{p.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* A monthly one: the season's months */}
                {monthly && (
                  <div className="bev-field">
                    <small>الشهر</small>
                    <div className="bev-months" role="radiogroup" aria-label="الشهر">
                      {monthsOf(season).map(m => (
                        <button
                          key={m.value}
                          type="button"
                          role="radio"
                          aria-checked={month === m.value}
                          className={month === m.value ? 'on' : ''}
                          onClick={() => { setMonth(m.value); setSaved(null); }}
                        >
                          {m.label}<em>{m.year}</em>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Step 2: the sheet */}
          <section className="imx-step">
            <span className="imx-num">2</span>
            <div className="imx-step-text">
              <strong>حمّل ورقة التقييم</strong>
              <small>سطر لكل لاعب نشط، والعلامات محدودة بأقصى كل معيار</small>
            </div>
            <button type="button" className="imx-btn" onClick={template} disabled={!players.length || busy !== null}>
              {busy === 'template' ? <Loader2 size={17} className="imx-spin" /> : <Download size={17} />} تحميل الورقة
            </button>
          </section>

          {/* Step 3: the filled sheet */}
          <section className="imx-step">
            <span className="imx-num">3</span>
            <div className="imx-step-text">
              <strong>ارفع الورقة المملوءة</strong>
              <small>{fileName || 'ملف ‎.xlsx‎ بنفس الورقة'}</small>
            </div>
            <button type="button" className="imx-btn primary" onClick={() => input.current?.click()} disabled={busy !== null}>
              {busy === 'read' ? <Loader2 size={17} className="imx-spin" /> : <Upload size={17} />} اختيار الملف
            </button>
            <input ref={input} type="file" accept=".xlsx" hidden onChange={e => read(e.target.files?.[0])} />
          </section>

          {!players.length && <p className="imx-error"><AlertTriangle size={16} /> لا يوجد لاعبون نشطون</p>}
          {error && <p className="imx-error"><AlertTriangle size={16} /> {error}</p>}

          {/* The preview */}
          {rows && rows.length > 0 && (
            <section className="imx-preview">
              <div className="imx-summary">
                <span className="ok"><CheckCircle2 size={15} /> {valid.length} صالحة</span>
                {invalid > 0 && <span className="bad"><AlertTriangle size={15} /> {invalid} فيها أخطاء (لن تُحفظ)</span>}
              </div>
              <div className="imx-table-wrap">
                <table className="imx-table">
                  <thead>
                    <tr><th>السطر</th><th>اللاعب</th><th>المجموع</th><th>التوصية</th><th>الحالة</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.line} className={r.errors.length ? 'bad' : ''}>
                        <td>{r.line}</td>
                        <td>{r.name}</td>
                        <td dir="ltr">{r.errors.length ? '—' : `${r.total} / ${TOTAL_MAX}`}</td>
                        <td>{r.recommendation || '—'}</td>
                        <td>
                          {r.errors.length ? <span className="imx-bad">{r.errors.join('، ')}</span>
                            : <span className="imx-ok"><CheckCircle2 size={14} /> {saved !== null ? 'حُفظ' : 'صالح'}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {(busy === 'save' || saved !== null) && (
            <p className={`imx-result ${saved !== null ? 'ok' : ''}`}>
              {busy === 'save' && <Loader2 size={16} className="imx-spin" />}
              {saved !== null ? `تم حفظ ${saved} تقييم (${heading})` : 'جاري الحفظ...'}
            </p>
          )}
        </div>

        <footer className="imx-foot">
          <button type="button" className="imx-btn ghost" onClick={onClose} disabled={busy === 'save'}>{saved !== null ? 'إغلاق' : 'إلغاء'}</button>
          {saved === null && (
            <button type="button" className="imx-btn primary" onClick={save} disabled={!valid.length || busy !== null}>
              <CheckCircle2 size={17} /> حفظ {valid.length || ''} تقييم
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
};
