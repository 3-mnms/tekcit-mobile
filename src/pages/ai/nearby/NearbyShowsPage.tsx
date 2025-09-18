import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import styles from './NearbyShowsPage.module.css'
import Button from '@/components/common/Button'
import Header from '@/components/common/header/Header'
import BottomNav from '@/components/festival/main/bottomnav/BottomNav'
import { useNavigate } from 'react-router-dom'
import { useNearbyFestivalsQuery } from '@/models/ai/tanstack-query/useNearbyFestivals'
import { useDefaultAddressQuery } from '@/models/auth/tanstack-query/useAddress'
import { loadKakaoMapSdk } from '@/shared/config/loadKakaoMap'
import { ExternalLink, Utensils } from 'lucide-react'
import Spinner from '@/components/common/spinner/Spinner'

type UiShow = {
  id: string
  title: string
  venue: string
  distanceKm: number | null
  lat?: number | null
  lng?: number | null
  poster?: string | null
}

/* ===== 기능 보강: 안전 파서 ===== */
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const asStr = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const asNum = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return null
}

/* ===== toUi: 타입 안전 변환 ===== */
const toUi = (raw: unknown): UiShow => {
  const r = isObj(raw) ? raw : {}
  const id = asStr(r.festivalDetailId) ?? asStr(r.id) ?? crypto.randomUUID()
  const title = asStr(r.name) ?? asStr(r.festivalName) ?? '-'
  const venue = asStr(r.venue) ?? asStr(r.hallName) ?? asStr(r.address) ?? '-'
  const distanceKm = asNum(r.distance) ?? asNum(r.distanceKm)
  const lat = asNum(r.latitude) ?? asNum(r.lat)
  const lng = asNum(r.longitude) ?? asNum(r.lng)
  const poster = asStr(r.poster) ?? asStr(r.posterFile)
  return {
    id,
    title,
    venue,
    distanceKm: distanceKm ?? null,
    lat: lat ?? null,
    lng: lng ?? null,
    poster: poster ?? null,
  }
}

