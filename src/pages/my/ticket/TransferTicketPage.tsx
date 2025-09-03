// src/pages/mypage/ticket/transfer/TransferTicketPage.tsx (모바일)
import React, { useEffect, useMemo, useState } from 'react';
import styles from './TransferTicketPage.module.css';
import MyHeader from '@/components/my/hedaer/MyHeader';
import { useNavigate } from 'react-router-dom';
import { useTicketsQuery, useTicketDetailQuery } from '@/models/my/ticket/tanstack-query/useTickets';
import type { TransferListItem } from '@/models/my/ticket/ticketTypes';

export const TRANSFER_DONE_EVENT = 'ticket:transferred';

/** 포스터만 가져오는 얇은 컴포넌트 */
const TicketPoster: React.FC<{ reservationNumber: string; alt: string; className?: string }> = ({
  reservationNumber,
  alt,
  className,
}) => {
  const { data } = useTicketDetailQuery(reservationNumber);
  const src = data?.posterFile || '/dummy-poster.jpg';
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/dummy-poster.jpg';
      }}
    />
  );
};

const TransferTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useTicketsQuery();

  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onDone = (ev: Event) => {
      const num = (ev as CustomEvent<string>).detail; // reservationNumber
      setHidden((prev) => {
        const next = new Set(prev);
        next.add(num);
        return next;
      });
    };
    window.addEventListener(TRANSFER_DONE_EVENT, onDone as EventListener);
    return () => window.removeEventListener(TRANSFER_DONE_EVENT, onDone as EventListener);
  }, []);

  const visibleTickets = useMemo(() => {
    const list: TransferListItem[] = data ?? [];
    return list.filter((t) => t.rawStatus === 'CONFIRMED' && !hidden.has(t.reservationNumber));
  }, [data, hidden]);

  const handleTransfer = (row: TransferListItem) => {
    navigate('/mypage/ticket/transfer/test', {
      state: {
        reservationNumber: row.reservationNumber,
        ticket: row,
      },
    });
  };

  return (
    <section className={styles.page}>
      <MyHeader title="티켓 양도" />

      <div className={styles.body}>
        <div className={styles.list}>
          {visibleTickets.map((t) => (
            <article
              key={t.reservationNumber}
              className={styles.card}
              aria-label={`${t.title} 티켓`}
            >
              {/* 좌측: 포스터 (상세 API에서 posterFile 사용) */}
              <div className={styles.left}>
                <TicketPoster
                  reservationNumber={t.reservationNumber}
                  alt={`${t.title} 포스터`}
                  className={styles.poster}
                />
              </div>

              {/* 중앙: 정보 */}
              <div className={styles.center}>
                <div className={styles.row}>
                  <span className={styles.k}>예매일</span>
                  <span className={styles.v}>{t.date}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>예매번호</span>
                  <span className={styles.v}>{t.number}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>공연명</span>
                  <span className={styles.v}>{t.title}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>일시</span>
                  <span className={styles.v}>{t.dateTime}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>매수</span>
                  <span className={styles.v}>{t.count}</span>
                </div>
              </div>

              {/* 우측: 액션 */}
              <div className={styles.right}>
                <button
                  type="button"
                  className={styles.transferBtn}
                  onClick={() => handleTransfer(t)}
                >
                  양도하기
                </button>
              </div>
            </article>
          ))}

          {visibleTickets.length === 0 && (
            <div className={styles.empty}>양도 가능한 티켓이 없어요.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TransferTicketPage;
