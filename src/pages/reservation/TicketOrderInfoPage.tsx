// src/pages/reservation/TicketOrderInfoPage.tsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './TicketOrderInfoPage.module.css';

import TicketInfoSection from '@/components/reservation/TicketInfoSection';
import TicketDeliverySelectSection, { type DeliveryMethod } from '@/components/reservation/TicketDeliverySelectSection';
import AddressForm from '@/components/payment/address/AddressForm';
import TicketBookerInfoSection from '@/components/reservation/TicketBookerInfoSection';
import OrderConfirmSection from '@/components/reservation/OrderConfirmSection';

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
    if (fid) navigate(`/reservation/${fid}/pay`, { state });
  };

  return (
    <div className={styles.page}>
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
