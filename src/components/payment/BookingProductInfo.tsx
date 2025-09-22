// src/components/payment/BookingProductInfo.tsx
import React from 'react'
import styles from './BookingProductInfo.module.css'

type Relation = 'FAMILY' | 'OTHERS'
type Info = {
  title?: string
  datetime?: string
  location?: string
  ticket?: number
  price?: number
  relation?: Relation
  posterFile?: string
}

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v
  const n = parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

const formatKRW = (n: number) => `${n.toLocaleString('ko-KR')}원`

const formatDateTime = (s?: string) => {
  if (!s) return '-'

  // 정규식으로 "YYYY-MM-DD HH:mm"만 추출
  const m = s.replace('T', ' ').match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/ // 초 이전까지만 캡처
  )
  if (m) return `${m[1]} ${m[2]}`

  // 폴백: 브라우저 Date 파싱 후 초 제외 포맷
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  }

  // 그래도 안 되면 T만 공백으로 바꾼 원문 반환
  return s.replace('T', ' ')
}

const BookingProductInfo: React.FC<{ info?: Info }> = ({ info }) => {
  const priceNumber = toNumber(info?.price)
  const priceDisplay = formatKRW(priceNumber)
  const dateTimeDisplay = formatDateTime(info?.datetime)

  return (
    <section className={styles.productSection}>
      <h2 className={styles.sectionTitle}>티켓 주문상세</h2>

      <div className={styles.card}>
        <div className={styles.infoBlock}>
          {/* 포스터 필요 시 썸네일 추가 가능 */}
          {/* {info?.posterFile && <img src={info.posterFile} alt="" className={styles.poster} />} */}
          <h3 className={styles.title}>{info?.title ?? '-'}</h3>
          <p className={styles.meta}>
            {dateTimeDisplay} · {info?.location ?? '-'}
          </p>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>수량</span>
          <span className={styles.value}>{info?.ticket ?? 0}매</span>
        </div>

        {/* 가격은 지인(OTHERS)일 때만 노출 */}
        {info?.relation === 'OTHERS' && (
          <div className={styles.detailRow}>
            <span className={styles.label}>가격정보</span>
            <span className={styles.value}>{priceDisplay}</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default BookingProductInfo
