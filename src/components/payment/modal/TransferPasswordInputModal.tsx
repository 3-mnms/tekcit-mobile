// src/components/payment/modal/PasswordInputModal.tsx
import { useState } from 'react'
import styles from './PasswordInputModal.module.css'
import DotDisplay from '@components/payment/password/DotDisplay'
import Keypad from '@components/payment/password/Keypad'

interface PasswordInputModalProps {
  onClose: () => void
  onComplete: (password: string) => void
  userName?: string
  amount: number
  paymentId: string
  userId: number             // 헤더용 prop은 그대로 두되 사용하지 않음
}

const PasswordInputModal: React.FC<PasswordInputModalProps> = ({
  onComplete, onClose, userName,
}) => {
  const [password, setPassword] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleKeyPress = async (raw: string) => {
    // 1) 문자열 정규화: 양끝 공백 제거 + 모든 공백 제거본/대문자본 준비
    const v = raw.trim()
    const noSpace = v.replace(/\s+/g, '')
    const upper = noSpace.toUpperCase()

    // 2) 기능 키 판별: 전체삭제/백스페이스를 널널하게 인식
    const isClearAll =
      noSpace === '전체삭제' || upper === 'AC' || upper === 'CLEAR' || upper === 'C'
    const isBackspace =
      v === '⌫' || v === '삭제' || upper === 'DEL' || upper === 'DELETE' || upper === 'BACK' || upper === 'BACKSPACE'

    // 3) 제출 중에도 전체삭제/백스페이스는 동작하도록 예외 허용
    if (isSubmitting && !isClearAll && !isBackspace) return

    // 4) 전체삭제 처리
    if (isClearAll) {
      setPassword('')
      setIsError(false)
      return
    }

    // 5) 백스페이스 처리
    if (isBackspace) {
      setPassword(prev => prev.slice(0, -1))
      setIsError(false)
      return
    }

    // 6) 숫자 키만 허용
    if (!/^\d$/.test(v) || password.length >= 6) return

    // 7) 입력 누적 및 6자리 완료 시 콜백 호출
    const next = password + v
    setPassword(next)
    setIsError(false)

    if (next.length === 6) {
      setIsSubmitting(true)
      setTimeout(() => {
        onComplete(next)
        setPassword('')
        setIsError(false)
        setIsSubmitting(false)
      }, 120)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="비밀번호 입력 닫기"
          disabled={isSubmitting}
        >
          ✕
        </button>

        <div className={styles.top}>
          {userName && <p className={styles.label}>{userName}님의</p>}
          <h2 className={styles.title}>비밀번호를 입력하세요</h2>
          <DotDisplay length={password.length} />
          {isError && <p className={styles.errorMessage}>비밀번호가 일치하지 않습니다.</p>}
        </div>

        <div className={styles.keypadWrapper}>
          <Keypad onPress={handleKeyPress} disabled={isSubmitting} />
        </div>
      </div>
    </div>
  )
}

export default PasswordInputModal
