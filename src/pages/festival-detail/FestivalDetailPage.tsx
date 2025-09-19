import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import Info from '@/components/festival/detail/FestivalInfoSection';
import Scheduler from '@/components/festival/detail/FestivalScheduleSection';
import InfoDetail from '@/components/festival/detail/FestivalInfoDetailSection';
import Statistics from '@/components/festival/detail/FestivalStatisticsSection';
import { useFestivalDetail, useIncreaseViews } from '@/models/festival/tanstack-query/useFestivalDetail';
import { useUIStore } from '@/shared/store/uiStore';
import styles from './FestivalDetailPage.module.css';
import Header from '@/components/common/header/Header';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';
import Review from '@/components/festival/review/FestivalReviewSection';

const FestivalDetailPage: React.FC = () => {
  const { fid } = useParams<{ fid: string }>();
  
  const { setHeader  } = useUIStore();

  const { data: detail, isLoading, isError } = useFestivalDetail(fid ?? '');

  const { mutate: increaseViews } = useIncreaseViews();
  const firedRef = useRef(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
  }, [fid])
  
useEffect(() => {
  if (detail) {
    setHeader({ centerMode: 'title', leftIcon: 'back', title: detail.prfnm });
  }
}, [detail, setHeader]);
  useEffect(() => {
    if (!fid) return;
    if (firedRef.current) return;
    firedRef.current = true;
    increaseViews(fid);
 }, [fid, increaseViews]);

  const [activeTab, setActiveTab] = useState<'info' | 'sale' | 'review'>('info');

  if (!fid) {
    return (
      <div className={styles.pageWrapper}>
        <Header/>
        <div className={styles.singleColumn}>잘못된 접근이에요(식별자 없음) 😿</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.pageWrapper}>
        <Header/>
        <div className={styles.singleColumn}>
          상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요 😿
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header/>
      <div className={styles.layout}>
        <Info detail={detail} loading={isLoading} />

        <div className={styles.tabWrapper}>
          <div className={styles.tabMenu}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('info')}
              className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
            >
              공연정보
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('sale')}
              className={`${styles.tab} ${activeTab === 'sale' ? styles.active : ''}`}
            >
              예매자통계
            </div>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('review')}
                className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
              >
                AI 기대평
              </div>
          </div>

          <div className={styles.tabContent}>
              {activeTab === 'info' && <InfoDetail />}
              {activeTab === 'sale' && <Statistics fid={fid} />}
              {activeTab === 'review' && <Review fid={fid} />}
            </div>
          <div className={styles.Scheduler}>
            <Scheduler />
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};

export default FestivalDetailPage;
