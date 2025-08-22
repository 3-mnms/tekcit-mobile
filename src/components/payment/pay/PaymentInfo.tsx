// 📄 src/components/payment/pay/PaymentInfo.tsx 멍
// - 주문 요약 카드(포스터/타이틀/일시 + 금액/매수/배송비 표시) 멍
// - props: receiveType, shippingFee(옵션) 추가 멍
// - 배송 방식일 때만 배송비 행을 표시하도록 조건부 렌더링 멍

import React from 'react'
import styles from './PaymentInfo.module.css'

// ✅ 수령 방법 타입(ReceiveInfo와 호환) 멍
export type ReceiveType = 'QR' | 'DELIVERY' | 'COURIER'

// ✅ 컴포넌트에 전달할 요약 정보 타입 멍
export interface PaymentSummaryProps {
  posterUrl?: string                     // 공연 포스터 URL 멍
  title: string                          // 공연 제목 멍
  dateTimeLabel: string                  // 일시(예: 2025.09.21 (일) 17:00) 멍
  unitPrice: number                      // 1매 금액 멍
  quantity: number                       // 매수 멍
  receiveType: ReceiveType               // ✅ 수령 방법(배송/QR) 멍
  shippingFee?: number                   // ✅ 배송비(옵션, 기본 0) 멍
  buyerName?: string                     // 예매자 이름(옵션) 멍
  festivalId?: string | number           // 페스티벌 ID(옵션: 표시는 기본 비노출) 멍
  showFestivalId?: boolean               // true면 ID도 표시 멍
}

// ✅ 통화 포맷 유틸(원화) 멍
const asKRW = (n: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace('₩', '') + '원'

// ✅ 수령 방법 한글 라벨 변환 멍
const receiveLabel = (t: ReceiveType) =>
  t === 'QR' ? '모바일 QR' : '택배 배송'

const PaymentInfo: React.FC<PaymentSummaryProps> = ({
  posterUrl,
  title,
  dateTimeLabel,
  unitPrice,
  quantity,
  receiveType,             // ✅ 추가 멍
  shippingFee = 0,         // ✅ 기본값 0 멍
  buyerName,
  festivalId,
  showFestivalId = false,  // 기본은 ID 비표시 멍
}) => {
  // ✅ 배송 방식 여부(배송: DELIVERY/COURIER) 멍
  const isDelivery = receiveType === 'DELIVERY' || receiveType === 'COURIER'

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
          <p className={styles.sub}>{dateTimeLabel}</p>
          {/* 수령 방법 뱃지(시각 보조용) 멍 */}
          <span className={styles.badge}>{receiveLabel(receiveType)}</span>
        </div>
      </div>

      {/* ─ 정보 표 ─ */}
      <div className={styles.table}>
        {showFestivalId && festivalId != null && (
          <div className={styles.row}>
            <span className={styles.label}>페스티벌 ID</span>
            <span className={styles.value}>{festivalId}</span>
          </div>
        )}

        {buyerName && (
          <div className={styles.row}>
            <span className={styles.label}>예매자</span>
            <span className={styles.value}>{buyerName}</span>
          </div>
        )}

        <div className={styles.row}>
          <span className={styles.label}>티켓 금액</span>
          <span className={styles.value}>{asKRW(unitPrice)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>매수</span>
          <span className={styles.value}>{quantity}매</span>
        </div>

        {/* ✅ 배송 방식일 때만 배송비 노출 멍 */}
        {isDelivery && (
          <div className={styles.row}>
            <span className={styles.label}>배송비</span>
            <span className={styles.value}>{asKRW(shippingFee)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentInfo
