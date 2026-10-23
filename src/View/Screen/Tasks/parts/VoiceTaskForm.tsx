import React, { useState } from 'react';
import { Save, Loader2, AlertCircle, Mic, UserRound, Shapes, ArrowLeft, RotateCcw } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { UserPicker } from '../../../shared/FormBits';
import { VoiceInput } from './VoiceInput';
import type { TasksAdmin } from '../useTasks';
import { NATURE_META, type Task, type TaskNature } from '../taskUtils';

/**
 * A voice note, in two dialogs: first the listening one (it records as soon as it opens, the words written as they
 * are said), then who it is for and its nature. Given at once, with no deadline.
 * Editing starts on the second one (the recording can be done again from there).
 */
export const VoiceTaskForm: React.FC<{ c: TasksAdmin; task?: Task; mobile: boolean }> = ({ c, task, mobile }) => {
  const [step, setStep] = useState<'listen' | 'details'>(task ? 'details' : 'listen');
  const [text, setText] = useState(task ? task.details || task.title : '');
  const [assignee, setAssignee] = useState(String(task?.assignee?.id ?? ''));
  const [nature, setNature] = useState<TaskNature | ''>(task?.nature || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const spoken = text.trim();

  const save = async () => {
    if (!assignee) return setError('اختر المكلّف');
    if (!nature) return setError('اختر طبيعة التنبيه');
    setError('');
    setSaving(true);
    try {
      await c.save({
        ...(task ? { id: task.id } : {}),
        // A long note: its start as the title, all of it in the details
        title: spoken.length > 200 ? `${spoken.slice(0, 197)}…` : spoken,
        details: spoken.length > 200 ? spoken : null,
        kind: 'voice',
        nature,
        assignee_id: Number(assignee),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'listen') {
    return (
      <SidePanel
        mobile={mobile}
        layer={2}
        size="sm"
        icon={Mic}
        title="تنبيه صوتي"
        onClose={c.closeForm}
        footer={(
          <>
            {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
            <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={() => setStep('details')} disabled={!spoken}>
              التالي<ArrowLeft size={17} />
            </button>
          </>
        )}
      >
        <div className="tk-form calm">
          <VoiceInput value={text} onChange={setText} autoStart />
        </div>
      </SidePanel>
    );
  }

  return (
    <SidePanel
      mobile={mobile}
      layer={2}
      size="sm"
      icon={Mic}
      title={task ? 'تعديل التنبيه الصوتي' : 'تنبيه صوتي'}
      onClose={c.closeForm}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {task ? 'حفظ التعديلات' : 'إرسال التنبيه'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <div className="tk-field">
          <span className="tk-label"><Mic size={14} />التنبيه</span>
          <p className="tsk-voice-quote">{spoken}</p>
          <button type="button" className="tk-btn ghost sm" onClick={() => { setText(''); setStep('listen'); }}>
            <RotateCcw size={15} />إعادة التسجيل
          </button>
        </div>

        <UserPicker mobile={mobile} label="المكلّف" icon={UserRound} value={assignee} users={c.users} onChange={v => { setAssignee(v); setError(''); }} placeholder="اختر العضو" />

        <div className="tk-field">
          <span className="tk-label"><Shapes size={14} />طبيعة التنبيه</span>
          <div className="tk-seg three tsk-nature">
            {(Object.keys(NATURE_META) as TaskNature[]).map(n => {
              const meta = NATURE_META[n];
              return <button key={n} type="button" className={nature === n ? 'on' : ''} onClick={() => { setNature(n); setError(''); }}><meta.icon size={15} />{meta.label}</button>;
            })}
          </div>
        </div>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </SidePanel>
  );
};
