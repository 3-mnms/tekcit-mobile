// src/components/reservation/TicketInfoSection.tsx
import React from 'react';
import styles from './TicketInfoSection.module.css';

type TicketInfoSectionProps = {
  posterUrl?: string | null;
  title?: string | null;
  date?: string | null;       // YYYY-MM-DD
  time?: string | null;       // HH:mm
  unitPrice?: number | null;  // 1매 가격
  quantity?: number | null;   // 매수
  className?: string;
  compact?: boolean;          // 컴팩트 모드
  // venue 제거(사용 안 함)
};

const formatKRW = (n: number) => `${new Intl.NumberFormat('ko-KR').format(n)}원`;

const TicketInfoSection: React.FC<TicketInfoSectionProps> = ({
  posterUrl,
  title,
  date,
  time,
  unitPrice,
  quantity,
  className = '',
  compact = false,
}) => {
  // 안전 값
  const safeTitle = title ?? '';
  const safeDate = date ?? '';
  const safeTime = time ?? '';
  const price = typeof unitPrice === 'number' ? unitPrice : 0;
  const qty = typeof quantity === 'number' ? quantity : 0;

  // 포스터 폴백
  const fallbackSvg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
        <rect width="200" height="300" fill="#e5e7eb"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-size="14" fill="#6b7280">No Poster</text>
      </svg>`
    );

  return (
    <section className={`${styles.section} ${className}`}>
      <h2 className={compact ? styles.headingCompact : styles.heading}>
        내 티켓 정보
      </h2>

      <div className={styles.content}>
        {/* 포스터 */}
        <div
          className={`${styles.poster} ${compact ? styles.posterCompact : styles.posterFull
            }`}
        >
          <img
            src={posterUrl || fallbackSvg}
            alt={safeTitle ? `${safeTitle} 포스터` : '포스터 이미지'}
            className={styles.posterImg}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackSvg;
            }}
            loading="lazy"
          />
        </div>

        {/* 정보 */}
        <div className={styles.info}>
          <div>
            <div className={styles.priceBox}>
              <div
                className={compact ? styles.titleCompact : styles.title}
                title={safeTitle}
              >
                {safeTitle}
              </div>
            </div>
          </div>

          <div className={styles.priceBox}>
            <div className={styles.priceRow}>
              <span className={styles.label}>일시</span>
              <span className={styles.value}>
                {safeDate}
                {safeDate && safeTime ? ' · ' : ''}
                {safeTime}
              </span>
            </div>
            <div className={styles.priceRow}>

              <span className={styles.label}>가격</span>
              <span className={styles.value}>
                {formatKRW(price)}
              </span>
            </div>
            <div className={styles.priceRow}>
              <span className={styles.label}>수량</span>
              <span className={styles.value}>
                {qty}매
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TicketInfoSection;
