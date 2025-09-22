import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFestivalCategories } from '@/shared/api/festival/festivalApi';
import styles from './FilterPanel.module.css';

const WEEK_LABELS = ['일','월','화','수','목','금','토'];
const DEFAULT_STATUSES = ['공연중', '공연예정'] as const;

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

type Props = {
  onApplied?: () => void; // ⬅️ 추가
  onReset?: () => void;   // ⬅️ 추가
};

export default function FilterPanel({ onApplied, onReset }: Props) {
  const [params, setParams] = useSearchParams();

  // ✅ URL → 상태 복원 (없으면 기본값)
  const [saleStatus, setSaleStatus] = useState<string[]>(() => {
    const p = params.get('status');
    return p ? p.split(',').filter(Boolean) : [...DEFAULT_STATUSES];
  });
  const [genres, setGenres] = useState<string[]>(() => {
    const p = params.get('genres');
    return p ? p.split(',').filter(Boolean) : [];
  });
  const [regions, setRegions] = useState<string[]>([]); // (보류)

  // 카테고리
  const { data: categories } = useQuery({
    queryKey: ['festivalCategories'],
    queryFn: getFestivalCategories,
    staleTime: 5 * 60_000,
  });

  // 달력 상태
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const [viewDate, setViewDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // 기간 (URL → 복원)
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>(() => {
    const from = params.get('from');
    const to = params.get('to');
    return { start: from ? new Date(from) : null, end: to ? new Date(to) : null };
  });

  // 🔄 URL 변동 시 로컬 상태 동기화
  useEffect(() => {
    const pStatus = params.get('status');
    setSaleStatus(pStatus ? pStatus.split(',').filter(Boolean) : [...DEFAULT_STATUSES]);

    const pGenres = params.get('genres');
    setGenres(pGenres ? pGenres.split(',').filter(Boolean) : []);

    const from = params.get('from');
    const to = params.get('to');
    setRange({ start: from ? new Date(from) : null, end: to ? new Date(to) : null });
  }, [params]);

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDayIdx = new Date(y, m, 1).getDay();
  const title = `${y}.${String(m + 1).padStart(2, '0')}`;

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const prevMonth = () => setViewDate(new Date(y, m - 1, 1));
  const nextMonth = () => setViewDate(new Date(y, m + 1, 1));

  const strip = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const handleDayClick = (dateObj: Date) => {
    const d = strip(dateObj);
    if (!range.start || (range.start && range.end)) {
      setRange({ start: d, end: null });
    } else if (range.start && !range.end) {
      if (d < range.start) setRange({ start: d, end: range.start });
      else setRange({ start: range.start, end: d });
    }
  };

  // ✅ 필터 적용 → URL 갱신 (status 사용)
  const applyFilters = () => {
    const next = new URLSearchParams(params);

    if (genres.length) next.set('genres', genres.join(','));
    else next.delete('genres');

    if (saleStatus.length) next.set('status', saleStatus.join(','));
    else next.set('status', DEFAULT_STATUSES.join(',')); // 비우면 기본값 강제

    if (range.start) next.set('from', fmt(range.start)); else next.delete('from');
    if (range.end)   next.set('to', fmt(range.end));     else next.delete('to');

    // 새 검색이면 page 리셋하고 싶다면: next.set('page', '1');
    setParams(next, { replace: false });
    onApplied?.();
  };

  return (
    <aside className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.body}>

          {/* 장르 */}
          <section className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>장르</span>
              <span className={styles.helper}>(중복 선택 가능)</span>
            </div>
            <div className={styles.chips}>
              {(categories ?? []).map((g: string) => (
                <button
                  key={g}
                  type="button"
                  className={`${styles.chip} ${genres.includes(g) ? styles.chipActive : ''}`}
                  onClick={() => toggle(genres, g, setGenres)}
                  aria-pressed={genres.includes(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          <div className={styles.divider} />

          {/* 공연상태 */}
          <section className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>공연상태</span>
            </div>
            <div className={styles.chips}>
              {['공연중', '공연예정', '공연종료'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.chip} ${saleStatus.includes(s) ? styles.chipActive : ''}`}
                  onClick={() => toggle(saleStatus, s, setSaleStatus)}
                  aria-pressed={saleStatus.includes(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <div className={styles.divider} />

          {/* 날짜 */}
          <section className={styles.section}>
            <div className={styles.labelRow}>
              <span className={styles.label}>날짜</span>
            </div>

            <div className={styles.calendarCard}>
              <div className={styles.calHeader}>
                <button className={styles.navBtn} onClick={prevMonth} aria-label="이전 달">‹</button>
                <strong className={styles.calTitle}>{title}</strong>
                <button className={styles.navBtn} onClick={nextMonth} aria-label="다음 달">›</button>
              </div>

              <div className={styles.weekRow}>
                {WEEK_LABELS.map((d) => <span key={d}>{d}</span>)}
              </div>

              <div className={styles.daysGrid}>
                {Array.from({ length: firstDayIdx }).map((_, i) => <span key={`b${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateObj = new Date(y, m, day);
                  const isPast = strip(dateObj) < today;

                  const isStart = !!(range.start && sameDay(dateObj, range.start));
                  const isEnd   = !!(range.end && sameDay(dateObj, range.end));
                  const isInRange =
                    !!(range.start && range.end &&
                       strip(dateObj) >= range.start && strip(dateObj) <= range.end);

                  return (
                    <button
                      key={day}
                      type="button"
                      className={[
                        styles.dayBtn,
                        isPast ? styles.dayBtnDisabled : '',
                        isInRange ? styles.dayInRange : '',
                        isStart ? styles.dayStart : '',
                        isEnd ? styles.dayEnd : '',
                      ].join(' ')}
                      onClick={() => !isPast && handleDayClick(dateObj)}
                      disabled={isPast}
                      aria-pressed={isStart || isEnd || isInRange}
                    >
                      <span className={styles.dayNum}>{day}</span>
                      {sameDay(dateObj, today) && <span className={styles.todayTag}>today</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className={styles.divider} />
        </div>

        {/* 하단 바 */}
        <div className={styles.actions}>
          <button
            className={styles.btnGhost}
            type="button"
            onClick={() => {
              setGenres([]);
              setRegions([]);
              setSaleStatus([...DEFAULT_STATUSES]);
              setRange({ start: null, end: null });
              setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

              const next = new URLSearchParams(params);
              next.delete('genres');
              next.set('status', DEFAULT_STATUSES.join(',')); // ✅ 초기화해도 기본 상태 유지
              next.delete('from');
              next.delete('to');
              setParams(next, { replace: false });
              onReset?.();
            }}
          >
            초기화
          </button>
          <button className={styles.btnPrimary} type="button" onClick={applyFilters}>
            필터 적용
          </button>
        </div>
      </div>
    </aside>
  );
}
