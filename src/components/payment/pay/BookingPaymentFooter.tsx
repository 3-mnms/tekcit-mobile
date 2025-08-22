import styles from './BookingPaymentFooter.module.css'

interface PaymentFooterProps {
  /** 💰 결제 금액(숫자) 멍 */
  amount: number
  /** ▶ 버튼 클릭 핸들러 멍 */
  onPay: () => void
  /** ⛔ 버튼 비활성화 여부 멍 */
  disabled?: boolean
  /** ⏳ 로딩 상태(스피너 대신 텍스트 변경) 멍 */
  loading?: boolean
  /** 🏷 좌측 프리픽스(기본: '총') 멍 */
  prefixLabel?: string
  /** 🏷 우측 서픽스(기본: '결제하기') 멍 */
  actionLabel?: string
  /** 🦻 푸터 영역 접근성 라벨 멍 */
  ariaLabel?: string
}

const PaymentFooter: React.FC<PaymentFooterProps> = ({
  amount,
  onPay,
  disabled = false,
  loading = false,
  prefixLabel = '총',
  actionLabel = '결제하기',
  ariaLabel = '결제 작업 바',
}) => {
  // ✅ 원화 포맷 유틸 멍
  const asKRW = (n: number) => n.toLocaleString('ko-KR')

  return (
    <div className={styles.footer} role="region" aria-label={ariaLabel}>
      {/* 🔘 라운드 풀폭 버튼: 스샷과 동일한 단일 CTA 구조 멍 */}
      <button
        type="button"
        className={styles.payBtn}
        onClick={onPay}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {/* 📣 로딩이면 텍스트만 교체하여 시각적 일관성 유지 멍 */}
        {loading
          ? '처리 중…'
          : `${prefixLabel} ${asKRW(amount)}원 ${actionLabel}`}
      </button>
    </div>
  )
}

export default PaymentFooter
