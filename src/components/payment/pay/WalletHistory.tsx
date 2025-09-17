// WalletHistory — 모바일 카드형 목록(2줄). 접근성/피드백/가독성 강화
import styles from './WalletHistory.module.css'

export type WalletHistoryViewItem = {
  id: string
  createdAt: string
  type: 'charge' | 'use' | 'refund' | 'transfer_in' | 'transfer_out' | 'unknown'
  amount: number
  method?: string
  transactionType: 'CREDIT' | 'DEBIT' | 'UNKNOWN'
  paymentStatus: string
}

export type WalletHistoryProps = {
  month?: string
  items: WalletHistoryViewItem[]
  loading?: boolean
  error?: string | null
}

const WalletHistory: React.FC<WalletHistoryProps> = ({ month, items, loading, error }) => {
  const fmtCurrency = (n: number) => `${n.toLocaleString('ko-KR')}원`
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\s/g, '')
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

  const getDisplayInfo = (t: WalletHistoryViewItem['type']) => {
    switch (t) {
      case 'charge':       return { title: '충전',     sign: '+', cls: styles.chargeText }
      case 'use':          return { title: '사용',     sign: '-', cls: styles.useText }
      case 'refund':       return { title: '환불',     sign: '+', cls: styles.refundText }
      case 'transfer_in':  return { title: '양도보냄', sign: '+', cls: styles.transferInText }
      case 'transfer_out': return { title: '양도받음', sign: '-', cls: styles.transferOutText }
      default:             return { title: '기타',     sign: '-', cls: styles.unknownText }
    }
  }

  const hasAny = items.length > 0

  return (
    <div className={styles.wrap} aria-live="polite">
      {month && <div className={styles.sectionTitle}>{month} 내역</div>}

      {loading && (
        <ul className={styles.list} aria-busy="true" aria-label="결제 내역 로딩 중">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={`sk-${i}`} className={`${styles.item} ${styles.skeleton}`} aria-hidden="true">
              <div className={styles.rowTop}>
                <span className={`${styles.badge} ${styles.badgeSk}`} />
                <span className={`${styles.amount} ${styles.amountSk}`} />
              </div>
              <div className={styles.rowBottom}>
                <span className={styles.metaSk} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && error && <div className={styles.emptyBox} role="alert">{error}</div>}

      {!loading && !error && hasAny && (
        <ul className={styles.list} aria-label="결제 내역">
          {items.map((it) => {
            const { title, sign, cls } = getDisplayInfo(it.type)
            const isPlus = sign === '+'
            const iso = it.createdAt
            return (
              <li
                key={it.id}
                className={styles.item}
                tabIndex={0}
                aria-label={`${title} ${sign}${it.amount}원, ${fmtDate(iso)} ${fmtTime(iso)}`}
              >
                <div className={styles.rowTop}>
                  <span className={`${styles.badge} ${cls}`}>{title}</span>
                  <span className={`${styles.amount} ${isPlus ? styles.amtPlus : styles.amtMinus}`}>
                    {sign}{fmtCurrency(it.amount)}
                  </span>
                </div>
                <div className={styles.rowBottom}>
                  <time className={styles.meta} dateTime={iso}>
                    {fmtDate(iso)} · {fmtTime(iso)}
                  </time>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && !error && !hasAny && <div className={styles.emptyBox}>내역이 없어요</div>}
    </div>
  )
}

export default WalletHistory
