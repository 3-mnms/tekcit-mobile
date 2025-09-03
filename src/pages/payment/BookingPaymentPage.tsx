// 📌 결제 페이지: 카드 4장(주문상세/수령방법/결제수단/결제정보)로 평탄화
//    - UI/CSS는 기존 그대로 유지
//    - 아래 로직만 웹 버전 결제 연동(API)으로 이식

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import BookingPaymentHeader from '@/components/payment/pay/BookingPaymentHeader'
import PaymentInfo from '@/components/payment/pay/PaymentInfo'
import ReceiveInfo, { type ReceiveType } from '@/components/payment/delivery/ReceiveInfo'
import WalletPayment from '@/components/payment/pay/WalletPayment'
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'
import PaymentTotal from '@/components/payment/pay/paymentTotal'
import PaymentFooter from '@/components/payment/pay/BookingPaymentFooter'
import AlertModal from '@/components/common/modal/AlertModal'
import orderStyles from '@/pages/reservation/TicketOrderPage.module.css'

import styles from './BookingPaymentPage.module.css'

// ───────────────────────── 웹 버전과 동일한 의존성 추가 (타입/유틸/API) ─────────────────────────
import type { CheckoutState } from '@/models/payment/types/paymentTypes' // 주석: 결제 상태 타입 멍
import { createPaymentId } from '@/models/payment/utils/paymentUtils'    // 주석: paymentId 생성 멍
import { saveBookingSession } from '@/shared/api/payment/paymentSession' // 주석: 프론트 세션 저장 멍
import { fetchBookingDetail } from '@/shared/api/payment/bookingDetail'  // 주석: sellerId 조회 멍
import {
  requestTekcitPayment,     // 주석: 1단계 — 결제 요청 멍
  verifyTekcitPassword,      // 주석: 2단계 — 지갑 비번 검증+차감 (자동 재시도) 멍
  confirmTekcitPayment,      // 주석: 3단계 — 결제 완료 멍
  getUserIdForHeader,        // 주석: X-User-Id 확보 멍
} from '@/shared/api/payment/tekcit'

// ✅ 결제수단 타입(모바일 지역 타입 유지)
type PaymentMethod = 'wallet' | 'Toss'

// ✅ 결제 타이머(초)
const DEADLINE_SECONDS = 5 * 60

// ✅ 접근성: 페이지 타이틀 id
const PAGE_TITLE_ID = 'bookingPaymentMainTitle'

