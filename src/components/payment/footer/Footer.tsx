import styles from './Footer.module.css'

interface ActionFooterProps {
  /** 왼쪽 라벨/금액 등 (예: '총', '선택 항목') */
  prefix?: string | React.ReactNode
  /** 금액(옵션) - 전달되면 원화 포맷 적용 */
  amount?: number
  /** 버튼 라벨 (예: '결제하기', '저장하기') */
  actionLabel: string
  /** 버튼 클릭 핸들러 */
  onAction: () => void
  /** 비활성화 여부 */
  disabled?: boolean
  /** 로딩 여부 */
  loading?: boolean
  /** 푸터 영역 접근성 라벨 */
  ariaLabel?: string
}

const Footer: React.FC<ActionFooterProps> = ({
  prefix,
  amount,
  actionLabel,
  onAction,
  disabled = false,
  loading = false,
  ariaLabel = '작업 바',
}) => {
  // ✅ 원화 포맷 유틸
  const asKRW = (n: number) => n.toLocaleString('ko-KR')

  return (
    <div className={styles.footer} role="region" aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.payBtn}
        onClick={onAction}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {loading
          ? '처리 중…'
          : (
            <>
              {prefix && <span>{prefix} </span>}
              {typeof amount === 'number' && <span>{asKRW(amount)}원 </span>}
              {actionLabel}
            </>
          )}
      </button>
    </div>
  )
}

export default Footer
