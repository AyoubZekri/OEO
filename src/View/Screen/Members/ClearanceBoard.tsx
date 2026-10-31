import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, Banknote, CalendarDays, CheckCircle2, CircleAlert, Loader2, Lock, LogOut, Package,
  PenLine, Printer, ShieldCheck, Stethoscope, Trash2, Trophy, Undo2, UserCheck, X,
} from 'lucide-react';
import defaultAvatar from '../../../assets/AVETER.png';
import type { PermissionModule } from '../UserManagement/Roles/role_model';
import type { MemberModel } from './member_model';
import { PrintSheet } from '../../widget/PrintSheet';
import { PrintableClearance } from './PrintableClearance';
import { DEPARTMENTS, DEPARTURE_REASONS, dayText, isSigned, money, type DepartmentId } from './clearance';
import type { ClearanceController } from './useClearance';
import { DeleteConfirm } from '../../shared/DeleteConfirm';
import './Clearance.css';

const ICONS: Record<DepartmentId, React.ComponentType<{ size?: number }>> = {
  admin: ShieldCheck,
  sporting: Trophy,
  medical: Stethoscope,
  financial: Banknote,
  equipment: Package,
};

type Confirm =
  | { kind: 'sign'; department: DepartmentId }
  | { kind: 'unsign'; department: DepartmentId }
  | { kind: 'close' }
  | { kind: 'delete' };

/** A small confirmation window, above the card (desktop dialog or phone screen): its title, no explanation under it */
const ConfirmBox: React.FC<{
  title: string;
  tone?: 'danger' | 'success' | 'amber';
  confirmLabel: string;
  busy: boolean;
  note?: { value: string; onChange: (v: string) => void; required: boolean; placeholder: string };
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, tone = 'success', confirmLabel, busy, note, onConfirm, onCancel }) => createPortal(
  <div className="clr-confirm-overlay" onClick={onCancel}>
    <div className={`clr-confirm tone-${tone}`} role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <span className="clr-confirm-icon">{tone === 'danger' ? <Trash2 size={24} /> : tone === 'amber' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}</span>
      <h3>{title}</h3>
      {note && (
        <textarea
          className="clr-input"
          rows={3}
          value={note.value}
          onChange={e => note.onChange(e.target.value)}
          placeholder={note.placeholder}
          autoFocus
        />
      )}
      <div className="clr-confirm-actions">
        <button type="button" className="clr-btn ghost" onClick={onCancel} disabled={busy}>إلغاء</button>
        <button
          type="button"
          className={`clr-btn ${tone === 'danger' ? 'danger' : 'primary'}`}
          onClick={onConfirm}
          disabled={busy || Boolean(note?.required && !note.value.trim())}
        >
          {busy && <Loader2 size={16} className="clr-spin" />} {confirmLabel}
        </button>
      </div>
    </div>
  </div>,
  document.body,
);

/**
 * The clearance card's content, the same on desktop (in a dialog) and on the phone (in a screen): the member and where
 * the file stands, the departments, the player's acknowledgement — nothing said twice, no counters.
 */
