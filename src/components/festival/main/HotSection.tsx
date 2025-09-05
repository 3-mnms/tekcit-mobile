import React, { useEffect, useMemo, useState } from 'react';
import styles from './HotSection.module.css';
import type { Festival, FestivalWithViews } from '@/models/festival/fFestivalType';
import { getFestivals, getFestivalViews } from '@/shared/api/festival/fFestivalApi';
import { useParams, Link } from 'react-router-dom'; // ✅ 추가!

// ✅ 라우트 슬러그 -> 그룹 카테고리
const slugToCategory: Record<string, string> = {
  pop: '대중음악',
  dance: '무용',
  theater: '뮤지컬/연극',
  classic: '클래식/국악',
  magic: '서커스/마술',
  mix: '복합',
};

// ✅ 원본 카테고리 -> 그룹 카테고리
const CATEGORY_MAP: Record<string, string> = {
  '대중무용': '무용',
  '무용(서양/한국무용)': '무용',
  '대중음악': '대중음악',
  '뮤지컬': '뮤지컬/연극',
  '연극': '뮤지컬/연극',
  '서양음악(클래식)': '클래식/국악',
  '한국음악(국악)': '클래식/국악',
  '서커스/마술': '서커스/마술',
};

const normalizeCategory = (original?: string): string => {
  if (!original) return '복합';
  return CATEGORY_MAP[original] ?? '복합';
};

// ✅ 포스터 URL 보정(절대경로/https 강제)
const buildPosterUrl = (f: Partial<Festival>): string => {
  const raw =
    (f as any)?.poster ??
    (f as any)?.poster_file ??
    (f as any)?.posterFile ??
    (f as any)?.posterUrl ??
    '';

  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // 혼합콘텐츠 방지: http → https
    return raw.replace(/^http:\/\//i, 'https://');
  }
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `https://www.kopis.or.kr${encodeURI(path)}`;
};

const HotSection: React.FC = () => {
  const { name: slug } = useParams<{ name?: string }>(); // ex) /category/theater
  const [hotFestivals, setHotFestivals] = useState<FestivalWithViews[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  const selectedCategory = useMemo(
    () => (slug ? slugToCategory[slug] ?? null : null),
    [slug]
  );

  // ✅ 반응형 카드 개수
  useEffect(() => {
    const handleResize = () => {
      const ratio = window.innerWidth / window.innerHeight;
      if (ratio < 0.7) setVisibleCount(3);      // 모바일 세로형
      else if (ratio < 0.9) setVisibleCount(3); // 태블릿
      else if (ratio < 1.2) setVisibleCount(4); // 노트북
      else setVisibleCount(5);                  // 와이드
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const festivals: Festival[] = await getFestivals();

        // ✅ 백엔드 카테고리 필드 (이제 genrenm이 표준)
        const getOriginalCategory = (f: Festival): string =>
          f.genrenm ??
          (f as any).category ??
          (f as any).genre ??
          (f as any).fcategory ??
          (f as any).fctg ??
          '';

        const filtered = selectedCategory
          ? festivals.filter((f) => normalizeCategory(getOriginalCategory(f)) === selectedCategory)
          : festivals;

        // ✅ 조회수 가져와 랭킹 정렬 (상위 20개만 계산)
        const withViewsPromises = filtered.slice(0, 20).map(async (festival) => {
          const fid = festival.fid;
          let views = 0;
          if (fid) {
            try {
              views = await getFestivalViews(fid);
            } catch {
              views = 0;
            }
          }
          return { ...festival, views } as FestivalWithViews;
        });

        const withViews = await Promise.all(withViewsPromises);
        withViews.sort((a, b) => b.views - a.views);
        setHotFestivals(withViews);
      } catch (err) {
        console.error('🔥 Hot 공연 불러오기 실패', err);
        setHotFestivals([]);
      }
    };

    fetchData();
  }, [selectedCategory]);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        {selectedCategory ? `${selectedCategory} HOT 공연` : '오늘의 HOT 공연'}
      </h2>

      <div className={styles.cardList}>
        {hotFestivals.slice(0, visibleCount).map((festival, index) => {
          const key = `${festival.fid || (festival as any).id || 'unknown'}-${index}`;
          const posterSrc = buildPosterUrl(festival);

          const to = festival.fid ? `/festival/${festival.fid}` : undefined;

          const CardInner = (
            <>
              <div className={styles.imageWrapper}>
                <img
                  src={posterSrc || '/assets/placeholder-poster.png'}
                  alt={festival.prfnm}
                  className={styles.image}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/placeholder-poster.png';
                  }}
                />
                <span className={styles.rank}>{index + 1}</span>
              </div>
              <div className={styles.content}>
                <h3 className={styles.name}>{festival.prfnm}</h3>
                <p className={styles.location}>{festival.fcltynm}</p>
                <p className={styles.date}>
                  {festival.prfpdfrom === festival.prfpdto
                    ? festival.prfpdfrom
                    : `${festival.prfpdfrom} ~ ${festival.prfpdto}`}
                </p>
              </div>
            </>
          );

          return (
            <div key={key} className={styles.card}>
              {to ? (
                // ✅ 링크로 전체 카드 클릭 가능 + state로 3개(+) 전달
                <Link
                  to={to}
                  state={{
                    fid: festival.fid,            // ① fid (백업)
                    title: festival.prfnm,        // ② 공연명
                    poster: posterSrc || '/assets/placeholder-poster.png', // ③ 포스터
                    // (보너스 프리뷰) UX 부드럽게
                    prfpdfrom: festival.prfpdfrom,
                    prfpdto: festival.prfpdto,
                    fcltynm: festival.fcltynm,
                  }}
                  className={styles.cardLink}
                  aria-label={`${festival.prfnm} 상세보기`}
                >
                  {CardInner}
                </Link>
              ) : (
                // fid 없으면 정적 카드
                <div className={styles.cardStatic} title="상세 이동 불가: 식별자 없음">
                  {CardInner}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HotSection;
