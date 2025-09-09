import React from 'react';
import styles from './BookingProgress.module.css';

type Props = {
  /** 1부터 시작(1,2,3). 현재 단계 */
  current: 1 | 2 | 3;
  /** 단계 라벨 (기본값 제공) */
  steps?: [string, string, string] | string[];
  /** 접근성 라벨 */
  ariaLabel?: string;
  /** 외부에서 여백 등 커스터마이징 용 */
  className?: string;
};

const DEFAULT_STEPS: [string, string, string] = [
  '날짜/시간/매수',
  '수령방법/주문자 확인',
  '결제',
];

const BookingProgress: React.FC<Props> = ({
  current,
  steps = DEFAULT_STEPS,
  ariaLabel = '예매 단계',
  className = '',
}) => {
  return (
    <header className={`${styles.progressBar} ${className}`} aria-label={ariaLabel}>
      <ol className={styles.stepper}>
        {steps.map((label, idx) => {
          const isActive = current === idx + 1;
          return (
            <li key={idx} className={`${styles.step} ${isActive ? styles.active : ''}`}>
              <span className={styles.bullet} aria-hidden="true" />
              <span className={styles.label}>{label}</span>
            </li>
          );
        })}
      </ol>
    </header>
  );
};

export default BookingProgress;