export const ClearanceBoard: React.FC<{
  player: MemberModel;
  cl: ClearanceController;
  can: (module: PermissionModule, action?: string) => boolean;
  variant?: 'desktop' | 'mobile';
}> = ({ player, cl, can, variant = 'desktop' }) => {
  const { card, checks, signers } = cl;
  const manages = can('members', 'clearance');
  const closed = Boolean(card?.player_signature);
  const signedCount = DEPARTMENTS.filter(d => isSigned(card, d.id)).length;
  const allSigned = signedCount === DEPARTMENTS.length;

  const [editing, setEditing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ exit_date: today, exit_reason: '', general_notes: '' });
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [note, setNote] = useState('');
  // Each print mounts a new sheet (the browser's print sheet opens at once)
  const [printing, setPrinting] = useState(0);

  const name = `${player.first_name} ${player.last_name}`.trim();
  const photo = player.photo && !player.photo.includes('ui-avatars.com') ? player.photo : defaultAvatar;

  const openForm = () => {
    setForm({
      exit_date: typeof card?.exit_date === 'string' ? card.exit_date.slice(0, 10) : today,
      exit_reason: card?.exit_reason || '',
      general_notes: card?.general_notes || '',
    });
    setEditing(true);
  };

  const saveForm = async () => {
    if (await cl.start(form)) setEditing(false);
  };

  const askSign = (department: DepartmentId) => {
    setNote('');
    setConfirm({ kind: 'sign', department });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const ok = confirm.kind === 'sign' ? await cl.sign(confirm.department, note)
      : confirm.kind === 'unsign' ? await cl.unsign(confirm.department)
        : confirm.kind === 'close' ? await cl.close()
          : await cl.remove();
    if (ok) setConfirm(null);
  };

  const showForm = !closed && (editing || !card);
  const statusText = !card ? 'لم تبدأ إجراءات المغادرة' : closed ? 'الملف مغلق' : 'في طور المغادرة';

  if (cl.loading) {
    return <div className="clr-loading"><Loader2 size={28} className="clr-spin" /> جارٍ تحميل البطاقة...</div>;
  }

  const confirmDept = confirm && (confirm.kind === 'sign' || confirm.kind === 'unsign') ? DEPARTMENTS.find(d => d.id === confirm.department)! : null;
  const confirmPending = confirm?.kind === 'sign' ? checks[confirm.department] : [];

  return (
    <div className={`clr ${variant}`}>
      {/* The member and where the file stands */}
      <section className="clr-head">
        <div className="clr-head-top">
          <img src={photo} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
          <div className="clr-head-text">
            <strong>{name}</strong>
            <span className={`clr-status ${!card ? 'none' : closed ? 'closed' : 'open'}`}><i /> {statusText}</span>
            {card && (
              <small>
                <CalendarDays size={13} /> المغادرة: {dayText(card.exit_date) || '—'}{card.exit_reason ? ` · ${card.exit_reason}` : ''}
              </small>
            )}
        </div>
        </div>
      </section>

      {cl.error && (
        <p className="clr-error" role="alert"><CircleAlert size={16} /> {cl.error}<button type="button" onClick={() => cl.setError('')} aria-label="إخفاء"><X size={14} /></button></p>
      )}

      {/* Step 1: the departure */}
      {showForm ? (
        manages ? (
          <section className="clr-panel clr-start">
            <h3><LogOut size={18} /> {card ? 'تعديل بيانات المغادرة' : 'بدء إجراءات المغادرة'}</h3>
            <div className="clr-start-grid">
              <label className="clr-field">
                <span>تاريخ المغادرة</span>
                <input className="clr-input" type="date" dir="ltr" value={form.exit_date}
                  onChange={e => setForm(f => ({ ...f, exit_date: e.target.value }))} />
              </label>
              <div className="clr-field">
                <span>سبب المغادرة</span>
                <div className="clr-chips">
                  {DEPARTURE_REASONS.map(r => (
                    <button key={r} type="button" className={form.exit_reason === r ? 'on' : ''} onClick={() => setForm(f => ({ ...f, exit_reason: r }))}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            <label className="clr-field">
              <span>ملاحظات</span>
              <textarea className="clr-input" rows={2} value={form.general_notes} onChange={e => setForm(f => ({ ...f, general_notes: e.target.value }))} placeholder="(اختياري)" />
            </label>
            <div className="clr-actions">
              {card && <button type="button" className="clr-btn ghost" onClick={() => setEditing(false)}>إلغاء</button>}
              <button
                type="button"
                className="clr-btn primary"
                disabled={cl.busy === 'start' || !form.exit_reason || !form.exit_date}
                onClick={saveForm}
              >
                {cl.busy === 'start' && <Loader2 size={16} className="clr-spin" />}
                {card ? 'حفظ' : 'بدء'}
              </button>
            </div>
          </section>
        ) : null
      ) : card && (
        <>
          {/* Step 2: the departments, one aligned row each */}
          <section className="clr-panel clr-depts">
            <h3><ShieldCheck size={18} /> تبرئة ذمة الأقسام</h3>
            {DEPARTMENTS.map(d => {
              const Icon = ICONS[d.id];
              const signed = isSigned(card, d.id);
              const pending = checks[d.id];
              const canSign = can(...d.permission) && !closed;
              const signedNote = card[d.columns.notes];
              return (
                <div key={d.id} className={`clr-dept ${signed ? 'signed' : pending.length ? 'blocked' : 'ready'}`}>
                  <div className="clr-dept-name">
                    <span className="clr-dept-icon"><Icon size={19} /></span>
                    <h4>{d.label}</h4>
                  </div>

                  <div className="clr-dept-body">
                    {signed ? (
                      <div className="clr-signed">
                        <span><UserCheck size={14} /> {signers[d.id] || 'موقّع'} · {dayText(card[d.columns.at]) || '—'}</span>
                        {typeof signedNote === 'string' && signedNote && <p><PenLine size={13} /> {signedNote}</p>}
                      </div>
                    ) : pending.length > 0 ? (
                      <ul className="clr-pending">
                        {pending.map((p, i) => <li key={i}><CircleAlert size={14} /> {p.text}{p.amount != null && <b>{money(p.amount)}</b>}</li>)}
                      </ul>
                    ) : (
                      <p className="clr-clear"><CheckCircle2 size={14} /> لا شيء عالق</p>
                    )}
                  </div>

                  <div className="clr-dept-action">
                    {!signed && canSign && (
                      <button type="button" className={`clr-btn ${pending.length ? 'amber' : 'primary'} small`} disabled={cl.busy === d.id} onClick={() => askSign(d.id)}>
                        {cl.busy === d.id ? <Loader2 size={15} className="clr-spin" /> : <ShieldCheck size={15} />} تبرئة الذمة
                      </button>
                    )}
                    {signed && canSign && (
                      <button type="button" className="clr-btn ghost small" disabled={cl.busy === d.id} onClick={() => setConfirm({ kind: 'unsign', department: d.id })}>
                        <Undo2 size={14} /> إلغاء التوقيع
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Step 3: the player's acknowledgement, with the card's tools under it */}
          <section className={`clr-panel clr-final ${closed ? 'closed' : allSigned ? 'ready' : 'locked'}`}>
            <div className="clr-final-row">
              <span className="clr-final-icon">{closed ? <CheckCircle2 size={24} /> : allSigned ? <PenLine size={22} /> : <Lock size={20} />}</span>
              {/* The title takes the row, the button stays at its end */}
              <div>
                <h3>{closed ? `أُغلق الملف · ${dayText(card.player_signed_at) || '—'}` : 'إقرار اللاعب وإغلاق الملف'}</h3>
              </div>
              {!closed && manages && (
                <button type="button" className="clr-btn primary" disabled={!allSigned || cl.busy === 'close'} onClick={() => setConfirm({ kind: 'close' })}>
                  <PenLine size={16} /> إقرار وإغلاق الملف
                </button>
              )}
            </div>
            <div className="clr-tools">
              <button type="button" className="clr-btn link" onClick={() => setPrinting(n => n + 1)}><Printer size={15} /> طباعة البطاقة</button>
              {manages && !closed && <button type="button" className="clr-btn link" onClick={openForm}><PenLine size={15} /> تعديل بيانات المغادرة</button>}
              {manages && <button type="button" className="clr-btn link danger" onClick={() => setConfirm({ kind: 'delete' })}><Trash2 size={15} /> حذف البطاقة</button>}
            </div>
          </section>
        </>
      )}

      {printing > 0 && card && (
        <PrintSheet key={printing} onDone={() => setPrinting(0)}>
          <PrintableClearance playerName={name} state={{ card, checks, signers }} />
        </PrintSheet>
      )}

      {confirm?.kind === 'sign' && confirmDept && (
        <ConfirmBox
          title={`تبرئة ذمة ${confirmDept.label}`}
          tone={confirmPending.length ? 'amber' : 'success'}
          note={{ value: note, onChange: setNote, required: confirmPending.length > 0, placeholder: confirmPending.length ? 'السبب (إجباري)' : 'ملاحظة (اختياري)' }}
          confirmLabel="تبرئة الذمة"
          busy={cl.busy === confirm.department}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.kind === 'unsign' && confirmDept && (
        <ConfirmBox
          title="إلغاء التوقيع"
          tone="amber"
          confirmLabel="إلغاء التوقيع"
          busy={cl.busy === confirm.department}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.kind === 'close' && (
        <ConfirmBox
          title="إغلاق الملف"
          confirmLabel="إقرار وإغلاق"
          busy={cl.busy === 'close'}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {/* Deleting the card: the app's one delete dialog */}
      {confirm?.kind === 'delete' && (
        <DeleteConfirm title="حذف بطاقة الإخلاء؟" name={name} onConfirm={async () => { await cl.remove(); }} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
};
