// src/pages/payment/wallet/WalletPointPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/common/button/Button'
import WalletHistory from '@/components/payment/pay/WalletHistory'
import { getWalletBalance } from '@/shared/api/payment/wallet'

import styles from './WalletPointPage.module.css'

const WalletPointPage: React.FC = () => {
  const navigate = useNavigate()
  const [balance, setBalance] = useState<number | null>(null)

  const thisMonth = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [month, setMonth] = useState<string>(thisMonth)

  // 최근 6개월 칩
  const monthChips = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}월`
      return { value: v, label }
    })
  }, [])

  useEffect(() => {
    const sync = async () => setBalance(await getWalletBalance())
    sync()
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  const handleChargeClick = () => navigate('/payment/wallet-point/money-charge')
  const fmt = (n: number) => n.toLocaleString('ko-KR')

  return (
  <div className={styles.container}>
    {/* ✅ 상단 고정바: 바깥은 전체폭, 안쪽은 shell로 중앙정렬 */}
    <header className={styles.topbar}>
      <div className={`${styles.shell} ${styles.topbarInner}`}>
        <button
          type="button"
          className={styles.backBtn}
          aria-label="뒤로가기"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className={styles.pageTitle}>킷페이 내역</h1>
        <span className={styles.topbarSpacer} />
      </div>
    </header>

    {/* ✅ 본문도 shell로 중앙 정렬 */}
    <main className={styles.main}>
      <div className={styles.shell}>
        <section className={styles.summaryCard}>
          <div className={styles.summaryLeft}>
            <div className={styles.summaryLabel}>현재 잔액</div>
            <div className={styles.summaryValue}>
              {balance === null ? <span className={styles.skeleton} /> : `${fmt(balance)}원`}
            </div>
          </div>
          <div className={styles.summaryRight}>
            <Button className={styles.chargeBtn} onClick={handleChargeClick}>충전</Button>
          </div>
        </section>

        <div className={styles.filterBar}>
          <div className={styles.monthChips} role="tablist" aria-label="월 선택">
            {monthChips.map((m) => (
              <button
                key={m.value}
                role="tab"
                aria-selected={month === m.value}
                className={`${styles.chip} ${month === m.value ? styles.chipActive : ''}`}
                onClick={() => setMonth(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <section className={styles.historySection}>
          <WalletHistory month={month} />
          <div className={styles.emptyAction}>
            <Button
              onClick={() => {
                const d = new Date(`${month}-01`)
                d.setMonth(d.getMonth() - 1)
                const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                setMonth(v)
              }}
            >
              지난달 내역 보기
            </Button>
          </div>
        </section>
      </div>
    </main>
  </div>
)

}

export default WalletPointPage
