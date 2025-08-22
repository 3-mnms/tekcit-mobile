import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WaitingQueue from '@/components/reservation/waiting/WaitingQueue';
import styles from './TicketQueuePage.module.css';

const TOTAL_AHEAD = 10; 

const TicketQueuePage: React.FC = () => {
  const { fid } = useParams<{ fid: string }>();
  const navigate = useNavigate();
  const [ahead, setAhead] = React.useState(TOTAL_AHEAD);
  const navigatedRef = React.useRef(false); // 중복 이동 방지

  React.useEffect(() => {
    const itv = setInterval(() => {
      setAhead((n) => Math.max(0, n - Math.floor(Math.random() * 5 + 1)));
    }, 1000);
    return () => clearInterval(itv);
  }, []);

  React.useEffect(() => {
    if (!fid || navigatedRef.current) return;
    if (ahead === 0) {
      navigatedRef.current = true;
      navigate(`/reservation/${fid}`); 
    }
  }, [ahead, fid, navigate]);

  const progress = ((TOTAL_AHEAD - ahead) / TOTAL_AHEAD) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <WaitingQueue
          title="그랜드 민트 페스티벌 2025"
          dateTime="2025-10-18(토) 18:00"
          waitingCount={ahead}
          progressPct={progress}
        />
      </div>
    </div>
  );
};

export default TicketQueuePage;
