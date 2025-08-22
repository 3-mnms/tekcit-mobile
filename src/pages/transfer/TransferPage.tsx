import React, { useMemo } from 'react';
import styles from './TransferPage.module.css';
import TransferTicketInfo from '@/components/transfer/TransferTicketInfo';
import TransferRefundGuide from '@/components/transfer/TransferRefundGuide';
import TransferRecipientForm from '@/components/transfer/TransferRecipientForm';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import MyHeader from '@/components/my/hedaer/MyHeader';

type TransferInfoShape = {
  festivalName: string;
  date: string;
  time: string;
  venue: string;
  seat: string;
  grade: string;
  delivery: 'QR' | 'PAPER';
  price: number;
  posterUrl: string;
};

type TicketFromList = {
  id: number;
  date: string;
  number: string;
  title: string;
  time: string;
  count: number;
  status: '결제 완료' | '결제 대기' | '취소 완료';
  imageUrl: string;
  isTransferred: boolean;
};

const mockTicket: TransferInfoShape = {
  festivalName: '그랜드 민트 페스티벌 2025',
  date: '2025-10-18',
  time: '18:00',
  venue: '올림픽공원 88잔디마당',
  seat: 'A구역 12열 14번',
  grade: 'VIP',
  delivery: 'QR',
  price: 165000,
  posterUrl: '',
};

const TransferPage: React.FC = () => {
  const { state } = useLocation() as { state?: { ticket?: TicketFromList } };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ticketForInfo: TransferInfoShape = useMemo(() => {
    const t = state?.ticket;
    if (!t) return mockTicket;
    const [dt, tm] = t.time.split(' ');
    return {
      festivalName: t.title,
      date: dt ?? '',
      time: tm ?? '',
      venue: '',
      seat: '',
      grade: '',
      delivery: 'QR',
      price: 0,
      posterUrl: t.imageUrl || '',
    };
  }, [state]);

  return (
    <section className={styles.page}>
      <MyHeader title="티켓 양도" />

      <div className={styles.body}>
        <h2 id="ticket-info-title" className={styles.title}>양도 · 티켓 정보</h2>
        <section>
          <TransferTicketInfo ticket={ticketForInfo} />
        </section>

        <h2 id="ticket-info-title" className={styles.title}>양도/환불 안내</h2>
        <section>
          <TransferRefundGuide />
        </section>

        <h2 id="ticket-info-title" className={styles.title}>양도자 선택</h2>
        <section>
          <TransferRecipientForm />
        </section>
      </div>
    </section>
  );
};

export default TransferPage;
