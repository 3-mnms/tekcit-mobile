import styles from './BookingPaymentHeader.module.css'

interface BookingPaymentHeaderProps {
  /** ⏱ 남은 시간 "MM:SS" (없으면 배지 숨김) 멍 */
  timeString?: string
  /** ⏰ 만료 여부(true면 '시간 만료' 표기) 멍 */
  expired?: boolean
  /** 🏷 제목(기본: '티켓 결제') 멍 */
  title?: string
  /** 🔙 뒤로가기 콜백(미지정 시 기본 history.back) 멍 */
  onBack?: () => void
  /** ❌ 닫기 콜백(미지정 시 기본 '/') 멍 */
  onClose?: () => void
}

const BookingPaymentHeader: React.FC<BookingPaymentHeaderProps> = ({
  timeString,
  expired = false,
  title = '티켓 결제',
  onBack,
  onClose,
}) => {
  // ✅ 기본 동작(콜백 미지정 시) 멍
  const handleBack = () => {
    if (onBack) return onBack()
    if (window.history.length > 1) window.history.back()
    else window.location.assign('/')
  }

  const handleClose = () => {
    if (onClose) return onClose()
    window.location.assign('/') // ⛳ 프로젝트 정책에 맞게 변경 가능 멍
  }

  return (
    <header className={styles.header} role="banner" aria-label="결제 상단 바">
      {/* 🔙 뒤로가기(항상 표시) 멍 */}
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="뒤로 가기"
        onClick={handleBack}
      >
        ‹
      </button>

      {/* 🏷 중앙 타이틀 멍 */}
      <h1 className={styles.title} aria-live="polite">
        {title}
      </h1>

      {/* ⏱ 우측: 타이머/만료 + 닫기 멍 */}
      <div className={styles.rightSlot}>
        {typeof timeString !== 'undefined' && (
          <span
            className={expired ? styles.badgeExpired : styles.badgeTimer}
            aria-live="polite"
            aria-atomic="true"
          >
            {expired ? '시간 만료' : timeString}
          </span>
        )}
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="닫기"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </header>
  )
}

export default BookingPaymentHeader
