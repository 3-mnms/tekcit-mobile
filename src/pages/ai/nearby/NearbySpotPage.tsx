import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styles from '@/components/ai/nearby/NearbySpotEmbed.module.css'
import Button from '@/components/common/Button'
import MapView from '@/components/ai/nearby/MapView'
import SpotCard, { type PlayEatSpot, type BaseSpot } from '@/components/ai/nearby/SpotCard'
import Spinner from '@/components/common/spinner/Spinner'
import Header from '@/components/common/header/Header'
import BottomNav from '@/components/festival/main/bottomnav/BottomNav'
import { PartyPopper, Utensils, MapPin } from 'lucide-react'
import {
  useNearbyActivities,
  pickRecommendForFestival,
} from '@/models/ai/tanstack-query/useNearbyFestivals'

type TabKey = 'play' | 'eat' | 'course'

export type NearbyFestivalMini = {
  id: string
  name: string
  venue?: string | null
  lat?: number | null
  lng?: number | null
}

const NearbySpotPage: React.FC = () => {
  const { fid } = useParams<{ fid: string }>()
  const navigate = useNavigate()
  const loc = useLocation() as { state?: { festival?: NearbyFestivalMini } }

  const passed = loc.state?.festival

  const festival: NearbyFestivalMini | null = useMemo(() => {
    if (passed) return passed
    if (fid) {
      return { id: fid, name: '주변 장소', venue: '', lat: null, lng: null }
    }
    return null
  }, [passed, fid])

  const { data, isLoading, isError, refetch } = useNearbyActivities()
  const rec = useMemo(
    () => (festival?.id ? pickRecommendForFestival(data, festival.id) : null),
    [data, festival?.id]
  )

  const playItems: PlayEatSpot[] = useMemo(
    () =>
      (rec?.hotPlaces ?? []).map((a, i) => ({
        id: `p-${i}`,
        kind: 'play',
        name: a.activityName,
        address: a.addressName,
        lat: a.latitude ?? festival?.lat ?? 37.566826,
        lng: a.longitude ?? festival?.lng ?? 126.9786567,
      })),
    [rec?.hotPlaces, festival?.lat, festival?.lng],
  )

  // 먹거리
  const eatItems: PlayEatSpot[] = useMemo(
    () =>
      (rec?.restaurants ?? []).map((a, i) => ({
        id: `e-${i}`,
        kind: 'eat',
        name: a.activityName,
        address: a.addressName,
        lat: a.latitude ?? festival?.lat ?? 37.566826,
        lng: a.longitude ?? festival?.lng ?? 126.9786567,
      })),
    [rec?.restaurants, festival?.lat, festival?.lng],
  )

  // 추천 코스 파싱 (제한 없이 전부 표시)
  const courseRows = useMemo(() => {
    const c = rec?.courseDTO
    const raws = [c?.course1, c?.course2, c?.course3, c?.course4, c?.course5].filter(
      Boolean,
    ) as string[]
    return raws.map((raw) =>
      raw
        .split('→')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }, [rec?.courseDTO])

  const norm = (s: string) => s.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase()

  const courseSpots = useMemo(() => {
    if (!festival?.id || !courseRows.length) return []
    const pool = [...playItems, ...eatItems]
    return courseRows.map((row, rowIdx) =>
      row.map((label, idx) => {
        if (idx === 0) {
          return {
            id: `course-${rowIdx}-festival`,
            name: festival.name,
            lat: festival.lat ?? 37.566826,
            lng: festival.lng ?? 126.9786567,
            address: festival.venue ?? '',
          }
        }
        const key = norm(label)
        const match = pool.find((p) => norm(p.name) === key || norm(p.name).includes(key))
        return match
          ? { id: `course-${rowIdx}-${idx}`, name: match.name, lat: match.lat, lng: match.lng, address: match.address }
          : { id: `course-${rowIdx}-${idx}`, name: label, lat: festival.lat ?? 37.566826, lng: festival.lng ?? 126.9786567, address: '' }
      })
    )
  }, [
    courseRows,
    playItems,
    eatItems,
    festival?.id,
    festival?.name,
    festival?.lat,
    festival?.lng,
    festival?.venue,
  ])


  const [active, setActive] = useState<TabKey>('play')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCourseIdx, setSelectedCourseIdx] = useState<number | null>(null)

  useEffect(() => {
    setSelectedId(null)
    if (active !== 'course') setSelectedCourseIdx(null)
  }, [active])

  const items: BaseSpot[] =
    active === 'play'
      ? playItems
      : active === 'eat'
        ? eatItems
        : selectedCourseIdx !== null
          ? courseSpots[selectedCourseIdx]
          : []

  if (!festival) return null

  return (
    <div className={styles.page}>
      <Header />

      <header className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <div className={styles.headerActions}>
            <Button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← 공연 목록으로
            </Button>
          </div>
          <h2 className={styles.pageTitle}>{festival.name}</h2>
          {festival.venue && <div className={styles.subtitle}>{festival.venue}</div>}
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="추천 탭">
        <TabButton
          icon={<PartyPopper size={16} />}
          label="놀거리"
          active={active === 'play'}
          onClick={() => setActive('play')}
        />
        <TabButton
          icon={<Utensils size={16} />}
          label="먹거리"
          active={active === 'eat'}
          onClick={() => setActive('eat')}
        />
        <TabButton
          icon={<MapPin size={16} />}
          label="추천 코스"
          active={active === 'course'}
          onClick={() => setActive('course')}
        />
      </div>

      {/* Loading/Error/Empty */}
      {isLoading && <Spinner />}
      {isError && (
        <div className={styles.error}>
          불러오기에 실패했어요.
          <button className={styles.retry} onClick={() => refetch()}>
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !isError && !rec && <div className={styles.empty}>추천 데이터가 없어요.</div>}

      {/* Body */}
      {!isLoading && !isError && rec && (
        <div className={styles.body}>
          <ul className={styles.list} role="list">
            {active !== 'course' ? (
              items.slice(0, 5).map((spot) => (
                <li key={spot.id}>
                  <SpotCard
                    spot={spot as PlayEatSpot}
                    active={spot.id === selectedId}
                    onClick={() => setSelectedId(spot.id)}
                  />
                </li>
              ))
            ) : (
              <li>
                {courseRows.length ? (
                  <div className={styles.courseList}>
                    {courseSpots.map((steps, rowIdx) => {
                      const isActiveRow = selectedCourseIdx === rowIdx
                      return (
                        <button
                          key={rowIdx}
                          type="button"
                          className={`${styles.courseRow} ${styles.courseAccent} ${isActiveRow ? styles.cardActive : ''}`}
                          onClick={() => {
                            setSelectedCourseIdx(rowIdx)
                            setSelectedId(null)
                          }}
                        >
                          <div className={styles.courseNodes}>
                            {steps.map((spot, idx) => {
                              const cls =
                                idx === 0
                                  ? styles.nodeGreen
                                  : idx === steps.length - 1
                                    ? styles.nodePurple
                                    : styles.nodeBlue
                              return (
                                <React.Fragment key={spot.id}>
                                  <span className={`${styles.node} ${cls}`}>{spot.name}</span>
                                  {idx < steps.length - 1 && <span className={styles.dash} />}
                                </React.Fragment>
                              )
                            })}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className={styles.emptySmall}>등록된 코스가 없어요.</div>
                )}
              </li>
            )}
          </ul>

          <MapView
            festival={festival}
            items={items}
            active={active}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default NearbySpotPage

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      className={`${styles.tab} ${active ? styles.tabActive : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.tabIcon}>{icon}</span>
      {label}
    </button>
  )
}
