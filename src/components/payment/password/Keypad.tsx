import React, { useEffect, useState } from 'react'
import styles from './Keypad.module.css'

interface KeypadProps {
  onPress: (value: string) => void
  disabled?: boolean // 비활성화 플래그 추가(모달에서 넘겨줌)
}

const Keypad: React.FC<KeypadProps> = ({ onPress, disabled = false }) => {
  const [shuffledNumbers, setShuffledNumbers] = useState<number[]>([])

  // 숫자 섞기
  const shuffleArray = (array: number[]) =>
    array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)

  // 마운트 시 0~9 랜덤 배열 생성
  useEffect(() => {
    setShuffledNumbers(shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
  }, [])

  return (
    <div className={styles.keypad} aria-label="숫자 키패드">
      {shuffledNumbers.map((num, index) => (
        <button
          key={index}
          className={styles.key}
          onClick={() => onPress(num.toString())}
          disabled={disabled}                         // 비활성화 연동
          aria-label={`${num} 입력`}
        >
          {num}
        </button>
      ))}

      {/* 삭제: 화면엔 ⌫, 실제 전달 값은 '삭제'로 통일 */}
      <button
        className={styles.key}
        onClick={() => onPress('삭제')}
        disabled={disabled}
        aria-label="삭제"
        title="삭제"
      >
        ⌫
      </button>

      {/* 전체삭제는 그대로 유지 */}
      <button
        className={`${styles.key} ${styles.special}`}
        onClick={() => onPress('전체삭제')}
        disabled={disabled}
        aria-label="전체삭제"
        title="전체삭제"
      >
        전체 삭제
      </button>
    </div>
  )
}

export default Keypad
