import React from 'react';
import styles from './TransferTicketInfo.module.css';

type Props = {
  ticket: {
    festivalName: string;
    date: string;
    time: string;
    venue: string;
    seat?: string | null;
    grade?: string | null;
    delivery: 'QR' | 'PAPER';
    price: number;
    posterUrl?: string;
  };
  /** 선택: 예매번호/매수 등 추가 메타 */
  extra?: {
    reservationNo?: string;
    count?: number;
  };
};

const TransferTicketInfo: React.FC<Props> = ({ ticket, extra }) => {
  const deliveryText = ticket.delivery === 'QR' ? '모바일 QR' : '지류';

  return (
    <section className={styles.card} aria-labelledby="ticket-info-title">
      <div className={styles.headerRow}>
        <div className={styles.thumbWrap}>
          {ticket.posterUrl ? (
            <img src={ticket.posterUrl} alt={ticket.festivalName} className={styles.thumb} />
          ) : (
            <div className={styles.thumbEmpty}>포스터</div>
          )}
        </div>

        <div className={styles.headerMeta}>
          <strong className={styles.festival}>{ticket.festivalName}</strong>
          <div className={styles.sub}>
            {ticket.date} {ticket.time} {ticket.venue}
          </div>
        </div>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      <dl className={styles.infoGrid}>
        {extra?.reservationNo && (
          <>
            <dt className={styles.k}>예매번호</dt>
            <dd className={styles.v}>{extra.reservationNo}</dd>
          </>
        )}
        {typeof extra?.count === 'number' && (
          <>
            <dt className={styles.k}>매수</dt>
            <dd className={styles.v}>{extra.count}매</dd>
          </>
        )}

        <dt className={styles.k}>수령</dt>
        <dd className={styles.v}>{deliveryText}</dd>

        <dt className={styles.k}>가격</dt>
        <dd className={`${styles.v} ${styles.price}`}>{ticket.price.toLocaleString()}원</dd>
      </dl>
    </section>
  );
};

export default TransferTicketInfo;
