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

const TicketOrderInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { fid: fidFromPath } = useParams<{ fid: string }>();
  const { state } = useLocation() as { state?: Partial<NavState> };
  const [sp] = useSearchParams();

  // 예매자 정보(이름 등)
  const { data: user } = usePreReservation(true);

  // 수령방법/주소 (모바일 UI는 그대로)
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

  // 화면 표시값(서버 우선, 부족하면 state 보조)
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

  // 수령방법 저장 훅
  const { mutate: saveDelivery, isPending: isSaving } = useSelectDelivery();

  // 라디오 변경: QR이면 즉시 저장, PAPER는 주소 제출 시 저장
  const handleMethodChange = (m: DeliveryMethod | null) => {
    const next = m ?? 'QR';
    setMethod(next);
    if (!reservationNumber) return;
    if (next === 'QR') {
      saveDelivery({
        festivalId: fid,
        reservationNumber,
        deliveryMethod: mapUiToBeDelivery('QR'), // UI→BE 매핑(MOBILE)
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

  // 결제 이동(결제 페이지에서 사용할 페이로드 세션에 캐시)
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
      deliveryMethod: method,                       // 'QR' | 'PAPER' (API 유지)
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
  // PAPER일 때만 로딩/에러 문구 노출(모바일 UI는 그대로)
  const showDetailLoading = isPaper && isLoading;
  const showDetailError = isPaper && isError;

  return (
    <div className={styles.page}>
      <BookingProgress current={2} />

      <div className={styles.stack}>
        {/* 예매 정보 카드 */}
        <section className={styles.card}>
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
        <section className={styles.card}>
          <TicketDeliverySelectSection
            value={method}
            onChange={handleMethodChange}
            loading={isSaving}
          />
        </section>

        {/* PAPER일 때 배송지 */}
        {isPaper && (
          <section className={styles.card}>
            <AddressForm onSubmit={handleAddressSubmit} />
            {showDetailLoading && <p className={styles.noScroll}>상세 불러오는 중…</p>}
            {showDetailError && (
              <p className={styles.noScroll} aria-live="polite">
                상세 불러오기 실패: {(error as any)?.message ?? '에러'}
              </p>
            )}
          </section>
        )}

        {/* 예매자 정보 */}
        <section className={styles.card}>
          <TicketBookerInfoSection className={styles.noScroll} />
        </section>

        {/* 합계 / 결제 버튼 */}
        <section className={`${styles.card} ${styles.confirm}`}>
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
