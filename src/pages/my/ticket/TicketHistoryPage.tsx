// src/pages/my/ticket/TicketHistoryPage.tsx
import React, { useState } from 'react';
import styles from './TicketHistoryPage.module.css';
import MyHeader from '@/components/my/hedaer/MyHeader';
import ReservationList from '@/components/my/ticket/ReservationList';
import FilterTabs, { type Tab } from '@/components/my/ticket/FilterTabs';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const TicketHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('전체');

  // 관람일정 조회 전용
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date | null>(null);

  const handleChangeTab = (t: Tab) => {
    setActiveTab(t);
    // 관람일정이 아닌 탭에서는 달력 닫기
    if (t !== '관람일정 조회') setIsCalendarOpen(false);
  };

  return (
    <section className={styles.page}>
      <MyHeader title="예매 / 취소 내역" />

      <div className={styles.body}>
        <FilterTabs
          active={activeTab}
          onChange={handleChangeTab}
          isCalendarOpen={isCalendarOpen}
          onToggleCalendar={() => setIsCalendarOpen((v) => !v)}
        />

        {/* 관람일정 조회일 때만 달력 표시(드롭다운처럼) */}
        {activeTab === '관람일정 조회' && isCalendarOpen && (
          <div className={styles.calendarWrap}>
            <DayPicker
              mode="single"
              selected={viewDate ?? undefined}
              onSelect={(d) => setViewDate(d ?? null)}
              ISOWeek
              weekStartsOn={1}
              showOutsideDays
            />
            {viewDate && (
              <p className={styles.calendarHint}>
                선택 날짜: {viewDate.toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        )}

        {/* 리스트에 탭/선택날짜 전달 */}
        <ReservationList filter={activeTab} viewDate={viewDate} />
      </div>
    </section>
  );
};

export default TicketHistoryPage;
