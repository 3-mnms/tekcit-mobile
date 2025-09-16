// src/pages/payment/BookingPaymentPage.tsx
import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

import type { TossPaymentHandle } from '@/components/payment/pay/TossPayment'
import PaymentInfo from '@/components/payment/pay/PaymentInfo'
import ReceiveInfo from '@/components/payment/delivery/ReceiveInfo'

import Button from '@/components/common/button/Button'
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'
import BookingProgress from '@/components/common/steps/BookingProgress'

import { useAuthStore } from '@/shared/storage/useAuthStore'
import PaymentSection from '@/components/payment/pay/PaymentSection'
import type { CheckoutState, PaymentMethod } from '@/models/payment/types/paymentTypes'
import { createPaymentId } from '@/models/payment/utils/paymentUtils'
import { saveBookingSession } from '@/shared/api/payment/paymentSession'
import { fetchBookingDetail } from '@/shared/api/payment/bookingDetail'

import { requestPayment, type PaymentRequestDTO } from '@/shared/api/payment/payments'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'
import { useReleaseWaitingMutation } from '@/models/waiting/tanstack-query/useWaiting'

import styles from './BookingPaymentPage.module.css'

// 주석: YYYY-MM-DD 문자열을 Date로 변환하는 안전 파서 멍
const parseYMD = (s?: string) => {
  if (!s) return undefined
  const t = s.trim().replace(/[./]/g, '-')
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(t)
  if (isNaN(d.getTime())) return undefined
  d.setHours(0, 0, 0, 0)
  return d
}

// 주석: 날짜 + "HH:mm"을 하나의 Date로 합치는 유틸 멍
const combineDateTime = (day?: Date, hhmm?: string | null) => {
  if (!day) return undefined
  const d = new Date(day)
  if (!hhmm) {
    d.setHours(0, 0, 0, 0)
    return d
  }
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return d
  d.setHours(Math.min(23, +m[1] || 0), Math.min(59, +m[2] || 0), 0, 0)
  return d
}

