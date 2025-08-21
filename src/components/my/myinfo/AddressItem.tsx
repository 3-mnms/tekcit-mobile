import React from 'react'
import styles from './AddressItem.module.css'

interface AddressItemProps {
  label: string
  isDefault?: boolean
  onClick?: () => void
}

const AddressItem: React.FC<AddressItemProps> = ({ label, isDefault = false, onClick }) => {
  return (
    <div className={styles.item} onClick={onClick}>
      <div className={styles.left}>
        <span>{label}</span>
        {isDefault && <span className={styles.badge}>기본 배송지</span>}
      </div>
      <span className={styles.arrow}>›</span>
    </div>
  )
}

export default AddressItem
