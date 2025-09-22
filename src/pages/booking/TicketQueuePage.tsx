import React, { useMemo, useRef, useEffect, useCallback, startTransition } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import WaitingQueue from '@/components/reservation/waiting/WaitingQueue'
import styles from './TicketQueuePage.module.css'
import { useFestivalDetail } from '@/models/festival/tanstack-query/useFestivalDetail'
import { useExitWaitingMutation } from '@/models/waiting/tanstack-query/useWaiting'
import { useAuthStore } from '@/shared/storage/useAuthStore'

import SockJS from 'sockjs-client'
import { Client, type IMessage, type StompHeaders } from '@stomp/stompjs'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'

const WS_URL = 'http://localhost:10000/ws'

const makeBroadcastTopic = (fid: string, date: string, time?: string) => {
  const d = date?.trim()
  const t = time?.trim()
  return t ? `/topic/waiting/${fid}/${d}/${t}` : `/topic/waiting/${fid}/${d}`
}

const parseYMD = (s?: string) => {
  if (!s) return undefined
  const t = s.trim().replace(/[./]/g, '-')
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(t)
  if (isNaN(d.getTime())) return undefined
  d.setHours(0, 0, 0, 0)
  return d
}

const combineDateTime = (day?: Date, hhmm?: string | null) => {
  if (!day) return undefined
  const d = new Date(day)
  if (!hhmm || hhmm === '공연시작') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return d
  d.setHours(Math.min(23, +m[1] || 0), Math.min(59, +m[2] || 0), 0, 0)
  return d
}

