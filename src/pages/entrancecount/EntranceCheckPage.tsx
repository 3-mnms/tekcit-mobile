// pages/EntranceCheckPage.tsx
import React, { useState } from 'react'
import styles from './EntranceCheckPage.module.css'
import EntranceCheckModal from '@/components/my/ticket/EntranceCheckModal'
import BottomNav from '@/components/festival/main/bottomnav/BottomNav'


import { useQuery } from '@tanstack/react-query';
import { getProducts as getProductsAdmin } from '@/shared/api/admin/festival'; 
import { getEntranceCount, getFestivalSchedules } from '@/shared/api/admin/statistics';
import type { Festival } from '@/models/admin/festival';

const EntranceCheckPage: React.FC = () => {
    const [selectedFid, setSelectedFid] = useState<string | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  

    const { data: festivals, isLoading: festivalsLoading } = useQuery({
        queryKey: ['festivals'],
        queryFn: getProductsAdmin,
        select: (response) => response.data || [],
    });
    
    const { data: schedules, isLoading: schedulesLoading } = useQuery({
        queryKey: ['schedules', selectedFid],
        queryFn: () => getFestivalSchedules(selectedFid!),
        enabled: !!selectedFid,
    });
    
    const { data: entranceStatsData, isLoading: entranceStatsLoading, refetch: refetchEntranceStats } = useQuery({
      queryKey: ['entranceStatsData', selectedFid, selectedSchedule],
      queryFn: () => getEntranceCount(selectedFid!, selectedSchedule!),
      enabled: false,
    });

    const handleFestivalSelect = (fid: string) => {
      setSelectedFid(fid);
      setSelectedSchedule(null);
    };

    const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedSchedule(e.target.value);
    };

    const handleCheck = () => {
        if (selectedFid && selectedSchedule) {
            refetchEntranceStats();
            setIsModalOpen(true);
        }
    };

    const selectedFestival = festivals?.find(f => f.fid === selectedFid);
      
    if (festivalsLoading || schedulesLoading || entranceStatsLoading ) {
        return <div>데이터를 불러오는 중...</div>;
    }

    if (!festivals || festivals.length === 0) {
        return <div>등록된 공연이 없습니다.</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.page}>
                <h2 className={styles.title}>입장 인원 수 조회</h2>
                <div className={styles.festivalList}>
                    {festivals?.map((festival: Festival) => (
                        <div
                            key={festival.fid}
                            className={`${styles.festivalCard} ${festival.fid === selectedFid ? styles.selected : ''}`}
                            onClick={() => handleFestivalSelect(festival.fid)}
                        >
                            <div className={styles.cardInfo}>
                                <p><strong>공연명:</strong> {festival.fname}</p>
                                <p><strong>공연장:</strong> {festival.fcltynm}</p>
                            </div>
                            {festival.fid === selectedFid && (
                                <div className={styles.scheduleDropdown} onClick={(e) => e.stopPropagation()}>
                                    <select
                                        value={selectedSchedule || ''}
                                        onChange={handleScheduleChange}
                                        disabled={!schedules?.data || schedules.data.length === 0}
                                    >
                                        <option value="">스케줄 선택</option>
                                        {schedules?.data.map(s => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className={styles.buttonWrapper}>
                    <button
                        className={styles.checkBtn}
                        disabled={!selectedFid || !selectedSchedule || entranceStatsLoading}
                        onClick={handleCheck}
                    >
                        입장 인원 수 조회하기
                    </button>
                </div>
                <EntranceCheckModal
                    isOpen={isModalOpen && !!entranceStatsData}
                    onClose={() => setIsModalOpen(false)}
                    count={entranceStatsData?.data.checkedInCount ?? 0}
                    totalCount={entranceStatsData?.data.availableNOP ?? 0}
                    title={selectedFestival?.fname ?? ''}
                />
            </div>
            <BottomNav/>
        </div>
    );
};

export default EntranceCheckPage