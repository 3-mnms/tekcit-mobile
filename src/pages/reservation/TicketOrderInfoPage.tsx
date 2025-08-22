// src/pages/reservation/TicketOrderInfoPage.tsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './TicketOrderInfoPage.module.css';
import orderStyles from './TicketOrderPage.module.css';

import TicketInfoSection from '@/components/reservation/TicketInfoSection';
import TicketDeliverySelectSection, { type DeliveryMethod } from '@/components/reservation/TicketDeliverySelectSection';
import AddressForm from '@/components/payment/address/AddressForm';
import TicketBookerInfoSection from '@/components/reservation/TicketBookerInfoSection';
import OrderConfirmSection from '@/components/reservation/OrderConfirmSection';
import BookingPaymentHeader from '@/components/payment/pay/BookingPaymentHeader'

type NavState = { fid: string; dateYMD: string; time: string; quantity: number; };
const UNIT_PRICE = 88000;

const TicketOrderInfoPage: React.FC = () => {
  const { state } = useLocation() as { state?: NavState };
  const navigate = useNavigate();
  const { fid } = useParams<{ fid: string }>();

  const [method, setMethod] = React.useState<DeliveryMethod>('QR');
  const isPaper = method === 'PAPER';
  const qty = state?.quantity ?? 1;

  const handlePay = () => {
    if (fid) navigate(`/payment`, { state });
  };

  return (
    <div className={styles.page}>
      <header className={orderStyles.progressBar} aria-label="예매 단계">
        <ol className={orderStyles.stepper}>
          <li className={orderStyles.step}>
            <span className={orderStyles.bullet} aria-hidden="true" />
            <span className={orderStyles.label}>날짜/시간/매수</span>
          </li>
          <li className={`${orderStyles.step} ${orderStyles.active}`}>
            <span className={orderStyles.bullet} aria-hidden="true" />
            <span className={orderStyles.label}>수령방법/주문자 확인</span>
          </li>
          <li className={orderStyles.step}>
            <span className={orderStyles.bullet} aria-hidden="true" />
            <span className={orderStyles.label}>결제</span>
          </li>
        </ol>
      </header>
   
      <div className={styles.stack}>
        <section className={styles.card}>
          <TicketInfoSection
            compact
            date={state?.dateYMD}
            time={state?.time}
            quantity={qty}
            unitPrice={UNIT_PRICE}
            className={styles.noScroll}
          />
        </section>

        <section className={styles.card}>
          <TicketDeliverySelectSection value={method} onChange={setMethod} />
        </section>

        {isPaper && (
          <section className={styles.card}>
            <AddressForm />
          </section>
        )}

        <section className={styles.card}>
          <TicketBookerInfoSection className={styles.noScroll} />
        </section>

        <section className={`${styles.card} ${styles.confirm}`}>
          <OrderConfirmSection
            unitPrice={UNIT_PRICE}
            quantity={qty}
            onPay={handlePay}
            className={styles.noScroll}
          />
        </section>
        
      </div>
      
    </div>
  );
};

export default TicketOrderInfoPage;
