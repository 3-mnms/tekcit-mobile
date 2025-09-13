import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import styles from './NearbyShowsPage.module.css'
import Button from '@/components/common/Button'
import Header from '@/components/common/header/Header'
import BottomNav from '@/components/festival/main/bottomnav/BottomNav'
import { useNavigate } from 'react-router-dom'
import { useNearbyFestivalsQuery } from '@/models/ai/tanstack-query/useNearbyFestivals'
import { useDefaultAddressQuery } from '@/models/auth/tanstack-query/useAddress'
import NearbySpotEmbed, { type NearbyFestivalMini } from '@/components/ai/nearby/NearbySpotEmbed'

declare global {
  interface Window { kakao: any }
}

type UiShow = {
  id: string
  title: string
  venue: string
  distanceKm: number | null
  lat?: number | null
  lng?: number | null
  poster?: string | null
}

const toUi = (raw: any): UiShow => ({
  id: String(raw.festivalDetailId ?? raw.id ?? crypto.randomUUID()),
  title: raw.name ?? raw.festivalName ?? '-',
  venue: raw.venue ?? raw.hallName ?? raw.address ?? '-',
  distanceKm:
    typeof raw.distance === 'number'
      ? Number(raw.distance)
      : typeof raw.distanceKm === 'number'
        ? Number(raw.distanceKm)
        : null,
  lat: raw.latitude ?? raw.lat ?? null,
  lng: raw.longitude ?? raw.lng ?? null,
  poster: raw.poster ?? raw.posterFile ?? null,
})

