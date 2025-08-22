// src/components/my/ticket/ReservationList.tsx
import React from 'react';
import styles from './ReservationList.module.css';

export interface ReservationItem {
  id: number;
  title: string;
  poster: string;
  reservationNo: string;
  reservedDate: string; 
  venue: string;
  showDateTime: string;
  status: string;
}

const DUMMY: ReservationItem[] = [
  {
    id: 1,
    title: '공연 이름 1',
    poster: 'https://picsum.photos/id/237/600/900',
    reservationNo: 'T2726373040',
    reservedDate: '2025.05.16',
    venue: '명화 라이브홀',
    showDateTime: '2025.07.23(수) 20:00 1회',
    status: '취소',
  },
  {
    id: 2,
    title: "공연 이름 1",
    poster: 'https://picsum.photos/id/102/600/900',
    reservationNo: '3010425187',
    reservedDate: '2024.12.22',
    venue: 'LG아트센터 서울 U+ 스테이지',
    showDateTime: '2025.01.17(금) 15:00 1회',
    status: '예매완료',
  },
];

interface Props {
  filter: '전체' | '예매완료' | '예매취소' | '관람일정 조회';
  viewDate?: Date | null;
}

const onlyDateStr = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

const extractShowDate = (s: string) => {
  const m = s.match(/^\d{4}\.\d{2}\.\d{2}/);
  return m ? m[0] : '';
};

const ReservationList: React.FC<Props> = ({ filter, viewDate }) => {
  let items = DUMMY;

  if (filter === '예매완료') {
    items = items.filter((i) => i.status === '예매완료');
  } else if (filter === '예매취소') {
    items = items.filter((i) => i.status === '취소');
  } else if (filter === '관람일정 조회') {
    items = items.filter((i) => i.status === '예매완료');
    if (viewDate) {
      const want = onlyDateStr(viewDate);
      items = items.filter((i) => extractShowDate(i.showDateTime) === want);
    }
  }

  return (
    <div className={styles.list}>
      {items.map((it) => (
        <article key={it.id} className={styles.card}>
          <h3 className={styles.title}>{it.title}</h3>
          <div className={styles.body}>
            <img src={it.poster} alt={`${it.title} 포스터`} className={styles.poster} loading="lazy" />
            <div className={styles.info}>
              <div className={styles.row}><span className={styles.k}>예매번호</span><span className={styles.v}>{it.reservationNo}</span></div>
              <div className={styles.row}><span className={styles.k}>예매일</span><span className={styles.v}>{it.reservedDate}</span></div>
              <div className={styles.row}><span className={styles.k}>장소</span><span className={styles.v}>{it.venue}</span></div>
              <div className={styles.row}><span className={styles.k}>관람일시</span><span className={styles.v}>{it.showDateTime}</span></div>
              <div className={styles.row}><span className={styles.k}>상태</span><span className={styles.v}>{it.status}</span></div>
            </div>
          </div>
        </article>
      ))}
      {items.length === 0 && <p className={styles.empty}>조건에 맞는 내역이 없어요.</p>}
    </div>
  );
};

export default ReservationList;
