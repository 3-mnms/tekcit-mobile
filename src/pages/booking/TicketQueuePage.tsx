// src/pages/reservation/TicketQueuePage.tsx  (모바일)
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import WaitingQueue from '@/components/reservation/waiting/WaitingQueue';
import styles from './TicketQueuePage.module.css';
import { useFestivalDetail } from '@/models/festival/tanstack-query/useFestivalDetail';

const TicketQueuePage: React.FC = () => {
  const { fid } = useParams<{ fid: string }>();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  // 공연 정보 (제목/포스터 표시용)
  const { data: detail } = useFestivalDetail(fid ?? '');
  const title =
    (detail as any)?.prfnm ||
    (detail as any)?.title ||
    '공연';

  const posterUrl =
    (detail as any)?.poster ||
    (detail as any)?.posterUrl ||
    (detail as any)?.posterPath ||
    (detail as any)?.mainImg ||
    (detail as any)?.img ||
    undefined;

  // 대기열 파라미터
  const date   = sp.get('date')   ?? '';
  const time   = sp.get('time')   ?? '';
  const fdfrom = sp.get('fdfrom') ?? '';
  const fdto   = sp.get('fdto')   ?? '';
  const initialWN = Number(sp.get('wn') ?? '0');

  // 초기 대기열 수
  const TOTAL_AHEAD = Math.max(0, Number.isFinite(initialWN) ? initialWN : 0);

  const [ahead, setAhead] = React.useState(TOTAL_AHEAD);
  const navigatedRef = React.useRef(false); // 중복 네비가드

  // 더미 감소 타이머 (실서비스에선 폴링/소켓으로 교체)
  React.useEffect(() => {
    const itv = setInterval(() => {
      setAhead((n) => Math.max(0, n - Math.floor(Math.random() * 5 + 1)));
    }, 1000);
    return () => clearInterval(itv);
  }, []);

  // 대기열 종료 → 예약 페이지로 이동(쿼리 보존)
  React.useEffect(() => {
    if (!fid || navigatedRef.current) return;
    if (ahead === 0) {
      navigatedRef.current = true;

      const params = new URLSearchParams();
      if (date)   params.set('date', date);
      if (time)   params.set('time', time);
      if (fdfrom) params.set('fdfrom', fdfrom);
      if (fdto)   params.set('fdto', fdto);

      navigate(`/reservation/${fid}?${params.toString()}`);
    }
  }, [ahead, fid, navigate, date, time, fdfrom, fdto]);

  const progress =
    TOTAL_AHEAD === 0
      ? 100
      : Math.min(100, Math.max(0, ((TOTAL_AHEAD - ahead) / TOTAL_AHEAD) * 100));
  const progressPct = Math.max(2, Math.round(progress)); // 최소 2%

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <WaitingQueue
          title={title}
          dateTime={date ? `${date}${time ? ' ' + time : ''}` : '일정 미지정'}
          waitingCount={ahead}
          progressPct={progressPct}
          posterUrl={posterUrl}         // WaitingQueue가 지원하면 노출됨 (옵션)
        />
      </div>
    </div>
  );
};

export default TicketQueuePage;
