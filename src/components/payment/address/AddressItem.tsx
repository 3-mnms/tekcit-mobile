// ✅ 개별 주소 카드 컴포넌트 멍
// - 공통 Button 제거, HTML button 태그로 직접 스타일링 멍
// - 수령인 + 전화번호 + 주소 + 기본 배송지 뱃지 표시 멍

import styles from './AddressItem.module.css'

export interface AddressItemProps {
  name: string // 수령인 멍
  phone: string // 전화번호 멍
  address: string // 주소 멍
  zipCode?: string // 우편번호 멍
  isDefault: boolean
  selected?: boolean
  onClick?: () => void
}

const AddressItem = ({
  name,
  phone,
  address,
  zipCode,
  isDefault,
  selected = false,
  onClick,
}: AddressItemProps) => {
  const line = `${zipCode ? `[${zipCode}] ` : ''}${address}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.addressItem} ${selected ? styles.selected : ''}`}
    >
      <div className={styles.addressInfo}>
        {/* 1행: 수령인 + 전화번호 */}
        <div className={styles.userRow}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userPhone}>{phone}</span>
        </div>

        {/* 2행: 주소 + 기본 배송지 뱃지 */}
        <div className={styles.addressRow}>
          <p className={styles.addressText}>{line}</p>
          {isDefault && <span className={styles.defaultLabel}>기본</span>}
        </div>
      </div>
    </button>
  )
}

export default AddressItem
