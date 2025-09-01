// src/components/my/ticket/TicketInfoCard.tsx
import React, { useMemo, useState } from 'react'
import styles from './TicketInfoCard.module.css'
import Modal from './QRModal'
import EntranceCheckModalLoader from '@/components/my/ticket/EntranceCheckModalLoader'
import { format } from 'date-fns'
import QRViewer from './QRViewer'
import KakaoMapModal from '@/components/shared/kakao/KakaoMapModal'

type Props = {
  festivalId: string
  reservationNumber: string
  title: string
  place: string
  performanceDateISO: string
  deliveryMethod: 'MOBILE' | 'PAPER'
  qrIds: string[]
  address?: string
  posterFile?: string
  reserverName?: string
  selectedTicketCount?: number
  totalCountForGauge?: number
}

const deliveryLabel = (t: 'MOBILE' | 'PAPER') => (t === 'MOBILE' ? '모바일 티켓' : '지류 티켓')

const TicketInfoCard: React.FC<Props> = ({
  festivalId,
  reservationNumber,
  title,
  place,
  performanceDateISO,
  deliveryMethod,
  qrIds,
  address,
  posterFile,
  reserverName,
}) => {
  const [showQR, setShowQR] = useState(false)
  const [showEntrance, setShowEntrance] = useState(false)
  const [showMap, setShowMap] = useState(false)  

  const ymd = useMemo(() => {
    const d = new Date(performanceDateISO)
    return isNaN(d.getTime()) ? performanceDateISO : format(d, 'yyyy.MM.dd')
  }, [performanceDateISO])

  const hm = useMemo(() => {
    const d = new Date(performanceDateISO)
    return isNaN(d.getTime()) ? '' : format(d, 'HH:mm')
  }, [performanceDateISO])

  const posterSrc = useMemo(() => {
    const src = (posterFile ?? '').trim()
    return src.length > 0 ? src : '/dummy-poster.jpg'
  }, [posterFile])

  return (
    <>
      <article className={styles.card} aria-label="티켓 정보">
        <img
          src={posterSrc}
          alt={`포스터 - ${title}`}
          className={styles.poster}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = '/dummy-poster.jpg'
          }}
        />

        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.k}>예매자</span>
            <span className={styles.v}>{reserverName ?? '-'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>예약번호</span>
            <span className={styles.v}>{reservationNumber}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>일시</span>
            <span className={styles.v}>
              {ymd}{' '}
              {hm && (
                <>
                  ({/* 요일 필요시 */}) {hm}
                </>
              )}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>장소</span>
            <span className={styles.v}>
              {place}
              <button className={styles.linkBtn} type="button" onClick={() => setShowMap(true)}>
                지도보기
              </button>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>티켓수령</span>
            <span className={styles.v}>
              {deliveryLabel(deliveryMethod)}
              {deliveryMethod === 'MOBILE' && (
              <button className={styles.linkBtn} type="button" onClick={() => setShowQR(true)}>
                QR 보기
              </button>
              )}
            </span>
          </div>

          {deliveryMethod === 'PAPER' && (
            <div className={styles.row}>
              <span className={styles.k}>배송지</span>
              <span className={styles.v}>{address ?? '-'}</span>
            </div>
          )}

          <div className={styles.row}>
            <span className={styles.k}>입장 인원수</span>
            <span className={styles.v}>
              <button
                className={styles.linkBtn}
                type="button"
                onClick={() => setShowEntrance(true)}
              >
                조회하기
              </button>
            </span>
          </div>
        </div>
      </article>

      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="티켓 QR">
        <QRViewer ids={qrIds} size={180} />
      </Modal>

      <EntranceCheckModalLoader
        isOpen={showEntrance}
        onClose={() => setShowEntrance(false)}
        festivalId={festivalId}
        performanceDateISO={performanceDateISO}
        title={title}
      />

      <KakaoMapModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        query={place}
      />
    </>
  )
}

export default TicketInfoCard
