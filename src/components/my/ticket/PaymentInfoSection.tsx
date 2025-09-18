// src/components/my/ticket/PaymentInfoSection.tsx (모바일)
import React, { useMemo } from 'react'
import { usePaymentOrdersQuery } from '@/models/my/ticket/tanstack-query/usePaymentOrders'
import styles from './PaymentInfoSection.module.css'
import { useNavigate } from 'react-router-dom'
import Spinner from '@/components/common/spinner/Spinner'

type Props = {
  bookingId: string
  reservationNumber: string
  qrUsed: boolean
}

const methodLabel = (m?: string) => {
  switch (m) {
    case 'CARD':
      return '신용/체크카드'
    case 'POINT_PAYMENT':
      return '포인트 결제'
    case 'POINT_CHARGE':
      return '포인트 충전'
    default:
      return m ?? '-'
  }
}

const krw = (n?: number | null, currency?: string) => {
  if (typeof n !== 'number') return '-'
  if (currency && currency !== 'KRW') return `${n.toLocaleString('ko-KR')} ${currency}`
  return n.toLocaleString('ko-KR') + '원'
}

const toDotYMD = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

function normalizeOrder(input: any): any | undefined {
  if (!input) return undefined
  if (Array.isArray(input)) {
    if (input.length === 0) return undefined
    // 최신 1건
    return [...input].sort((a, b) => {
      const ta = new Date(String(a.payTime ?? a.createdAt ?? 0)).getTime()
      const tb = new Date(String(b.payTime ?? b.createdAt ?? 0)).getTime()
      return tb - ta
    })[0]
  }
  // 래퍼 형태 방어
  const wrapped = input?.content ?? input?.data?.content ?? input?.data ?? input
  if (Array.isArray(wrapped)) return normalizeOrder(wrapped)
  if (wrapped && typeof wrapped === 'object') return wrapped
  return undefined
}

const PaymentInfoSection: React.FC<Props> = ({ bookingId, reservationNumber, qrUsed }) => {
  const navigate = useNavigate() // ✅ 추가
  const { data, isLoading, isError } = usePaymentOrdersQuery(bookingId)

  const order = useMemo(() => normalizeOrder(data), [data])

  const fee = 0
  const delivery = 0
  const subtotal = order?.amount ?? 0
  const total = subtotal + fee + delivery

  const handleRefundClick = () => {
    const paymentId =
      (order as any)?.paymentId ??
      (order as any)?.id ??
      (order as any)?.paymentid

    if (!paymentId) {
      console.warn('[PaymentInfoSection] paymentId가 없습니다. order:', order)
      return
    }
    navigate(`/payment/refund/${paymentId}`, {
      state: {
        paymentId,
        paymentAmount: order?.amount,
        currency: order?.currency ?? 'KRW'
      },
    })
  }

  const status = (order?.paymentStatus ?? '').toLowerCase()
  const isCanceled = status === 'canceled' || status === 'cancelled'
  console.log(isCanceled)
  const isPaid = status === 'paid'

  const isQrUsed = useMemo(() => {
    const v = String(qrUsed ?? '')
      .trim()
      .toLowerCase()
    return v === 'true' || v === 'y' || v === 'yes' || v === '1'
  }, [qrUsed])

  const canRefund = Boolean(order?.paymentId) && isPaid && !isCanceled && !isQrUsed

  const onRefund = () => {
    if (!canRefund) return
    const paymentId = order.paymentId ?? order.id ?? order.paymentid
    if (!paymentId) return
    navigate(`/payment/refund/${paymentId}`, {
      state: {
        paymentId,
        paymentAmount: order.amount,
        currency: order.currency ?? 'KRW',
      },
    })
  }

  if (isLoading) {
    return (
      <section className={styles.card} aria-label="결제 내역">
        <Spinner />
      </section>
    )
  }
  if (isError) {
    return (
      <div className={`${styles.card2} ${styles.empty}`}>
        <div className={styles.emptyIcon} aria-hidden />
        <h3 className={styles.emptyTitle}>결제 내역이 없습니다</h3>
        <p className={styles.emptyDesc}>양도 받은 티켓은 결제 내역에서 제외됩니다.</p>
      </div>
    )
  }
  if (!order) {
    return (
      <section className={styles.card} aria-label="결제 내역">
        <span className={styles.v}>이 예매번호에 해당하는 결제내역이 없습니다.</span>
      </section>
    )
  }

  return (
    <section className={styles.card} aria-label="결제 내역">
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.k}>예매일</span>
          <span className={styles.v}>{toDotYMD(order.payTime as unknown as string)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>결제수단</span>
          <span className={styles.v}>{methodLabel(order.payMethod as unknown as string)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>예매번호</span>
          <span className={styles.v}>{reservationNumber}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>가격</span>
          <span className={`${styles.v} ${styles.em}`}>{krw(order.amount, order.currency)}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.summary}>
        <div className={`${styles.sumRow} ${styles.total}`}>
          <span>총 결제금액</span>
          <span>{krw(total, order.currency)}</span>
        </div>
      </div>

      {isCanceled ? (
        <span className={styles.badgeGray}>환불완료</span>
      ) : isQrUsed ? (
        <span className={styles.badgeGray}>사용완료 · 환불불가</span>
      ) : (
        <button
          type="button"
          onClick={onRefund}
          disabled={!canRefund}
          className={styles.refundButton}
        >
          환불하기
        </button>
      )}
    </section>
  )
}

export default PaymentInfoSection