const TicketQueuePage: React.FC = () => {
  const { data: tokenInfo } = useTokenInfoQuery()
  const myUserId = tokenInfo?.userId ?? null
  const { fid } = useParams<{ fid: string }>()
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  // 공연 정보 (제목/포스터 표시용)
  const { data: detail } = useFestivalDetail(fid ?? '')
  const title = (detail as any)?.prfnm || (detail as any)?.title || '공연'

  const posterUrl =
    (detail as any)?.poster ||
    (detail as any)?.posterUrl ||
    (detail as any)?.posterPath ||
    (detail as any)?.mainImg ||
    (detail as any)?.img ||
    undefined

  // 대기열 파라미터
  const date = sp.get('date') ?? ''
  const time = sp.get('time') ?? ''
  const fdfrom = sp.get('fdfrom') ?? ''
  const fdto = sp.get('fdto') ?? ''
  const initialWN = Number(sp.get('wn') ?? '0')

  // ❌ 빼지 말자
  const initialAhead = Number.isFinite(initialWN) ? Math.max(0, Math.floor(initialWN)) : 0
  const [ahead, setAhead] = React.useState(initialAhead)

  // 진행률 분모도 동일 기준 사용
  const TOTAL_AHEAD = initialAhead
  const proceedingToBookingRef = useRef(false)
  const isUnmountedRef = useRef(false)

  // ★ 소켓/워치독 상태들
  const stompRef = useRef<Client | null>(null)
  const wsActiveRef = useRef(false)
  const lastMsgAtRef = useRef<number>(Date.now())
  const heartbeatWatchdogRef = useRef<number | null>(null) // ← interval id 저장

  const exitMut = useExitWaitingMutation()

  const reservationDate = useMemo(
    () => combineDateTime(parseYMD(date || undefined), time || null),
    [date, time],
  )

  const accessToken = useAuthStore((s) => s.accessToken)

  const connectHeadersRef = useRef<StompHeaders | undefined>()
  useEffect(() => {
    connectHeadersRef.current = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  }, [accessToken])

  const navParamsRef = useRef({ fid, date, time, fdfrom, fdto })
  useEffect(() => {
    navParamsRef.current = { fid, date, time, fdfrom, fdto }
  }, [fid, date, time, fdfrom, fdto])

  const proceedToBooking = useCallback(() => {
    const { fid, date, time, fdfrom, fdto } = navParamsRef.current
    if (!fid || proceedingToBookingRef.current) return

    proceedingToBookingRef.current = true
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (time) params.set('time', time)
    if (fdfrom) params.set('fdfrom', fdfrom)
    if (fdto) params.set('fdto', fdto)
    startTransition(() => {
      navigate(`/reservation/${fid}? ${params.toString()}`)
    })
  }, [navigate])

  const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v)
  const nn = (n: number) => Math.max(0, Math.floor(n))

  const extractAhead = (raw: any): number | undefined => {
    // 서버가 '앞 사람 수' 그대로 주는 필드들
    if (isFiniteNum(raw?.peopleAhead)) return nn(raw.peopleAhead)
    if (isFiniteNum(raw?.ahead)) return nn(raw.ahead)
    if (isFiniteNum(raw?.queue?.peopleAhead)) return nn(raw.queue.peopleAhead)
    if (isFiniteNum(raw?.queue?.ahead)) return nn(raw.queue.ahead)

    // 'waitingNumber'도 너 기대치대로 '앞 사람 수' 의미로 취급 (❗️-1 하지 않음)
    if (isFiniteNum(raw?.waitingNumber)) return nn(raw.waitingNumber)
    if (isFiniteNum(raw?.waiting_number)) return nn(raw.waiting_number)

    return undefined
  }

  const handleQueueMessage = useCallback((msg: IMessage) => {
    if (isUnmountedRef.current) return
    try {
      const data = JSON.parse(msg.body || '{}')
      console.log('데이터', data)

      // 🎯 어떤 유형의 메시지든 수신시각 갱신
      lastMsgAtRef.current = Date.now()

      // 명시적 입장 신호만 즉시 입장
      if (
        data?.type === 'PROCEED' ||
        data?.event === 'PROCEED' ||
        data?.status === 'ENTER_BOOKING'
      ) {
        proceedToBooking()
        return
      }

      // 대기 인원 숫자는 화면 표시만 (입장 트리거 X)
      const next = extractAhead(data)
      if (typeof next === 'number') setAhead(p => (p !== next ? next : p))
    } catch (e) {
      console.warn('[WS] message parse error', e, msg.body)
    }
  }, [proceedToBooking])

  // 3) ✅ 소켓 연결 & 워치독 (15초 침묵 시에만 입장)
  useEffect(() => {
    if (!fid || !date || !myUserId || wsActiveRef.current) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}?token=Bearer ${accessToken}`),
      connectHeaders: { Authorization: `Bearer ${accessToken}`, userId: String(myUserId) },
      reconnectDelay: 5000,
    })

    client.onConnect = () => {
      lastMsgAtRef.current = Date.now()

      client.subscribe('/user/queue/waitingNumber', handleQueueMessage)
      const broad = makeBroadcastTopic(String(fid), date, time || undefined)
      client.subscribe(broad, handleQueueMessage)

      // ⏱️ 침묵워치독: 15초 무응답일 때만 입장
      if (heartbeatWatchdogRef.current == null) {
        heartbeatWatchdogRef.current = window.setInterval(() => {
          const SILENCE_MS = 15_000
          if (!proceedingToBookingRef.current && Date.now() - lastMsgAtRef.current > SILENCE_MS) {
            proceedToBooking()
          }
        }, 3000)
      }

      wsActiveRef.current = true
      stompRef.current = client
    }

    client.onDisconnect = () => {
      if (heartbeatWatchdogRef.current != null) {
        clearInterval(heartbeatWatchdogRef.current)
        heartbeatWatchdogRef.current = null
      }
      wsActiveRef.current = false
      stompRef.current = null
    }

    client.activate()

    return () => {
      if (heartbeatWatchdogRef.current != null) {
        clearInterval(heartbeatWatchdogRef.current)
        heartbeatWatchdogRef.current = null
      }
      try { client.deactivate() } catch { }
      wsActiveRef.current = false
      stompRef.current = null
    }
  }, [fid, date, time, myUserId, accessToken, handleQueueMessage, proceedToBooking])

  // 페이지 이탈 시 백으로 exit 알림
  const exitedRef = useRef(false);

  useEffect(() => {
    if (!fid || !reservationDate) return;

    const callExit = () => {
      // 이미 보냈거나, 예매로 진행 중이면 스킵
      if (exitedRef.current || proceedingToBookingRef.current) return;
      exitedRef.current = true;
      try {
        exitMut.mutate({ festivalId: String(fid), reservationDate });
      } catch { }
    };

    const onPageHide = () => callExit();
    const onBeforeUnload = () => callExit();

    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      callExit();
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [fid, reservationDate, exitMut]);

  // body 스크롤 잠금
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevTouch = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouch
    }
  }, [])

  const progress =
    TOTAL_AHEAD === 0
      ? 100
      : Math.min(100, Math.max(0, ((TOTAL_AHEAD - ahead) / TOTAL_AHEAD) * 100))

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <WaitingQueue
          title={title}
          dateTime={date ? `${date}${time ? ' ' + time : ''}` : '일정 미지정'}
          waitingCount={ahead}
          progressPct={Math.max(2, Math.round(progress))}
          posterUrl={posterUrl}
        />
      </div>
    </div>
  )
}

export default TicketQueuePage
