// src/components/my/ticket/ReservationList.tsx
import React, { useMemo } from 'react'
import styles from './ReservationList.module.css'
import { useNavigate } from 'react-router-dom'

import { useTicketsQuery } from '@/models/my/ticket/tanstack-query/useTickets'
import type { TicketListItem } from '@/models/my/ticket/ticketTypes'

interface Props {
  filter: '전체' | '예매완료' | '예매취소' | '관람일정 조회'
  viewDate?: Date | null
}

const DUMMY_POSTER = 'https://picsum.photos/id/102/600/900'

const mapTabToStatusLabel = (tab: Props['filter']): '전체' | '예매 완료' | '취소 완료' => {
  if (tab === '예매완료') return '예매 완료'
  if (tab === '예매취소') return '취소 완료'
  return '전체'
}

const ReservationList: React.FC<Props> = ({ filter, viewDate }) => {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useTicketsQuery()

  const { startDate, endDate } = useMemo(() => {
    if (filter === '관람일정 조회' && viewDate) {
      const start = new Date(viewDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(viewDate)
      end.setHours(23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }
    return { startDate: null as Date | null, endDate: null as Date | null }
  }, [filter, viewDate])

  const statusFilter = mapTabToStatusLabel(filter)

  const items = useMemo(() => {
    const src = Array.isArray(data) ? (data as TicketListItem[]) : []
    return src.filter((item) => {
      const reservationDate = new Date(item.date.replaceAll('.', '-'))
      if (startDate && reservationDate < startDate) return false
      if (endDate && reservationDate > endDate) return false
      if (statusFilter !== '전체' && item.statusLabel !== statusFilter) return false
      return true
    })
  }, [data, startDate, endDate, statusFilter])

  const openDetail = (row: TicketListItem) => {
    navigate(`/mypage/ticket/detail/${row.reservationNumber}`)
  }

  if (isLoading) {
    return (
      <div className={styles.list}>
        <p className={styles.empty}>불러오는 중…</p>
      </div>
    )
  }
  if (isError) {
    return (
      <div className={styles.list}>
        <p className={styles.empty}>
          목록 조회 실패: {(error as Error)?.message ?? '알 수 없는 오류'}
        </p>
      </div>
    )
  }
  if (!items.length) {
    return (
      <div className={styles.list}>
        <p className={styles.empty}>조건에 맞는 내역이 없어요.</p>
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
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = DUMMY_POSTER
              }}
            />
            <div className={styles.info}>
              <div className={styles.row}>
                <span className={styles.k}>예매번호</span>
                <span className={styles.v}>{it.number}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.k}>예매일</span>
                <span className={styles.v}>{it.date}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.k}>관람일시</span>
                <span className={styles.v}>{it.dateTime}</span>
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
