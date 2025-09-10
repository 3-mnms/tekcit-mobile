import { useLocation } from 'react-router-dom'
import styles from './PaymentInfo.module.css'

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
  
  // ✅ 총 결제 금액 계산
  const total = unitPrice * quantity

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
          <span className={styles.value}>{unitPrice.toLocaleString()}</span>
        </div>

        {/* ✅ 총 결제 금액: 프론트 계산 값 */}
        <div className={`${styles.row} ${styles.totalRow}`}>
          <span className={styles.labelTotal}>총 결제</span>
          <span className={styles.valueTotal}>{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default PaymentInfo