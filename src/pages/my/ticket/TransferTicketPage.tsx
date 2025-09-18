import React, { useEffect, useMemo, useState, useCallback } from 'react'
import styles from './TransferTicketPage.module.css'
import MyHeader from '@/components/my/hedaer/MyHeader'
import { useNavigate } from 'react-router-dom'
import BeforeTransferTicket from '@/components/my/ticket/BeforeTransferTicket'
import AfterTransferTicket from '@/components/my/ticket/AfterTransferTicket'

import {
  useTransferTicketsQuery, // ✅ 모바일도 보유티켓은 이 훅으로 통일
} from '@/models/my/ticket/tanstack-query/useTickets'
import type { TransferListItem } from '@/models/my/ticket/ticketTypes'

import {
  useWatchTransferQuery,
  useRespondFamilyTransfer,
  useRespondOthersTransfer,
  useTransferor, // ✅ 로그인 사용자(userId)
} from '@/models/transfer/tanstack-query/useTransfer'

/* ───────────────────────── 유틸 ───────────────────────── */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const splitDateTime = (iso?: string) => {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const HH = pad(d.getHours())
  const MM = pad(d.getMinutes())
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` }
}
const fmtDate = (iso?: string) => splitDateTime(iso).date
const fmtTime = (iso?: string) => splitDateTime(iso).time

/** 서버 타입 → '가족' | '지인' 라벨 */
const toRelationLabel = (t: unknown): '가족' | '지인' => {
  if (typeof t === 'number') return t === 0 ? '가족' : '지인'
  if (typeof t === 'string') {
    const v = t.trim().toUpperCase()
    if (v === 'FAMILY' || v === '0') return '가족'
    if (v === 'OTHERS' || v === '1') return '지인'
  }
  return '지인'
}
/** 서버 타입 정규화 (엔드포인트/관계 전달용) */
const toType = (t: unknown): 'FAMILY' | 'OTHERS' => {
  if (typeof t === 'number') return t === 0 ? 'FAMILY' : 'OTHERS'
  if (typeof t === 'string') {
    const v = t.trim().toUpperCase()
    if (v === 'FAMILY' || v === '0') return 'FAMILY'
    if (v === 'OTHERS' || v === '1') return 'OTHERS'
  }
  return 'OTHERS'
}

/** 서버 상태 enum(0~3 또는 문자열) → 문자열 정규화 */
const normalizeServerStatus = (
  v: unknown
): 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'CANCELED' => {
  if (typeof v === 'number') {
    return (['REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELED'][v] ??
      'REQUESTED') as any
  }
  if (typeof v === 'string') {
    const s = v.trim().toUpperCase()
    if (s === '0') return 'REQUESTED'
    if (s === '1') return 'APPROVED'
    if (s === '2') return 'COMPLETED'
    if (s === '3') return 'CANCELED'
    if (['REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELED'].includes(s))
      return s as any
  }
  return 'REQUESTED'
}

/** 화면 표기 라벨 */
const toUiStatusLabel = (
  s: ReturnType<typeof normalizeServerStatus>
): '양도 요청' | '양도 승인' | '양도 거부' => {
  switch (s) {
    case 'REQUESTED':
    case 'APPROVED':
      return '양도 요청'
    case 'COMPLETED':
      return '양도 승인'
    case 'CANCELED':
      return '양도 거부'
    default:
      return '양도 요청'
  }
}

export const TRANSFER_DONE_EVENT = 'ticket:transferred'

/** 🔁 watch 아이템 → AfterTransferTicket props 매핑 (상태/라벨 정규화 포함) */
const toAfterProps = (w: any) => {
  const { date, time } = splitDateTime(w.performanceDate) // ISO -> YYYY-MM-DD / HH:mm
  const normStatus = normalizeServerStatus(w?.status)
  const statusLabel = toUiStatusLabel(normStatus)

  return {
    title: w.fname ?? '-', // 공연명
    date,
    time,
    relation: toRelationLabel(w?.type ?? w?.transferType) as '가족' | '지인',
    status: normStatus, // 스타일/로직용
    statusLabel, // 화면표시 라벨
    posterUrl: w.posterFile,
    price: w.ticketPrice,
    count: w.selectedTicketCount ?? 1,
  }
}

/* ───────────────────────── 메인 컴포넌트 ───────────────────────── */
const TransferTicketPage: React.FC = () => {
  const navigate = useNavigate()

  /** 로그인 사용자 (userId 전달용) */
  const { data: me } = useTransferor({ enabled: true })

  /** 내 보유 티켓 */
  const { data: myTickets } = useTransferTicketsQuery()

  /** 양도요청 수신함 (거절/취소 포함 + userId 안전 전달) */
  const {
    data: inbox,
    isLoading: inboxLoading,
    isError: inboxError,
  } = useWatchTransferQuery({ userId: me?.userId, includeCanceled: true })

  /** 수락/거절 훅 */
  const respondFamily = useRespondFamilyTransfer()
  const respondOthers = useRespondOthersTransfer()

  /** 버튼 로딩 제어 (아이템 단위) */
  const [pendingId, setPendingId] = useState<number | null>(null)

  /** 완료된 예약번호 숨김 처리 */
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
    const list: TransferListItem[] = myTickets ?? []
    return list.filter((t) => t.rawStatus === 'CONFIRMED' && !hidden.has(t.reservationNumber))
  }, [myTickets, hidden])

  // AFTER: watch 수신함 → 화면표시용 리스트
  const inboxItems: any[] = Array.isArray(inbox) ? (inbox as any).filter(Boolean) : []
  const afterList = useMemo(() => inboxItems.map(toAfterProps), [inboxItems])

  const handleTransfer = (reservationNumber: string) => {
    navigate(`/mypage/ticket/transfer/${encodeURIComponent(reservationNumber)}`)
  }

  /** 공통 응답 핸들러
   * - REJECTED: 즉시 API 호출( deliveryMethod/address = "키 자체 생략" )
   * - ACCEPTED: 결제 페이지로 이동하며 필요한 state 전달
   */
  const handleRespond = useCallback(
    async (rawItem: any, decision: 'ACCEPTED' | 'REJECTED') => {
      const transferId = rawItem?.transferId as number | undefined
      const tType = toType(rawItem?.type ?? rawItem?.transferType)

      if (!transferId) {
        alert('transferId가 없어 응답을 보낼 수 없어요. watch 응답에 transferId를 포함해 주세요!')
        return
      }
      if (pendingId) return

      if (decision === 'ACCEPTED') {
        // ✅ 수락 시: 결제 페이지로 이동 + 결제/요약/상품정보에 필요한 state를 모두 전달
        setPendingId(transferId)

        const unitPrice = Number(rawItem?.ticketPrice) || 0
        const count = Number(rawItem?.selectedTicketCount) || 0
        const totalPrice = unitPrice * count

        navigate('/payment/transfer', {
          state: {
            transferId,
            senderId: rawItem?.senderId,
            transferStatus: 'ACCEPTED' as const,
            relation: tType, // 'FAMILY' | 'OTHERS'

            // 🧾 결제/요약 카드에서 사용할 상품정보
            title: rawItem?.fname,
            datetime: rawItem?.performanceDate, // ISO 그대로 넘겨서 렌더쪽 포맷
            location: rawItem?.fcltynm,
            ticket: count,
            price: unitPrice,
            totalPrice,
            posterFile: rawItem?.posterFile,
            reservationNumber: rawItem?.reservationNumber,
          },
        })
        return
      }

      // ❌ 거절 시: API 호출 (deliveryMethod/address "키 자체"를 보내지 않음)
      try {
        setPendingId(transferId)
        const minimal = {
          transferId,
          senderId: rawItem?.senderId,
          transferStatus: 'REJECTED' as const,
        }
        if (tType === 'FAMILY') {
          await respondFamily.mutateAsync(minimal)
        } else {
          await respondOthers.mutateAsync(minimal)
        }
        alert('양도 요청을 거절했어요.')
      } catch (e: any) {
        alert(e?.message ?? '요청 처리 중 오류가 발생했어요.')
      } finally {
        setPendingId(null)
      }
    },
    [navigate, pendingId, respondFamily, respondOthers]
  )

  return (
    <section className={styles.page}>
      <MyHeader title="티켓 양도" />

      <div className={styles.body}>
        {/* ===== AFTER: 진행/요청/승인/거절 목록 (상단) ===== */}
        <h2 className={styles.sectionTitle}>양도 요청/진행</h2>
        <div className={styles.list}>
          {!inboxLoading && !inboxError && afterList.map((w, idx) => {
            const raw = inboxItems[idx]
            const isBusy = pendingId != null && pendingId === raw?.transferId
            return (
              <AfterTransferTicket
                key={raw?.transferId ?? `${w.title}-${w.date}-${w.time}-${idx}`}
                {...w}
                onAccept={() => handleRespond(raw, 'ACCEPTED')}
                onReject={() => handleRespond(raw, 'REJECTED')}
                acceptDisabled={isBusy}
                rejectDisabled={isBusy}
              />
            )
          })}
          {(!afterList || afterList.length === 0) && (
            <div className={styles.empty}>현재 진행 중인 양도 요청이 없습니다.</div>
          )}
        </div>

        {/* ===== BEFORE: 양도 가능한 티켓 (하단) ===== */}
        <h2 className={styles.sectionTitle}>양도 가능한 티켓</h2>
        <div className={styles.list}>
          {visibleTickets.map((t) => (
            <BeforeTransferTicket key={t.reservationNumber} item={t} onTransfer={handleTransfer} />
          ))}
          {visibleTickets.length === 0 && (
            <div className={`${styles.card} ${styles.empty}`}>
              <div className={styles.emptyIcon} aria-hidden />
              <h3 className={styles.emptyTitle}>예매 내역이 없습니다</h3>
              <p className={styles.emptyDesc}>양도 가능한 티켓 내역이 없습니다.</p>
              <button className={styles.primaryBtn} onClick={() => navigate('/')}>티켓 예매하기</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default TransferTicketPage
