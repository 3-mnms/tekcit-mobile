import { useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './WalletChargePage.module.css'

import Input from '@/components/common/input/Input'
import Button from '@/components/common/button/Button'
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'

const AMOUNT_PRESETS = [10000, 50000, 100000, 1000000] // 단위: 원

const WalletChargePage: React.FC = () => {
  const [amount, setAmount] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  const navigate = useNavigate()
  const tossRef = useRef<TossPaymentHandle>(null)

  const amountNumber = useMemo(
    () => parseInt((amount || '').replace(/[^0-9]/g, ''), 10) || 0,
    [amount],
  )
  const orderName = '지갑 포인트 충전'

  const formattedAmount = useMemo(() => {
    if (!amountNumber) return '0원'
    return new Intl.NumberFormat('ko-KR').format(amountNumber) + '원'
  }, [amountNumber])

  const AMOUNT_PRESETS = [
    { value: 5000, label: '5천원' },
    { value: 10000, label: '1만원' },
    { value: 50000, label: '5만원' },
    { value: 100000, label: '10만원' },
    { value: 500000, label: '50만원' },
    { value: 1000000, label: '100만원' },
  ]

  const handlePresetClick = (preset: number) => {
    const prev = parseInt((amount || '').replace(/[^0-9]/g, ''), 10) || 0
    setAmount(String(prev + preset))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target instanceof HTMLInputElement) {
      const val = e.target.value.replace(/[^0-9]/g, '')
      setAmount(val)
      setSelectedPreset(null) // 입력시 프리셋 선택 해제
    }
  }

  const handleCharge = async () => {
    if (!amountNumber || amountNumber < 1000) {
      alert('1,000원 이상부터 충전할 수 있습니다.')
      return
    }
    await tossRef.current?.requestPay()
    navigate('/payment/wallet-point/charge-success', { replace: true })
  }

  return (
    <div className={styles.container}>
      <header className={styles.topbar} aria-label="상단 탐색 바">
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className={styles.title}>포인트 충전하기</h1>
        <span className={styles.topbarSpacer} />
      </header>

      <div className={styles.wrapper}>
        <section className={styles.section}>
          <div className={styles.labelRow}>
            <div className={styles.label}>포인트 충전 금액</div>
            <div className={styles.helper}>{formattedAmount}</div>
          </div>

          <div className={styles.inputWrapper}>
            <Input
              type="text"
              placeholder="금액 입력"
              value={amount}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.presetGroup}>
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={styles.presetBtn}
                onClick={() => handlePresetClick(preset.value)}
              >
                +{preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <TossPayment
            ref={tossRef}
            isOpen={true}
            onToggle={() => {}}
            amount={amountNumber}
            orderName={orderName}
            redirectUrl={`${window.location.origin}/payment/wallet-point/charge-success?amount=${encodeURIComponent(
              String(amountNumber),
            )}`}
          />
        </section>

        <Button className={styles.chargeBtn} onClick={handleCharge} disabled={!amountNumber}>
          충전하기
        </Button>
      </div>
    </div>
  )
}

export default WalletChargePage
