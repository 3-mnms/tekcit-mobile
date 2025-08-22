// 📌 결제 페이지: 카드 4장(주문상세/수령방법/결제수단/결제정보)로 평탄화
//    - 불필요한 aside/중첩 summaryCard 제거
//    - 카드 내부는 flush 유틸로 좌우 패딩 상쇄 → 가로폭 시원하게
//    - 헤더와 겹침 방지: page 상단 padding으로 처리

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import BookingPaymentHeader from '@/components/payment/pay/BookingPaymentHeader'
import PaymentInfo from '@/components/payment/pay/PaymentInfo'
import ReceiveInfo, { type ReceiveType } from '@/components/payment/delivery/ReceiveInfo'
import WalletPayment from '@/components/payment/pay/WalletPayment'
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'
import PaymentTotal from '@/components/payment/pay/paymentTotal'
import PaymentFooter from '@/components/payment/pay/BookingPaymentFooter'
import AlertModal from '@/components/common/modal/AlertModal'

import styles from './BookingPaymentPage.module.css'

// ✅ 결제수단 타입
type PaymentMethod = 'wallet' | 'Toss'

// ✅ 결제 타이머(초)
const DEADLINE_SECONDS = 5 * 60

// ✅ 접근성: 페이지 타이틀 id
const PAGE_TITLE_ID = 'bookingPaymentMainTitle'

