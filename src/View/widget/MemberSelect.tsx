import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, UserPlus, UserRound, X } from 'lucide-react';
import defaultAvatar from '../../assets/AVETER.png';
import { TYPE_LABELS } from '../Mobile/MobileMembers/memberLabels';
import type { MemberModel } from '../Screen/Members/member_model';
import './MemberSelect.css';

const fullName = (m: MemberModel) => `${m.first_name} ${m.last_name}`.trim();
const photoOf = (m?: MemberModel) => (m?.photo && !m.photo.includes('ui-avatars.com') ? m.photo : defaultAvatar);
const hintOf = (m: MemberModel) => [TYPE_LABELS[m.type] || m.type, m.team_name].filter(Boolean).join(' · ');

const Avatar: React.FC<{ member?: MemberModel; size?: number }> = ({ member, size = 32 }) =>
  member
    ? <img className="msel-avatar" style={{ width: size, height: size }} src={photoOf(member)} alt="" onError={e => { e.currentTarget.src = defaultAvatar; }} />
    : <span className="msel-avatar msel-avatar-empty" style={{ width: size, height: size }}><UserRound size={size * 0.5} /></span>;

interface BaseProps {
  members: MemberModel[];
  placeholder?: string;
  /** A name typed in the search that is not a member can be used as is (e.g. "المدير الرياضي") */
  allowFreeText?: boolean;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  /** The chosen member's name */
  value: string;
  onChange: (name: string, member?: MemberModel) => void;
}

interface MultiProps extends BaseProps {
  multiple: true;
  /** The chosen members' names */
  values: string[];
  onChange: (names: string[]) => void;
}

/** Desktop dropdown to choose one member or several: photos, type and team, search */
export const MemberSelect: React.FC<SingleProps | MultiProps> = props => {
  const { members, placeholder = 'اختر...', allowFreeText } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const chosen = props.multiple ? props.values : props.value ? [props.value] : [];
  const byName = (name: string) => members.find(m => fullName(m) === name);

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () => (q ? members.filter(m => fullName(m).toLowerCase().includes(q) || hintOf(m).toLowerCase().includes(q)) : members),
    [members, q],
  );
  const freeText = allowFreeText && q && !members.some(m => fullName(m).toLowerCase() === q) ? query.trim() : '';
  const rows = [...(freeText ? [freeText] : []), ...list.map(fullName)];

  // Placed under the field (above when there is no room), fixed so the dialog does not clip it
  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 280 && above > below;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: r.left, width: r.width, up, maxHeight: Math.min(360, up ? above : below) });
  };

  const close = () => { setOpen(false); setQuery(''); };

  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const outside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) close();
    };
    const follow = () => place();
    document.addEventListener('mousedown', outside);
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, true);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', follow, true);
    };
  }, [open]);


  const pick = (name: string) => {
    if (props.multiple) {
      props.onChange(chosen.includes(name) ? chosen.filter(n => n !== name) : [...chosen, name]);
      setQuery('');
      searchRef.current?.focus();
    } else {
      props.onChange(name, byName(name));
      close();
    }
  };

  const remove = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.multiple) props.onChange(chosen.filter(n => n !== name));
    else props.onChange('', undefined);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, rows.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (rows[active]) pick(rows[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  };

  useEffect(() => {
    panelRef.current?.querySelector(`[data-row="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const single = !props.multiple && props.value ? props.value : '';

  return (
    <>
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        tabIndex={0}
        className={`msel-trigger ${open ? 'open' : ''} ${props.multiple ? 'multi' : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={e => { if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setOpen(true); } }}
      >
        {props.multiple ? (
          chosen.length ? (
            <span className="msel-chips">
              {chosen.map(name => (
                <span key={name} className="msel-chip">
                  <Avatar member={byName(name)} size={20} />
                  {name}
                  <button type="button" aria-label={`إزالة ${name}`} onClick={e => remove(name, e)}><X size={12} /></button>
                </span>
              ))}
            </span>
          ) : <span className="msel-placeholder"><UserPlus size={16} /> {placeholder}</span>
        ) : single ? (
          <span className="msel-value">
            <Avatar member={byName(single)} size={28} />
            <span className="msel-value-text">
              <strong>{single}</strong>
              {byName(single) && hintOf(byName(single)!) && <small>{hintOf(byName(single)!)}</small>}
            </span>
          </span>
        ) : <span className="msel-placeholder"><UserRound size={16} /> {placeholder}</span>}

        {single && <button type="button" className="msel-clear" aria-label="إلغاء الاختيار" onClick={e => remove(single, e)}><X size={14} /></button>}
        <ChevronDown size={18} className="msel-caret" />
      </div>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          className={`msel-panel ${pos.up ? 'up' : ''}`}
          dir="rtl"
          style={{ left: pos.left, width: pos.width, maxHeight: pos.maxHeight, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
        >
          <label className="msel-search">
            <Search size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKey}
              placeholder={allowFreeText ? 'ابحث أو اكتب اسماً...' : 'ابحث بالاسم أو الصفة...'}
            />
            {props.multiple && chosen.length > 0 && <span className="msel-count">{chosen.length}</span>}
          </label>

          <div className="msel-list" role="listbox" aria-multiselectable={props.multiple || undefined}>
            {rows.length === 0 && <p className="msel-empty">لا توجد نتائج</p>}
            {freeText && (
              <button type="button" data-row={0} className={`msel-row msel-free ${active === 0 ? 'active' : ''}`} onMouseEnter={() => setActive(0)} onClick={() => pick(freeText)}>
                <span className="msel-avatar msel-avatar-empty" style={{ width: 32, height: 32 }}><UserPlus size={16} /></span>
                <span className="msel-row-text"><strong>استخدام «{freeText}»</strong><small>اسم من خارج قائمة الأعضاء</small></span>
              </button>
            )}
            {list.map((m, i) => {
              const index = i + (freeText ? 1 : 0);
              const name = fullName(m);
              const selected = chosen.includes(name);
              return (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-row={index}
                  className={`msel-row ${selected ? 'selected' : ''} ${active === index ? 'active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(name)}
                >
                  <Avatar member={m} />
                  <span className="msel-row-text">
                    <strong>{name}</strong>
                    {hintOf(m) && <small>{hintOf(m)}</small>}
                  </span>
                  <span className={`msel-check ${props.multiple ? 'square' : ''}`}>{selected && <Check size={13} strokeWidth={3} />}</span>
                </button>
              );
            })}
          </div>

          {props.multiple && (
            <div className="msel-foot">
              <span>{chosen.length ? `${chosen.length} محدد` : 'لم يُحدد أحد'}</span>
              <button type="button" onClick={close}>تم</button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
};
