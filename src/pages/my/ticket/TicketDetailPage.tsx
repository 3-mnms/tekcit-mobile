// src/pages/my/ticket/TicketDetailPage.tsx
import React from 'react'
import styles from './TicketDetailPage.module.css'
import { useParams } from 'react-router-dom'
import MyHeader from '@/components/my/hedaer/MyHeader'
import TicketInfoCard from '@/components/my/ticket/TicketInfoCard'
import PaymentInfoSection from '@/components/my/ticket/PaymentInfoSection'

const TicketDetailPage: React.FC = () => {
  const { id } = useParams() // TODO: id로 상세 fetch

  return (
    <section className={styles.page}>
      <div className={styles.top}>
        <MyHeader title="예매 / 취소 내역" />
      </div>

      <div className={styles.content}>
        <h2 className="text-lg font-bold">예매내역 확인 · 취소</h2>
        <TicketInfoCard />
        <PaymentInfoSection />
      </div>
    </section>
  )
}

export default TicketDetailPage
