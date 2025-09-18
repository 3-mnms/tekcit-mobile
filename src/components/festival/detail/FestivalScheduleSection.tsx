import React, { useMemo, useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { isSameDay } from 'date-fns'
import ko from 'date-fns/locale/ko'
import 'react-datepicker/dist/react-datepicker.css'
import styles from './FestivalScheduleSection.module.css'

import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useFestivalDetail } from '@/models/festival/tanstack-query/useFestivalDetail'
import { useAuthStore } from '@/shared/storage/useAuthStore'
import { useUserAgeQuery } from '@/models/festival/tanstack-query/useUserAgeDetail'
import { useEnterWaitingMutation } from '@/models/waiting/tanstack-query/useWaiting'
import Spinner from '@/components/common/spinner/Spinner'

/** YYYY-MM-DD */
const ymd = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** 안전 파서 */
const parseYMD = (s?: string): Date | undefined => {
  if (!s) return
  const norm = String(s).trim().replace(/[./]/g, '-').replace(/\s+\d{2}:\d{2}(:\d{2})?$/, '')
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(norm)
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(norm)
  if (isNaN(d.getTime())) return
  d.setHours(0, 0, 0, 0)
  return d
}

/** 요일 정규화 → 0~6 */
const toJsDow = (raw?: string): number | undefined => {
  if (raw == null) return
  const s = String(raw).trim().toUpperCase()
  if (/^[0-6]$/.test(s)) return Number(s)
  const three = s.replace(/[^A-Z]/g, '').slice(0, 3)
  const map: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }
  return map[three]
}

/** HH:mm을 Date로 합치기 */
const combineDateTime = (day: Date, hhmm?: string | null): Date => {
  const d = new Date(day)
  d.setSeconds(0, 0)
  if (!hhmm || hhmm === '공연시작') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return d
  const h = Math.min(23, parseInt(m[1], 10) || 0)
  const mm = Math.min(59, parseInt(m[2], 10) || 0)
  d.setHours(h, mm, 0, 0)
  return d
}

/** 관람연령 문자열 → 최소나이 (전체/전연령/ALL은 0, 못알아보면 null) */
const parseMinAge = (raw?: string | null): number | null => {
  if (!raw) return null
  const s = String(raw).replace(/\s+/g, '')
  if (/(전체관람가|전연령|ALL)/i.test(s)) return 0
  const m = s.match(/(?:만)?(\d+)\s*세\s*이상?/)
  if (m?.[1]) {
    const n = parseInt(m[1], 10)
    if (!isNaN(n)) return n
  }
  return null
}

/** 요일 키 */
const DOW_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

/** 테스트 중 강제 대기열로 보내기 (완료 후 false) */
const FORCE_WAIT = true

