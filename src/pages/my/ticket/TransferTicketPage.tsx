import React, { useEffect, useMemo, useState } from 'react'
import styles from './TransferTicketPage.module.css'
import MyHeader from '@/components/my/hedaer/MyHeader'
import { useNavigate } from 'react-router-dom'
import { useTicketsQuery } from '@/models/my/ticket/tanstack-query/useTickets'
import type { TransferListItem } from '@/models/my/ticket/ticketTypes'
import BeforeTransferTicket from '@/components/my/ticket/BeforeTransferTicket'

import AfterTransferTicket from '@/components/my/ticket/AfterTransferTicket'
import {
  useWatchTransferQuery,
  // 수락/거절 훅이 있다면 가져다 쓰세요
  // useRespondFamilyTransfer,
  // useRespondOthersTransfer,
} from '@/models/transfer/tanstack-query/useTransfer'

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const splitDateTime = (iso?: string) => {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const HH = pad(d.getHours())
  const MM = pad(d.getMinutes())
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` }
}

export const TRANSFER_DONE_EVENT = 'ticket:transferred'

/** 🔁 watch 아이템 → AfterTransferTicket props 매핑 */
const toAfterProps = (w: any) => {
  const { date, time } = splitDateTime(w.performanceDate) // ISO -> YYYY-MM-DD / HH:mm

  return {
    title: w.fname ?? '-', // ✅ 공연명
    date, // ✅ 2025-09-15
    time, // ✅ 18:00
    relation: (w.transferType === 'FAMILY' ? '가족' : '지인') as '가족' | '지인', // ✅ FAMILY/OTHERS
    status: (w.status ?? '').toString().toLowerCase(), // ✅ requested/approved/completed/canceled...
    posterUrl: w.posterFile, // ✅ 포스터
    price: w.ticketPrice, // ✅ 단가(지인일 때 컴포넌트에서만 노출)
    count: w.selectedTicketCount ?? 1, // ✅ 매수
  }
}

const TransferTicketPage: React.FC = () => {
  const navigate = useNavigate()
  const { data } = useTicketsQuery()

  // 👀 진행중/요청/완료 등 watch 데이터
  const { data: watchData } = useWatchTransferQuery()
  const afterList = useMemo(() => (watchData ?? []).map(toAfterProps), [watchData])

  // ✅ 양도 완료 시 before 리스트에서 숨김 처리
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  useEffect(() => {
    const onDone = (ev: Event) => {
      const num = (ev as CustomEvent<string>).detail // reservationNumber
      setHidden((prev) => {
        const next = new Set(prev)
        next.add(num)
        return next
      })
    }
    window.addEventListener(TRANSFER_DONE_EVENT, onDone as EventListener)
    return () => window.removeEventListener(TRANSFER_DONE_EVENT, onDone as EventListener)
  }, [])

  // BEFORE: 양도 가능한 티켓 (확정된 것만)
  const visibleTickets = useMemo(() => {
    const list: TransferListItem[] = data ?? []
    return list.filter((t) => t.rawStatus === 'CONFIRMED' && !hidden.has(t.reservationNumber))
  }, [data, hidden])

  const handleTransfer = (row: TransferListItem) => {
    navigate('/mypage/ticket/transfer/test', {
      state: {
        reservationNumber: row.reservationNumber,
        ticket: row,
      },
    })
  }

  // 수락/거절 동작을 붙이고 싶다면 여기서 훅 사용해 연결!
  const onAccept = (w: any) => {
    // TODO: 가족/지인 분기하여 DTO 맞춰 호출
    // ex) respondFamily({ transferId, senderId, transferStatus: 'APPROVED', deliveryMethod:'', address:'' })
  }
  const onReject = (w: any) => {
    // TODO: 가족/지인 분기하여 DTO 맞춰 호출
    // ex) respondFamily({ transferId, senderId, transferStatus: 'REJECTED', deliveryMethod:'', address:'' })
  }

  return (
    <section className={styles.page}>
      <MyHeader title="티켓 양도" />

      <div className={styles.body}>
        {/* ===== AFTER: 진행/요청/승인/거절 목록 (상단) ===== */}
        <h2 className={styles.sectionTitle}>양도 요청/진행</h2>
        <div className={styles.list}>
          {afterList.map((w, idx) => (
            <AfterTransferTicket
              key={watchData?.[idx]?.transferId ?? `${w.title}-${w.date}-${w.time}-${idx}`}
              {...w}
              onAccept={() => onAccept(watchData?.[idx])}
              onReject={() => onReject(watchData?.[idx])}
            />
          ))}
          {afterList.length === 0 && (
            <div className={styles.empty}>현재 진행 중인 양도 요청이 없어요.</div>
          )}
        </div>

        {/* ===== BEFORE: 양도 가능한 티켓 (하단) ===== */}
        <h2 className={styles.sectionTitle}>양도 가능한 티켓</h2>
        <div className={styles.list}>
          {visibleTickets.map((t) => (
            <BeforeTransferTicket key={t.reservationNumber} item={t} onTransfer={handleTransfer} />
          ))}
          {visibleTickets.length === 0 && (
            <div className={styles.empty}>양도 가능한 티켓이 없어요.</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default TransferTicketPage
