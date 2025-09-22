import React from 'react';
import styles from './BeforeTransferTicket.module.css';
import type { TransferListItem } from '@/models/my/ticket/ticketTypes';

type Props = {
  item: TransferListItem;
  onTransfer: (reservationNumber: string) => void;
};

const BeforeTransferTicket: React.FC<Props> = ({ item, onTransfer }) => {
  const posterSrc = item.posterFile ? encodeURI(item.posterFile) : '';
  return (
    <article
      className={styles.card}
      aria-label={`${item.title} 티켓`}
    >
      <div className={styles.left}>
        <img
        src={posterSrc}
        alt={item.posterFile}
        className={styles.poster}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '@/shared/assets/placeholder-poster.png';
        }}
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
          onClick={() => onTransfer(item.reservationNumber)}
        >
          양도하기
        </button>
      </div>
    </article>
  );
};

export default BeforeTransferTicket;
