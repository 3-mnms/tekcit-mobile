// ✅ 양도 수수료 요약 블록(모바일 퍼스트) 멍
// - perFee: 1건(또는 1매) 당 수수료 멍
// - totalFee: 총 결제 수수료 멍
// - className: 외부에서 여백/정렬을 커스터마이즈할 수 있게 확장 포인트 제공 멍

import React from 'react'
import styles from './TransferFeeInfo.module.css'

interface TransferFeeInfoProps {
  perFee: number                           // 1건(또는 1매)당 수수료 금액(원) 멍
  totalFee: number                         // 총 결제 수수료(원) 멍
  className?: string                       // (옵션) 외부에서 스타일 확장 멍
}

// ✅ 원화 포맷(소수점 없이) 유틸 멍
const asKRW = (n: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n)

const TransferFeeInfo: React.FC<TransferFeeInfoProps> = ({ perFee, totalFee, className }) => {
  return (
    // ⛳ 설명 목록(dL)로 라벨/값 쌍을 시맨틱하게 표현 멍
    <section className={`${styles.feeBox} ${className ?? ''}`} aria-labelledby="transfer-fee-summary">
      <h2 id="transfer-fee-summary" className={styles.srOnly}>양도 수수료 요약</h2>

      <dl className={styles.feeList}>
        {/* 1건당 수수료 멍 */}
        <div className={styles.feeRow}>
          <dt className={styles.feeLabel}>수수료 금액</dt>
          <dd className={styles.feeValue}>{asKRW(perFee)}</dd>
        </div>

        {/* 총 결제 수수료 멍 */}
        <div className={`${styles.feeRow} ${styles.totalRow}`} aria-live="polite">
          <dt className={styles.feeLabel}>총 수수료 결제 금액</dt>
          <dd className={styles.totalValue}>{asKRW(totalFee)}</dd>
        </div>
      </dl>
    </section>
  )
}

export default TransferFeeInfo
