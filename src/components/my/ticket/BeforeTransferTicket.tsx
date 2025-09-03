import React from 'react';
import styles from './BeforeTransferTicket.module.css';
import { useTicketDetailQuery } from '@/models/my/ticket/tanstack-query/useTickets';
import type { TransferListItem } from '@/models/my/ticket/ticketTypes';

type Props = {
  item: TransferListItem;
  onTransfer: (row: TransferListItem) => void;
};

const Poster: React.FC<{ reservationNumber: string; alt: string; className?: string }> = ({
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

const BeforeTransferTicket: React.FC<Props> = ({ item, onTransfer }) => {
  return (
    <article
      className={styles.card}
      aria-label={`${item.title} 티켓`}
    >
      {/* 좌측: 포스터 */}
      <div className={styles.left}>
        <Poster
          reservationNumber={item.reservationNumber}
          alt={`${item.title} 포스터`}
          className={styles.poster}
        />
      </div>

      {/* 중앙: 정보 */}
      <div className={styles.center}>
        <div className={styles.row}>
          <span className={styles.k}>예매일</span>
          <span className={styles.v}>{item.date}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>예매번호</span>
          <span className={styles.v}>{item.number}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>공연명</span>
          <span className={styles.v}>{item.title}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>일시</span>
          <span className={styles.v}>{item.dateTime}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>매수</span>
          <span className={styles.v}>{item.count}</span>
        </div>
      </div>

      {/* 우측: 액션 */}
      <div className={styles.right}>
        <button
          type="button"
          className={styles.transferBtn}
          onClick={() => onTransfer(item)}
        >
          양도하기
        </button>
      </div>
    </article>
  );
};

export default BeforeTransferTicket;
