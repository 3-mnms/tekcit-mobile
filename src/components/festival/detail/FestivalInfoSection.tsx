// src/components/festival/detail/FestivalInfoSection.tsx
import React, { useMemo } from 'react';
import styles from './FestivalInfoSection.module.css';
import type { FestivalDetail } from '@/models/festival/festivalType';

// ✅ 추가: 찜 상태/카운트 훅 & 토글 뮤테이션, 로그인 스토어
import {
  useIsFavorite,
  useFavoriteCount,
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
} from '@/models/festival/tanstack-query/useFavoritesDetail';
import { useAuthStore } from '@/shared/storage/useAuthStore';

type Props = {
  detail?: FestivalDetail;
  loading?: boolean;
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${y}.${m}.${d}`;
};
const formatPrice = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString() + '원' : '';

const FestivalInfoSection: React.FC<Props> = ({ detail, loading }) => {
  // ✅ 추가: fid 안전 추출 (프로젝트 DTO 상황에 맞게 확장)
  const fid = useMemo(() => {
    const raw = (detail as any)?.fid ?? (detail as any)?.mt20id ?? (detail as any)?.id;
    return raw ? String(raw) : undefined;
  }, [detail]);

  // ✅ 추가: 로그인 토큰
  const accessToken = useAuthStore((s) => s.accessToken);

  // ✅ 추가: 찜 상태/카운트 + 토글 뮤테이션
  const { data: likedData } = useIsFavorite(fid, Boolean(accessToken));
  const { data: countData } = useFavoriteCount(fid);
  const createMut = useCreateFavoriteMutation(fid || '');
  const deleteMut = useDeleteFavoriteMutation(fid || '');

  const liked = likedData?.liked ?? false;
  const count = countData?.count ?? 0;
  const toggling = createMut.isPending || deleteMut.isPending;

  const onToggleLike = () => {
    if (!fid) return;
    if (!accessToken) {
      alert('로그인이 필요해요!');
      return;
    }
    if (liked) deleteMut.mutate();
    else createMut.mutate();
  };

  if (loading && !detail) {
    return (
      <section className={styles.container}>
        <div className={styles.left}>
          <div className={styles.posterPlaceholder}>Loading…</div>
          {/* 디자인 유지, 버튼만 비활성화 */}
          <button className={styles.likeBtn} type="button" disabled>
            <i className="fa-heart fa-regular" /> 0
          </button>
        </div>
        <div className={styles.right}>
          <h1 className={styles.title}>로딩 중…</h1>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className={styles.container}>
        <div className={styles.right}>
          <h1 className={styles.title}>공연 정보를 불러오지 못했어요</h1>
        </div>
      </section>
    );
  }

  const performers =
    detail.fcast ? detail.fcast.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <section className={styles.container}>
      {/* 왼쪽: 포스터 + 찜 */}
      <div className={styles.left}>
        {detail.poster ? (
          <img
            src={detail.poster}
            alt={`${detail.prfnm} 포스터`}
            className={styles.poster}
          />
        ) : (
          <div className={styles.posterPlaceholder}>No Image</div>
        )}

        {/* ✅ 추가: 찜 토글 + 카운트 (디자인 클래스 유지) */}
        <button
          className={`${styles.likeBtn} ${liked ? styles.likeBtnLiked : ''}`}
          type="button"
          aria-pressed={liked}
          aria-label={liked ? '관심 해제' : '관심 추가'}
          onClick={onToggleLike}
          disabled={toggling || !fid}
        >
          <i className={`fa-heart ${liked ? 'fa-solid' : 'fa-regular'}`} />
          <span className={styles.likeCount}> {count}</span>
        </button>
      </div>

      {/* 오른쪽: DTO 그대로 표기 */}
      <div className={styles.right}>
        <h1 className={styles.title}>{detail.prfnm}</h1>

        <div className={styles.infoRows}>
          <div className={styles.infoRow}>
            <span className={styles.label}>공연장소</span>
            <span className={styles.value}>{detail.fcltynm}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>공연기간</span>
            <span className={styles.value}>
              {/* ✅ 추가: 시작일=종료일이면 한 번만 표기 */}
              {detail.prfpdfrom === detail.prfpdto
                ? formatDate(detail.prfpdfrom)
                : `${formatDate(detail.prfpdfrom)} ~ ${formatDate(detail.prfpdto)}`}
            </span>
          </div>

          {detail.runningTime && (
            <div className={styles.infoRow}>
              <span className={styles.label}>러닝타임</span>
              <span className={styles.value}>{detail.runningTime}</span>
            </div>
          )}

          {detail.prfage && (
            <div className={styles.infoRow}>
              <span className={styles.label}>관람연령</span>
              <span className={styles.value}>{detail.prfage}</span>
            </div>
          )}

          <div className={styles.infoRow}>
            <span className={styles.label}>가격</span>
            <span className={styles.value}>{formatPrice(detail.ticketPrice)}</span>
          </div>

          {performers.length > 0 && (
            <div className={`${styles.infoRow} ${styles.fullRow}`}>
              <span className={styles.label}>출연</span>
              <span className={styles.value}>{performers.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FestivalInfoSection;
