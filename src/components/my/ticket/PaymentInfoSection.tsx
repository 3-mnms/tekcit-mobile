import React from 'react';
import styles from './PaymentInfoSection.module.css';

const PaymentInfoSection: React.FC = () => {
  const payment = {
    bookedAt: '2025.07.01',
    method: '무통장 입금',
    bookingStatus: '예매',  
    payStatus: '결제',   
    bookingNo: 'A123456',
    price: '110,000원',
    fee: '1,000원',
    shipping: '2,500원',
    total: '113,500원',
  };

  return (
    <section className={styles.card} aria-label="결제 내역">
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.k}>예매일</span>
          <span className={styles.v}>{payment.bookedAt}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>결제수단</span>
          <span className={styles.v}>{payment.method}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>현재상태</span>
          <span className={styles.v}>
            <span className={`${styles.badge} ${styles.neutral}`}>{payment.bookingStatus}</span>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>결제상태</span>
          <span className={styles.v}>
            <span className={`${styles.badge} ${styles.success}`}>{payment.payStatus}</span>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>예매번호</span>
          <span className={styles.v}>{payment.bookingNo}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>가격</span>
          <span className={`${styles.v} ${styles.em}`}>{payment.price}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.summary}>
        <div className={styles.sumRow}>
          <span>예매 수수료</span>
          <span>{payment.fee}</span>
        </div>
        <div className={styles.sumRow}>
          <span>배송비</span>
          <span>{payment.shipping}</span>
        </div>
        <div className={`${styles.sumRow} ${styles.total}`}>
          <span>총 결제금액</span>
          <span>{payment.total}</span>
        </div>
      </div>
    </section>
  );
};

export default PaymentInfoSection;
