// 📌 결제 페이지: 카드 4장(주문상세/수령방법/결제수단/결제정보)로 평탄화
//    - UI/CSS는 기존 그대로 유지
//    - 웹 버전 결제 연동 API 이식

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Stomp, type Frame, type Message } from '@stomp/stompjs'

import PaymentInfo from '@/components/payment/pay/PaymentInfo'
import ReceiveInfo, { type ReceiveType } from '@/components/payment/delivery/ReceiveInfo'
import WalletPayment from '@/components/payment/pay/WalletPayment'
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'
import PaymentTotal from '@/components/payment/pay/paymentTotal'
import PaymentFooter from '@/components/payment/pay/BookingPaymentFooter'
import AlertModal from '@/components/common/modal/AlertModal'
import BookingProgress from '@/components/common/steps/BookingProgress'
import styles from './BookingPaymentPage.module.css'

import type { CheckoutState } from '@/models/payment/types/paymentTypes'
import { createPaymentId } from '@/models/payment/utils/paymentUtils'
import { saveBookingSession } from '@/shared/api/payment/paymentSession'
import { fetchBookingDetail } from '@/shared/api/payment/bookingDetail'
import {
  requestTekcitPayment,
  verifyTekcitPassword,
  confirmTekcitPayment,
  getUserIdForHeader,
} from '@/shared/api/payment/tekcit'
import { useAuthStore } from '@/shared/storage/useAuthStore'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'

// ✅ 결제수단 타입(모바일 지역 타입 유지)
type PaymentMethod = 'wallet' | 'Toss'

// ✅ 접근성: 페이지 타이틀 id
const PAGE_TITLE_ID = 'bookingPaymentMainTitle'

