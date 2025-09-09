import { useRef, useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import * as SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

import AddressForm from '@/components/payment/address/AddressForm'
import BookingProductInfo, { type ReceiveType } from '@/components/payment/BookingProductInfo'
import AlertModal from '@/components/common/modal/AlertModal'
import PasswordInputModal from '@/components/payment/modal/TransferPasswordInputModal'
import WalletPayment from '@/components/payment/pay/WalletPayment'
import TossPayment, { type TossPaymentHandle } from '@/components/payment/pay/TossPayment'
import TransferPaymentFooter from '@/components/payment/transfer/TransferPaymentFooter'
import BookingPaymentHeader from '@/components/payment/transfer/TransferPaymentHeader'

import { useRespondFamilyTransfer } from '@/models/transfer/tanstack-query/useTransfer'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'
import {
  requestTransferPayment,
  type RequestTransferPaymentDTO,
  getPaymentIdByBookingId,
} from '@/shared/api/payment/payments'

import styles from './TransferPaymentPage.module.css'

type Method = '킷페이' | '토스'

// 웹 버전과 동일한 TransferState 타입
type TransferState = {
  transferId: number
  senderId: number
  transferStatus: 'ACCEPTED'
  relation: 'FAMILY' | 'OTHERS'
  reservationNumber: string
  title?: string
  datetime?: string
  location?: string
  ticket?: number
  price?: number
  posterFile?: string
}

// 예약번호 유효성 체크 스키마
const BookingIdSchema = z.string().min(1)

const TransferPaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const tossRef = useRef<TossPaymentHandle>(null)
  const stompClientRef = useRef<any>(null)

  // 웹 버전과 동일한 state 처리
  const navState = (location.state ?? {}) as Partial<TransferState>

  // 관계 분기
  const relation: 'FAMILY' | 'OTHERS' =
    navState.relation === 'FAMILY' || navState.relation === 'OTHERS' ? navState.relation : 'OTHERS'
  const isFamily = relation === 'FAMILY'

  // 유저 정보
  const { data: tokenInfo } = useTokenInfoQuery()
  const userId = tokenInfo?.userId

  // 승인 뮤테이션
  const respondFamily = useRespondFamilyTransfer()

  // 서버에서 bookingId → 기존 예매 결제 정보 조회
  const {
    data: basePayment,
    isLoading: isBasePayLoading,
    isError: isBasePayError,
    error: basePayError,
  } = useQuery({
    queryKey: ['basePayment', navState.reservationNumber, userId],
    queryFn: async () => {
      if (!userId) throw new Error('로그인이 필요합니다.')
      const bookingId = BookingIdSchema.parse(navState.reservationNumber!)
      const info = await getPaymentIdByBookingId(bookingId, userId)
      if (!info?.paymentId) throw new Error('기존 결제 정보를 찾을 수 없습니다.')
      return info
    },
    enabled: !!userId && !!navState.reservationNumber && !isFamily,
    staleTime: 60_000,
  })

  // 웹소켓 연결 (웹 버전과 동일)
  useEffect(() => {
    if (!navState.transferId) return

    const connectWebSocket = () => {
      const socket = new SockJS('/ws')
      const stompClient = Stomp.over(socket)

      stompClient.connect({}, function (frame) {
        console.log('Transfer WebSocket 연결됨:', frame)

        stompClient.subscribe(`/user/queue/transfer-status`, function (message) {
          const data = JSON.parse(message.body)
          console.log('양도 상태 업데이트:', data)
          
          if (data.reservationNumber === navState.reservationNumber) {
            if (data.status === 'COMPLETED') {
              navigate('/payment/result?type=transfer&status=success')
            } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
              navigate('/payment/result?type=transfer&status=fail')
            }
          }
        })
      })

      stompClientRef.current = stompClient
    }

    connectWebSocket()

    return () => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.disconnect()
      }
    }
  }, [navState.transferId, navState.reservationNumber, userId, navigate])

  // 모바일 UI 상태 (기존 유지)
  const [isAddressFilled, setIsAddressFilled] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [openedMethod, setOpenedMethod] = useState<Method | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isPwModalOpen, setIsPwModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 서버 기준 값 (웹 버전과 동일)
  const basePaymentId = basePayment?.paymentId
  const baseAmount = basePayment?.amount ?? 0

  // 모바일 UI용 목 데이터 (기존 유지)
  const amount = 190000
  const product = {
    posterUrl: '',
    title: navState.title || '뮤지컬 <레미제라블>',
    dateTimeLabel: navState.datetime || '2025.09.21 (일) 17:00',
    unitPrice: navState.price || amount,
    quantity: navState.ticket || 2,
    receiveType: 'DELIVERY' as ReceiveType,
    shippingFee: 3000,
    Transferor: '김양도',
    Transferee: '이양수',
  }

  // 필수 파라미터 가드
  const transferIdOK = Number.isFinite(Number(navState.transferId))
  const senderIdOK = Number.isFinite(Number(navState.senderId))
  if (!transferIdOK || !senderIdOK || !navState.reservationNumber) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>요청 정보가 올바르지 않습니다. 목록에서 다시 들어와 주세요.</p>
          <button onClick={() => navigate(-1)}>뒤로가기</button>
        </div>
      </div>
    )
  }
  const disabledNext = useMemo(() => {
    if (isFamily) {
      return !(isAddressFilled && isAgreed)
    }
    return !(isAddressFilled && isAgreed && openedMethod !== null && !isBasePayLoading && !!basePaymentId && !isBasePayError)
  }, [isAddressFilled, isAgreed, openedMethod, isFamily, isBasePayLoading, basePaymentId, isBasePayError])

  const toggleMethod = (m: Method) => setOpenedMethod(prev => (prev === m ? null : m))

  // 양도 승인 DTO (웹 버전과 동일한 로직 적용)
  const buildApproveDTO = () => ({
    transferId: Number(navState.transferId),
    senderId: Number(navState.senderId),
    transferStatus: 'ACCEPTED' as const,
    deliveryMethod: deliveryMethod ?? null,
    address: deliveryMethod === 'PAPER' ? (address || '') : null,
  })

  const handleNextClick = async () => {
    if (disabledNext) return
    if (openedMethod === '킷페이' || isFamily) {
      setIsAlertOpen(true)
      return
    }
    if (openedMethod === '토스') {
      // TossPayment가 요구하는 인자들을 전달
      await tossRef.current?.requestPay({
        paymentId: `transfer-${Date.now()}`, // 임시 paymentId 생성
        amount,
        orderName: "티켓 양도 결제",
        bookingId: navState.reservationNumber || '',
        festivalId: navState.transferId?.toString() || '',
        sellerId: Number(navState.senderId) || 0,
      })
      return
    }
  }

  // 웹 버전과 동일한 확인 로직
  const handleAlertConfirm = async () => {
    setIsAlertOpen(false)
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // 가족: 결제 없이 승인만 처리
      if (isFamily) {
        const dto = buildApproveDTO()
        await respondFamily.mutateAsync(dto)
        alert('성공적으로 티켓 양도를 받았습니다.')
        navigate('/mypage/ticket/history')
        return
      }

      // 지인: 비밀번호 모달 표시
      if (!userId) throw new Error('로그인이 필요합니다.')
      if (isBasePayLoading) throw new Error('결제 정보를 불러오는 중입니다.')
      if (!basePaymentId) throw new Error((basePayError as any)?.message || '기존 결제 정보를 찾을 수 없습니다.')

      setIsPwModalOpen(true)
    } catch (e: any) {
      console.log('[Transfer][handleAlertConfirm error]', e?.response?.data || e)
      const msg = e?.message || ''
      if (e?.response?.data?.errorMessage) {
        alert(e.response.data.errorMessage)
      } else {
        alert(msg || '오류남.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAlertCancel = () => setIsAlertOpen(false)

  // 웹 버전과 동일한 비밀번호 완료 처리
  const handlePasswordComplete = async (password: string) => {
    try {
      if (!userId || !basePaymentId) throw new Error('필수 정보가 없습니다.')

      // 양도 수수료 계산
      const RATE = Number(import.meta.env.VITE_TRANSFER_FEE_RATE ?? 0.1)
      const commission = Math.max(1, Math.floor(baseAmount * RATE))

      // 양도 결제 실행 (포인트 차감 + 양도 처리 + 수수료 처리)
      const transferReqBody: RequestTransferPaymentDTO = {
        sellerId: Number(navState.senderId) || 0,
        paymentId: basePaymentId,
        bookingId: navState.reservationNumber!,
        totalAmount: baseAmount,
        commission,
      }

      console.log('transfer 호출 payload', transferReqBody)
      // 실제 양도 결제 실행
      await requestTransferPayment(transferReqBody, userId)
      console.log('transfer api 성공')

      // 양도 승인 처리
      const approveDTO = buildApproveDTO()
      await respondFamily.mutateAsync(approveDTO)

      // WebSocket 메시지 누락 대비
      setTimeout(() => {
        navigate('/payment/result?type=transfer&status=success')
      }, 2000)

    } catch (e: any) {
      console.log('[Transfer][handlePasswordComplete error]', e?.response?.data || e)
      const msg = e?.response?.data?.errorMessage || e?.message || '양도 처리에 실패했습니다.'
      alert(msg)
      navigate('/payment/result?type=transfer&status=fail')
    } finally {
      setIsPwModalOpen(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* 모바일 UI 그대로 유지 */}
      <BookingPaymentHeader
        title="양도 결제"
      />

      <div className={styles.headerSpacer} aria-hidden />

      {/* 예매 기본 안내사항 */}
      <section className={styles.card}>
        <BookingProductInfo {...product} />
      </section>

      {/* 배송지 선택 */}
      <section className={styles.card}>
        <AddressForm onValidChange={setIsAddressFilled} />
      </section>

      {/* 결제 수단 - 지인일 때만 표시 (웹 버전과 동일) */}
      {!isFamily && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>결제 수단</h2>
          {/* 킷페이 */}
          <div className={`${styles.methodCard} ${openedMethod === '킷페이' ? styles.active : ''}`}>
            <button 
              type="button" 
              className={styles.methodHeader}
              onClick={() => toggleMethod('킷페이')} 
              aria-expanded={openedMethod === '킷페이'}
              disabled={isBasePayLoading || isBasePayError}
              title={
                isBasePayLoading
                  ? '결제 정보를 불러오는 중입니다.'
                  : isBasePayError
                    ? (basePayError as any)?.message ?? '결제 정보를 찾을 수 없습니다.'
                    : undefined
              }
            >
              <span className={`${styles.radio} ${openedMethod === '킷페이' ? styles.radioOn : ''}`} />
              <span className={styles.methodText}>
                킷페이 (포인트 결제)
                {isBasePayLoading ? ' - 결제정보 조회중...' : ''}
              </span>
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
      )}

      {/* 가족 양도 안내 */}
      {isFamily && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>가족 양도</h2>
          <p style={{ padding: '16px 0', color: '#666' }}>
            가족 간 양도는 <strong>무료</strong>로 진행됩니다.<br />
            결제 과정 없이 다음 단계로 넘어갑니다.
          </p>
        </section>
      )}

      {/* 하단 CTA */}
      <TransferPaymentFooter
        unitPrice={product.unitPrice}
        quantity={product.quantity}
        shippingFee={product.shippingFee}
        onPay={handleNextClick}
        disabled={disabledNext || isSubmitting || (!isFamily && !userId)}
      />

      {/* 모달들 */}
      {isAlertOpen && (
        <AlertModal title="결제 안내" onCancel={handleAlertCancel} onConfirm={handleAlertConfirm}>
          {isFamily 
            ? '가족 간 양도는 결제 없이 진행됩니다. 계속하시겠습니까?'
            : '양도로 구매한 티켓은 환불 불가합니다. 계속 진행하시겠습니까?'
          }
        </AlertModal>
      )}

      {/* 비가족: 결제 정보가 준비된 후에만 모달 표시 */}
      {!isFamily && isPwModalOpen && userId && basePaymentId && (
        <PasswordInputModal
          onClose={() => setIsPwModalOpen(false)}
          onComplete={handlePasswordComplete}
        />
      )}
    </div>
  )
}

export default TransferPaymentPage