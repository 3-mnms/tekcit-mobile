// src/components/my/ticket/TicketInfoCard.tsx
import React, { useState } from 'react'
import styles from './TicketInfoCard.module.css'
import Modal from './QRModal'
import EntranceCheckModal from './EntranceCheckModal'

const TicketInfoCard: React.FC = () => {
  const [showQR, setShowQR] = useState(false)
  const [showEntrance, setShowEntrance] = useState(false)
  const eventTitle = '공연 이름 1';
  const eventDate = '2025.10.18';
  const eventTime = '17:00';
  const enteredCount = 4;
  const totalCount = 10;

  return (
    <>
      <article className={styles.card} aria-label="티켓 정보">
        <img
          className={styles.poster}
          src="https://picsum.photos/id/1069/600/900"
          alt="공연 포스터"
          loading="lazy"
          decoding="async"
        />

        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.k}>예매자</span>
            <span className={styles.v}>홍길동</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>예약번호</span>
            <span className={styles.v}>A123456789</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>일시</span>
            <span className={styles.v}>2025년 10월 18일 (토) 17:00</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>장소</span>
            <span className={styles.v}>
              올림픽공원 88잔디마당
              <button className={styles.linkBtn} type="button">
                지도보기
              </button>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>티켓수령</span>
            <span className={styles.v}>
              모바일 티켓
              <button className={styles.linkBtn} type="button" onClick={() => setShowQR(true)}>
                QR 보기
              </button>
            </span>
          </div>
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

      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="티켓 QR 코드">
        <img
          src="https://picsum.photos/seed/qr/180/180"
          alt="QR 코드"
          style={{ width: 180, height: 180 }}
        />
      </Modal>

      <EntranceCheckModal
        isOpen={showEntrance}
        onClose={() => setShowEntrance(false)}
        count={enteredCount}
        totalCount={totalCount}
        title={eventTitle}
        date={eventDate}
        time={eventTime}
      />
    </>
  )
}

export default TicketInfoCard
