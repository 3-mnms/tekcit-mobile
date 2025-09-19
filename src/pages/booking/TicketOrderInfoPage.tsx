// src/pages/reservation/TicketOrderInfoPage.tsx  (모바일)
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './TicketOrderInfoPage.module.css';

import TicketInfoSection from '@/components/reservation/TicketInfoSection';
import TicketDeliverySelectSection, { type DeliveryMethod } from '@/components/reservation/TicketDeliverySelectSection';
import AddressForm from '@/components/payment/address/AddressForm';
import TicketBookerInfoSection from '@/components/reservation/TicketBookerInfoSection';
import OrderConfirmSection from '@/components/reservation/OrderConfirmSection';
import BookingProgress from '@/components/common/steps/BookingProgress';

import { usePhase2Detail, useSelectDelivery } from '@/models/booking/tanstack-query/useBookingDetail';
import { usePreReservation } from '@/models/booking/tanstack-query/useUser';
import { mapUiToBeDelivery } from '@/models/booking/bookingTypes';

type NavState = {
  fid: string;
  dateYMD: string;
  time: string;
  quantity: number;
  reservationNumber?: string;
};

const RESNO_KEY = 'reservationId';

// detail 안에 ticketPick/deliveryAvailabilityCode가 들어올 수 있어서
type AvailabilityLike = {
  ticketPick?: number;                // 1 | 2
  deliveryAvailabilityCode?: number;  // 1 | 2
};

const TicketOrderInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { fid: fidFromPath } = useParams<{ fid: string }>();
  const { state } = useLocation() as { state?: Partial<NavState> };
  const [sp] = useSearchParams();

  // 예매자 정보
  const { data: user } = usePreReservation(true);

  // 수령방법/주소
  const [method, setMethod] = useState<DeliveryMethod>('QR');
  const [address, setAddress] = useState('');
  const isPaper = method === 'PAPER';

  const fid = state?.fid || fidFromPath || '';

  // 예약번호: state > query(res|resNo) > sessionStorage
  const reservationNumber = useMemo(() => {
    const fromState = state?.reservationNumber;
    const fromQuery = sp.get('res') || sp.get('resNo') || undefined;
    const fromStorage =
      typeof window !== 'undefined'
        ? sessionStorage.getItem(RESNO_KEY) || undefined
        : undefined;

    const v = fromState || fromQuery || fromStorage;
    if (v && typeof window !== 'undefined') {
      sessionStorage.setItem(RESNO_KEY, v);
    }
    return v;
  }, [state?.reservationNumber, sp]);

  // Phase2 상세
  const { data: detail, isLoading, isError, error } = usePhase2Detail({
    festivalId: fid,
    reservationNumber: reservationNumber ?? '',
  });

  useEffect(() => {
    if (!fid || !reservationNumber) navigate(-1);
  }, [fid, reservationNumber, navigate]);

  if (!fid || !reservationNumber) return null;

  // 화면 표시값
  const display = useMemo(() => {
    const perf = detail?.performanceDate; // "YYYY-MM-DDTHH:mm:ss"
    const [d, tFull] = perf ? perf.split('T') : [state?.dateYMD, state?.time];

    const date = d ?? '';
    const time = (tFull ?? '').slice(0, 5) || state?.time || '';
    const unitPrice = detail?.ticketPrice ?? 0;
    const quantity = detail?.ticketCount ?? state?.quantity ?? 1;
    const posterUrl = detail?.posterFile;
    const title = detail?.festivalName;

    return { posterUrl, title, date, time, unitPrice, quantity };
  }, [detail, state]);

  const perfDateISO = useMemo(() => {
    if (!display.date || !display.time) return '';
    return `${display.date}T${display.time}:00`;
  }, [display.date, display.time]);

  // ✅ ticketPick 계산: detail.ticketPick / deliveryAvailabilityCode 우선 사용
  const ticketPick: 1 | 2 = useMemo(() => {
    const shape = detail as AvailabilityLike | undefined;
    const code = shape?.ticketPick ?? shape?.deliveryAvailabilityCode ?? 1;
    return code === 2 ? 2 : 1;
  }, [detail]);

  // 수령방법 저장 훅
  const { mutate: saveDelivery, isPending: isSaving } = useSelectDelivery();

  // 라디오 변경
  const handleMethodChange = (m: DeliveryMethod | null) => {
    const next = m ?? 'QR';
    setMethod(next);
    if (!reservationNumber) return;
    if (next === 'QR') {
      saveDelivery({
        festivalId: fid,
        reservationNumber,
        deliveryMethod: mapUiToBeDelivery('QR'),
      });
    }
  };

  // PAPER 주소 저장
  const handleAddressSubmit = (addr: string) => {
    const trimmed = (addr || '').trim();
    setAddress(trimmed);
    if (!trimmed || !reservationNumber) return;
    saveDelivery({
      festivalId: fid,
      reservationNumber,
      deliveryMethod: 'PAPER',
      address: trimmed,
    });
  };

  // 결제 이동
  const handlePay = () => {
    const bookingId = reservationNumber;

    const payload = {
      bookingId,
      festivalId: fid,
      posterUrl: display.posterUrl,
      title: display.title,
      performanceDate: perfDateISO,
      unitPrice: display.unitPrice,
      quantity: display.quantity,
      bookerName: user?.name ?? '',
      deliveryMethod: method,
      address: method === 'PAPER' ? address : undefined,
    };

    try {
      if (bookingId) {
        sessionStorage.setItem(`payment:${bookingId}`, JSON.stringify(payload));
      } else {
        sessionStorage.setItem('payment:latest', JSON.stringify(payload));
      }
      sessionStorage.setItem(RESNO_KEY, bookingId ?? '');
    } catch { }

    navigate('/payment', { state: payload });
  };

  const showDetailLoading = isPaper && isLoading;
  const showDetailError = isPaper && isError;

  return (
    <div className={styles.page}>
      <BookingProgress current={2} />

      <div className={styles.stack}>
        {/* 예매 정보 카드 */}
        <section>
          <TicketInfoSection
            compact
            posterUrl={display.posterUrl}
            title={display.title}
            date={display.date}
            time={display.time}
            quantity={display.quantity}
            unitPrice={display.unitPrice}
            className={styles.noScroll}
          />
        </section>

        {/* 수령방법 */}
        <section>
          <TicketDeliverySelectSection
            value={method}
            onChange={handleMethodChange}
            loading={isSaving}
            ticketPick={ticketPick}   // ✅ 2면 QR만
          />
        </section>

        {/* PAPER일 때 배송지 */}
        {isPaper && (
          <section className={styles.card}>
            <AddressForm onSubmit={handleAddressSubmit} />
            {showDetailLoading && <p className={styles.noScroll}>상세 불러오는 중…</p>}
            {showDetailError && (
              <p className={styles.noScroll} aria-live="polite">
                상세 불러오기 실패: {(error as Error)?.message ?? '에러'}
              </p>
            )}
          </section>
        )}

        {/* 예매자 정보 */}
        <section>
          <TicketBookerInfoSection className={styles.noScroll} />
        </section>

        {/* 합계 / 결제 버튼 */}
        <section className={styles.confirm}>
          <OrderConfirmSection
            unitPrice={display.unitPrice}
            quantity={display.quantity}
            method={method}
            festivalId={fid}
            posterUrl={display.posterUrl}
            title={display.title}
            performanceDate={display.date}
            performanceTime={display.time}
            reservationNumber={reservationNumber!}
            bookerName={user?.name ?? ''}
            onPay={handlePay}
          />
        </section>
      </div>
    </div>
  );
};

export default TicketOrderInfoPage;
