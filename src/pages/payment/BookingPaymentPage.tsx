// src/pages/payment/BookingPaymentPage.tsx
// 목적: 모바일 UI 유지 + 웹 버전 API 연동(상세 조회, 세션 저장, 결제 준비, WS) 동일 적용

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'                   // 주석: 훅
import { useNavigate, useLocation } from 'react-router-dom'                                 // 주석: 라우팅
import { useMutation } from '@tanstack/react-query'                                         // 주석: 결제 준비 요청 뮤테이션
import SockJS from 'sockjs-client'                                                          // 주석: 웹소켓
import { Client } from '@stomp/stompjs'                                                     // 주석: STOMP 클라이언트

import PaymentInfo from '@/components/payment/pay/PaymentInfo'                              // 주석: 주문 요약 카드
import ReceiveInfo, { type ReceiveType } from '@/components/payment/delivery/ReceiveInfo'   // 주석: 수령 방법 표시
import WalletPayment from '@/components/payment/pay/WalletPayment'                          // 주석: 지갑 결제 UI
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'              // 주석: 지갑 비번 모달
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'  // 주석: 토스 결제 컴포넌트
import PaymentTotal from '@/components/payment/pay/paymentTotal'                            // 주석: 최종 결제 정보/약관
import PaymentFooter from '@/components/payment/pay/BookingPaymentFooter'                   // 주석: 하단 CTA 바
import AlertModal from '@/components/common/modal/AlertModal'                               // 주석: 알럿 모달
import BookingProgress from '@/components/common/steps/BookingProgress'                     // 주석: 진행 표시 (sellerId 로딩 시)

import styles from './BookingPaymentPage.module.css'                                        // 주석: 스타일

import type { CheckoutState, PaymentMethod } from '@/models/payment/types/paymentTypes'     // 주석: 결제 타입/체크아웃 타입
import { createPaymentId } from '@/models/payment/utils/paymentUtils'                       // 주석: paymentId 생성 유틸
import { saveBookingSession } from '@/shared/api/payment/paymentSession'                    // 주석: 프론트 세션 저장
import { fetchBookingDetail } from '@/shared/api/payment/bookingDetail'                     // 주석: 예매 상세 조회(sellerId 확보)
import { requestPayment, type PaymentRequestDTO } from '@/shared/api/payment/payments'      // 주석: 결제 준비 API
import { useAuthStore } from '@/shared/storage/useAuthStore'                                // 주석: 사용자명 표시
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'                          // 주석: userId 가져오기

// 접근성: 페이지 타이틀 id
const PAGE_TITLE_ID = 'bookingPaymentMainTitle'

