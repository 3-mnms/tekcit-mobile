// src/components/reservation/OrderConfirmSection.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/button/Button'; // ← 모바일 쪽 경로 유지
import type { DeliveryMethod } from '@/components/reservation/TicketDeliverySelectSection';
import styles from './OrderConfirmSection.module.css';

import {
  apiReserveTicket,
  apiSelectDelivery,
  mapUiDeliveryToBE,
  type IssueQrRequest,
} from '@api/booking/bookingApi';

type Props = {
  unitPrice: number;
  quantity: number;
  method?: DeliveryMethod;           // 'QR' | 'PAPER'
  festivalId?: string;
  posterUrl?: string;
  title?: string;
  performanceDate?: string;          // YYYY-MM-DD
  performanceTime?: string;          // HH:mm
  bookerName?: string;
  reservationNumber?: string;        // = bookingId (웹의 bookingId와 동일 개념)
  className?: string;
};

const toLocalDateTimeISO = (dateYmd?: string, timeHm?: string) => {
  if (!dateYmd || !timeHm) return undefined;
  const hhmmss = timeHm.length === 5 ? `${timeHm}:00` : timeHm; // HH:mm:ss 보장
  return `${dateYmd}T${hhmmss}`;
};

const RESNO_KEY = 'reservationId';
const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n) + '원';

const OrderConfirmSection: React.FC<Props> = ({
  unitPrice,
  quantity,
  method,
  festivalId,
  posterUrl,
  title,
  performanceDate,
  performanceTime,
  bookerName,
  reservationNumber,
  className = '',
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { total } = useMemo(() => {
    const subtotal = (unitPrice || 0) * (quantity || 0);
    return { total: subtotal };
  }, [unitPrice, quantity]);

  const handlePayClick = async () => {
    // bookingId: props > sessionStorage
    const ssResNo =
      (typeof window !== 'undefined' && sessionStorage.getItem(RESNO_KEY)) || undefined;
    const finalBookingId = reservationNumber ?? ssResNo;

    if (!finalBookingId) {
      alert('결제 식별자(bookingId)를 찾을 수 없어요. 뒤로 가서 다시 시도해 주세요.');
      return;
    }
    if (!festivalId) {
      alert('공연 식별자(festivalId)가 없어요.');
      return;
    }

    const performanceDateTime = toLocalDateTimeISO(performanceDate, performanceTime);
    if (!performanceDateTime) {
      alert('공연 시작시간 형식이 올바르지 않아요.');
      return;
    }

    // 결제 페이지로 넘길 payload (웹과 동일 구조)
    const payload = {
      bookingId: finalBookingId,
      festivalId,
      posterUrl,
      title,
      performanceDate: performanceDateTime, // full datetime
      unitPrice,
      quantity,
      bookerName,
      deliveryMethod: method ?? 'QR',
    };

    // 사전 백업
    try {
      sessionStorage.setItem(`payment:${finalBookingId}`, JSON.stringify(payload));
      sessionStorage.setItem(RESNO_KEY, finalBookingId);
      sessionStorage.setItem('payment:last', JSON.stringify(payload));
    } catch { }

    if (loading) return;
    setLoading(true);

    try {
      // 1) 수령방법 설정
      const delivery = mapUiDeliveryToBE((method ?? 'QR') as 'QR' | 'PAPER'); // 'QR' -> 'MOBILE'
      await apiSelectDelivery({
        festivalId,
        reservationNumber: String(finalBookingId),
        deliveryMethod: delivery, // 'MOBILE' | 'PAPER'
      });

      // 2) QR 발권
      const req: IssueQrRequest = {
        festivalId,
        reservationNumber: String(finalBookingId),
        performanceDate: performanceDateTime, // 예: "2025-09-23T17:00:00"
      };
      await apiReserveTicket(req);

      // 3) 결제 페이지 이동
      navigate('/payment', { state: payload });
    } catch (e: any) {
      console.error('[발권 실패]', e?.response?.data || e);
      alert(
        e?.response?.data?.errorMessage ||
        e?.response?.data?.message ||
        '발권에 실패했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${styles.section} ${className}`}>
      <h2 className={styles.title}>총 가격</h2>

      <div className={styles.priceBox}>
        <div className={styles.row}>
          <span className={styles.label}>가격 × 수량</span>
          <span className={styles.value}>
            {fmt(unitPrice)} × {quantity}매
          </span>
        </div>

        <div className={`${styles.row} ${styles.totalRow}`}>
          <span className={styles.label}>합계</span>
          <span className={styles.total}>{fmt(total)}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handlePayClick}
        className={styles.payButton}
        disabled={loading}
      >
        {loading ? '처리 중…' : '결제하기'}
      </Button>
    </section>
  );
};

export default OrderConfirmSection;
