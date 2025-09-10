// src/pages/payment/wallet/WalletPointPage.tsx
// 목적: 모바일 UI 유지 + 웹 버전의 API 연동(잔액/내역/충전확정) 동일 적용

import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import Button from '@/components/common/button/Button'
import WalletHistory, { type WalletHistoryViewItem } from '@/components/payment/pay/WalletHistory'
import { useWalletBalance, useWalletHistory } from '@/shared/api/payment/tekcitHistory'
import { confirmPointCharge } from '@/shared/api/payment/pointToss'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'

import styles from './WalletPointPage.module.css'

const PAGE_SIZE = 10

// 결제 결과 쿼리 파싱 스키마(redirect 후 ?type=wallet-charge&paymentId=...&success=true/false)
const ResultQuerySchema = z.object({
  type: z.literal('wallet-charge').optional(),
  paymentId: z.string().min(10).optional(),
  success: z.enum(['true', 'false']).optional(),
})

// 충전 결과 처리 훅: 웹 버전 동작과 동일하게 적용
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

  // 실패로 돌아온 경우: 안내 후 쿼리 제거되도록 리로드 이동
  useEffect(() => {
    if (qs.type === 'wallet-charge' && qs.success === 'false') {
      alert('결제가 완료되지 않았습니다.')
      window.location.replace('/payment/wallet-point')
    }
  }, [qs.type, qs.success])

  // 확정 API 호출 뮤테이션 (X-User-Id 필요 시 서버 인터셉터가 주입)
  const confirmMutation = useMutation({
    mutationFn: (pid: string) => confirmPointCharge(pid, userId),
  })

  // 승인 지연 대비 2초 폴링: userId가 준비된 뒤 시작
  const pollRef = useRef<number | null>(null)
  const shouldConfirm =
    qs.type === 'wallet-charge' && !!qs.paymentId && qs.success === 'true'

  useEffect(() => {
    if (!shouldConfirm || !userId) return

    // 최초 시도
    if (!confirmMutation.isPending && !confirmMutation.isSuccess) {
      confirmMutation.mutate(qs.paymentId!)
    }

    // 폴링 시작
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

  // 월 선택 초기값(YYYY-MM)
  const thisMonth = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])
  const [month, setMonth] = useState<string>(thisMonth)

  // 최근 6개월 칩(모바일 UI 그대로)
  const monthChips = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}월`
      return { value: v, label }
    })
  }, [])

  // 결제 결과 핸들러: redirect로 돌아온 경우 확정 처리
  useChargeResultHandler()

  // 잔액/내역 API: 웹과 동일 훅 사용
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useWalletBalance()
  const [page, setPage] = useState(0)
  const { data: historyPage, isLoading: isHistoryLoading, error: historyError, refetch: refetchHistory } =
    useWalletHistory({ page, size: PAGE_SIZE })

  // 탭 포커스/가시성 변경 시 데이터 동기화
  useEffect(() => {
    const sync = () => { refetchBalance(); refetchHistory() }
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

  // 뷰모델 변환: WalletHistoryViewItem으로 매핑
  const viewItems: WalletHistoryViewItem[] = useMemo(() => {
    return filteredItems.map((row: any, idx: number) => {
      const rawMethod = String(row.payMethod ?? row.method ?? '').toUpperCase()
      // 규칙: 'CHARGE' 포함 → 충전(+), 'REFUND' 포함 → 환불(+), 그 외 사용(-)
      const type: 'charge' | 'refund' | 'use' =
        rawMethod.includes('CHARGE') ? 'charge'
          : rawMethod.includes('REFUND') ? 'refund'
          : 'use'
      return {
        id: String(row.paymentId ?? row.id ?? `tx-${page}-${idx}`),
        createdAt: String(row.payTime ?? row.time ?? new Date().toISOString()),
        type,
        amount: Math.abs(Number(row.amount ?? 0)),
      }
    })
  }, [filteredItems, page])

  const fmt = (n: number) => n.toLocaleString('ko-KR')
  const handleChargeClick = () => navigate('/payment/wallet-point/money-charge')

  return (
    <div className={styles.container}>
      {/* 상단 고정바: 모바일 UI 그대로 */}
      <header className={styles.topbar}>
        <div className={`${styles.shell} ${styles.topbarInner}`}>
          <button
            type="button"
            className={styles.backBtn}
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <h1 className={styles.pageTitle}>킷페이 내역</h1>
          <span className={styles.topbarSpacer} />
        </div>
      </header>

      {/* 본문: 모바일 UI 그대로 */}
      <main className={styles.main}>
        <div className={styles.shell}>
          {/* 잔액 카드: 웹과 동일 데이터 연동 */}
          <section className={styles.summaryCard}>
            <div className={styles.summaryLeft}>
              <div className={styles.summaryLabel}>현재 잔액</div>
              <div className={styles.summaryValue}>
                {isBalanceLoading
                  ? <span className={styles.skeleton} />
                  : `${fmt(balanceData?.availableBalance ?? 0)}원`}
              </div>
            </div>
            <div className={styles.summaryRight}>
              <Button className={styles.chargeBtn} onClick={handleChargeClick}>충전</Button>
            </div>
          </section>

          {/* 월 선택 칩: 모바일 UI 그대로 */}
          <div className={styles.filterBar}>
            <div className={styles.monthChips} role="tablist" aria-label="월 선택">
              {monthChips.map((m) => (
                <button
                  key={m.value}
                  role="tab"
                  aria-selected={month === m.value}
                  className={`${styles.chip} ${month === m.value ? styles.chipActive : ''}`}
                  onClick={() => setMonth(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* 페이지 이동 컨트롤(웹 연동 그대로 적용) */}
            <div className={styles.pager}>
              <button
                className={styles.pagerBtn}
                disabled={!historyPage || historyPage.first}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                이전
              </button>
              <span className={styles.pageInfo}>
                {(historyPage?.number ?? 0) + 1} / {Math.max(1, historyPage?.totalPages ?? 1)}
              </span>
              <button
                className={styles.pagerBtn}
                disabled={!historyPage || historyPage.last}
                onClick={() => setPage(p => p + 1)}
              >
                다음
              </button>
            </div>
          </div>

          {/* 내역: 웹과 동일 데이터 바인딩(아이템/로딩/에러) */}
          <section className={styles.historySection}>
            <WalletHistory
              month={month}
              items={viewItems}
              loading={isHistoryLoading}
              error={historyError ? '내역을 불러오지 못했어요 (서버 오류)' : null}
            />
            <div className={styles.emptyAction}>
              <Button
                onClick={() => {
                  const d = new Date(`${month}-01`)
                  d.setMonth(d.getMonth() - 1)
                  const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  setMonth(v)
                }}
              >
                지난달 내역 보기
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default WalletPointPage
