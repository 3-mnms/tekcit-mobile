// src/pages/reservation/TicketOrderPage.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './TicketOrderPage.module.css';
import TicketOrderSection from '@/components/reservation/TicketOrderSection';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TicketOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { fid } = useParams<{ fid: string }>();

  const handleNext = ({ date, time, quantity }: { date: Date; time: string; quantity: number }) => {
    if (!fid) return;
    navigate(`/reservation/${fid}/order-info`, {
      state: { fid, dateYMD: ymd(date), time, quantity },
    });
  };

  return (
    <div className={styles.page}>
      {/* ✅ 새 스텝퍼 */}
      <header className={styles.progressBar} aria-label="예매 단계">
        <ol className={styles.stepper}>
          <li className={`${styles.step} ${styles.active}`}>
            <span className={styles.bullet} aria-hidden="true" />
            <span className={styles.label}>날짜/시간/매수</span>
          </li>
          <li className={styles.step}>
            <span className={styles.bullet} aria-hidden="true" />
            <span className={styles.label}>좌석/옵션</span>
          </li>
          <li className={styles.step}>
            <span className={styles.bullet} aria-hidden="true" />
            <span className={styles.label}>결제</span>
          </li>
        </ol>
      </header>

      <main className={styles.main}>
        <TicketOrderSection
          fid={fid}
          onNext={handleNext}
          pricePerTicket={88000}
          maxQuantity={4}
          hideHeader
        />
      </main>
    </div>
  );
};

export default TicketOrderPage;