const FestivalScheduleSection: React.FC = () => {
  const { fid } = useParams<{ fid: string }>()
  const { data: detail, isLoading, isError, status } = useFestivalDetail(fid ?? '')

  const navigate = useNavigate()
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { refetch: refetchAge } = useUserAgeQuery({ enabled: false })
  const enterMut = useEnterWaitingMutation() // ✅ 훅은 컴포넌트 최상단에서 1회만

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  /** 오늘 00:00 */
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  /** 기간 파싱 */
  const startDate = useMemo(() => parseYMD((detail as any)?.prfpdfrom as any), [detail?.prfpdfrom])
  const endDate   = useMemo(() => parseYMD((detail as any)?.prfpdto as any),   [detail?.prfpdto])
  const isSingleDay = !!startDate && !!endDate && isSameDay(startDate, endDate)

  /** 과거 비활성: 시작일 vs 오늘 중 늦은 날 */
  const effectiveMinDate = useMemo(() => {
    if (!startDate) return today
    return startDate < today ? today : startDate
  }, [startDate, today])

  /** 공연 요일 집합: timesByDow가 있으면 그 키로, 없으면 daysOfWeek */
  const allowedDowSet = useMemo(() => {
    const set = new Set<number>()
    if (detail?.timesByDow && Object.keys(detail.timesByDow).length > 0) {
      for (const k of Object.keys(detail.timesByDow)) {
        const idx = DOW_KEYS.indexOf(k as (typeof DOW_KEYS)[number])
        if (idx >= 0) set.add(idx)
      }
      return set
    }
    const src = ((detail as any)?.daysOfWeek ?? []) as Array<string | null | undefined>
    for (const v of src) {
      const n = toJsDow(v ?? undefined)
      if (n !== undefined) set.add(n)
    }
    return set
  }, [detail?.timesByDow, detail?.daysOfWeek])

  /** 날짜 선택 가능 판정: 기간 + (단일일자 특례) + 허용 요일 + 해당 요일에 타임 존재 */
  const isSelectableDate = (date: Date) => {
    if (effectiveMinDate && date < effectiveMinDate) return false
    if (endDate && date > endDate) return false
    if (isSingleDay && endDate) return isSameDay(date, endDate)

    const dow = date.getDay()
    if (allowedDowSet.size > 0 && !allowedDowSet.has(dow)) return false

    // timesByDow가 있으면 그 요일에 시간이 있어야 함
    const key = DOW_KEYS[dow]
    const list = (detail?.timesByDow?.[key] ?? []) as string[]
    if (Array.isArray(list) && list.length === 0) return false

    return true
  }

  /** 네비 가능한 최소/최대 */
  const [minNavDate, maxNavDate] = useMemo(() => {
    if (!endDate) {
      const seed = effectiveMinDate ?? startDate ?? today
      return [seed, seed]
    }
    if (isSingleDay && endDate) return [endDate, endDate]

    let first: Date | undefined
    let last: Date | undefined

    // 앞으로 검색
    {
      const d = new Date(effectiveMinDate ?? today)
      for (let i = 0; i < 730 && d <= endDate; i++) {
        if (isSelectableDate(d)) { first = new Date(d); break }
        d.setDate(d.getDate() + 1)
      }
    }
    // 뒤로 검색
    {
      const d = new Date(endDate)
      for (let i = 0; i < 730 && d >= (effectiveMinDate ?? today); i++) {
        if (isSelectableDate(d)) { last = new Date(d); break }
        d.setDate(d.getDate() - 1)
      }
    }

    const minD = first ?? (effectiveMinDate ?? startDate ?? today)
    const maxD = last ?? (endDate ?? minD)
    return [minD, maxD]
  }, [effectiveMinDate, endDate, startDate, today, isSingleDay, allowedDowSet, detail?.timesByDow])

  /** ✅ 선택된 날짜의 시간들: 선택 날짜의 요일 → timesByDow[요일] */
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [] as string[]
    const dowIdx = selectedDate.getDay()
    const key = DOW_KEYS[dowIdx]
    const list = (detail?.timesByDow?.[key] ?? []) as string[]
    return Array.isArray(list) ? list : []
  }, [selectedDate, detail?.timesByDow])

  /** 시간이 없으면 "공연시작" */
  const timesToShow = useMemo(
    () => (availableTimes.length > 0 ? availableTimes : ['공연시작']),
    [availableTimes],
  )

  /** 날짜 변경 시 첫 시간 자동 선택 */
  useEffect(() => {
    if (!selectedDate) return
    setSelectedTime(availableTimes.length > 0 ? availableTimes[0] : null)
  }, [selectedDate, availableTimes])

  /** 최초 자동 선택 */
  useEffect(() => {
    if (!detail) return
    if (selectedDate && selectedTime) return

    let initialDate: Date | null = null
    if (isSingleDay && endDate) {
      if (isSelectableDate(endDate)) initialDate = endDate
    } else {
      if (endDate) {
        const startScan = new Date(effectiveMinDate ?? today)
        for (let i = 0; i < 730 && startScan <= endDate; i++) {
          if (isSelectableDate(startScan)) { initialDate = new Date(startScan); break }
          startScan.setDate(startScan.getDate() + 1)
        }
      } else if (effectiveMinDate && isSelectableDate(effectiveMinDate)) {
        initialDate = effectiveMinDate
      }
    }

    if (initialDate) {
      const key = DOW_KEYS[initialDate.getDay()]
      const list = (detail?.timesByDow?.[key] ?? []) as string[]
      setSelectedDate((p) => p ?? initialDate)
      setSelectedTime((p) => p ?? (list[0] ?? null))
    }
  }, [detail, isSingleDay, endDate, effectiveMinDate, today, selectedDate, selectedTime, isSelectableDate])

  const confirmDisabled = !selectedDate || !selectedTime

  return (
    <>
      <div className={styles.container}>
        {!fid && <div className={styles.notice}>잘못된 경로입니다.</div>}

        {(isLoading) && (
          <Spinner />
        )}

        {(isError || (!isLoading && !detail)) && (
          <div className={styles.notice}>일정을 불러오지 못했어요 ㅠㅠ</div>
        )}

        {detail && (
          <>
            <p className={styles.title}>관람일</p>
            <div className={styles.datepickerWrapper}>
              <DatePicker
                inline
                locale={ko}
                selected={selectedDate}
                onChange={(d) => setSelectedDate(d)}
                minDate={minNavDate}
                maxDate={maxNavDate}
                filterDate={isSelectableDate}
                openToDate={minNavDate}
                showDisabledMonthNavigation
                renderCustomHeader={({
                  date,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                }) => (
                  <div className={styles.dpHeader}>
                    <button
                      type="button"
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      className={styles.dpNavBtn}
                      aria-label="이전 달"
                    >
                      ‹
                    </button>
                    <div className={styles.dpMonthTitle}>
                      {date.getFullYear()}년 {String(date.getMonth() + 1).padStart(2, '0')}월
                    </div>
                    <button
                      type="button"
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      className={styles.dpNavBtn}
                      aria-label="다음 달"
                    >
                      ›
                    </button>
                  </div>
                )}
                /* ✅ 추가 2: 요일 한 글자 */
                formatWeekDay={(nameOfDay) => nameOfDay.slice(0, 1)}
                /* ✅ 기존 dayClassName → 오늘/주말 표시 포함으로 강화 */
                dayClassName={(date) => {
                  const selectable = isSelectableDate(date)
                  const isSel = selectedDate && isSameDay(date, selectedDate)
                  const isToday = isSameDay(date, new Date())
                  const isWeekend = [0, 6].includes(date.getDay())
                  return [
                    'custom-day',
                    selectable ? 'day-active' : 'day-inactive',
                    isSel ? 'day-selected' : '',
                    isToday ? 'day-today' : '',
                    isWeekend ? 'day-weekend' : '',
                  ].join(' ')
                }}
              />
            </div>

            {/* 시간 */}
            <div className={styles.section}>
              <p className={styles.label}>시간</p>
              <div className={styles.timeGroup}>
                {timesToShow.map((time) => (
                  <button
                    key={time}
                    className={`${styles.timeBtn} ${selectedTime === time ? styles.selectedBtn : ''}`}
                    onClick={() => setSelectedTime(time)}
                    aria-pressed={selectedTime === time}
                    type="button"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 하단 고정 버튼과 스페이서(모바일 스타일 유지) */}
      <div className={styles.ctaSpacer} />

      {detail && (
        <div className={styles.ctaDock} role="region" aria-label="예매하기 고정영역">
          <button
            className={styles.confirmBtn}
            disabled={confirmDisabled}
            onClick={async () => {
              if (!fid || !selectedDate) return

              // 1) 로그인 가드
              if (!accessToken) {
                alert('로그인이 필요한 서비스입니다.')
                const redirect = location.pathname + location.search
                navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
                return
              }

              // 2) 관람연령 가드 (필요 시 서버 확인)
              const ageText =
                (detail as any)?.prfage ??
                (detail as any)?.age ??
                (detail as any)?.ageLimit ??
                null
              const minAge = parseMinAge(ageText)
              if (minAge !== null && minAge > 0) {
                try {
                  const { data: userAge } = await refetchAge()
                  if (userAge == null) {
                    alert('나이 확인에 실패했어요. 잠시 후 다시 시도해 주세요.')
                    return
                  }
                  if (userAge < minAge) {
                    alert('관람연령 이상만 예매 가능한 공연입니다.')
                    return
                  }
                } catch {
                  alert('나이 확인에 실패했어요. 잠시 후 다시 시도해 주세요.')
                  return
                }
              }

              const fdfrom = startDate ? ymd(startDate) : null
              const fdto = endDate ? ymd(endDate) : null

              // 3) (테스트) 강제 대기열
              if (FORCE_WAIT) {
                const params = new URLSearchParams()
                params.set('date', ymd(selectedDate))
                if (selectedTime) params.set('time', selectedTime)
                params.set('wn', '1')
                if (fdfrom) params.set('fdfrom', fdfrom)
                if (fdto) params.set('fdto', fdto)
                navigate(`/reservation/${fid}/queue?${params.toString()}`)
                return
              }

              // 4) 대기열 진입 API → 즉시/대기 분기
              try {
                const reservationDateTime = combineDateTime(selectedDate, selectedTime)
                // ❗️훅 재호출 금지: 이미 선언한 enterMut 사용
                const res = await enterMut.mutateAsync({
                  festivalId: fid,
                  reservationDate: reservationDateTime,
                })

                if (res.immediateEntry) {
                  const params = new URLSearchParams()
                  params.set('date', ymd(selectedDate))
                  if (selectedTime) params.set('time', selectedTime)
                  if (fdfrom) params.set('fdfrom', fdfrom)
                  if (fdto) params.set('fdto', fdto)
                  navigate(`/reservation/${fid}?${params.toString()}`)
                } else {
                  const params = new URLSearchParams()
                  params.set('date', ymd(selectedDate))
                  if (selectedTime) params.set('time', selectedTime)
                  params.set('wn', String(res.waitingNumber))
                  if (fdfrom) params.set('fdfrom', fdfrom)
                  if (fdto) params.set('fdto', fdto)
                  navigate(`/reservation/${fid}/queue?${params.toString()}`)
                }
              } catch (e) {
                console.error('[enter waiting] error:', e)
                alert('진입에 실패했어요. 잠시 후 다시 시도해 주세요.')
              }
            }}
            type="button"
          >
            예매하기
          </button>
        </div>
      )}
    </>
  )
}

export default FestivalScheduleSection
