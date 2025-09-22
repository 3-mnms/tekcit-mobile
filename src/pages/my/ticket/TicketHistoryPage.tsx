// src/pages/my/ticket/TicketHistoryPage.tsx
import React, { useState } from 'react'
import styles from './TicketHistoryPage.module.css'
import MyHeader from '@/components/my/hedaer/MyHeader'
import ReservationList from '@/components/my/ticket/ReservationList'
import FilterTabs, { type Tab } from '@/components/my/ticket/FilterTabs'
import 'react-day-picker/dist/style.css'

const TicketHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('전체')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleChangeTab = (t: Tab) => {
    setActiveTab(t)
    if (t !== '관람일정 조회') setIsCalendarOpen(false)
  }

  return (
    <section className={styles.page}>
      {/* 상단 고정 영역 */}
      <div className={styles.top}>
        <MyHeader title="예매 / 취소 내역" />
        <div className={styles.tabsWrap}>
          <FilterTabs
            active={activeTab}
            onChange={handleChangeTab}
            isCalendarOpen={isCalendarOpen}
            onToggleCalendar={() => setIsCalendarOpen(v => !v)}
          />
        </div>
      </div>

      {/* 스크롤 영역 */}
      <main className={styles.content}>
        <div className={styles.body}>
          <ReservationList filter={activeTab} />
        </div>
      </main>
    </section>
  )
}

export default TicketHistoryPage