const BookingPaymentPage: React.FC = () => {
  const stompClientRef = useRef<any>(null)

  const navigate = useNavigate()
  const { state } = useLocation()
  const checkout = state as CheckoutState
  const reconnect = useRef(0); 

  // 주석: 결제 금액/상품 정보 캐싱 멍
  const unitPrice = checkout?.unitPrice ?? 0
  const quantity = checkout?.quantity ?? 0
  const finalAmount = useMemo(() => unitPrice * quantity, [unitPrice, quantity])
  const orderName = useMemo(() => checkout?.title, [checkout?.title])
  const festivalIdVal = checkout?.festivalId

  // 주석: 판매자 ID는 예매 상세 조회로 확보 멍
  const [sellerId, setSellerId] = useState<number | null>(null)

  // 주석: 사용자 이름(스토어 우선, 없으면 토큰에서 파싱) 멍
  const storeName = useAuthStore((s) => s.user?.name) || undefined
  const userName = useMemo(() => storeName ?? getNameFromJwt(), [storeName])

  // 주석: 결제 방식/모달/결제ID 상태 멍
  const tossRef = useRef<TossPaymentHandle>(null)
  const [openedMethod, setOpenedMethod] = useState<PaymentMethod | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [ensuredPaymentId, setEnsuredPaymentId] = useState<string | null>(null)

  // 주석: 사용자 토큰에서 userId 확보 멍
  const { data: tokenInfo } = useTokenInfoQuery()
  const userId = Number(tokenInfo?.userId)

  // 주석: 결제 금액 표준화 멍
  const amountToPay = finalAmount ?? checkout.amount

  // 주석: 로딩/에러/결제ID 상태 멍
  const [isPaying, setIsPaying] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const toYMD = (input: Date) => {
    const y = input.getFullYear()
    const m = String(input.getMonth() + 1).padStart(2, '0')
    const d = String(input.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 주석: 최초 paymentId 생성 + 세션 저장 멍
  useEffect(() => {
    if (!paymentId) {
      const id = createPaymentId()
      setPaymentId(id)
      if (checkout?.bookingId && checkout?.festivalId && sellerId) {
        saveBookingSession({
          paymentId: id,
          bookingId: checkout.bookingId,
          festivalId: checkout.festivalId,
          sellerId,
          amount: finalAmount,
          createdAt: Date.now(),
        })
      }
    }
  }, [paymentId, checkout, finalAmount, sellerId])

  // 주석: sellerId 확보 - 예매 상세 조회 멍
  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetchBookingDetail({
          festivalId: checkout.festivalId,
          performanceDate: checkout.performanceDate,
          reservationNumber: checkout.bookingId,
        })
        if (!res.success) throw new Error(res.message || '상세 조회 실패')
        const sid = (res.data?.sellerId ?? res.data?.sellerId) as number | undefined
        if (!sid) throw new Error('sellerId 누락')
        setSellerId(sid)
      } catch (e) {
        // 주석: 조회 실패 시 사용자 흐름을 끊지 않기 위해 무음 처리 멍
      }
    })()
  }, [checkout?.festivalId, checkout?.performanceDate, checkout?.bookingId, navigate])

  // 주석: 웹소켓 연결 - 결제 완료/취소 알림 수신
  useEffect(() => {
    if (!checkout?.bookingId) return

    if (stompClientRef.current?.connected) {
      stompClientRef.current.deactivate()
      stompClientRef.current = null
    }

    const connectWebSocket = () => {
      if (reconnect.current >= 1) {
        return;
      }

      reconnect.current += 1;

      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:10000/ws'), // 포트/경로는 기존 설정 멍
        connectHeaders: {},
        debug: (str) => console.log('[STOMP Debug]', str),
        reconnectDelay: 0,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      })

      client.onConnect = () => {
        stompClientRef.current = client
        client.subscribe('/user/queue/ticket-status', (message) => {
          try {
            const data = JSON.parse(message.body)
            if (data.status === 'CONFIRMED') {
              navigate('/payment/result?type=booking&status=success')
            } else if (data.status === 'CANCELED') {
              navigate('/payment/result?type=booking&status=fail')
            }
          } catch { }
        })
      }

      client.onDisconnect = () => {
        setTimeout(() => connectWebSocket(), 5000)
      }

      client.activate()
    }

    connectWebSocket()

    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate()
        stompClientRef.current = null
      }
    }
  }, [checkout?.bookingId, navigate])

  // 주석: 대기열(좌석 홀드) 해제 트리거 멍
  const releaseMut = useReleaseWaitingMutation()
  const releasedOnceRef = useRef(false)

  // 주석: 예약 일시(Date) 계산 멍
  const reservationDate = useMemo(() => {
    const day = parseYMD(checkout?.performanceDate)
    return combineDateTime(day, (checkout as any)?.performanceTime ?? null)
  }, [checkout?.performanceDate, (checkout as any)?.performanceTime])

  // 주석: 실패/성공 진입 시 1회만 해제 호출 멍
  const callReleaseOnce = (why: string) => {
    if (releasedOnceRef.current) return
    if (!checkout?.festivalId || !reservationDate) return

    releasedOnceRef.current = true
    releaseMut.mutate({
      festivalId: String(checkout.festivalId),
      reservationDate: toYMD(reservationDate), // ← 문자열로 변경
    })
  }

  // 주석: 결과 라우팅 공통 유틸 멍
  const routeToResult = (ok: boolean) => {
    callReleaseOnce(ok ? 'routeToResult:success' : 'routeToResult:fail')
    navigate(`/payment/result?type=booking&status=${ok ? 'success' : 'fail'}`)
  }

  // 주석: 결제 수단 토글 - 제한시간 체크 제거 멍
  const toggleMethod = (m: PaymentMethod) => {
    if (isPaying) return
    setOpenedMethod((prev) => (prev === m ? null : m))
    setErr(null)
  }

  // 주석: 결제 핸들러 - 지갑은 모달로, 카드/토스는 PG 이동 멍
  const handlePayment = async () => {
    if (!checkout) {
      setErr('결제 정보를 불러오지 못했어요. 처음부터 다시 진행해주세요.')
      return
    }
    if (!openedMethod) {
      setErr('결제 수단을 선택해주세요.')
      return
    }
    if (isPaying) return

    // 주석: paymentId 고정 멍
    const ensuredId = ensuredPaymentId ?? paymentId ?? createPaymentId()
    if (!ensuredPaymentId) setEnsuredPaymentId(ensuredId)
    if (!paymentId) setPaymentId(ensuredId)

    if (!Number.isFinite(userId)) {
      setErr('로그인이 필요합니다.')
      return
    }

    // 주석: 1) REQUEST - 백엔드에 결제 요청 상태 기록 멍
    const dto: PaymentRequestDTO = {
      paymentId: ensuredId,
      bookingId: checkout.bookingId ?? null,
      festivalId: checkout.festivalId ?? null,
      paymentRequestType:
        openedMethod === 'wallet' ? 'POINT_PAYMENT_REQUESTED' : 'GENERAL_PAYMENT_REQUESTED',
      buyerId: userId!,
      sellerId: sellerId!,
      amount: finalAmount,
      currency: 'KRW',
      payMethod: openedMethod === 'wallet' ? 'POINT_PAYMENT' : 'CARD',
    }

    setIsPaying(true)
    try {
      await requestPayment(dto, userId!)
    } catch (e: any) {
      console.error('[requestPayment] failed', e?.response?.status, e?.response?.data)
      setErr('결제 준비에 실패했어요. 잠시 후 다시 시도해 주세요.')
      setIsPaying(false)
      return
    }

    // 주석: 2) 지갑 결제 → 비밀번호 모달 열기 멍
    if (openedMethod === 'wallet') {
      setIsPaying(false)
      setIsPasswordModalOpen(true)
      return
    }

    // 주석: 2') 카드/토스 → PG로 이동 멍
    try {
      sessionStorage.setItem(
        'tekcit:waitingRelease',
        JSON.stringify({
          festivalId: checkout.festivalId,
          performanceDate: checkout.performanceDate, // "YYYY-MM-DD"
          performanceTime: (checkout as any)?.performanceTime ?? null, // "HH:mm" | null
        }),
      )

      await tossRef.current?.requestPay({
        paymentId: ensuredId,
        amount: finalAmount,
        orderName,
        bookingId: checkout.bookingId,
        festivalId: festivalIdVal,
        sellerId: sellerId!,
        successUrl: `${window.location.origin}/payment/result?type=booking&status=success`,
        failUrl: `${window.location.origin}/payment/result?type=booking&status=fail`,
      })
    } catch {
      setErr('결제 요청 중 오류가 발생했어요.')
      routeToResult(false)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* 주석: 예매 단계 진행 표시줄 - 현재 단계는 3(결제) 멍 */}
      <BookingProgress current={3} />

      <div className={styles.container} role="main">
        <section className={styles.left}>
          <div className={styles.sectionContainer}>

            {/* 주석: 주문 요약 + 하단 결제 버튼 멍 */}
            <aside className={styles.right}>
              <div className={styles.summaryCard}>
                <PaymentInfo />
              </div>
              <div className={styles.buttonWrapper}>
                <Button
                  type="button"
                  className={styles.payButton}
                  onClick={handlePayment}
                  aria-busy={isPaying}
                >
                  {isPaying ? '결제 중...' : '결제하기'}
                </Button>
              </div>
            </aside>

            {/* 주석: 수령 방법 멍 */}
            <div className={styles.receiveSection}>
              <h2 className={styles.sectionTitle}>수령 방법</h2>
              <ReceiveInfo rawValue={checkout.deliveryMethod} />
            </div>

            {/* 주석: 결제 수단 멍 */}
            <div>
              <h2 className={styles.sectionTitle}>결제 수단</h2>
              <PaymentSection
                ref={tossRef}
                openedMethod={openedMethod}
                onToggle={toggleMethod}
                amount={finalAmount}
                orderName={orderName}
                errorMsg={err}
                bookingId={checkout.bookingId}
                festivalId={checkout.festivalId}
                sellerId={sellerId!}
              />
            </div>
          </div>
        </section>
      </div>

      {/* 주석: 지갑 비밀번호 모달 - tekcitpay 성공 시 바로 성공 라우팅 멍 */}
      {isPasswordModalOpen && ensuredPaymentId && Number.isFinite(userId) && (
        <PasswordInputModal
          amount={amountToPay}
          paymentId={ensuredPaymentId}
          userName={userName}
          userId={userId as number}
          onClose={() => setIsPasswordModalOpen(false)}
          onComplete={() => {
            setTimeout(() => {
              navigate('/payment/result?type=booking&status=success')
            }, 2000)
            setIsPasswordModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default BookingPaymentPage
