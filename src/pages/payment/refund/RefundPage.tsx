// src/pages/payment/RefundPage.tsx
// 목적: 모바일 UI 유지 + 웹 버전 refund API 연동 동일 적용
import { useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'          // 주석: API 호출을 안전하게 관리
import { z } from 'zod'                                      // 주석: paymentId 검증용

import styles from './RefundPage.module.css'

import TransferTicketInfo from '@/components/payment/refund/RefundTicketInfo'
import Button from '@/components/common/button/Button'
import AlertModal from '@/components/common/modal/AlertModal'
import { refundPayment } from '@/shared/api/payment/refund'  // 주석: 웹과 동일한 환불 API

// 주석: paymentId 유효성 검사 스키마 (빈 문자열/공백 금지)
const PaymentIdSchema = z.string().trim().min(1, 'paymentId 누락')

const RefundPage: React.FC = () => {
  // 주석: 모달/로딩/에러 상태
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [loadingRefund, setLoadingRefund] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  const navigate = useNavigate()

  // 주석: path(:paymentId) > query(?paymentId=) > state 순서로 paymentId 확보
  const { paymentId: paymentIdFromPath } = useParams<{ paymentId: string }>()
  const location = useLocation()
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search])
  const paymentId =
    paymentIdFromPath || qs.get('paymentId') || (location.state as any)?.paymentId || ''

  // 주석: 결과 페이지로 이동 (웹/모바일 공통 규칙 유지)
  const routeToResult = useCallback(
    (ok: boolean) => {
      const q = new URLSearchParams({
        type: 'refund',
        status: ok ? 'success' : 'fail',
      }).toString()
      navigate(`/payment/result?${q}`)
    },
    [navigate]
  )

  const handleCancel = () => navigate(-1)
  const handleRefundClick = () => setIsRefundModalOpen(true)
  const handleRefundModalCancel = () => setIsRefundModalOpen(false)

  // 주석: TanStack Query로 환불 API 래핑 (웹 버전과 동일한 refundPayment 사용)
  const refundMut = useMutation({
    // 주석: mutationFn은 paymentId를 받아 refundPayment 호출
    mutationFn: async (pid: string) => {
      // 주석: 호출 전 paymentId 스키마 검증 (빈 값일 때 명확한 에러 제공)
      const validId = PaymentIdSchema.parse(pid)
      // 주석: axios 인터셉터에서 X-User-Id/Authorization 주입된다는 전제 (웹과 동일)
      const res = await refundPayment(validId)
      return res
    },
    onSuccess: (res) => {
      // 주석: 서버 표준 응답을 고려해 success 판단
      if (res?.success) {
        routeToResult(true)
      } else {
        setRefundError(res?.message || '환불 처리에 실패했습니다.')
        routeToResult(false)
      }
    },
    onError: (err: any) => {
      // 주석: 서버 메시지 혹은 기본 메시지 노출
      const serverMsg = err?.response?.data?.message
      setRefundError(serverMsg || err?.message || '환불 요청 중 오류가 발생했습니다.')
      routeToResult(false)
    },
    onSettled: () => {
      // 주석: 로딩 해제는 handleRefundConfirm에서 처리하지만, 안전망으로 둠
      setLoadingRefund(false)
    },
  })

  /** 주석: 환불 확정 → 실제 API 호출 */
  const handleRefundConfirm = async () => {
    setIsRefundModalOpen(false)
    setRefundError(null)
    setLoadingRefund(true)
    // 주석: mutateAsync로 명시적 호출 (에러는 onError에서 처리)
    try {
      await refundMut.mutateAsync(paymentId)
    } finally {
      // 주석: onSettled에서 해도 되지만, 중복으로 안전하게 한 번 더 처리
      setLoadingRefund(false)
    }
  }

  return (
    <div className={styles.page} aria-busy={loadingRefund}>
      <header className={styles.header}>
        <h1 className={styles.title}>취소 요청</h1>
        <p className={styles.subtitle}>환불 내용을 확인한 뒤 진행해 주세요.</p>
      </header>

      {/* 주석: 예매 정보 표시 컴포넌트 (UI는 그대로) */}
      <TransferTicketInfo
        title="하울의 움직이는 성"
        date="2025.09.21 (일) 오후 3시"
        ticket={2}
        price={150000}
      />

      {/* 주석: 금액 요약 섹션 (UI 그대로 유지) */}
      <section className={styles.summary} aria-label="환불 금액 요약">
        <div className={styles.summaryHead}>
          <span className={styles.badge}>요약</span>
          <span className={styles.tip}>수수료 제외 후 환불됩니다.</span>
        </div>

        <dl className={styles.list}>
          <div className={styles.row}>
            <dt className={styles.label}>최종 환불 예정 금액</dt>
            <dd className={styles.value}>100,000원</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.label}>환불 수수료</dt>
            <dd className={styles.value}>2,000원</dd>
          </div>

          <div role="separator" className={styles.divider} />

          <div className={styles.rowTotal}>
            <dt className={styles.totalLabel}>결제 금액</dt>
            <dd className={styles.totalValue}>102,000원</dd>
          </div>
        </dl>

        {/* 주석: 에러가 있다면 간단히 안내 (디자인은 유지) */}
        {refundError && (
          <p className={styles.notice} role="alert">
            {refundError}
          </p>
        )}

        <p className={styles.notice}>
          환불은 결제 수단에 따라 영업일 기준 3~5일 소요될 수 있습니다.
        </p>
      </section>

      {/* 주석: 액션 버튼 영역 (UI 그대로) */}
      <div className={styles.actions} role="group" aria-label="환불 진행">
        <Button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={handleCancel}
          disabled={loadingRefund}
        >
          환불 취소
        </Button>
        <Button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleRefundClick}
          disabled={loadingRefund || !paymentId} // 주석: paymentId 없으면 비활성화
        >
          {loadingRefund ? '처리 중…' : '환불'}
        </Button>
      </div>

      {/* 주석: 환불 확인 모달 (UI 그대로) */}
      {isRefundModalOpen && (
        <AlertModal
          title="환불 확인"
          onCancel={handleRefundModalCancel}
          onConfirm={handleRefundConfirm}
          confirmText="확인"
          cancelText="취소"
        >
          정말 환불 하시겠습니까?
        </AlertModal>
      )}
    </div>
  )
}

export default RefundPage