const NearbyShowsPage: React.FC = () => {
  const navigate = useNavigate()

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<kakao.maps.Map | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([]) // ✅ 마커 보관
  const infoWindowsRef = useRef<kakao.maps.InfoWindow[]>([]) // ✅ 인포윈도우 보관
  const mapContainerRef = useRef<HTMLDivElement | null>(null) // ✅ 컨테이너 변경 감지

  const [sheetOpen, setSheetOpen] = useState(true)
  const [selected, setSelected] = useState<NearbyFestivalMini | null>(null)

  const { data: defaultAddr, isLoading: isAddrLoading } = useDefaultAddressQuery()
  const { data, isLoading, isError, refetch } = useNearbyFestivalsQuery()

  // ✅ Kakao SDK 사전 로드
  const [sdkLoaded, setSdkLoaded] = useState(false)
  useEffect(() => {
    let mounted = true
    loadKakaoMapSdk()
      .then(() => mounted && setSdkLoaded(true))
      .catch(() => mounted && setSdkLoaded(false))
    return () => {
      mounted = false
    }
  }, [])

  const shows = useMemo<UiShow[]>(
    () => (Array.isArray(data?.festivalList) ? data!.festivalList.map(toUi) : []),
    [data],
  )

  const userCenter = useMemo(() => {
    const lat = asNum(data?.userGeocodeInfo?.latitude)
    const lng = asNum(data?.userGeocodeInfo?.longitude)
    return lat != null && lng != null ? { lat, lng } : null
  }, [data])

  const hasDefaultAddress = useMemo(() => {
    if (!defaultAddr) return false
    const candidate = defaultAddr.address ?? ''
    return typeof candidate === 'string' && candidate.trim().length > 0
  }, [defaultAddr])

  useEffect(() => {
    if (isAddrLoading) return
    if (!hasDefaultAddress) {
      const confirmAdd = window.confirm(
        '이 서비스는 기본 배송지가 필요합니다.\n현재 등록된 배송지가 없습니다. 추가하시겠습니까?',
      )
      if (confirmAdd) {
        navigate('/mypage/myinfo/address', {
          replace: true,
          state: { from: 'nearby-shows' },
        })
      } else {
        return
      }
    }
  }, [isAddrLoading, hasDefaultAddress, navigate])

  /* 선택 해제 시 맵 객체/컨테이너 정리 (원 코드 동작 반영) */
  useEffect(() => {
    if (selected === null) {
      mapObjRef.current = null
      mapContainerRef.current = null
    }
  }, [selected])

  /* ===== bounds 맞추기: 사용자 위치 + 모든 마커, 패딩 포함 ===== */
  const fitToBounds = useCallback(() => {
    if (!mapObjRef.current || !window.kakao?.maps) return
    const map = mapObjRef.current
    const bounds = new window.kakao.maps.LatLngBounds()
    let added = false

    markersRef.current.forEach((m) => {
      const pos = m.getPosition()
      if (pos) {
        bounds.extend(pos)
        added = true
      }
    })

    if (userCenter) {
      bounds.extend(new window.kakao.maps.LatLng(userCenter.lat, userCenter.lng))
      added = true
    }

    if (added && !bounds.isEmpty()) {
      // 패딩(좌/상/우/하)을 충분히 줘서 여백 확보
      if ((map as any).setBounds.length >= 5) {
        ;(map as any).setBounds(bounds, 40, 40, 40, 40)
      } else {
        map.setBounds(bounds)
      }
    }
  }, [userCenter])

  /* ===== 지도 렌더링/갱신 ===== */
  useEffect(() => {
    if (!mapRef.current) return
    if (!sdkLoaded) return

    let cancelled = false

    const render = async () => {
      const kakaoNS = await loadKakaoMapSdk()
      if (cancelled || !mapRef.current) return

      // 센터 계산 (유저 위치 > 첫 좌표 존재 공연 > 서울 기본값)
      const firstWithPos = shows.find((s) => s.lat != null && s.lng != null)
      const centerLat = userCenter?.lat ?? firstWithPos?.lat ?? 37.566826
      const centerLng = userCenter?.lng ?? firstWithPos?.lng ?? 126.9786567

      const containerChanged = mapContainerRef.current !== mapRef.current

      if (!mapObjRef.current || containerChanged) {
        mapObjRef.current = new kakaoNS.maps.Map(mapRef.current, {
          center: new kakaoNS.maps.LatLng(centerLat, centerLng),
          level: 6,
        })
        mapContainerRef.current = mapRef.current
      } else {
        mapObjRef.current.setCenter(new kakaoNS.maps.LatLng(centerLat, centerLng))
      }

      const map = mapObjRef.current!

      // 이전 마커/인포윈도우 정리
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      infoWindowsRef.current.forEach((iw) => iw.close())
      infoWindowsRef.current = []

      // 공연 마커 + 인포윈도우
      shows.forEach((s) => {
        if (s.lat == null || s.lng == null) return
        const pos = new kakaoNS.maps.LatLng(s.lat, s.lng)
        const marker = new kakaoNS.maps.Marker({ position: pos, map })
        markersRef.current.push(marker)

        const iw = new kakaoNS.maps.InfoWindow({
          content: `
            <div style="
              box-sizing:border-box;
              max-width: 260px;
              padding: 8px 10px;
              font-size: 13px;
              line-height: 1.4;
              white-space: normal;
              word-break: break-word;
              overflow-wrap: anywhere;
            ">
              <b style="display:block;margin-bottom:4px;font-weight:600;">
                ${s.title}
              </b>
              <span style="color:#666">${s.venue}</span>
            </div>
          `,
        })
        infoWindowsRef.current.push(iw)

        kakaoNS.maps.event.addListener(marker, 'mouseover', () => iw.open(map, marker))
        kakaoNS.maps.event.addListener(marker, 'mouseout', () => iw.close())
        kakaoNS.maps.event.addListener(marker, 'click', () =>
          setSelected({
            id: s.id,
            name: s.title,
            venue: s.venue,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
          }),
        )
      })

      // 사용자 위치 마커
      if (userCenter) {
        const userMarker = new kakaoNS.maps.Marker({
          position: new kakaoNS.maps.LatLng(userCenter.lat, userCenter.lng),
          map,
        })
        markersRef.current.push(userMarker)
      }

      fitToBounds()
    }

    void render()

    return () => {
      cancelled = true
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      infoWindowsRef.current.forEach((iw) => iw.close())
      infoWindowsRef.current = []
    }
  }, [sdkLoaded, shows, userCenter, fitToBounds])

  // 맵 컨트롤
  const zoomIn = () => {
    if (mapObjRef.current) mapObjRef.current.setLevel(Math.max(1, mapObjRef.current.getLevel() - 1))
  }
  const zoomOut = () => {
    if (mapObjRef.current) mapObjRef.current.setLevel(mapObjRef.current.getLevel() + 1)
  }
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
      {/* 상단 주소 바 (스타일 그대로 유지) */}
      <div className={styles.addrBar}>
        <div className={styles.addrMain}>
          <i className={`fa-solid fa-location-dot ${styles.addrIcon}`} />
          <span className={styles.addrText}>{defaultAddr ? addrText : <Spinner />}</span>
        </div>
        <Button className={styles.addrBtn} onClick={() => navigate('/mypage/myinfo/address')}>
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
          <button
            className={`${styles.fab} ${styles.fabAccent}`}
            aria-label="내 위치"
            onClick={recenter}
          >
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

            {isLoading && <Spinner />}
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

            {!isLoading &&
              !isError &&
              shows.map((s) => (
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
                  </div>

                  <div className={styles.actions}>
                    <Button
                      className={styles.btnGhost}
                      onClick={() =>
                        navigate(`/nearby/spot/${s.id}`, {
                          state: {
                            festival: {
                              id: s.id,
                              name: s.title,
                              venue: s.venue,
                              lat: s.lat ?? null,
                              lng: s.lng ?? null,
                            },
                          },
                        })
                      }
                    >
                      <Utensils className={styles.linkIcon} />
                      주변 볼거리 & 먹거리
                    </Button>

                    <Button
                      className={styles.btnPrimary}
                      onClick={() => navigate(`/festival/${s.id}`)}
                    >
                      <ExternalLink className={styles.linkIcon} />
                      공연 상세 페이지
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
export default NearbyShowsPage
