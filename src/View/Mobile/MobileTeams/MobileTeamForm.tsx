import React, { useState } from 'react';
import { Shirt, Save, Loader2, Sparkles, AlertCircle, Users, Type, Info } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { validInput } from '../../../core/functions/valiedinput';
import type { TeamModel } from '../../Screen/Teams/team_model';
import { membersText } from './teamRoster';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileTeamForm.css';

interface MobileTeamFormProps {
  /** Category being edited; null when adding a new one */
  team: TeamModel | null;
  /** Names of the other categories, to catch duplicates */
  otherNames: string[];
  /** Members in the edited category, when known */
  memberCount: number | null;
  isSaving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

const NAME_MAX = 50;

// Category names offered as one-tap suggestions
const SUGGESTIONS = ['الفريق الأول', 'U23', 'U21', 'U19', 'U17'];

const tidy = (value: string) => value.trim().replace(/\s+/g, ' ');
// Same name whatever the spacing, the article "ال", hamza form or letter case
const sameKey = (value: string) =>
  tidy(value)
    .split(' ')
    .map(word => word.replace(/^ال(?=..)/, ''))
    .join(' ')
    .replace(/[أإآ]/g, 'ا')
    .toLowerCase();

// Phone add / edit page of a team category (same rules as the desktop TeamDialog)
export const MobileTeamForm: React.FC<MobileTeamFormProps> = ({
  team, otherNames, memberCount, isSaving, onSave, onClose,
}) => {
  const [name, setName] = useState(team?.name || '');
  const [showError, setShowError] = useState(false);

  const taken = new Set(otherNames.map(sameKey));
  const value = tidy(name);
  const error = validInput(value, 2, NAME_MAX, 'text') || (taken.has(sameKey(value)) ? 'توجد فئة أخرى بهذا الاسم' : null);
  const suggestions = team ? [] : SUGGESTIONS.filter(s => !taken.has(sameKey(s)));

  const submit = () => {
    if (error) {
      setShowError(true);
      return;
    }
    if (team && value === team.name) {
      onClose();
      return;
    }
    onSave(value);
  };

  return (
    <MobileScreen
      title={team ? 'تعديل الفئة' : 'فئة جديدة'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={submit} disabled={isSaving}>
          {isSaving ? <Loader2 size={18} className="mtf-spin" /> : <Save size={18} />}
          {isSaving ? 'جاري الحفظ...' : team ? 'حفظ التعديلات' : 'إضافة الفئة'}
        </button>
      )}
    >
      {/* Live preview */}
      <section className="mtf-hero">
        <span className="mtf-jersey"><Shirt size={44} strokeWidth={1.6} /></span>
        <strong key={value ? 'name' : 'empty'} className={value ? '' : 'placeholder'}>{value || 'اسم الفئة'}</strong>
        <span className="mtf-hero-sub">
          {team
            ? memberCount != null ? `تضم ${memberCount ? membersText(memberCount) : 'لا أحد بعد'}` : 'تعديل فئة'
            : 'فئة جديدة في النادي'}
        </span>
      </section>

      <section className="mtf-card">
        <label className="me-field">
          <span className="me-label"><Type size={14} /> اسم الفئة</span>
          <span className={`mtf-input ${showError && error ? 'invalid' : ''}`}>
            <input
              type="text"
              value={name}
              maxLength={NAME_MAX}
              placeholder="مثال: U19"
              enterKeyHint="done"
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
            <span className="mtf-count">{name.length}/{NAME_MAX}</span>
          </span>
        </label>
        {showError && error
          ? <p className="mtf-error"><AlertCircle size={14} /> {error}</p>
          : <p className="mtf-help"><Info size={14} /> يظهر هذا الاسم في قوائم الأعضاء والتدريبات والمباريات.</p>}
      </section>

      {suggestions.length > 0 && (
        <section className="mtf-card">
          <h3 className="mtf-title"><Sparkles size={16} /> اقتراحات سريعة</h3>
          <div className="mtf-suggestions">
            {suggestions.map(s => (
              <button key={s} type="button" className={sameKey(s) === sameKey(value) ? 'active' : ''} onClick={() => setName(s)}>
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {team && !!memberCount && (
        <p className="mtf-note"><Users size={16} /> الاسم الجديد يظهر مباشرة عند {membersText(memberCount)} في هذه الفئة.</p>
      )}
    </MobileScreen>
  );
};