const NearbyShowsPage: React.FC = () => {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<any>(null)

  const [sheetOpen, setSheetOpen] = useState(true)
  const [selected, setSelected] = useState<NearbyFestivalMini | null>(null)

  const { data: defaultAddr } = useDefaultAddressQuery()
  const { data, isLoading, isError, refetch } = useNearbyFestivalsQuery()

  const shows = useMemo<UiShow[]>(() => (data?.festivalList ?? []).map(toUi), [data])

  const userCenter = useMemo(() => {
    const lat = data?.userGeocodeInfo?.latitude ?? null
    const lng = data?.userGeocodeInfo?.longitude ?? null
    return lat && lng ? { lat, lng } : null
  }, [data])

  const fitToBounds = useCallback(() => {
    if (!mapObjRef.current || !window.kakao?.maps) return
    const map = mapObjRef.current
    const bounds = new window.kakao.maps.LatLngBounds()

    let added = false
    shows.forEach((s) => {
      if (!s.lat || !s.lng) return
      bounds.extend(new window.kakao.maps.LatLng(s.lat, s.lng))
      added = true
    })
    if (userCenter) {
      bounds.extend(new window.kakao.maps.LatLng(userCenter.lat, userCenter.lng))
      added = true
    }
    if (added) map.setBounds(bounds)
  }, [shows, userCenter])

  // 지도 렌더링
  useEffect(() => {
    if (!mapRef.current) return
    if (!window.kakao?.maps) return

    const render = () => {
      const centerLat = userCenter?.lat ?? shows.find((s) => s.lat && s.lng)?.lat ?? 37.566826
      const centerLng = userCenter?.lng ?? shows.find((s) => s.lat && s.lng)?.lng ?? 126.9786567

      const mapOption = {
        center: new window.kakao.maps.LatLng(centerLat, centerLng),
        level: 6,
      }

      const map = mapObjRef.current ?? new window.kakao.maps.Map(mapRef.current as any, mapOption)
      if (!mapObjRef.current) mapObjRef.current = map
      else map.setCenter(mapOption.center)

      // 마커 클리어
      ;(map.__markers ?? []).forEach((m: any) => m.setMap(null))
      map.__markers = []

      shows.forEach((s) => {
        if (!s.lat || !s.lng) return
        const pos = new window.kakao.maps.LatLng(s.lat, s.lng)
        const marker = new window.kakao.maps.Marker({ position: pos, map })
        map.__markers.push(marker)

        const iw = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:8px 12px;font-size:13px;max-width:200px;line-height:1.4;border-radius:8px;">
              <b style="color:#1f2937;">${s.title}</b><br/>
              <span style="color:#6b7280;">${s.venue}</span>
            </div>`,
        })

        window.kakao.maps.event.addListener(marker, 'click', () =>
          setSelected({
            id: s.id,
            name: s.title,
            venue: s.venue,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
          }),
        )
        window.kakao.maps.event.addListener(marker, 'mouseover', () => iw.open(map, marker))
        window.kakao.maps.event.addListener(marker, 'mouseout', () => iw.close())
      })

      if (userCenter) {
        const userMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(userCenter.lat, userCenter.lng),
          map,
        })
        map.__markers.push(userMarker)
      }

      fitToBounds()
    }

    if (window.kakao?.maps?.load) window.kakao.maps.load(render)
    else render()
  }, [shows, userCenter, fitToBounds])

  // 맵 컨트롤
  const zoomIn = () => { if (mapObjRef.current) mapObjRef.current.setLevel(mapObjRef.current.getLevel() - 1) }
  const zoomOut = () => { if (mapObjRef.current) mapObjRef.current.setLevel(mapObjRef.current.getLevel() + 1) }
  const recenter = () => {
    if (!mapObjRef.current || !window.kakao?.maps) return
    const map = mapObjRef.current
    if (userCenter) {
      map.setCenter(new window.kakao.maps.LatLng(userCenter.lat, userCenter.lng))
      map.setLevel(5)
    } else {
      fitToBounds()
    }
  }

  const addrText = defaultAddr ? `${defaultAddr?.address || ''}`.trim() : ''

  return (
    <div className={styles.pageWrapper}>
      <Header />
      {/* 상단 주소 바 (첨부파일 스타일) */}
      <div className={styles.addrBar}>
        <div className={styles.addrMain}>
          <i className={`fa-solid fa-location-dot ${styles.addrIcon}`} />
          <span className={styles.addrText}>
            {defaultAddr ? addrText : '기본 주소를 불러오는 중…'}
          </span>
        </div>
        <Button
          className={styles.addrBtn}
          onClick={() => navigate('/mypage/myinfo/address')}
        >
          주소 변경
        </Button>
      </div>

      {/* 지도 영역 */}
      <div className={styles.mapStage}>
        <div ref={mapRef} className={styles.mapArea} />

        {/* 맵 FAB (동그란 버튼 3종) */}
        <div className={styles.mapFabCol}>
          <button className={styles.fab} aria-label="확대" onClick={zoomIn}>
            <i className="fa-solid fa-plus" />
          </button>
          <button className={styles.fab} aria-label="축소" onClick={zoomOut}>
            <i className="fa-solid fa-minus" />
          </button>
          <button className={`${styles.fab} ${styles.fabAccent}`} aria-label="내 위치" onClick={recenter}>
            <i className="fa-solid fa-location-crosshairs" />
          </button>
        </div>

        {/* 바텀시트 */}
        <div className={`${styles.sheet} ${sheetOpen ? styles.sheetOpen : styles.sheetPeek}`}>
          {/* 핸들 */}
          <button className={styles.sheetHandle} onClick={() => setSheetOpen((v) => !v)}>
            <span className={styles.handleBar} />
          </button>

          {/* 헤더 */}
          <div className={styles.sheetHeader}>
            <div className={styles.titleWrap}>
              <i className="fa-solid fa-map" />
              <h1>내 주변 공연</h1>
            </div>

            {!isLoading && !isError && (
              <span className={styles.badgeCount}>{shows.length}개</span>
            )}
            {isLoading && <span className={styles.badgeMuted}>불러오는 중…</span>}
            {isError && (
              <button className={styles.badgeError} onClick={() => refetch()}>
                불러오기 실패 — 다시 시도
              </button>
            )}
          </div>

          {/* 리스트 */}
          <div className={styles.list}>
            {!isLoading && !isError && shows.length === 0 && (
              <div className={styles.empty}>
                <i className="fa-regular fa-map" />
                <p>주변에 공연이 없습니다</p>
              </div>
            )}

            {!isLoading && !isError && shows.map((s) => (
              <div key={s.id} className={styles.card}>
                <div className={styles.poster} aria-hidden>
                  {s.poster ? (
                    <img src={s.poster} alt={`${s.title} 포스터`} />
                  ) : (
                    <span>포스터</span>
                  )}
                </div>

                <div className={styles.meta}>
                  <h3 className={`${styles.cardTitle} ${styles.clamp2}`}>{s.title}</h3>
                  <div className={`${styles.venue} ${styles.clamp1}`}>{s.venue}</div>
                  {s.distanceKm != null && (
                    <span className={styles.badgeOutline}>{s.distanceKm}km</span>
                  )}

                  <div className={styles.actions}>
                    <Button
                      className={styles.btnGhost}
                      onClick={() =>
                        setSelected({
                          id: s.id,
                          name: s.title,
                          venue: s.venue,
                          lat: s.lat ?? null,
                          lng: s.lng ?? null,
                        })
                      }
                    >
                      주변 볼거리
                    </Button>

                    <Button
                      className={styles.btnPrimary}
                      onClick={() => navigate(`/festival/${s.id}`)}
                    >
                      상세 보기
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NearbySpotEmbed 전체 오버레이 */}
        {selected && (
          <div className={styles.embedOverlay}>
            <NearbySpotEmbed festival={selected} onBack={() => setSelected(null)} />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
export default NearbyShowsPage
