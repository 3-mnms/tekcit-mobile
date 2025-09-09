// src/components/my/ticket/AfterTransferTicket.tsx
import React from 'react';
import styles from './AfterTransferTicket.module.css';

const priceFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

type Relation = '가족' | '지인';
type RawStatus = string | number;
type NormalizedStatus = 'PROGRESS' | 'APPROVED' | 'REJECTED';

function normalizeStatus(s?: RawStatus): NormalizedStatus {
  if (typeof s === 'number') {
    if (s === 0 || s === 1) return 'PROGRESS';
    if (s === 2) return 'APPROVED';
    if (s === 3) return 'REJECTED';
    return 'PROGRESS';
  }
  const v = (s ?? '').toString().trim().toUpperCase();
  if (['0', '1', 'REQUESTED', 'APPROVED', 'WAITING', 'PENDING'].includes(v)) return 'PROGRESS';
  if (['2', 'COMPLETED', 'SUCCESS', 'OK'].includes(v)) return 'APPROVED';
  if (['3', 'REJECTED', 'DENIED', 'DECLINED', 'CANCELED', 'CANCELLED'].includes(v)) return 'REJECTED';
  return 'PROGRESS';
}

type Props = {
  title: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  relation: Relation;
  status: RawStatus;
  posterUrl?: string;
  price?: number; // 단가 (지인일 때만 노출)
  count: number;  // 매수
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
};

const AfterTransferTicket: React.FC<Props> = ({
  title,
  date,
  time,
  relation,
  status,
  posterUrl,
  price,
  count,
  onAccept,
  onReject,
  className = '',
}) => {
  const fallbackPoster = '/dummy-poster.jpg';
  const s = normalizeStatus(status);

  // 지인일 때만 가격 보임
  const showPrice = relation === '지인' && Number.isFinite(price);
  const totalPrice = showPrice ? (price as number) * count : null;

  const StatusBadge = () => {
    if (s === 'PROGRESS') return <span className={`${styles.badge} ${styles.progress}`}>양도 진행중</span>;
    if (s === 'APPROVED') return <span className={`${styles.badge} ${styles.approved}`}>양도 승인</span>;
    if (s === 'REJECTED') return <span className={`${styles.badge} ${styles.rejected}`}>양도 거절</span>;
    return null;
  };

  return (
    <article className={`${styles.card} ${className}`} aria-label={`${title} 양도 카드`}>
      {/* 좌측: 포스터 + (포스터 아래 배지) */}
      <div className={styles.left}>
        <img
          src={posterUrl || fallbackPoster}
          alt={`${title} 포스터`}
          className={styles.poster}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.endsWith(fallbackPoster)) img.src = fallbackPoster;
          }}
        />
        <div className={styles.badgeBox}>
          <StatusBadge />
        </div>
      </div>

      {/* 중앙: 정보 (Before 카드와 동일 구조) */}
      <div className={styles.center}>
        <div className={styles.row}>
          <span className={styles.k}>공연명</span>
          <span className={styles.v} title={title}>{title}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>일시</span>
          <span className={styles.v}>{date} {time}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>매수</span>
          <span className={styles.v}>{count}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>관계</span>
          <span className={styles.v}>{relation}</span>
        </div>

        {showPrice ? (
          <div className={styles.row}>
            <span className={styles.k}>가격</span>
            <span className={styles.v}>
              {priceFormatter.format(totalPrice!)}
              <span className={styles.unitPrice}> ({priceFormatter.format(price!)} × {count})</span>
            </span>
          </div>
        ) : (
          /** 👇 가격 비노출이어도 행 높이/간격 유지용 placeholder */
          <div className={`${styles.row} ${styles.hiddenPriceRow}`} aria-hidden="true" role="presentation">
            <span className={styles.k}>가격</span>
            <span className={styles.v}>&nbsp;</span>
          </div>
        )}
      </div>

      {/* 우측: 액션만 표시 */}
      <div className={styles.right}>
        {s === 'PROGRESS' && (onAccept || onReject) && (
          <div className={styles.actions}>
            {onAccept && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.acceptBtn}`}
                onClick={onAccept}
              >
                수락
              </button>
            )}
            {onReject && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                onClick={onReject}
              >
                거절
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default AfterTransferTicket;
