// src/components/my/ticket/PaymentInfoSection.tsx (모바일)
import React, { useMemo } from 'react'
import { usePaymentOrdersQuery } from '@/models/my/ticket/tanstack-query/usePaymentOrders'
import styles from './PaymentInfoSection.module.css'

type Props = {
  festivalId: string
  reservationNumber: string
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

const PaymentInfoSection: React.FC<Props> = ({ festivalId, reservationNumber }) => {
  const { data: list, isLoading, isError, error } = usePaymentOrdersQuery(festivalId)

  // 웹과 동일: 최신 결제건 1개 선택
  const order = useMemo(() => {
    if (!list || list.length === 0) return undefined
    return [...list].sort((a, b) => {
      const ta = new Date(a.payTime as unknown as string).getTime()
      const tb = new Date(b.payTime as unknown as string).getTime()
      return tb - ta // desc
    })[0]
  }, [list])

  // 웹과 동일(현재 0 고정; 필요 시 API 필드 붙이면 교체)
  const fee = 0
  const delivery = 0
  const subtotal = order?.amount ?? 0
  const total = subtotal + fee + delivery

  // 로딩/에러/빈값 처리 — 모바일 스타일 유지
  if (isLoading) {
    return (
      <section className={styles.card} aria-label="결제 내역">
        <div className={styles.rows}>
          <div className={styles.row}><span className={styles.v}>불러오는 중…</span></div>
        </div>
      </section>
    )
  }
  if (isError) {
    return (
      <section className={styles.card} aria-label="결제 내역">
        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.v}>불러오기 실패: {(error as Error)?.message ?? '알 수 없는 오류'}</span>
          </div>
        </div>
      </section>
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
          <span className={styles.k}>현재상태</span>
          {/* 웹에선 아직 상태 필드가 없어 '-' 처리 */}
          <span className={styles.v}>
            <span className={`${styles.badge} ${styles.neutral}`}>-</span>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.k}>결제상태</span>
          <span className={styles.v}>
            <span className={`${styles.badge} ${styles.success}`}>-</span>
          </span>
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
        <div className={styles.sumRow}>
          <span>예매 수수료</span>
          <span>{krw(fee, order.currency)}</span>
        </div>
        <div className={styles.sumRow}>
          <span>배송비</span>
          <span>{krw(delivery, order.currency)}</span>
        </div>
        <div className={`${styles.sumRow} ${styles.total}`}>
          <span>총 결제금액</span>
          <span>{krw(total, order.currency)}</span>
        </div>
      </div>
    </section>
  )
}

export default PaymentInfoSection
