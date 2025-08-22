import styles from './BookingProductInfo.module.css'

// ✅ 수령 방법 타입(ReceiveInfo와 호환) 멍
export type ReceiveType = 'QR' | 'DELIVERY' | 'COURIER'

// ✅ 컴포넌트에 전달할 요약 정보 타입 멍
export interface PaymentSummaryProps {
  posterUrl?: string                // 공연 포스터 URL 멍
  title: string                     // 공연 제목 멍
  dateTimeLabel: string             // 일시(예: 2025.09.21 (일) 17:00) 멍
  unitPrice: number                 // 1매 금액 멍
  quantity: number                  // 매수 멍
  receiveType: ReceiveType          // ✅ 수령 방법(배송/QR) 멍
  shippingFee?: number              // ✅ 배송비(옵션, 기본 0) 멍
  Transferor: string                // 양도자 이름 멍
  Transferee: string                // 양수자 이름 멍
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
const receiveLabel = (t: ReceiveType) => (t === 'QR' ? '모바일 QR' : '택배 배송')

const BookingProductInfo: React.FC<PaymentSummaryProps> = ({
  posterUrl,
  title,
  dateTimeLabel,
  unitPrice,
  quantity,
  receiveType,
  shippingFee = 0,
  Transferor,
  Transferee,
}) => {
  // ✅ 배송 방식 여부(배송: DELIVERY/COURIER) 멍
  const isDelivery = receiveType === 'DELIVERY' || receiveType === 'COURIER'

  // ✅ 금액 계산: (단가 × 매수) + (배송비는 배송일 때만) 멍
  const productSubtotal = unitPrice * quantity
  const appliedShipping = isDelivery ? shippingFee : 0
  const totalAmount = productSubtotal + appliedShipping

  return (
    <div className={styles.card}>
      {/* ─ 헤더(포스터 + 타이틀/일시/배지) ─ */}
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
          <span className={styles.badge}>{receiveLabel(receiveType)}</span>
        </div>
      </div>

      {/* ─ 정보 표 ─ */}
      <div className={styles.table}>
        {/* 금액/매수 */}
        <div className={styles.row}>
          <span className={styles.label}>티켓 금액</span>
          <span className={styles.value}>{asKRW(unitPrice)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>매수</span>
          <span className={styles.value}>{quantity}매</span>
        </div>

        {/* ✅ 배송 방식일 때만 배송비 노출 멍 (QR이면 자동 숨김) */}
        {isDelivery && (
          <div className={styles.row}>
            <span className={styles.label}>배송비</span>
            <span className={styles.value}>{asKRW(appliedShipping)}</span>
          </div>
        )}

        {/* 양도자/양수자 */}
        <div className={styles.row}>
          <span className={styles.label}>양도자</span>
          <span className={styles.value}>{Transferor}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>양수자</span>
          <span className={styles.value}>{Transferee}</span>
        </div>

        {/* ✅ 총 결제 금액(배송비 포함 계산값) 강조 행 멍 */}
        <div className={`${styles.row} ${styles.totalRow}`} aria-live="polite">
          <span className={`${styles.label} ${styles.totalLabel}`}>총 결제 금액</span>
          <strong className={`${styles.value} ${styles.totalValue}`}>
            {asKRW(totalAmount)}
          </strong>
        </div>
      </div>
    </div>
  )
}

export default BookingProductInfo
