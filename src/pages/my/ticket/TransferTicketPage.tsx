import React, { useEffect, useMemo, useState } from 'react';
import styles from './TransferTicketPage.module.css';
import MyHeader from '@/components/my/hedaer/MyHeader';
import { useNavigate } from 'react-router-dom';
import { useTicketsQuery } from '@/models/my/ticket/tanstack-query/useTickets';
import type { TransferListItem } from '@/models/my/ticket/ticketTypes';
import BeforeTransferTicket from '@/components/my/ticket/BeforeTransferTicket';

export const TRANSFER_DONE_EVENT = 'ticket:transferred';

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
            <BeforeTransferTicket
              key={t.reservationNumber}
              item={t}
              onTransfer={handleTransfer}
            />
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