const BookingPaymentPage: React.FC = () => {
  // 주석: STOMP 클라이언트 ref
  const stompClientRef = useRef<Client | null>(null)

  // 주석: 내비/라우팅 상태
  const navigate = useNavigate()
  const { state } = useLocation()
  const checkout = state as CheckoutState | undefined

  // 주석: 스토어/토큰 정보
  const storeName = useAuthStore((s) => s.user?.name) || undefined
  const { data: tokenInfo } = useTokenInfoQuery()
  const userId = Number(tokenInfo?.userId)

  // 주석: 수령방법(모바일 UI는 고정 표기)
  const [receiveType] = useState<ReceiveType>('QR')

  // 주석: 토스 결제 ref
  const tossRef = useRef<TossPaymentHandle>(null)

  // 주석: UI 상태
  const [openedMethod, setOpenedMethod] = useState<PaymentMethod | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [allAgreed, setAllAgreed] = useState(false)

  // 주석: 결제 금액/주문 파생값
  const unitPrice = checkout?.unitPrice ?? checkout?.amount ?? 0
  const quantity = checkout?.quantity ?? 1
  const finalAmount = useMemo(() => unitPrice * quantity, [unitPrice, quantity])
  const orderName = useMemo(() => checkout?.title ?? '티켓 예매', [checkout?.title])
  const festivalIdVal = checkout?.festivalId as any
  const buyerName = useMemo(
    () => storeName ?? checkout?.buyerName ?? '주문자',
    [storeName, checkout?.buyerName],
  )

  // 주석: 결과 페이지 이동(모바일 라우트 유지)
  const routeToResult = useCallback(
    (ok: boolean, id?: string) => {
      const params = new URLSearchParams({ type: 'booking', status: ok ? 'success' : 'fail' })
      if (id) params.set('paymentId', id)
      navigate(`/payment/result?${params.toString()}`)
    },
    [navigate],
  )

  // 주석: 상세 페이지 이동(닫기 확인 모달)
  const goShowDetail = () => navigate(`/festival/${festivalIdVal}`)

  // 주석: 버튼 활성
  const canPay = !!openedMethod && allAgreed && !isPaying

  // 주석: 결제 연동 공통 상태
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [ensuredPaymentId, setEnsuredPaymentId] = useState<string | null>(null)
  const [sellerId, setSellerId] = useState<number | null>(null)

  // 주석: 최초 paymentId 생성 + 프론트 세션 저장(웹과 동일)
  useEffect(() => {
    if (!paymentId) {
      const id = createPaymentId()
      setPaymentId(id)
    }
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

  // 주석: 예매 상세 조회 → sellerId 확보(웹과 동일; sellerId/seller_id 모두 대응은 fetchBookingDetail 내부에서 처리)
  useEffect(() => {
    if (!checkout?.festivalId || !checkout?.performanceDate || !checkout?.bookingId) return
    ;(async () => {
      try {
        const res = await fetchBookingDetail({
          festivalId: String(checkout.festivalId),
          performanceDate: checkout.performanceDate,               // 주석: 서버가 ISO 요구 시 호출부/인터셉터에서 변환
          reservationNumber: checkout.bookingId,
        })
        if (!res.success) throw new Error(res.message || '상세 조회 실패')
        const sid = res.data?.sellerId as number | undefined
        if (!sid || sid <= 0) throw new Error('sellerId 누락')
        setSellerId(sid)
      } catch (e) {
        console.error('예매 상세 조회 실패', e)
        alert('결제 정보를 불러오지 못했습니다.')
        navigate(-1)
      }
    })()
  }, [checkout?.festivalId, checkout?.performanceDate, checkout?.bookingId, navigate])

  // 주석: 웹소켓 연결 (결제 완료 알림 수신) — 웹과 동일
  useEffect(() => {
    if (!checkout?.bookingId) return

    // 기존 연결 해제
    if (stompClientRef.current?.connected) {
      stompClientRef.current.deactivate()
      stompClientRef.current = null
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:10000/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => console.log('[STOMP]', msg),
    })

    client.onConnect = () => {
      stompClientRef.current = client

      client.subscribe('/user/queue/ticket-status', (message) => {
        try {
          const data = JSON.parse(message.body)
          if (data.status === 'CONFIRMED') {
            // 팝업 시나리오: 부모창에 신호 후 닫기
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: 'PAYMENT_SUCCESS',
                  data: { bookingId: checkout.bookingId, paymentId: ensuredPaymentId || paymentId, status: 'success' },
                },
                window.location.origin,
              )
              setTimeout(() => window.close(), 1000)
            } else {
              routeToResult(true, ensuredPaymentId || paymentId || undefined)
            }
          } else if (data.status === 'CANCELED') {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                { type: 'PAYMENT_FAILURE', data: { bookingId: checkout.bookingId, status: 'fail', reason: 'canceled' } },
                window.location.origin,
              )
              setTimeout(() => window.close(), 1000)
            } else {
              routeToResult(false, ensuredPaymentId || paymentId || undefined)
            }
          }
        } catch (err) {
          console.error('웹소켓 메시지 파싱 실패', err, message.body)
        }
      })

      // 연결 테스트용 publish(선택)
      setTimeout(() => {
        try {
          client.publish({
            destination: '/app/test',
            body: JSON.stringify({ type: 'connection-test', bookingId: checkout.bookingId, ts: Date.now() }),
          })
        } catch (e) {
          console.error('웹소켓 테스트 메시지 실패', e)
        }
      }, 1000)
    }

    client.onDisconnect = () => {
      // 재연결은 Client의 reconnectDelay로 처리
    }

    client.activate()

    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate()
        stompClientRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout?.bookingId, routeToResult])

  // 주석: 결제 준비 요청 — TanStack Query(웹과 동일 DTO)
  const requestMut = useMutation({
    mutationFn: async (params: { ensuredId: string; method: PaymentMethod }) => {
      if (!checkout) throw new Error('결제 정보가 없습니다.')
      if (!Number.isFinite(userId)) throw new Error('로그인이 필요합니다.')
      if (!sellerId) throw new Error('판매자 정보가 없습니다.')

      const dto: PaymentRequestDTO = {
        paymentId: params.ensuredId,
        bookingId: checkout.bookingId ?? null,
        festivalId: checkout.festivalId ?? null,
        paymentRequestType: params.method === 'wallet' ? 'POINT_PAYMENT_REQUESTED' : 'GENERAL_PAYMENT_REQUESTED',
        buyerId: userId!,
        sellerId: sellerId!,
        amount: finalAmount,
        currency: 'KRW',
        payMethod: params.method === 'wallet' ? 'POINT_PAYMENT' : 'CARD',
      }

      await requestPayment(dto, userId!)
      return params.ensuredId
    },
  })

  // 주석: 결제수단 토글(모바일 UX 유지)
  const toggleMethod = (m: PaymentMethod) => {
    if (isPaying) return
    setOpenedMethod((prev) => (prev === m ? null : m))
    setErr(null)
  }

  // 주석: 결제 버튼
  const handlePayment = async () => {
    if (!checkout) { setErr('결제 정보를 불러오지 못했어요. 처음부터 다시 진행해주세요.'); return }
    if (!openedMethod) { setErr('결제 수단을 선택해주세요.'); return }
    if (isPaying) return

    // paymentId 고정(웹과 동일)
    const ensuredId = ensuredPaymentId ?? paymentId ?? createPaymentId()
    if (!ensuredPaymentId) setEnsuredPaymentId(ensuredId)
    if (!paymentId) setPaymentId(ensuredId)

    // 서버에 결제 준비 요청
    setIsPaying(true)
    try {
      await requestMut.mutateAsync({ ensuredId, method: openedMethod })
    } catch (e: any) {
      console.error('[requestPayment] 실패', e?.response?.status, e?.response?.data)
      setErr('결제 준비에 실패했어요. 잠시 후 다시 시도해 주세요.')
      setIsPaying(false)
      return
    }

    // 지갑: 비번 모달 열기(모달 내부에서 tekcitpay → WS/타임아웃으로 결과 이동)
    if (openedMethod === 'wallet') {
      setIsPaying(false)
      setIsPasswordModalOpen(true)
      return
    }

    // 카드/토스: PG 요청(결과는 리다이렉트/웹소켓에서 처리)
    try {
      await tossRef.current?.requestPay?.({
        paymentId: ensuredId,
        amount: finalAmount,
        orderName,
        bookingId: checkout.bookingId as any,
        festivalId: festivalIdVal,
        sellerId: sellerId as any,
        successUrl: `${window.location.origin}/payment/result?type=booking&status=success`,
        failUrl: `${window.location.origin}/payment/result?type=booking&status=fail`,
      } as any)

      // 주석: 구버전 대응
      if (!tossRef.current?.requestPay) {
        await (tossRef.current as any)?.requestPay?.()
      }
    } catch {
      setErr('결제 요청 중 오류가 발생했어요.')
      routeToResult(false)
    } finally {
      setIsPaying(false)
    }
  }

  // 주석: 가드 렌더
  if (!checkout) {
    return (
      <div className={styles.page}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p>결제 정보를 불러오지 못했습니다.</p>
          <button onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    )
  }
  if (sellerId === null) {
    return (
      <div className={styles.page}>
        <BookingProgress current={3} />
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p>결제 정보를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  // 주석: 실제 렌더(모바일 UI 유지)
  return (
    <div className={styles.page}>
      <div className={styles.container} role="main" aria-labelledby={PAGE_TITLE_ID}>
        <h1 id={PAGE_TITLE_ID} className="sr-only">예매 결제</h1>

        {/* 1) 티켓 주문상세 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>티켓 주문상세</h2>
          <PaymentInfo />
        </div>

        {/* 2) 수령 방법 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>수령 방법</h2>
          <div className={styles.flush}>
            <ReceiveInfo value={receiveType} />
          </div>
        </div>

        {/* 3) 결제 수단 */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>결제 수단</h2>
          <section className={`${styles.paymentBox} ${styles.flush}`}>
            {/* 킷페이(지갑) */}
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

            {/* 토스 */}
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

            {/* 에러 메시지 */}
            {err && <p className={styles.errorMsg}>{err}</p>}
          </section>
        </div>

        {/* 4) 결제 정보 */}
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
      />

      {/* 모달: 닫기 확인 */}
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

      {/* 모달: 지갑 비밀번호(tekcitpay 성공 시 결과 이동; WS 미수신 대비 타임아웃) */}
      {isPasswordModalOpen && ensuredPaymentId && Number.isFinite(userId) && (
        <PasswordInputModal
          amount={finalAmount}
          paymentId={ensuredPaymentId}
          userName={buyerName}
          userId={userId as number}
          onClose={() => setIsPasswordModalOpen(false)}
          onComplete={() => {
            setTimeout(() => {
              routeToResult(true, ensuredPaymentId)
            }, 2000)
            setIsPasswordModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default BookingPaymentPage
