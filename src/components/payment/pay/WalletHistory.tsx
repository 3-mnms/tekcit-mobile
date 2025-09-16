// WalletHistory — 부모로부터 받은 데이터를 '표시만' 하는 컴포넌트

import styles from './WalletHistory.module.css'

export type WalletHistoryViewItem = {
  id: string                 // 키용 식별자(paymentId 등)
  createdAt: string          // ISO 문자열
  type: 'charge' | 'refund' | 'use'  // 충전/환불/사용
  amount: number             // 금액(원)
}

export type WalletHistoryProps = {
  month?: string
  items: WalletHistoryViewItem[]
  loading?: boolean
  error?: string | null
}

const WalletHistory: React.FC<WalletHistoryProps> = ({ month, items, loading, error }) => {
  // 금액 포맷
  const fmtCurrency = (n: number) => `${n.toLocaleString('ko-KR')}원`
  // 날짜/시간 포맷
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

  const hasAny = items.length > 0

  return (
    <div className={styles.wrap} aria-live="polite">
      <div className={styles.headerRow}>
        <span className={styles.colDate}>날짜</span>
        <span className={styles.colDesc}>내역</span>
        <span className={styles.colAmount}>금액</span>
      </div>

      {loading && (
        <ul className={styles.list} aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={`sk-${i}`} className={`${styles.item} ${styles.skeleton}`}>
              <span className={styles.colDate} />
              <span className={styles.colDesc} />
              <span className={styles.colAmount} />
            </li>
          ))}
        </ul>
      )}

      {!loading && error && <div className={styles.emptyBox} role="alert">{error}</div>}

      {!loading && !error && hasAny && (
        <ul className={styles.list}>
          {items.map((it, idx) => {
            // 내역 텍스트 색상 전용 클래스
            const typeClass =
              it.type === 'charge'
                ? styles.typeCharge
                : it.type === 'refund'
                ? styles.typeRefund
                : styles.typeUse

            // 금액 앞부호: 충전/환불 = +, 사용 = -
            const sign = it.type === 'charge' || it.type === 'refund' ? '+' : '-'
            // 내역명
            const title = it.type === 'charge' ? '충전' : it.type === 'refund' ? '환불' : '사용'

            return (
              <li key={it.id} className={`${styles.item} ${idx % 2 ? styles.alt : ''}`}>
                <span className={styles.colDate}>{fmtDateTime(it.createdAt)}</span>
                <span className={`${styles.colDesc} ${typeClass}`}>{title}</span>
                <span className={`${styles.colAmount} ${sign === '+' ? styles.amtPlus : styles.amtMinus}`}>
                  {sign}{fmtCurrency(it.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && !error && !hasAny && (
        <div className={styles.emptyBox}>
          {month ? '선택한 월의 내역이 없어요' : '포인트 내역이 없어요'}
        </div>
      )}
    </div>
  )
}

export default WalletHistory
