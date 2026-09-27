import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Shield, Search } from 'lucide-react';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import type { useClubsController } from '../../Screen/Clubs/ClubsController';
import type { Club } from '../../Screen/Clubs/club_model';
import { MobileClubForm } from './MobileClubForm';
import { clubInitial } from './clubUtils';
import './MobileClubs.css';

// 1 → "نادٍ واحد", 2 → "ناديان", 3–10 → "3 أندية", 11+ → "11 نادياً"
const clubsText = (n: number) =>
  n === 1 ? 'نادٍ واحد' : n === 2 ? 'ناديان' : `${n} ${n <= 10 ? 'أندية' : 'نادياً'}`;

interface MobileClubsProps {
  controller: ReturnType<typeof useClubsController>;
}

// Phone version of the other clubs page: logo grid, add / edit on its own page
export const MobileClubs: React.FC<MobileClubsProps> = ({ controller }) => {
  const { clubs, isLoading } = controller;
  const [query, setQuery] = useState('');
  // undefined = form closed, null = new club
  const [editing, setEditing] = useState<Club | null | undefined>(undefined);

  const q = query.trim().toLowerCase();
  const visible = q
    ? clubs.filter(c => c.name.toLowerCase().includes(q) || c.symbol?.toLowerCase().includes(q))
    : clubs;
  const withLogo = clubs.filter(c => c.logo).length;

  const remove = (club: Club) => {
    if (window.confirm(`هل أنت متأكد من حذف نادي ${club.name}؟`)) controller.deleteClub(club.id);
  };

  const menuItems = (club: Club): MobileRowMenuItem[] => [
    { key: 'edit', label: 'تعديل', icon: Pencil, color: '#f97316', onClick: () => setEditing(club) },
    { key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => remove(club) },
  ];

  return (
    <div className="mcl-page">
      <MobileAppBar title="الأندية الأخرى" />

      {isLoading ? (
        <MobileLoader text="جاري تحميل الأندية..." />
      ) : clubs.length === 0 ? (
        <div className="mcl-empty">
          <span className="mcl-empty-icon"><Shield size={40} /></span>
          <strong>لا توجد أندية مضافة</strong>
          <p>أضف الأندية الأخرى بشعارها ورمزها لتظهر في صفحات النادي.</p>
          <button type="button" className="mcl-empty-btn" onClick={() => setEditing(null)}>
            <Plus size={18} /> إضافة أول نادي
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <section className="mcl-hero">
            <span className="mcl-hero-icon"><Shield size={26} /></span>
            <div className="mcl-hero-text">
              <small>الأندية المسجلة</small>
              <strong>{clubs.length}</strong>
            </div>
            <div className="mcl-hero-logos" aria-hidden="true">
              {clubs.filter(c => c.logo).slice(0, 3).map(c => <img key={c.id} src={c.logo} alt="" />)}
            </div>
            {withLogo < clubs.length && (
              <p className="mcl-hero-note">{clubsText(clubs.length - withLogo)} بدون شعار</p>
            )}
          </section>

          <label className="mcl-search">
            <Search size={17} />
            <input type="search" placeholder="ابحث باسم النادي أو رمزه..." value={query} onChange={e => setQuery(e.target.value)} />
          </label>

          {visible.length === 0 ? (
            <div className="mcl-empty small">
              <Search size={34} />
              <p>لا توجد نتائج للبحث</p>
            </div>
          ) : (
            <div className="mcl-grid">
              {visible.map(club => (
                <article
                  key={club.id}
                  className="mcl-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditing(club)}
                  onKeyDown={e => { if (e.key === 'Enter') setEditing(club); }}
                >
                  <div className="mcl-card-menu">
                    <MobileRowMenu items={menuItems(club)} label="إجراءات النادي" />
                  </div>
                  <span className={`mcl-logo ${club.logo ? '' : 'empty'}`}>
                    {club.logo ? <img src={club.logo} alt="" /> : clubInitial(club)}
                  </span>
                  <strong>{club.name}</strong>
                  <span className="mcl-symbol">{club.symbol || 'بدون رمز'}</span>
                </article>
              ))}
            </div>
          )}

          <button type="button" className="mcl-fab" onClick={() => setEditing(null)} aria-label="إضافة نادي" title="إضافة نادي">
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </>
      )}

      {editing !== undefined && (
        <MobileClubForm
          key={editing?.id || 'new'}
          club={editing}
          otherClubs={clubs.filter(c => c.id !== editing?.id)}
          onSave={data => (editing ? controller.updateClub(editing.id, data) : controller.addClub(data))}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
};
