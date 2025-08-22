import React from 'react'
import styles from './TransferTicketPage.module.css'
import MyHeader from '@/components/my/hedaer/MyHeader'
import { useNavigate } from 'react-router-dom' 

interface Ticket {
  id: number
  date: string
  number: string
  title: string
  time: string
  count: number
  status: '결제 완료' | '결제 대기' | '취소 완료'
  imageUrl: string
  isTransferred: boolean
}

const dummyTickets: Ticket[] = [
  {
    id: 1,
    date: '2025.07.01',
    number: 'A123456',
    title: 'GMF 2025',
    time: '2025.10.18 17:00',
    count: 2,
    status: '결제 완료',
    imageUrl: 'https://picsum.photos/id/1011/600/900',
    isTransferred: false,
  },
  {
    id: 2,
    date: '2025.07.02',
    number: 'B987654',
    title: '뮤지컬 캣츠',
    time: '2025.11.10 19:30',
    count: 1,
    status: '결제 완료',
    imageUrl: 'https://picsum.photos/id/1029/600/900',
    isTransferred: true,
  },
]

const TransferTicketPage: React.FC = () => {
  const navigate = useNavigate()

  const handleTransfer = (ticket: Ticket) => {
    navigate(`${ticket.id}`, { state: { ticket } })
  }

  const visibleTickets = dummyTickets.filter((t) => t.status === '결제 완료')

  return (
    <section className={styles.page}>
      <MyHeader title="티켓 양도" />

      <div className={styles.body}>
        <div className={styles.list}>
          {visibleTickets.map((ticket) => (
            <article key={ticket.id} className={styles.card} aria-label={`${ticket.title} 티켓`}>
              <div className={styles.left}>
                <img
                  src={ticket.imageUrl}
                  alt={`${ticket.title} 포스터`}
                  className={styles.poster}
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className={styles.center}>
                <div className={styles.row}>
                  <span className={styles.k}>예매일</span>
                  <span className={styles.v}>{ticket.date}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>예매번호</span>
                  <span className={styles.v}>{ticket.number}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>공연명</span>
                  <span className={styles.v}>{ticket.title}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>일시</span>
                  <span className={styles.v}>{ticket.time}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.k}>매수</span>
                  <span className={styles.v}>{ticket.count}</span>
                </div>
              </div>

              <div className={styles.right}>
                {ticket.isTransferred ? (
                  <span className={styles.transferredBadge} aria-label="양도 완료됨">
                    양도 완료됨
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.transferBtn}
                    onClick={() => handleTransfer(ticket)}
                  >
                    양도하기
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TransferTicketPage
