// ✅ 모바일 최적화 + 범용 헤더/푸터 적용 버전 멍
// - 결제 수단: 전자지갑(킷페이) 단일만 사용 멍
// - Toss 관련 import/ref/로직 전부 제거 멍
// - 약관 동의 + 결제수단 선택 시 하단 CTA 활성화 멍

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './TransferFeePaymentPage.module.css'

// ⛳ 범용 헤더/푸터 멍
import PageHeader from '@/components/payment/header/Header'
import Footer from '@/components/payment/footer/Footer'
import footerStyles from '@/components/payment/footer/Footer.module.css'

// ⛳ 공용 UI/블록 멍
import Button from '@/components/common/button/Button'
import TransferTicketInfo from '@/components/payment/refund/RefundTicketInfo'
import TransferFeeInfo from '@/components/payment/transfer/TransferFeeInfo'
import ConfirmModal from '@/components/common/modal/AlertModal'
import PasswordInputModal from '@/components/payment/modal/PasswordInputModal'

// ⛳ 목데이터/모델 멍
import { bookingTransfer } from '@/models/payment/BookingTransfer'
import { transferFee } from '@/models/payment/TransferFee'

// ⛳ 결제 수단 컴포넌트(전자지갑) 멍
import WalletPayment from '@/components/payment/pay/WalletPayment'

// ✅ 결제수단 타입: 전자지갑 단일 멍
type Method = 'wallet' | ''

const TransferFeePaymentPage: React.FC = () => {
  // ✅ 모달/상태 멍
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false) // 지갑 결제 전 확인 모달 멍
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false) // 비밀번호 입력 모달 멍
  const [selectedMethod, setSelectedMethod] = useState<Method>('') // 'wallet' 선택 시 활성화 멍
  const [isAgreed, setIsAgreed] = useState<boolean>(false) // 약관 동의 상태 멍
  const [isPaying, setIsPaying] = useState(false) // 결제 진행 중 표시 멍

  const navigate = useNavigate()

  // ✅ 결과 페이지 이동 헬퍼 멍
  const routeToResult = useCallback(
    (ok: boolean, extra?: Record<string, string | undefined>) => {
      const params = new URLSearchParams({
        type: 'transfer-fee', // 결과 페이지에서 구분용 멍
        status: ok ? 'success' : 'fail', // 성공/실패 멍
        ...(extra ?? {}),
      })
      navigate(`/payment/result?${params.toString()}`)
    },
    [navigate],
  )

  // ✅ 결제 버튼 클릭(전자지갑 전용) 멍
  const handlePayment = async () => {
    // ── 수단 선택 + 약관 동의 + 중복 요청 방지 체크 멍
    if (selectedMethod !== 'wallet' || !isAgreed || isPaying) return
    // ── 지갑: 안내 모달 → 비밀번호 모달 흐름 멍
    setIsConfirmModalOpen(true)
  }

  // ✅ 확인 모달 → 비밀번호 모달 멍
  const handleConfirm = () => {
    setIsConfirmModalOpen(false)
    setIsPasswordModalOpen(true)
  }
  const handleCancel = () => setIsConfirmModalOpen(false)

  // ✅ 지갑 비밀번호 입력 완료 → 실제 결제 처리 후 결과 이동(목데이터) 멍
  const handlePasswordComplete = async (password: string) => {
    console.log('입력된 비밀번호:', password)
    setIsPasswordModalOpen(false)
    setIsPaying(true)
    try {
      // TODO: 실제 지갑 결제 API 연동 지점 멍
      const ok = Math.random() < 0.95 // 데모 성공 확률 멍
      const txId = Math.random().toString(36).slice(2, 10) // 데모 트랜잭션 ID 멍
      routeToResult(ok, { txId })
    } catch (e) {
      console.error(e)
      routeToResult(false)
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <>
      {/* ✅ 범용 헤더: 페이지 최상단 고정 멍 */}
      <PageHeader title="양도 수수료 결제" showBack showClose />

      {/* ✅ 본문: 푸터 고정 높이만큼 여백 확보(hasFixedFooter) 멍 */}
      <main className={styles.container}>
        {/* ✅ 티켓/양도 정보 멍 */}
        <TransferTicketInfo
          title={bookingTransfer.product.title}
          date={bookingTransfer.product.datetime}
          ticket={bookingTransfer.product.ticket}
          sender={bookingTransfer.sender}
          receiver={bookingTransfer.receiver}
        />
        {/* ✅ 결제 수단(전자지갑 단일) 멍 */}
        <section className={styles.section} aria-labelledby="pay-method">
          <h2 id="pay-method" className={styles.sectionTitle}>
            결제 수단
          </h2>

          <div className={styles.paymentMethodWrapper}>
            {/* 👉 전자지갑: 열기/닫기 토글 멍 */}
            <WalletPayment
              isOpen={selectedMethod === 'wallet'}
              onToggle={() => setSelectedMethod((prev) => (prev === 'wallet' ? '' : 'wallet'))}
            />
          </div>
        </section>
        {/* ✅ 수수료 정보 멍 */}
        <section className={styles.feeSection} aria-labelledby="fee-info">
          <TransferFeeInfo perFee={transferFee.perFee} totalFee={transferFee.totalFee} />
        </section>
        {/* ✅ 약관 동의 멍 */}
        <section className={styles.termsSection}>
          <label className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              aria-label="양도 서비스 이용약관 및 개인정보 수집·이용 동의(필수)"
            />
            <span>(필수) 양도 서비스 이용약관 및 개인정보 수집 및 이용에 동의합니다.</span>
          </label>
        </section>
        {/* ✅ 데스크톱 전용 상단 버튼(모바일은 하단 푸터 사용) 멍 */}
        <div className={styles.buttonWrapper}>
          <Button
            className="w-full h-12"
            disabled={selectedMethod !== 'wallet' || !isAgreed || isPaying}
            onClick={handlePayment}
          >
            {isPaying ? '결제 중...' : '수수료 결제하기'}
          </Button>
        </div>
      </main>

      {/* ✅ 공용 하단 고정 푸터(전자지갑 전용 로직 반영) 멍 */}
      <Footer
        prefix="총 수수료"
        amount={transferFee.totalFee}
        actionLabel={isPaying ? '결제 중...' : '결제하기'}
        onAction={handlePayment}
        disabled={selectedMethod !== 'wallet' || !isAgreed || isPaying}
        ariaLabel="결제 작업 바"
      />

      {isConfirmModalOpen && (
        <ConfirmModal onConfirm={handleConfirm} onCancel={handleCancel}>
          양도 수수료 결제를 진행하시겠습니까?
        </ConfirmModal>
      )}
      {isPasswordModalOpen && (
        <PasswordInputModal
          onComplete={handlePasswordComplete}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </>
  )
}

export default TransferFeePaymentPage