const BookingPaymentPage: React.FC = () => {
  const navigate = useNavigate()

  // ── UI/상태
  const [openedMethod, setOpenedMethod] = useState<PaymentMethod | null>(null) // 현재 열린 결제수단 아코디언
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)        // 지갑 비번 모달
  const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false)            // 시간만료 모달
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)          // 닫기 확인 모달
  const [isPaying, setIsPaying] = useState(false)                              // 결제중 플래그
  const [err, setErr] = useState<string | null>(null)                          // 결제수단 관련 에러
  const [allAgreed, setAllAgreed] = useState(false)                            // 약관 전체 동의

  // ── 수령방법(ReceiveInfo가 onChange 미지원 → 고정)
  const [receiveType] = useState<ReceiveType>('QR')

  // ── 토스 결제 ref
  const tossRef = useRef<TossPaymentHandle>(null)

  // ── 목데이터(연동 전)
  const buyerName = '홍길동'
  const festivalId = 'FSTV-2025-0921-001'
  // 한글 파라미터 인코딩(placeholder 한글 문제 방지)
  const posterUrl = 'https://via.placeholder.com/150x200?text=%ED%8F%AC%EC%8A%A4%ED%84%B0'
  const title = '2025 변진섭 전국투어 콘서트 : 변천 시 시즌2 -'
  const dateTimeLabel = '2025.09.21 (일) 17:00'
  const unitPrice = 110_000
  const quantity = 1

  // ── 배송비 계산: DELIVERY/COURIER 키워드 방어
  const isCourier =
    (receiveType as unknown as string) === 'DELIVERY' ||
    (receiveType as unknown as string) === 'COURIER'
  const shippingFee = isCourier ? 3_200 : 0

  // ── 결제 금액/주문명
  const amount = unitPrice * quantity + shippingFee
  const orderName = '티켓 예매'

  // ── 상세 페이지 이동
  const goShowDetail = () => navigate(`/festival/${festivalId}`)

  // ── 타이머
  const [remainingSeconds, setRemainingSeconds] = useState(DEADLINE_SECONDS)
  useEffect(() => {
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setIsTimeUpModalOpen(true) // ⏰ 시간 만료 시 모달 오픈
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // ── 시간만료 모달 확인: 팝업이면 닫기, 아니면 메인 이동
  const handleTimeUpConfirm = () => {
    if (window.opener) window.close()
    else navigate('/')
  }

  // ── 결과 페이지 이동
  const routeToResult = (ok: boolean) => {
    const params = new URLSearchParams({ type: 'booking', status: ok ? 'success' : 'fail' })
    navigate(`/payment/result?${params.toString()}`)
  }

  // ── 결제수단 아코디언 토글
  const toggleMethod = (m: PaymentMethod) => {
    if (isPaying || remainingSeconds <= 0) return
    setOpenedMethod((prev) => (prev === m ? null : m))
    setErr(null)
  }

  // ── 결제 실행
  const handlePayment = async () => {
    if (!openedMethod) {
      setErr('결제 수단을 선택해주세요.')
      return
    }
    if (remainingSeconds <= 0) {
      setErr('결제 시간이 만료되었습니다.')
      setIsTimeUpModalOpen(true)
      return
    }
    if (isPaying) return
    setErr(null)

    // 지갑(킷페이): 비밀번호 모달부터
    if (openedMethod === 'wallet') {
      setIsPasswordModalOpen(true)
      return
    }

    // 토스 결제
    if (openedMethod === 'Toss') {
      setIsPaying(true)
      try {
        await tossRef.current?.requestPay()
      } catch (e) {
        console.error(e)
        setErr('결제 요청 중 오류가 발생했어요.')
        routeToResult(false)
      } finally {
        setIsPaying(false)
      }
    }
  }

  // ── 버튼 활성화/타이머 표시
  const canPay = !!openedMethod && allAgreed && !isPaying && remainingSeconds > 0
  const timeString = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60
  ).padStart(2, '0')}`

  // ── 닫기 버튼
  const handleRequestClose = () => setIsCloseConfirmOpen(true)

  return (
    <div className={styles.page}>
      {/* 상단 타이머/헤더 */}
      <BookingPaymentHeader
        timeString={timeString}
        expired={remainingSeconds <= 0}
        onBack={() => navigate(-1)}
        onClose={handleRequestClose}
      />

      {/* 본문: 카드 4장 */}
      <div className={styles.container} role="main" aria-labelledby={PAGE_TITLE_ID}>
        <h1 id={PAGE_TITLE_ID} className="sr-only">예매 결제</h1>

        {/* 🎴 1) 티켓 주문상세 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>티켓 주문상세</h2>
          <PaymentInfo
            posterUrl={posterUrl}
            title={title}
            dateTimeLabel={dateTimeLabel}
            unitPrice={unitPrice}
            quantity={quantity}
            shippingFee={shippingFee}
            receiveType={receiveType}
            buyerName={buyerName}
            festivalId={festivalId}
            showFestivalId={false}
          />
        </div>

        {/* 🎴 2) 수령 방법 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>수령 방법</h2>
          {/* flush: 카드 좌우 패딩 상쇄 → 내부가 가로로 꽉 차게 */}
          <div className={styles.flush}>
            <ReceiveInfo value={receiveType} />
          </div>
        </div>

        {/* 🎴 3) 결제 수단 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>결제 수단</h2>

          {/* paymentBox: 여분 패딩/보더 제거 + flush로 꽉 채움 */}
          <section className={`${styles.paymentBox} ${styles.flush}`}>
            {/* ─ 킷페이(지갑) ─ */}
            <div className={styles.methodCard}>
              <button
                className={styles.methodHeader}
                onClick={() => toggleMethod('wallet')}
                aria-expanded={openedMethod === 'wallet'}
                type="button"
              >
                <span className={styles.radio + (openedMethod === 'wallet' ? ` ${styles.radioOn}` : '')} />
                <span className={styles.methodText}>킷페이 (포인트 결제)</span>
              </button>

              {openedMethod === 'wallet' && (
                <div className={styles.methodBody}>
                  <WalletPayment isOpen onToggle={() => toggleMethod('wallet')} dueAmount={amount} />
                </div>
              )}
            </div>

            {/* ─ 토스 ─ */}
            <div className={styles.methodCard}>
              <button
                className={styles.methodHeader}
                onClick={() => toggleMethod('Toss')}
                aria-expanded={openedMethod === 'Toss'}
                type="button"
              >
                <span className={styles.radio + (openedMethod === 'Toss' ? ` ${styles.radioOn}` : '')} />
                <span className={styles.methodText}>토스페이먼츠 (신용/체크)</span>
              </button>

              {openedMethod === 'Toss' && (
                <div className={styles.methodBody}>
                  <TossPayment
                    ref={tossRef}
                    isOpen
                    onToggle={() => toggleMethod('Toss')}
                    amount={amount}
                    orderName={orderName}
                    redirectUrl={`${window.location.origin}/payment/result?type=booking`}
                  />
                </div>
              )}
            </div>

            {/* ─ 에러 메시지 ─ */}
            {err && <p className={styles.errorMsg}>{err}</p>}
          </section>
        </div>

        {/* 🎴 4) 결제 정보 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>결제 정보</h2>
          {/* ⛔️ 예전처럼 sectionTitle 클래스로 감싸지 말 것 (카드가 사라짐) */}
          <PaymentTotal
            ticketAmount={unitPrice * quantity}
            allAgreed={allAgreed}
            onChangeAllAgreed={setAllAgreed}
            onOpenPrivacy3rd={() => console.log('개인정보 제3자 제공 안내 열기')}
          />
        </div>
      </div>

      {/* 하단 결제 바 */}
      <PaymentFooter
        amount={amount}
        onPay={handlePayment}
        disabled={!canPay}
        loading={isPaying}
        prefixLabel="총"
        actionLabel="결제하기"
      />

      {/* ── 모달들 ── */}
      {isPasswordModalOpen && (
        <PasswordInputModal
          onClose={() => setIsPasswordModalOpen(false)}
          onComplete={async () => {
            setIsPaying(true)
            try {
              await new Promise((r) => setTimeout(r, 700)) // 목 결제 처리
              routeToResult(true)
            } finally {
              setIsPaying(false)
              setIsPasswordModalOpen(false)
            }
          }}
        />
      )}

      // ⛏ 모달 영역만 수정 — BookingPaymentPage.tsx 멍

      {isTimeUpModalOpen && (
        <AlertModal
          title="시간 만료"            // ✅ 동일 멍
          confirmText="확인"           // ✅ confirmLabel → confirmText 멍
          hideCancel                   // ✅ 취소 버튼 숨김 멍
          onConfirm={handleTimeUpConfirm}
        >
          결제 시간이 만료되었습니다. 다시 시도해주세요.
        </AlertModal>
      )}

      {isCloseConfirmOpen && (
        <AlertModal
          title="안내"
          confirmText="확인"           
          onCancel={() => setIsCloseConfirmOpen(false)}
          onConfirm={() => {
            setIsCloseConfirmOpen(false)
            goShowDetail()
          }}
        >
          진행중인 예매 정보가 사라집니다.
          이동하시겠습니까?
        </AlertModal>
      )}

    </div>
  )
}

export default BookingPaymentPage
