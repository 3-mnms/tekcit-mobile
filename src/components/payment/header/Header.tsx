// ✅ 범용 페이지 헤더 컴포넌트 (공용)
// - title: 중앙 타이틀
// - showBack / showClose: 좌/우 아이콘 표시 여부
// - leftSlot / rightSlot: 슬롯으로 추가 액션 주입
// - onBack / onClose: 콜백 없으면 기본 동작(fallback)

import React from 'react'
import styles from './Header.module.css'

interface PageHeaderProps {
  title?: string                           // 중앙 타이틀 텍스트
  showBack?: boolean                       // 뒤로가기 버튼 노출 여부
  showClose?: boolean                      // 닫기 버튼 노출 여부
  leftSlot?: React.ReactNode               // 좌측 슬롯(아이콘/버튼 등)
  rightSlot?: React.ReactNode              // 우측 슬롯(아이콘/버튼 등)
  onBack?: () => void                      // 뒤로가기 콜백
  onClose?: () => void                     // 닫기 콜백
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title = '',
  showBack = true,
  showClose = true,
  leftSlot,
  rightSlot,
  onBack,
  onClose,
}) => {
  // ⏪ 기본 뒤로가기 동작(콜백 없으면 history → /)
  const handleBack = () => {
    if (onBack) return onBack()
    if (window.history.length > 1) window.history.back()
    else window.location.assign('/')
  }

  // ❌ 기본 닫기 동작(콜백 없으면 /)
  const handleClose = () => {
    if (onClose) return onClose()
    window.location.assign('/')
  }

  return (
    <header className={styles.header} role="banner" aria-label="페이지 헤더">
      <div className={styles.leftSlot}>
        {showBack && (
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="뒤로 가기"
            onClick={handleBack}
          >
            ‹
          </button>
        )}
        {leftSlot}
      </div>

      <h1 className={styles.title} aria-live="polite">{title}</h1>

      <div className={styles.rightSlot}>
        {rightSlot}
        {showClose && (
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="닫기"
            onClick={handleClose}
          >
            ×
          </button>
        )}
      </div>
    </header>
  )
}

export default PageHeader
