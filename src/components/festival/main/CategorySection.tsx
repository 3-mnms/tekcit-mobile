import React, { useEffect, useMemo, useState } from 'react';
import styles from './CategorySection.module.css';
import { getFestivals } from '@/shared/api/festival/festivalApi';
import type { Festival } from '@/models/festival/festivalType';
import { useParams, Link } from 'react-router-dom';

// 문자열 정규화
const canon = (s?: string) =>
  (s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[()（）]/g, (m) => (m === '(' || m === '（' ? '(' : ')'));

const MAX_ITEMS = 6;

/** 원본 -> 그룹 */
const CATEGORY_MAP: Record<string, string> = {
  '대중음악': '대중음악',
  '대중무용': '무용',
  '무용(서양/한국무용)': '무용',
  '뮤지컬': '뮤지컬/연극',
  '연극': '뮤지컬/연극',
  '서양음악(클래식)': '클래식/국악',
  '한국음악(국악)': '클래식/국악',
  '서커스/마술': '서커스/마술',
};
const normalizeGroup = (o?: string) => (o ? (CATEGORY_MAP[canon(o)] ?? '복합') : '복합');

/** 메인 상단 탭 */
const GROUP_TABS = ['대중음악','무용','뮤지컬/연극','클래식/국악','서커스/마술','복합'] as const;

/** 슬러그 -> 그룹 */
const SLUG_TO_GROUP: Record<string, string> = {
  pop: '대중음악',
  dance: '무용',
  theater: '뮤지컬/연극',
  classic: '클래식/국악',
  magic: '서커스/마술',
  mix: '복합',
};

/** 🔧 포스터 URL 보정(키 통합 + http→https + 상대경로 보정) */
const buildPosterUrl = (f: any): string => {
  const raw = f?.poster ?? f?.poster_file ?? f?.posterFile ?? f?.posterUrl ?? '';
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/^http:\/\//i, 'https://');
  }
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `https://www.kopis.or.kr${encodeURI(path)}`;
};

const CategorySection: React.FC = () => {
  const { slug, name, category } = useParams<{ slug?: string; name?: string; category?: string }>();
  const rawSlug = slug ?? name ?? category ?? null;
  const isCategoryPage = Boolean(rawSlug);
  const groupFromSlug = rawSlug ? (SLUG_TO_GROUP[rawSlug] ?? '복합') : undefined;

  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [currentGroup, setCurrentGroup] = useState<string>(groupFromSlug || GROUP_TABS[0]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await getFestivals();
        setFestivals(raw);
      } catch (e) {
        console.error('🚨 공연 리스트 불러오기 실패', e);
      }
    })();
  }, []);

  // 슬러그로 진입 시 그룹 동기화
  useEffect(() => {
    if (groupFromSlug) {
      setCurrentGroup(groupFromSlug);
      setSelectedChild(null);
    }
  }, [groupFromSlug]);

  const handleSelectGroup = (g: string) => {
    setCurrentGroup(g);
    setSelectedChild(null);
  };

  // 1) 현재 그룹 데이터
  const inGroup = useMemo(
    () => festivals.filter((f) => normalizeGroup((f as any).genrenm) === currentGroup),
    [festivals, currentGroup]
  );

  // 2) 하위(원본) 목록을 "데이터에서" 추출
  const presentChildren = useMemo(() => {
    const set = new Set<string>();
    inGroup.forEach((f) => {
      const raw = (f as any).genrenm as string | undefined;
      if (raw) set.add(canon(raw));
    });
    return Array.from(set);
  }, [inGroup]);

  // 3) 버튼 노출 여부 (카테고리 페이지 && 하위 2개 이상)
  const showChildButtons = isCategoryPage && presentChildren.length > 1;

  // 4) 하위 자동 선택: 카테고리 페이지에서만
  useEffect(() => {
    if (!isCategoryPage) {
      if (selectedChild !== null) setSelectedChild(null);
      return;
    }
    if (showChildButtons) {
      if (!selectedChild || !presentChildren.includes(canon(selectedChild))) {
        setSelectedChild(presentChildren[0] ?? null);
      }
    } else {
      if (selectedChild !== null) setSelectedChild(null);
    }
  }, [isCategoryPage, showChildButtons, presentChildren, selectedChild]);

  // 5) 최종 리스트
  const finalList = useMemo(() => {
    const base =
      showChildButtons && selectedChild
        ? inGroup.filter((f) => canon((f as any).genrenm) === canon(selectedChild))
        : inGroup;
    return base;
  }, [inGroup, showChildButtons, selectedChild]);

  const displayed = useMemo(() => finalList.slice(0, MAX_ITEMS), [finalList]);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>분야별 공연</h2>

        {/* 메인: 상위 그룹 탭 */}
        {!isCategoryPage && (
          <div className={styles.tabList}>
            {GROUP_TABS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleSelectGroup(g)}
                className={`${styles.tabButton} ${currentGroup === g ? styles.active : ''}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* 카테고리 페이지: 하위 버튼 (2개 이상일 때만) */}
        {showChildButtons && (
          <div className={styles.tabList}>
            {presentChildren.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedChild((prev) => (canon(prev) === c ? null : c))}
                className={`${styles.tabButton} ${canon(selectedChild) === c ? styles.active : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.cardSlider}>
        {displayed.map((festival, idx) => {
          const posterSrc = buildPosterUrl(festival);

          // ✅ fid 후보 통합 (kopis mt20id 포함)
          const fid =
            (festival as any).fid ??
            (festival as any).mt20id ??
            (festival as any).id ??
            null;

          const key = `${fid ?? 'unknown'}-${idx}`;
          const title = festival.prfnm;
          const poster = posterSrc || '/assets/placeholder-poster.png';

          return (
            <div key={key} className={styles.card}>
              {fid ? (
                <Link
                  to={`/festival/${fid}`}           // ✅ 디테일에서 받는 1개(라우트 파라미터)
                  state={{                          // ✅ 카드에서 넘기는 3개
                    fid,                            // ① fid (state에도 백업)
                    title,                          // ② 공연명
                    poster,                         // ③ 포스터
                  }}
                  className={styles.cardLink}
                  aria-label={`${title} 상세보기`}
                >
                  <div className={styles.imageWrapper}>
                    <img
                      src={poster}
                      alt={title}
                      className={styles.image}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/placeholder-poster.png';
                      }}
                    />
                  </div>
                  <h3 className={styles.name}>{title}</h3>
                  <p className={styles.location}>{(festival as any).fcltynm}</p>
                  <p className={styles.date}>
                    {festival.prfpdfrom === festival.prfpdto
                      ? festival.prfpdfrom
                      : `${festival.prfpdfrom} ~ ${festival.prfpdto}`}
                  </p>
                </Link>
              ) : (
                <div className={styles.cardStatic} title="상세 이동 불가: 식별자 없음">
                  <div className={styles.imageWrapper}>
                    <img
                      src={poster}
                      alt={title}
                      className={styles.image}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/placeholder-poster.png';
                      }}
                    />
                  </div>
                  <h3 className={styles.name}>{title}</h3>
                  <p className={styles.location}>{(festival as any).fcltynm}</p>
                  <p className={styles.date}>
                    {festival.prfpdfrom === festival.prfpdto
                      ? festival.prfpdfrom
                      : `${festival.prfpdfrom} ~ ${festival.prfpdto}`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;