// 주석: JWT에서 name 꺼내기(스토어에 없을 때 폴백) 멍
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

  // ─────────────────────────────────────────────────────────────
  // ===== [삭제 대상] MOCK FOR MOBILE ONLY START 멍 =====
  // 주석: 예매 단계 API가 아직 없어 state가 undefined일 때만 사용 멍
  const isMock = !checkout

  const MOCK_CHECKOUT: CheckoutState = {
    // 주석: 실제 CheckoutState 필드명에 맞춰 값 세팅 필요 시 조정 멍
    bookingId: 'R-20250921-0001',
    festivalId: 3 as any, // 백엔드가 number/string 중 무엇인지에 맞춰 쓰기 멍
    performanceDate: '2025-09-21T17:00:00',
    title: '2025 변진섭 전국투어 콘서트 : 변천 시 시즌2 -',
    buyerName: getNameFromJwt() ?? '홍길동',
    unitPrice: 110_000,
    quantity: 1,
    amount: 110_000,
    deliveryMethod: 'QR' as any,
    posterUrl: 'https://via.placeholder.com/150x200?text=%ED%8F%AC%EC%8A%A4%ED%84%B0',
    dateTimeLabel: '2025.09.21 (일) 17:00',
  }

  // 주석: 이후 로직은 checkoutEffective만 사용 — 실제 state가 오면 실데이터 사용 멍
  const checkoutEffective = (checkout ?? MOCK_CHECKOUT) as CheckoutState
  // ===== [삭제 대상] MOCK FOR MOBILE ONLY END 멍 =====
  // ─────────────────────────────────────────────────────────────
  // ===== [수정 시 되돌릴 코드 예시] START 멍
  // const checkoutEffective = checkout as CheckoutState
  // ===== [수정 시 되돌릴 코드 예시] END 멍

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

  // ── 결제 타이머
  const [remainingSeconds, setRemainingSeconds] = useState(DEADLINE_SECONDS)
  useEffect(() => {
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setIsTimeUpModalOpen(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // ── 결제 금액/주문명/공연ID 등 파생값(목데이터 → 실제 checkout 기반)
  const unitPrice = checkoutEffective?.unitPrice ?? checkoutEffective?.amount ?? 0
  const quantity = checkoutEffective?.quantity ?? 1
  const shippingFee = useMemo(() => {
    const isCourier =
      (receiveType as unknown as string) === 'DELIVERY' ||
      (receiveType as unknown as string) === 'COURIER'
    return isCourier ? 3200 : 0
  }, [receiveType])
  const finalAmount = useMemo(() => unitPrice * quantity + shippingFee, [unitPrice, quantity, shippingFee])
  const orderName = useMemo(() => checkoutEffective?.title ?? '티켓 예매', [checkoutEffective?.title])
  const festivalIdVal = checkoutEffective?.festivalId as any
  const buyerName = useMemo(
    () => checkoutEffective?.buyerName ?? getNameFromJwt() ?? '주문자',
    [checkoutEffective?.buyerName]
  )

  // ── 결과 페이지 이동(모바일 버전 라우트 유지)
  const routeToResult = useCallback((ok: boolean, id?: string) => {
    const params = new URLSearchParams({ type: 'booking', status: ok ? 'success' : 'fail' })
    if (id) params.set('paymentId', id)
    navigate(`/payment/result?${params.toString()}`)
  }, [navigate])

  // ── 상세 페이지 이동(닫기 확인 모달에서 사용)
  const goShowDetail = () => navigate(`/festival/${festivalIdVal}`)

  // ── 시간만료 모달 확인: 팝업이면 닫기, 아니면 메인 이동
  const handleTimeUpConfirm = () => {
    if (window.opener) window.close()
    else navigate('/')
  }

  // ── 버튼 활성화/타이머 표시
  const canPay = !!openedMethod && allAgreed && !isPaying && remainingSeconds > 0

  // ───────────────────────── 결제 연동 공통 상태(웹 버전 이식) ─────────────────────────
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [ensuredPaymentId, setEnsuredPaymentId] = useState<string | null>(null)
  const [sellerId, setSellerId] = useState<number | null>(null)

  // 주석: 초기 paymentId 생성 + 프론트 세션 저장(판매자 정보 로딩 전에는 저장 보류) 멍
  useEffect(() => {
    if (!paymentId) {
      const id = createPaymentId()
      setPaymentId(id)
    }

    // ===== [삭제 대상] 목 sellerId 보정 START 멍 =====
    // 주석: 목 모드일 때는 fetch 없이 고정 sellerId를 세팅해 포트원까지 진행 가능하게 함 멍
    if (isMock && sellerId == null) {
      setSellerId(101) // 임시 판매자 ID 멍
    }
    // ===== [삭제 대상] 목 sellerId 보정 END 멍

    // 주석: sellerId가 확보되면 세션 저장 멍
    if (paymentId && checkoutEffective?.bookingId && checkoutEffective?.festivalId && sellerId) {
      saveBookingSession({
        paymentId,
        bookingId: checkoutEffective.bookingId as any,
        festivalId: checkoutEffective.festivalId as any,
        sellerId,
        amount: finalAmount,
        createdAt: Date.now(),
      })
    }
  }, [paymentId, checkoutEffective?.bookingId, checkoutEffective?.festivalId, finalAmount, sellerId, isMock])

  // 주석: 예매 상세 조회로 sellerId 확보(웹 버전 동일 플로우) — 목 모드에서는 스킵 멍
  useEffect(() => {
    // ===== [삭제 대상] 목 가드 START 멍 =====
    if (isMock) return
    // ===== [삭제 대상] 목 가드 END 멍 =====

    if (!checkoutEffective?.festivalId || !checkoutEffective?.performanceDate || !checkoutEffective?.bookingId) return
    ;(async () => {
      try {
        const res = await fetchBookingDetail({
          festivalId: checkoutEffective.festivalId as any,
          performanceDate: checkoutEffective.performanceDate as any,
          reservationNumber: checkoutEffective.bookingId as any,
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
  }, [checkoutEffective?.festivalId, checkoutEffective?.performanceDate, checkoutEffective?.bookingId, navigate, isMock])

  // ───────────────────────── TanStack Query — 3단계 뮤테이션 ─────────────────────────
  // 주석: 1) 결제 요청 멍
  const requestMut = useMutation({
    mutationFn: async () => {
      const id = paymentId ?? createPaymentId()
      if (!paymentId) setPaymentId(id)

      if (!sellerId) throw new Error('판매자 정보가 없습니다.')
      if (!checkoutEffective?.bookingId || !checkoutEffective?.festivalId) throw new Error('예매 식별 정보가 없습니다.')

      const uid = getUserIdForHeader()
      if (!uid) throw new Error('로그인이 필요합니다. (buyerId 없음)')
      const buyerIdNum = Number(uid)

      // 주석: 프론트 세션 저장 멍
      saveBookingSession({
        paymentId: id,
        bookingId: checkoutEffective.bookingId as any,
        festivalId: checkoutEffective.festivalId as any,
        sellerId,
        amount: finalAmount,
        createdAt: Date.now(),
      })

      // 주석: 서버 결제 요청 멍
      await requestTekcitPayment({
        paymentId: id,
        bookingId: checkoutEffective.bookingId as any,
        festivalId: checkoutEffective.festivalId as any,
        sellerId,
        buyerId: buyerIdNum,
        amount: finalAmount,
      })

      console.log('✅ 결제 요청 완료, PaymentOrder는 테킷페이 결제에서 자동 대기')
      return id
    },
  })

  // 주석: 2) 지갑 결제(비번 검증+차감) — 내부 자동 재시도 포함 멍
  const tekcitPayMut = useMutation({
    mutationFn: async (password: string) => {
      const id = ensuredPaymentId ?? paymentId
      if (!id) throw new Error('paymentId가 준비되지 않았습니다.')
      return verifyTekcitPassword({ amount: finalAmount, paymentId: id, password })
    },
  })

  // 주석: 3) 결제 완료 멍
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

    // 주석: 지갑 결제 — 1) 서버 request 성공 → 2) 비밀번호 모달 오픈 멍
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

    // 주석: 토스 결제 — 모바일 컴포넌트 내부 시그니처 유지 + 포트원 팝업 파라미터 전달 멍
    if (openedMethod === 'Toss') {
      const ensuredId = paymentId ?? createPaymentId()
      if (!paymentId) setPaymentId(ensuredId)

      setIsPaying(true)
      try {
        await tossRef.current?.requestPay?.({
          paymentId: ensuredId,
          amount: finalAmount,
          orderName,
          bookingId: checkoutEffective?.bookingId as any,
          festivalId: festivalIdVal,
          sellerId: (sellerId ?? 101) as any, // ===== [삭제 대상] 목 fallback 멍
          successUrl: `${window.location.origin}/payment/result?type=booking`,
          failUrl: `${window.location.origin}/payment/result?type=booking`,
        } as any)
        if (!tossRef.current?.requestPay) {
          // @ts-ignore
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

  // 주석: 타이머 표시 문자열(모바일 헤더 주석 상태라 값만 유지) 멍
  const timeString = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60
  ).padStart(2, '0')}`

  // ───────────────────────── 렌더 ─────────────────────────
  return (
    <div className={styles.page}>
      <header className={orderStyles.progressBar} aria-label="예매 단계">
        <ol className={orderStyles.stepper}>
          <li className={orderStyles.step}>
            <span className={orderStyles.bullet} aria-hidden="true" />
            <span className={orderStyles.label}>날짜/시간/매수</span>
          </li>
          <li className={orderStyles.step}>
            <span className={orderStyles.bullet} aria-hidden="true" />
            <span className={orderStyles.label}>수령방법/주문자 확인</span>
          </li>
          <li className={`${orderStyles.step} ${orderStyles.active}`}>
            <span className={orderStyles.bullet} aria-hidden="true" />
            <span className={orderStyles.label}>결제</span>
          </li>
        </ol>
      </header>
      {/* 상단 타이머/헤더는 기존 주석 유지
      <BookingPaymentHeader
        timeString={timeString}
        expired={remainingSeconds <= 0}
        onBack={() => navigate(-1)}
        onClose={handleRequestClose}
      /> */}

      <div className={styles.container} role="main" aria-labelledby={PAGE_TITLE_ID}>
        <h1 id={PAGE_TITLE_ID} className="sr-only">예매 결제</h1>

        {/* 🎴 1) 티켓 주문상세 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>티켓 주문상세</h2>
          <PaymentInfo
            posterUrl={checkoutEffective?.posterUrl}
            title={checkoutEffective?.title}
            dateTimeLabel={checkoutEffective?.dateTimeLabel}
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
              await tekcitPayMut.mutateAsync(pwd)   // 주석: 지갑 검증+차감 멍
              await completeMut.mutateAsync()       // 주석: 결제 완료 멍
              routeToResult(true, ensuredPaymentId)
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

      {isTimeUpModalOpen && (
        <AlertModal
          title="시간 만료"
          confirmText="확인"
          hideCancel
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
