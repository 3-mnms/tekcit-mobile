import styles from './TransferPaymentHeader.module.css'

interface TransferPaymentHeaderProps {
  title?: string
  onBack?: () => void
  onClose?: () => void
}

const TransferPaymentHeader: React.FC<TransferPaymentHeaderProps> = ({
  title = '양도 결제',
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

      <div className={styles.rightSlot}>
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

export default TransferPaymentHeader
