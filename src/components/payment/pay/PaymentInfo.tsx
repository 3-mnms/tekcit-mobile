// 📄 src/components/payment/pay/PaymentInfo.tsx
// - 주문 요약 카드(포스터/타이틀/일시 + 금액/매수/배송비 표시)
// - 웹 버전 데이터 수신 방식 적용 (useLocation state)
// - 모바일 UI 구조 유지

import React from 'react'
import { useLocation } from 'react-router-dom'
import styles from './PaymentInfo.module.css'

// ✅ 수령 방법 타입(ReceiveInfo와 호환)
export type ReceiveType = 'QR' | 'DELIVERY' | 'COURIER'

// ✅ 웹 버전과 동일한 state 타입
interface PaymentInfoState {
  bookingId: string
  festivalId: string
  posterUrl?: string
  title: string
  performanceDate: string
  unitPrice: number
  quantity: number
  bookerName?: string
  deliveryMethod: string // 'QR' | 'DELIVERY'
  reservationNumber?: string
}

// ✅ 통화 포맷 유틸(원화)
const asKRW = (n: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace('₩', '') + '원'

// ✅ 수령 방법 한글 라벨 변환
const receiveLabel = (deliveryMethod: string) =>
  deliveryMethod === 'QR' ? '모바일 QR' : '택배 배송'

const PaymentInfo: React.FC = () => {
  // ✅ 웹 버전과 동일한 라우터 state 수신
  const location = useLocation()
  const state = location.state as PaymentInfoState | undefined

  // 데이터 없으면 표시
  if (!state) {
    return (
      <div className={styles.card}>
        <p>결제 정보가 없습니다.</p>
      </div>
    )
  }

  // ✅ 여기부터는 state가 정의됨 (TS가 타입을 좁힘)
  const { 
    posterUrl, 
    title, 
    performanceDate, 
    unitPrice, 
    quantity, 
    bookerName, 
    deliveryMethod 
  } = state

  // ✅ 배송 방식 여부(배송: DELIVERY/COURIER)
  const isDelivery = deliveryMethod === 'DELIVERY' || deliveryMethod === 'COURIER'
  
  // ✅ 배송비 계산 (배송 방식일 때만)
  const shippingFee = isDelivery ? 3200 : 0
  
  // ✅ 총 결제 금액 계산
  const total = unitPrice * quantity + shippingFee

  return (
    <div className={styles.card}>
      {/* ─ 헤더(포스터 + 타이틀/일시) ─ */}
      <div className={styles.header}>
        <div className={styles.posterBox} aria-hidden={!posterUrl}>
          {posterUrl ? (
            <img src={posterUrl} alt="공연 포스터" className={styles.poster} />
          ) : (
            <div className={styles.posterPlaceholder} />
          )}
        </div>
        <div className={styles.titleBox}>
          <p className={styles.title}>{title}</p>
          <p className={styles.sub}>{performanceDate}</p>
          {/* 수령 방법 뱃지(시각 보조용) */}
          <span className={styles.badge}>{receiveLabel(deliveryMethod)}</span>
        </div>
      </div>

      {/* ─ 정보 표 ─ */}
      <div className={styles.table}>
        <div className={styles.row}>
          <span className={styles.label}>예매자</span>
          <span className={styles.value}>{bookerName || '자동입력'}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>수령 방법</span>
          <span className={styles.value}>
            {deliveryMethod === 'QR' ? 'QR 티켓' : 'QR 티켓과 지류 티켓 배송'}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>매수</span>
          <span className={styles.value}>{quantity}매</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>티켓 금액</span>
          <span className={styles.value}>{asKRW(unitPrice)}</span>
        </div>

        {/* ✅ 총 결제 금액: 프론트 계산 값 */}
        <div className={`${styles.row} ${styles.totalRow}`}>
          <span className={styles.labelTotal}>총 결제</span>
          <span className={styles.valueTotal}>{asKRW(total)}</span>
        </div>
      </div>

      {/* ✅ 약관 안내 */}
      <div className={styles.notice}>
        결제 진행 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        <button className={styles.linkBtn}>[상세보기]</button>
      </div>
    </div>
  )
}

export default PaymentInfo