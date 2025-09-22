import React, { useMemo } from 'react'
import styles from './ReservationList.module.css'
import { useNavigate } from 'react-router-dom'
import { useTicketsQuery } from '@/models/my/ticket/tanstack-query/useTickets'
import type { TicketListItem } from '@/models/my/ticket/ticketTypes'
import Spinner from '@/components/common/spinner/Spinner'

interface Props {
  filter: '전체' | '예매완료' | '예매취소' | '관람일정 조회'
  viewDate?: Date | null
}

const mapTabToStatusLabel = (tab: Props['filter']): '전체' | '예매 완료' | '취소 완료' => {
  if (tab === '예매완료') return '예매 완료'
  if (tab === '예매취소') return '취소 완료'
  return '전체'
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))

const parseDateLoose = (raw: string): Date | null => {
  if (!raw) return null
  const norm = raw
    .replaceAll('.', '-')   
    .replace('T', ' ')      
    .replace(/\.\d+$/, '')  
  const d = new Date(norm)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatYMDHM = (d: Date): string =>
  `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`

const fmt = (raw: string): string => {
  const d = parseDateLoose(raw)
  if (d) return formatYMDHM(d)

  const m = raw
    .replace('T', ' ')
    .match(/(\d{4})[.\-\/](\d{2})[.\-\/](\d{2})[ T](\d{2}):(\d{2})/)
  if (m) {
    const [, y, mo, da, hh, mm] = m
    return `${y}.${mo}.${da} ${hh}:${mm}`
  }
  return raw 
}

const ReservationList: React.FC<Props> = ({ filter, viewDate }) => {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useTicketsQuery()

  const { startDate, endDate } = useMemo(() => {
    if (filter === '관람일정 조회' && viewDate) {
      const start = new Date(viewDate); start.setHours(0, 0, 0, 0)
      const end = new Date(viewDate);   end.setHours(23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    return { startDate: null as Date | null, endDate: null as Date | null }
  }, [filter, viewDate])

  const statusFilter = mapTabToStatusLabel(filter)

  const items = useMemo(() => {
    const src = Array.isArray(data) ? (data as TicketListItem[]) : []
    return src.filter((item) => {
      const reservationDate = parseDateLoose(item.date) ?? new Date(item.date)
      if (startDate && reservationDate < startDate) return false
      if (endDate && reservationDate > endDate) return false
      if (statusFilter !== '전체' && item.statusLabel !== statusFilter) return false
      return true
    })
  }, [data, startDate, endDate, statusFilter])

  const openDetail = (row: TicketListItem) => {
    navigate(`/mypage/ticket/detail/${row.reservationNumber}`)
  }

  if (isLoading) return <Spinner />
  if (isError) {
    return (
      <div className={styles.list}>
        <p className={styles.empty}>예매 내역이 존재하지 않습니다.</p>
      </div>
    )
  }
  if (!items.length) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <div className={styles.emptyIcon} aria-hidden />
        <h3 className={styles.emptyTitle}>예매 내역이 없습니다</h3>
        <p className={styles.emptyDesc}>선택한 조건에 해당하는 예매 내역이 없습니다.</p>
        <button className={styles.primaryBtn} onClick={() => navigate('/')}>티켓 예매하기</button>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {items.map((it) => (
        <article key={it.reservationNumber} className={styles.card} onClick={() => openDetail(it)}>
          <h3 className={styles.title}>{it.title}</h3>
          <div className={styles.body}>
            <img
              src={(it.posterFile ?? '').trim()}
              alt={`${it.title} 포스터`}
              className={styles.poster}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '@/shared/assets/placeholder-poster.png' }}
            />
            <div className={styles.info}>
              <div className={styles.row}>
                <span className={styles.k}>예매번호</span>
                <span className={styles.v}>{it.number}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.k}>예매일</span>
                <span className={styles.v}>{fmt(it.date)}</span> 
              </div>
              <div className={styles.row}>
                <span className={styles.k}>관람일시</span>
                <span className={styles.v}>{fmt(it.dateTime)}</span> 
              </div>
              <div className={styles.row}>
                <span className={styles.k}>매수</span>
                <span className={styles.v}>{it.count}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.k}>상태</span>
                <span className={styles.v}>{it.statusLabel}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ReservationList