// JWT에서 name 꺼내기(스토어에 없을 때 폴백)
function getNameFromJwt(): string | undefined {
  try {
    const raw = localStorage.getItem('accessToken') || ''
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw
    if (!token) return undefined
    const part = token.split('.')[1] ?? ''
    const safe = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = safe + '='.repeat((4 - (safe.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    const name = payload?.name
    return typeof name === 'string' && name.trim() ? name.trim() : undefined
  } catch {
    return undefined
  }
}

const BookingPaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const checkout = state as CheckoutState | undefined

  // ── 스토어/토큰 정보
  const storeName = useAuthStore((s) => s.user?.name) || undefined
  const { data: tokenInfo } = useTokenInfoQuery()
  const userId = Number(tokenInfo?.userId)

  // ── 수령방법(ReceiveInfo가 onChange 미지원 → 고정)
  const [receiveType] = useState<ReceiveType>('QR')

  // ── 토스 결제 ref
  const tossRef = useRef<TossPaymentHandle>(null)

  // ── UI/상태
  const [openedMethod, setOpenedMethod] = useState<PaymentMethod | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [allAgreed, setAllAgreed] = useState(false)

  // ── 결제 정보 확인
  if (!checkout) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>결제 정보를 불러오지 못했습니다.</p>
          <button onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    )
  }

  // ── 결제 금액/주문명/공연ID 등 파생값
  const unitPrice = checkout?.unitPrice ?? checkout?.amount ?? 0
  const quantity = checkout?.quantity ?? 1
  const shippingFee = useMemo(() => {
    const isCourier =
      (receiveType as unknown as string) === 'DELIVERY' ||
      (receiveType as unknown as string) === 'COURIER'
    return isCourier ? 3200 : 0
  }, [receiveType])
  const finalAmount = useMemo(() => unitPrice * quantity + shippingFee, [unitPrice, quantity, shippingFee])
  const orderName = useMemo(() => checkout?.title ?? '티켓 예매', [checkout?.title])
  const festivalIdVal = checkout?.festivalId as any
  const buyerName = useMemo(
    () => storeName ?? checkout?.buyerName ?? getNameFromJwt() ?? '주문자',
    [storeName, checkout?.buyerName]
  )

  // ── 결과 페이지 이동(모바일 버전 라우트 유지)
  const routeToResult = useCallback((ok: boolean, id?: string) => {
    const params = new URLSearchParams({ type: 'booking', status: ok ? 'success' : 'fail' })
    if (id) params.set('paymentId', id)
    navigate(`/payment/result?${params.toString()}`)
  }, [navigate])

  // ── 상세 페이지 이동(닫기 확인 모달에서 사용)
  const goShowDetail = () => navigate(`/festival/${festivalIdVal}`)

  // ── 버튼 활성
  const canPay = !!openedMethod && allAgreed && !isPaying

  // ───────────────────────── 결제 연동 공통 상태(웹 버전 이식) ─────────────────────────
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [ensuredPaymentId, setEnsuredPaymentId] = useState<string | null>(null)
  const [sellerId, setSellerId] = useState<number | null>(null)

  // 초기 paymentId 생성 + 프론트 세션 저장
  useEffect(() => {
    if (!paymentId) {
      const id = createPaymentId()
      setPaymentId(id)
    }

    // sellerId가 확보되면 세션 저장
    if (paymentId && checkout?.bookingId && checkout?.festivalId && sellerId) {
      saveBookingSession({
        paymentId,
        bookingId: checkout.bookingId as any,
        festivalId: checkout.festivalId as any,
        sellerId,
        amount: finalAmount,
        createdAt: Date.now(),
      })
    }
  }, [paymentId, checkout?.bookingId, checkout?.festivalId, finalAmount, sellerId])

  // 예매 상세 조회로 sellerId 확보
  useEffect(() => {
    if (!checkout?.festivalId || !checkout?.performanceDate || !checkout?.bookingId) return
    ;(async () => {
      try {
        const res = await fetchBookingDetail({
          festivalId: checkout.festivalId as any,
          performanceDate: checkout.performanceDate as any,
          reservationNumber: checkout.bookingId as any,
        })
        if (!res.success) throw new Error(res.message || '상세 조회 실패')
        const sid = (res.data?.sellerId ?? res.data?.seller_id) as number | undefined
        if (!sid || sid <= 0) throw new Error('sellerId 누락')
        setSellerId(sid)
      } catch (e) {
        console.error('예매 상세 조회 실패', e)
        alert('결제 정보를 불러오지 못했습니다.')
        navigate(-1)
      }
    })()
  }, [checkout?.festivalId, checkout?.performanceDate, checkout?.bookingId, navigate])

  // ───────────────────────── TanStack Query — 3단계 뮤테이션 ─────────────────────────
  // 1) 결제 요청
  const requestMut = useMutation({
    mutationFn: async () => {
      const id = paymentId ?? createPaymentId()
      if (!paymentId) setPaymentId(id)

      if (!sellerId) throw new Error('판매자 정보가 없습니다.')
      if (!checkout?.bookingId || !checkout?.festivalId) throw new Error('예매 식별 정보가 없습니다.')

      const uid = getUserIdForHeader()
      if (!uid) throw new Error('로그인이 필요합니다. (buyerId 없음)')
      const buyerIdNum = Number(uid)

      // 프론트 세션 저장
      saveBookingSession({
        paymentId: id,
        bookingId: checkout.bookingId as any,
        festivalId: checkout.festivalId as any,
        sellerId,
        amount: finalAmount,
        createdAt: Date.now(),
      })

      // 서버 결제 요청
      await requestTekcitPayment({
        paymentId: id,
        bookingId: checkout.bookingId as any,
        festivalId: checkout.festivalId as any,
        sellerId,
        buyerId: buyerIdNum,
        amount: finalAmount,
      })

      console.log('✅ 결제 요청 완료, PaymentOrder는 테킷페이 결제에서 자동 대기')
      return id
    },
  })

  // 2) 지갑 결제(비번 검증+차감) — 내부 자동 재시도 포함
  const tekcitPayMut = useMutation({
    mutationFn: async (password: string) => {
      const id = ensuredPaymentId ?? paymentId
      if (!id) throw new Error('paymentId가 준비되지 않았습니다.')
      return verifyTekcitPassword({ amount: finalAmount, paymentId: id, password })
    },
  })

  // 3) 결제 완료
  const completeMut = useMutation({
    mutationFn: async () => {
      const id = ensuredPaymentId ?? paymentId
      if (!id) throw new Error('paymentId가 준비되지 않았습니다.')
      return confirmTekcitPayment(id)
    },
  })

  // ───────────────────────── UI 핸들러 (모바일 구조 유지) ─────────────────────────
  const toggleMethod = (m: PaymentMethod) => {
    if (isPaying || remainingSeconds <= 0) return
    setOpenedMethod((prev) => (prev === m ? null : m))
    setErr(null)
  }

  const handleRequestClose = () => setIsCloseConfirmOpen(true)

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

    // 지갑 결제 — 1) 서버 request 성공 → 2) 비밀번호 모달 오픈
    if (openedMethod === 'wallet') {
      try {
        setIsPaying(true)
        const id = paymentId ?? createPaymentId()
        if (!paymentId) setPaymentId(id)

        await requestMut.mutateAsync()
        setEnsuredPaymentId((prev) => prev ?? id)
        setIsPasswordModalOpen(true)
      } catch (e: any) {
        console.error(e)
        setErr(e?.message ?? '결제 요청에 실패했습니다.')
      } finally {
        setIsPaying(false)
      }
      return
    }

    // 토스 결제 — 모바일 컴포넌트 내부 시그니처 유지 + 포트원 팝업 파라미터 전달
    if (openedMethod === 'Toss') {
      const ensuredId = paymentId ?? createPaymentId()
      if (!paymentId) setPaymentId(ensuredId)

      setIsPaying(true)
      try {
        await tossRef.current?.requestPay?.({
          paymentId: ensuredId,
          amount: finalAmount,
          orderName,
          bookingId: checkout?.bookingId as any,
          festivalId: festivalIdVal,
          sellerId: sellerId as any,
          successUrl: `${window.location.origin}/payment/result?type=booking`,
          failUrl: `${window.location.origin}/payment/result?type=booking`,
        } as any)
        if (!tossRef.current?.requestPay) {
          await (tossRef.current as any)?.requestPay?.()
        }
      } catch (e) {
        console.error(e)
        setErr('결제 요청 중 오류가 발생했어요.')
        routeToResult(false)
      } finally {
        setIsPaying(false)
      }
    }
  }

  // sellerId 로딩 중일 때 로딩 표시
  if (sellerId === null) {
    return (
      <div className={styles.page}>
        <BookingProgress current={3} />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>결제 정보를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  // ───────────────────────── 렌더 ─────────────────────────
  return (
    <div className={styles.page}>

      <div className={styles.container} role="main" aria-labelledby={PAGE_TITLE_ID}>
        <h1 id={PAGE_TITLE_ID} className="sr-only">예매 결제</h1>

        {/* 🎴 1) 티켓 주문상세 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>티켓 주문상세</h2>
          <PaymentInfo
            posterUrl={checkout?.posterUrl}
            title={checkout?.title}
            dateTimeLabel={checkout?.dateTimeLabel}
            unitPrice={unitPrice}
            quantity={quantity}
            shippingFee={shippingFee}
            receiveType={receiveType}
            buyerName={buyerName}
            festivalId={festivalIdVal as any}
            showFestivalId={false}
          />
        </div>

        {/* 🎴 2) 수령 방법 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>수령 방법</h2>
          <div className={styles.flush}>
            <ReceiveInfo value={receiveType} />
          </div>
        </div>

        {/* 🎴 3) 결제 수단 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>결제 수단</h2>
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
                  <WalletPayment isOpen onToggle={() => toggleMethod('wallet')} dueAmount={finalAmount} />
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
                    amount={finalAmount}
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
        amount={finalAmount}
        onPay={handlePayment}
        disabled={!canPay}
        loading={isPaying}
        prefixLabel="총"
        actionLabel="결제하기"
      />

      {/* ── 모달들 ── */}
      {isPasswordModalOpen && ensuredPaymentId && (
        <PasswordInputModal
          amount={finalAmount}
          paymentId={ensuredPaymentId}
          userName={buyerName}
          onClose={() => setIsPasswordModalOpen(false)}
          onComplete={async (pwd) => {
            setIsPaying(true)
            setErr(null)
            try {
              await tekcitPayMut.mutateAsync(pwd)   // 지갑 검증+차감
              await completeMut.mutateAsync()       // 결제 완료
              
              // WebSocket 메시지 누락 대비 - 2초 후 자동 이동
              setTimeout(() => {
                routeToResult(true, ensuredPaymentId)
              }, 2000)
            } catch (e: any) {
              console.error(e)
              setErr(e?.message ?? '결제 처리에 실패했습니다.')
              routeToResult(false, ensuredPaymentId)
            } finally {
              setIsPaying(false)
              setIsPasswordModalOpen(false)
            }
          }}
        />
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