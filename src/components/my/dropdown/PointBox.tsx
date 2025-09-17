import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './PointBox.module.css'
import { getTekcitPayAccount } from '@/shared/api/my/tekcitPay'
import { Coins, Plus } from 'lucide-react'

const PointBox: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      const account = await getTekcitPayAccount()
      setBalance(account.availableBalance ?? 0)
    } catch (e: unknown) {
      const code = (e as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode
      if (code === 'NOT_FOUND_TEKCIT_PAY_ACCOUNT') {
        setBalance(null) 
      }
    }
  }, [])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const goByAccount = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const account = await getTekcitPayAccount()
      setBalance(account.availableBalance ?? 0)
      navigate('/payment/wallet-point')
    } catch (e: unknown) {
      const code = (e as { response?: { data?: { errorCode?: string } } })?.response?.data?.errorCode
      if (code === 'NOT_FOUND_TEKCIT_PAY_ACCOUNT') {
        alert('테킷페이 계정이 없습니다. 계정 생성 페이지로 이동합니다.')
        navigate('/payment/wallet/join')
      } else {
        alert('잔액/계정 조회 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
      }
    } finally {
      setLoading(false)
    }
  }, [loading, navigate])

  const displayPoint = loading
    ? '- P'
    : `${(balance ?? 0).toLocaleString('ko-KR')}P`

  const btnLabel = balance !== null ? '충전하기' : '테킷페이 가입하기'

  return (
    <div
      className={styles.box}
      onClick={goByAccount}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goByAccount()}
      aria-disabled={loading}
    >
      <div className={styles.left}>
        <div className={styles.titleRow}>
          <Coins className={styles.coinIcon} />
          <span className={styles.label}>포인트</span>
        </div>
        <div className={styles.amount}>{displayPoint}</div>
      </div>

      <button
        className={styles.charge}
        onClick={(e) => {
          e.stopPropagation()
          void goByAccount()
        }}
        disabled={loading}
      >
        <Plus className={styles.plusIcon} />
        {btnLabel}
      </button>
    </div>
  )
}

export default PointBox
