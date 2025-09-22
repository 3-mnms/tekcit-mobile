// src/pages/payment/wallet/WalletPointPage.tsx
// 목적: 모바일 UI 유지 + 웹 버전과 동일한 API/매핑 규칙 적용

import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import Button from '@/components/common/button/Button'
import WalletHistory, { type WalletHistoryViewItem } from '@/components/payment/pay/WalletHistory'
import { useWalletBalance, useWalletHistory } from '@/shared/api/payment/tekcitHistory'
import { confirmPointCharge } from '@/shared/api/payment/pointToss'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'
import MonthDropdown from '@/components/payment/dropdown/MonthDropdown'
import { useUIStore } from '@/shared/store/uiStore'
import Header from '@/components/common/header/Header'

import styles from './WalletPointPage.module.css'

const PAGE_SIZE = 10

// 결제 결과 쿼리 파싱 스키마
const ResultQuerySchema = z.object({
  type: z.literal('wallet-charge').optional(),
  paymentId: z.string().min(10).optional(),
  success: z.enum(['true', 'false']).optional(),
})

// 충전 결과 처리 훅: 웹과 동일 동작
function useChargeResultHandler() {
  const [params] = useSearchParams()
  const { data: tokenInfo } = useTokenInfoQuery()
  const userId = tokenInfo?.userId

  const parsed = ResultQuerySchema.safeParse({
    type: params.get('type') ?? undefined,
    paymentId: params.get('paymentId') ?? undefined,
    success: params.get('success') ?? undefined,
  })
  const qs = parsed.success ? parsed.data : {}

  // 실패 안내 후 리로드(쿼리 제거)
  useEffect(() => {
    if (qs.type === 'wallet-charge' && qs.success === 'false') {
      alert('결제가 완료되지 않았습니다.')
      window.location.replace('/payment/wallet-point')
    }
  }, [qs.type, qs.success])

  // 서버 확정 폴링
  const confirmMutation = useMutation({
    mutationFn: (pid: string) => confirmPointCharge(pid, userId),
  })

  const pollRef = useRef<number | null>(null)
  const shouldConfirm = qs.type === 'wallet-charge' && !!qs.paymentId && qs.success === 'true'

  useEffect(() => {
    if (!shouldConfirm || !userId) return

    // 최초 시도
    if (!confirmMutation.isPending && !confirmMutation.isSuccess) {
      confirmMutation.mutate(qs.paymentId!)
    }

    // 2초 주기 폴링
    if (pollRef.current == null) {
      pollRef.current = window.setInterval(() => {
        if (!confirmMutation.isSuccess && !confirmMutation.isPending) {
          confirmMutation.mutate(qs.paymentId!)
        }
      }, 2000)
    }

    return () => {
      if (pollRef.current != null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [shouldConfirm, userId, qs.paymentId, confirmMutation.isPending, confirmMutation.isSuccess])

  // 성공 시 안내 후 리로드(쿼리 제거)
  const redirectedRef = useRef(false)
  useEffect(() => {
    if (shouldConfirm && confirmMutation.isSuccess && !redirectedRef.current) {
      redirectedRef.current = true
      alert('충전이 완료되었습니다.')
      window.location.replace('/payment/wallet-point')
    }
  }, [shouldConfirm, confirmMutation.isSuccess])
}

const WalletPointPage: React.FC = () => {
  const navigate = useNavigate()
  const { setHeader } = useUIStore()

  // 월 선택 초기값(YYYY-MM)
  const thisMonth = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])
  const [month, setMonth] = useState<string>(thisMonth)

  // Header 설정 - 검색 버튼 숨김
  useEffect(() => {
    setHeader({
      leftIcon: 'back',
      centerMode: 'title',
      title: '킷페이 내역',
      showSearch: false,
    })
  }, [setHeader])

  // 최근 6개월 칩
  const monthChips = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}월`
      return { value: v, label }
    })
  }, [])

  // 결제 결과 확정 처리
  useChargeResultHandler()

  // 잔액/내역 API
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useWalletBalance()
  const [page, setPage] = useState(0)
  const {
    data: historyPage,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useWalletHistory({ page, size: PAGE_SIZE })

  // 포커스/가시성 변경 시 데이터 동기화
  useEffect(() => {
    const sync = () => {
      refetchBalance()
      refetchHistory()
    }
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [refetchBalance, refetchHistory])

  // 월 필터(YYYY-MM): 서버 페이지 결과를 프론트에서 필터링
  const filteredItems = useMemo(() => {
    const toYM = (isoLike: unknown) => {
      const d = new Date(String(isoLike ?? ''))
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }
    const list = historyPage?.content ?? []
    // 서버가 payTime 또는 time을 줄 수 있으므로 둘 다 대응
    return list.filter((it: any) => toYM(it.payTime ?? it.time) === month)
  }, [historyPage, month])

  // 뷰모델 변환: 웹과 동일한 규칙으로 타입 매핑
  const viewItems: WalletHistoryViewItem[] = useMemo(() => {
    return filteredItems.map((row: any, idx: number) => {
      const rawMethod = String(row.payMethod ?? row.method ?? '').toUpperCase()
      const transactionType = String(row.transactionType ?? '').toUpperCase() // CREDIT/DEBIT/UNKNOWN
      const paymentStatus = String(row.paymentStatus ?? '').toUpperCase()
      const buyerId = row.buyerId

      const type:
        | 'charge'
        | 'refund'
        | 'use'
        | 'transfer_in'
        | 'transfer_out'
        | 'unknown' = (() => {
        // 0) 환불 우선: 상태에 CANCEL/CANCELLED 포함
        if (paymentStatus.includes('CANCELLED') || paymentStatus.includes('CANCEL')) {
          return 'refund'
        }
        // 1) 충전: POINT_CHARGE/CHARGE 키워드
        if (rawMethod.includes('POINT_CHARGE') || rawMethod.includes('CHARGE')) {
          return 'charge'
        }
        // 2) 양도: TRANSFER 키워드 → CREDIT=transfer_in, DEBIT=transfer_out
        if (rawMethod.includes('TRANSFER')) {
          if (transactionType === 'CREDIT') return 'transfer_in'
          if (transactionType === 'DEBIT') return 'transfer_out'
          return 'unknown'
        }
        // 3) 결제: POINT_PAYMENT
        if (rawMethod.includes('POINT_PAYMENT')) {
          // buyerId가 null → 정산/대금수취 맥락
          if (buyerId === null) {
            if (transactionType === 'DEBIT') return 'transfer_in' // 증가
            if (transactionType === 'CREDIT') return 'use'        // 감소
          }
          // buyerId 존재 → 일반 사용
          return 'use'
        }
        // 4) 기타 환불 키워드
        if (rawMethod.includes('REFUND') || rawMethod.includes('CANCEL')) {
          return 'refund'
        }
        // 5) 기타: DEBIT=use, 그 외 unknown
        if (transactionType === 'DEBIT') return 'use'
        return 'unknown'
      })()

      return {
        id: String(row.paymentId ?? row.id ?? `tx-${page}-${idx}`),
        createdAt: String(row.payTime ?? row.time ?? new Date().toISOString()),
        type,
        amount: Math.abs(Number(row.amount ?? 0)),
        // 아래 두 필드는 웹 WalletHistory에 맞춰 전달(스타일/표시 커스터마이즈 용도)
        transactionType: (transactionType as 'CREDIT' | 'DEBIT' | 'UNKNOWN'),
        paymentStatus: String(row.paymentStatus ?? ''),
      }
    })
  }, [filteredItems, page])

  const fmt = (n: number) => n.toLocaleString('ko-KR')
  const handleChargeClick = () => navigate('/payment/wallet-point/money-charge', { replace: true })

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* 본문 */}
        <main className={styles.main}>
          <div className={styles.shell}>
            {/* 잔액 카드 */}
            <section className={styles.summaryCard}>
              <div className={styles.summaryLeft}>
                <div className={styles.summaryLabel}>현재 잔액</div>
                <div className={styles.summaryValue}>
                  {isBalanceLoading ? (
                    <span className={styles.skeleton} />
                  ) : (
                    `${fmt(balanceData?.availableBalance ?? 0)}원`
                  )}
                </div>
              </div>
              <div className={styles.summaryRight}>
                <Button className={styles.chargeBtn} onClick={handleChargeClick}>
                  충전
                </Button>
              </div>
            </section>

            {/* 월 선택 + 페이지 이동 */}
            <div className={styles.filterBar}>
              <MonthDropdown value={month} onChange={setMonth} months={6} />

              <div className={styles.pager}>
                <button
                  className={styles.pagerBtn}
                  disabled={!historyPage || historyPage.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  {'<'}
                </button>
                <span className={styles.pageInfo}>
                  {(historyPage?.number ?? 0) + 1} / {Math.max(1, historyPage?.totalPages ?? 1)}
                </span>
                <button
                  className={styles.pagerBtn}
                  disabled={!historyPage || historyPage.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {'>'}
                </button>
              </div>
            </div>

            {/* 내역: 웹과 동일 규칙으로 가공된 데이터 바인딩 */}
            <section className={styles.historySection}>
              <WalletHistory
                month={month}
                items={viewItems}
                loading={isHistoryLoading}
                error={historyError ? '내역을 불러오지 못했어요 (서버 오류)' : null}
              />
            </section>
          </div>
        </main>
      </div>
    </>
  )
}

export default WalletPointPage
