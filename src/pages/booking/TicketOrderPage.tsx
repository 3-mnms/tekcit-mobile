// src/pages/reservation/TicketOrderPage.tsx (모바일)
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styles from './TicketOrderPage.module.css'
import TicketOrderSection from '@/components/reservation/TicketOrderSection'

import { useSelectDate, usePhase1Detail } from '@/models/booking/tanstack-query/useBookingDetail'
import type { BookingSelect } from '@/models/booking/bookingTypes'
import BookingProgress from '@/components/common/steps/BookingProgress'
import CaptchaOverlay from '@/components/reservation/captcha/CaptchaOverlay'
import Spinner from '@/components/common/spinner/Spinner'
import { useReleaseWaitingMutation } from '@/models/waiting/tanstack-query/useWaiting'

// ---------- utils ----------
const pad2 = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`

const toLocalIsoString = (date: Date, timeHHmm: string) => {
  const [hh, mm] = timeHHmm.split(':').map(Number)
  const dt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0, 0)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:00`
}

const DOW: Array<'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'> = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
]

const parseYMD = (s?: string | null) => {
  if (!s) return null
  const d = s.includes('T') ? new Date(s) : new Date(`${s}T00:00:00`)
  if (isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
const inRange = (d: Date, from: Date, to: Date) =>
  d.getTime() >= from.getTime() && d.getTime() <= to.getTime()

// 달력 데이터 구성(웹 로직과 동일)
function buildCalendarData(detail: any, fdfrom?: string, fdto?: string) {
  const byDate: Record<string, Set<string>> = {}
  const list = Array.isArray(detail?.schedules) ? detail.schedules : []

  let fromDate: Date | null = parseYMD(detail?.fdfrom) || parseYMD(detail?.period?.from) || null
  let toDate: Date | null = parseYMD(detail?.fdto) || parseYMD(detail?.period?.to) || null

  if (fdfrom) fromDate = parseYMD(fdfrom) || fromDate
  if (fdto) toDate = parseYMD(fdto) || toDate

  if (!fromDate || !toDate) {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    fromDate ||= base
    toDate ||= new Date(base.getFullYear(), base.getMonth(), base.getDate() + 90)
  }

  const explicit = list.filter(
    (s: any) =>
      typeof s?.startDateTime === 'string' ||
      (typeof s?.date === 'string' && typeof s?.time === 'string'),
  )

  if (explicit.length > 0) {
    explicit.forEach((s: any) => {
      let dt: Date | null = null
      if (typeof s?.startDateTime === 'string') dt = new Date(s.startDateTime)
      else if (typeof s?.date === 'string' && typeof s?.time === 'string')
        dt = new Date(`${s.date}T${s.time}:00`)
      if (!dt || isNaN(dt.getTime())) return

      const day = parseYMD(ymd(dt))!
      if (!inRange(day, fromDate!, toDate!)) return

      const k = ymd(day)
        ; (byDate[k] ||= new Set()).add(hhmm(dt))
    })
  } else {
    const weekdaySet = new Set<string>()
    const timeByWeekday = new Map<string, Set<string>>()
    list.forEach((s: any) => {
      const dow = String(s?.dayOfWeek || '').toUpperCase()
      const time = typeof s?.time === 'string' ? s.time.slice(0, 5) : ''
      if (!dow || !time) return
      weekdaySet.add(dow)
        ; (timeByWeekday.get(dow) || timeByWeekday.set(dow, new Set()).get(dow)!).add(time)
    })

    const cur = new Date(fromDate!)
    while (cur.getTime() <= toDate!.getTime()) {
      const d = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate())
      const dow = DOW[d.getDay()]
      const times = Array.from(timeByWeekday.get(dow) ?? [])
      if (weekdaySet.has(dow) && times.length) {
        const key = ymd(d)
        byDate[key] ||= new Set()
        times.forEach((t) => byDate[key].add(t))
      }
      cur.setDate(cur.getDate() + 1)
    }
  }

  const availableDates = Object.keys(byDate)
    .sort()
    .map((k) => new Date(k))
  const timesByDate = Object.fromEntries(
    Object.entries(byDate).map(([k, set]) => [
      k,
      Array.from(set).sort((a, b) => {
        const [ha, ma] = a.split(':').map(Number)
        const [hb, mb] = b.split(':').map(Number)
        return ha * 60 + ma - (hb * 60 + mb)
      }),
    ]),
  )

  return { availableDates, timesByDate, fromDate, toDate }
}

// ---------- page ----------
const TicketOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const { fid: fidParam } = useParams<{ fid: string }>()
  const { state } = useLocation() as {
    state?: { fid?: string; dateYMD?: string; time?: string; quantity?: number }
  }
  const [sp] = useSearchParams()

  const [captchaPassed, setCaptchaPassed] = useState(false)

  useEffect(() => {
    if (!captchaPassed) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [captchaPassed])

  // 초기값: params/state/query 순서
  const fid = state?.fid || fidParam || sp.get('fid') || ''
  const initialDateYMD = state?.dateYMD || sp.get('date') || ''
  const initialTime = state?.time || sp.get('time') || ''
  const initialQty = Number(state?.quantity || sp.get('qty') || 1)

  // 선택 상태
  const [selDate, setSelDate] = useState<Date | null>(
    initialDateYMD ? new Date(initialDateYMD) : null,
  )
  const [selTime, setSelTime] = useState<string | null>(initialTime || null)
  const [selQty, setSelQty] = useState<number>(Number.isFinite(initialQty) ? initialQty : 1)
  const releaseMut = useReleaseWaitingMutation()

  // PHASE1 요청 본문 (선택이 있을 때만 유효)
  const phase1Req: BookingSelect | null = useMemo(() => {
    if (!fid || !selDate || !selTime) return null
    return {
      festivalId: fid,
      performanceDate: toLocalIsoString(selDate, selTime),
      selectedTicketCount: 0,
    }
  }, [fid, selDate, selTime])

  // PHASE1 호출(훅은 항상 호출)
  const { data: phase1, isLoading, isError, isFetching } = usePhase1Detail(phase1Req ?? ({} as any))

  // PHASE1 → 달력 데이터/가격/제한치 등 추출
  const {
    availableDates,
    timesByDate,
    pricePerTicket,
    maxQuantity,
    title,
    poster,
    serverSelectedDate,
    serverSelectedTime,
  } = useMemo(() => {
    if (!phase1) {
      return {
        availableDates: [] as Date[],
        timesByDate: {} as Record<string, string[]>,
        pricePerTicket: 0,
        maxQuantity: 0,
        title: '',
        poster: '',
        serverSelectedDate: null as Date | null,
        serverSelectedTime: null as string | null,
      }
    }

    const fdFromStr = (sp.get('fdfrom') || phase1?.fdfrom || phase1?.period?.from) ?? undefined
    const fdToStr = (sp.get('fdto') || phase1?.fdto || phase1?.period?.to) ?? undefined

    const cal = buildCalendarData(phase1, fdFromStr, fdToStr)

    let sDate: Date | null = null
    let sTime: string | null = null
    if (typeof phase1?.performanceDate === 'string') {
      const dt = new Date(phase1.performanceDate)
      if (!isNaN(dt.getTime())) {
        const day = parseYMD(ymd(dt))!
        const time = hhmm(dt)
        if (!cal.fromDate || !cal.toDate || inRange(day, cal.fromDate, cal.toDate)) {
          sDate = day
          sTime = time
        }
      }
    }

    return {
      availableDates: cal.availableDates,
      timesByDate: cal.timesByDate,
      pricePerTicket: Number(phase1?.ticketPrice ?? 0),
      maxQuantity: Number(phase1?.maxPurchase ?? 0),
      title: String(phase1?.fname ?? ''),
      poster: String(phase1?.posterFile ?? ''),
      serverSelectedDate: sDate,
      serverSelectedTime: sTime,
    }
  }, [phase1, sp])

  // 서버 선택값이 있으면 최초 1회 보정
  useEffect(() => {
    if (!selDate && serverSelectedDate) setSelDate(serverSelectedDate)
    if (!selTime && serverSelectedTime) setSelTime(serverSelectedTime)
  }, [selDate, selTime, serverSelectedDate, serverSelectedTime])

  const selMut = useSelectDate()

  // ✅ 더블 클릭/연타 방지 (웹에서 이식)
  const clickLockRef = useRef(false)

  // 다음 단계
  const handleNext = useCallback(
    async ({ date, time, quantity }: { date: Date; time: string; quantity: number }) => {
      if (!fid) return
      if (clickLockRef.current) return
      clickLockRef.current = true

      const payload: BookingSelect = {
        festivalId: fid,
        performanceDate: toLocalIsoString(date, time),
        selectedTicketCount: quantity,
      }
      try {
        const res = await selMut.mutateAsync(payload)
        const reservationNumber = typeof res === 'string' ? res : (res?.data ?? res)
        try {
          sessionStorage.setItem('reservationId', reservationNumber)
        } catch { }
        navigate(`/reservation/${fid}/order-info?res=${encodeURIComponent(reservationNumber)}`, {
          replace: true,
          state: {
            fid,
            dateYMD: ymd(date),
            time,
            quantity,
            reservationNumber,
            performanceDate: payload.performanceDate,
            selectedTicketCount: quantity,
          },
        })
      } catch (e) {
        console.error('예약번호 발급 실패', e)
        alert('예약번호 발급에 실패했어요. 잠시 후 다시 시도해주세요.')
      } finally {
        clickLockRef.current = false
      }
    },
    [fid, navigate, selMut],
  )

  const selectedDateTime: Date | null = useMemo(() => {
    const d = selDate ?? serverSelectedDate ?? null
    const t = selTime ?? serverSelectedTime ?? null
    if (!d || !t) return null
    const [hh, mm] = t.split(':').map(Number)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0)
  }, [selDate, serverSelectedDate, selTime, serverSelectedTime])

  const firedRef = React.useRef(false);                

  useEffect(() => {
    if (!fid || !selectedDateTime) return;             

    const fireOnce = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      try {
        releaseMut.mutate({
          festivalId: String(fid),
          reservationDate: selectedDateTime,
        });
      } catch { }
    };

    const onBeforeUnload = () => fireOnce();           
    const onPageHide = () => fireOnce();               

    window.addEventListener('beforeunload', onBeforeUnload);
    // window.addEventListener('pagehide', onPageHide);

    return () => {
      fireOnce();
      window.removeEventListener('beforeunload', onBeforeUnload);
      // window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  const guardMessage = !fid ? 'fid가 필요합니다.' : isError ? '예매 정보를 불러오지 못했어요.' : ''

  const readyForUI = availableDates.length > 0 && Object.keys(timesByDate).length > 0

  return (
    <div className={styles.page}>
      <BookingProgress current={1} />

      {/* 가드/로딩/정상 UI */}
      {guardMessage && <div className={styles.main}>{guardMessage}</div>}

      {!guardMessage && isLoading && !phase1 && <Spinner />}

      {!guardMessage && !(isLoading && !phase1) && (
        <main className={styles.main} aria-hidden={!captchaPassed}>
          {readyForUI ? (
            // 타입 차이 있을 수 있어 캐스팅 처리
            <TicketOrderSection
              {...({
                fid,
                availableDates,
                timesByDate,
                pricePerTicket,
                maxQuantity,
                selectedDate: selDate ?? serverSelectedDate ?? null,
                selectedTime: selTime ?? serverSelectedTime ?? null,
                onSelectionChange: (d: Date | null, t: string | null, q: number) => {
                  setSelDate(d ?? null)
                  setSelTime(t ?? null)
                  setSelQty(q)
                },
                onNext: handleNext,
                hideHeader: true,
              } as any)}
            />
          ) : (
            <div>선택 가능한 일정 정보가 없습니다.</div>
          )}

          {isFetching && <Spinner />}
        </main>
      )}

      {/* ✅ 캡챠 오버레이 (웹과 동일 동작) */}
      {!captchaPassed && (
        <CaptchaOverlay
          onVerified={() => setCaptchaPassed(true)}
          onCloseWindow={() => navigate(`/festival/${fid}`)}
          expireSeconds={180}
        />
      )}
    </div>
  )
}

export default TicketOrderPage
