import styles from './paymentTotal.module.css'

interface PaymentTotalProps {
  // ── 결제 정보
  ticketAmount: number

  // ── 약관 동의
  allAgreed?: boolean
  onChangeAllAgreed?: (next: boolean) => void
  onOpenCancelPolicy?: () => void
  onOpenPrivacy3rd?: () => void
}

/** 통화 포맷(원화) */
const asWon = (n: number) =>
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n) + '원'

const PaymentTotal: React.FC<PaymentTotalProps> = ({
  ticketAmount,
  allAgreed = false,
  onChangeAllAgreed,
  onOpenPrivacy3rd,
}) => {
  const finalAmount = ticketAmount

  return (
    <div className={styles.wrap}>
      {/* ───────────── 결제 정보 ───────────── */}
      <section className={styles.section}>
        <div className={styles.payTable}>
          <div className={styles.payRow}>
            <span className={styles.payLabel}>티켓금액</span>
            <span className={styles.payValue}>{asWon(ticketAmount)}</span>
          </div>
          <hr className={styles.sep} />
          <div className={styles.finalRow}>
            <span className={styles.finalLabel}>최종 결제금액</span>
            <span className={styles.finalValue}>{asWon(finalAmount)}</span>
          </div>
        </div>
      </section>

      {/* ───────────── 약관 동의 ───────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>약관 동의</h2>

        <label className={styles.allAgree}>
          <input
            type="checkbox"
            className={styles.visuallyHidden}
            checked={allAgreed}
            onChange={(e) => onChangeAllAgreed?.(e.target.checked)}
            aria-label="이용약관 전체 동의"
          />
          <span className={styles.allAgreeIcon} />
          <span className={styles.allAgreeText}>이용약관 전체 동의</span>
        </label>

        <div className={styles.termItemBorder}>
          <button type="button" className={styles.termOnlyLink} onClick={onOpenPrivacy3rd}>
            개인정보 제 3자 제공 안내 ▸
          </button>
        </div>
      </section>
    </div>
  )
}

export default PaymentTotal
