import { useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import AddressForm from '@/components/payment/address/AddressForm'
import BookingProductInfo, { type ReceiveType } from '@/components/payment/BookingProductInfo'
import AlertModal from '@/components/common/modal/AlertModal'
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'
import WalletPayment from '@/components/payment/pay/WalletPayment'
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'
import TransferPaymentFooter from '@/components/payment/transfer/TransferPaymentFooter'
import BookingPaymentHeader from '@/components/payment/transfer/TransferPaymentHeader' // ✅ 추가

import styles from './TransferPaymentPage.module.css'

type Method = '킷페이' | '토스'

const TransferPaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const tossRef = useRef<TossPaymentHandle>(null)

  const [isAddressFilled, setIsAddressFilled] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [openedMethod, setOpenedMethod] = useState<Method | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isPwModalOpen, setIsPwModalOpen] = useState(false)

  const amount = 190000
  const product = {
    posterUrl: '',
    title: '뮤지컬 <레미제라블>',
    dateTimeLabel: '2025.09.21 (일) 17:00',
    unitPrice: amount,
    quantity: 2,
    receiveType: 'DELIVERY' as ReceiveType,
    shippingFee: 3000,
    Transferor: '김양도',
    Transferee: '이양수',
  }

  const disabledNext = useMemo(
    () => !(isAddressFilled && isAgreed && openedMethod !== null),
    [isAddressFilled, isAgreed, openedMethod]
  )

  const routeToResult = (ok: boolean, extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams({
      type: 'transfer',
      status: ok ? 'success' : 'fail',
      ...(extra ?? {}),
    })
    navigate(`/payment/result?${params.toString()}`)
  }

  const toggleMethod = (m: Method) => setOpenedMethod(prev => (prev === m ? null : m))

  const handleNextClick = async () => {
    if (disabledNext) return
    if (openedMethod === '킷페이') {
      setIsAlertOpen(true)
      return
    }
    if (openedMethod === '토스') {
      await tossRef.current?.requestPay()
      return
    }
  }

  const handleAlertConfirm = () => { setIsAlertOpen(false); setIsPwModalOpen(true) }
  const handleAlertCancel = () => setIsAlertOpen(false)

  const handlePasswordComplete = (password: string) => {
    console.log('[KitPay] 입력 비밀번호:', password)
    setIsPwModalOpen(false)
    const ok = Math.random() < 0.9
    const txId = Math.random().toString(36).slice(2, 10)
    routeToResult(ok, { txId })
  }

  return (
    <div className={styles.page}>
      {/* ─ 상단 헤더 ─ */}
      <BookingPaymentHeader
        title="양도 결제"
        timeString="09:59"   // ⏱ 필요 시 카운트다운 값 넘겨주면 됨
        expired={false}     // ⛔ 만료 상태라면 true로
      />

      <div className={styles.headerSpacer} aria-hidden />

      {/* ─ 예매 기본 안내사항 ─ */}
      <section className={styles.card}>
        {/* <h2 className={styles.cardTitle}>예매 기본 안내사항</h2> */}
        <BookingProductInfo {...product} />
      </section>

      {/* ─ 배송지 선택 ─ */}
      <section className={styles.card}>
        <AddressForm onValidChange={setIsAddressFilled} />
      </section>

      {/* ─ 결제 수단 ─ */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>결제 수단</h2>
        {/* 킷페이 */}
        <div className={`${styles.methodCard} ${openedMethod === '킷페이' ? styles.active : ''}`}>
          <button type="button" className={styles.methodHeader}
            onClick={() => toggleMethod('킷페이')} aria-expanded={openedMethod === '킷페이'}>
            <span className={`${styles.radio} ${openedMethod === '킷페이' ? styles.radioOn : ''}`} />
            <span className={styles.methodText}>킷페이 (포인트 결제)</span>
          </button>
          {openedMethod === '킷페이' && (
            <div className={styles.methodBody}>
              <WalletPayment isOpen onToggle={() => toggleMethod('킷페이')} dueAmount={amount} />
            </div>
          )}
        </div>

        {/* 토스 */}
        <div className={`${styles.methodCard} ${openedMethod === '토스' ? styles.active : ''}`}>
          <button type="button" className={styles.methodHeader}
            onClick={() => toggleMethod('토스')} aria-expanded={openedMethod === '토스'}>
            <span className={`${styles.radio} ${openedMethod === '토스' ? styles.radioOn : ''}`} />
            <span className={styles.methodText}>토스페이먼츠 (신용/체크/간편)</span>
          </button>
          {openedMethod === '토스' && (
            <div className={styles.methodBody}>
              <TossPayment
                ref={tossRef}
                isOpen
                onToggle={() => toggleMethod('토스')}
                amount={amount}
                orderName="티켓 양도 결제"
                redirectUrl={`${window.location.origin}/payment/result?type=transfer`}
              />
            </div>
          )}
        </div>
      </section>

      {/* ─ 하단 CTA ─ */}
      <TransferPaymentFooter
        unitPrice={product.unitPrice}
        quantity={product.quantity}
        shippingFee={product.shippingFee}
        onPay={handleNextClick}
        disabled={disabledNext}
      />


      {/* ─ 모달들 ─ */}
      {isAlertOpen && (
        <AlertModal title="결제 안내" onCancel={handleAlertCancel} onConfirm={handleAlertConfirm}>
          양도로 구매한 티켓은 환불 불가합니다. 계속 진행하시겠습니까?
        </AlertModal>
      )}

      {isPwModalOpen && (
        <PasswordInputModal
          onClose={() => setIsPwModalOpen(false)}
          onComplete={handlePasswordComplete}
        />
      )}
    </div>
  )
}

export default TransferPaymentPage
