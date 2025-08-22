import styles from './TransferPaymentFooter.module.css'

interface TransferPaymentFooterProps {
  /** 🎫 단가 멍 */
  unitPrice: number
  /** 🔢 매수 멍 */
  quantity: number
  /** 🚚 배송비(없으면 0) 멍 */
  shippingFee?: number
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

const TransferPaymentFooter: React.FC<TransferPaymentFooterProps> = ({
  unitPrice,
  quantity,
  shippingFee = 0,
  onPay,
  disabled = false,
  loading = false,
  prefixLabel = '총',
  actionLabel = '결제하기',
  ariaLabel = '결제 작업 바',
}) => {
  // ✅ 총 결제 금액 계산 (단가 × 매수 + 배송비) 멍
  const totalAmount = unitPrice * quantity + shippingFee

  // ✅ 원화 포맷 유틸 멍
  const asKRW = (n: number) =>
    n.toLocaleString('ko-KR')

  return (
    <div className={styles.footer} role="region" aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.payBtn}
        onClick={onPay}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {loading
          ? '처리 중…'
          : `${prefixLabel} ${asKRW(totalAmount)}원 ${actionLabel}`}
      </button> 
    </div>
  )
}

export default TransferPaymentFooter
