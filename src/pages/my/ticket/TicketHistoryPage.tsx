// src/pages/my/ticket/TicketHistoryPage.tsx
import React, { useState } from 'react'
import styles from './TicketHistoryPage.module.css'
import MyHeader from '@/components/my/hedaer/MyHeader'
import ReservationList from '@/components/my/ticket/ReservationList'
import FilterTabs, { type Tab } from '@/components/my/ticket/FilterTabs'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const TicketHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('전체')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [viewDate, setViewDate] = useState<Date | null>(null)

  const handleChangeTab = (t: Tab) => {
    setActiveTab(t)
    if (t !== '관람일정 조회') setIsCalendarOpen(false)
  }

  return (
    <section className={styles.page}>
        <MyHeader title="예매 / 취소 내역" />

      <div className={`${styles.fullBleed} ${styles.tabsWrap}`}>
        <FilterTabs
          active={activeTab}
          onChange={handleChangeTab}
          isCalendarOpen={isCalendarOpen}
          onToggleCalendar={() => setIsCalendarOpen((v) => !v)}
        />
      </div>
      <div className={styles.content}>
        {activeTab === '관람일정 조회' && isCalendarOpen && (
          <div className={`${styles.fullBleed} ${styles.calendarWrap}`}>
            <DayPicker
              mode="single"
              selected={viewDate ?? undefined}
              onSelect={(d) => setViewDate(d ?? null)}
              ISOWeek
              weekStartsOn={1}
              showOutsideDays
            />
          </div>
        )}

        <div className={styles.body}>
          <ReservationList filter={activeTab} viewDate={viewDate} />
        </div>
      </div>
    </section>
  )
}

export default TicketHistoryPage
