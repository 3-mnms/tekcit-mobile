// ✅ 배송지 선택 모달(모바일 최적화, 목 데이터 버전) 멍
// - name/phone까지 포함된 AddressItem 렌더링 멍

import { useEffect, useRef, useState } from 'react'
import AddressItem from '@/components/payment/address/AddressItem'
import Header from '@components/payment/delivery/DeliveryHeader'
import Footer from '@components/payment/delivery/DeliveryFooter'

import styles from './DeliveryManageModal.module.css'

// ✅ 모달 컴포넌트에 전달할 props 타입 멍
interface DeliveryManageModalProps {
  onClose?: () => void
  onSelectAddress?: (addr: {
    id?: number
    name: string
    phone: string
    address: string
    zipCode?: string
  }) => void
  closeOnBackdrop?: boolean
}

// ✅ 목 데이터 타입 멍
type MockAddress = {
  id: number
  name: string
  phone: string
  address: string
  zipCode?: string
  isDefault?: boolean
}

// ✅ 하드코딩 목 데이터 멍
const MOCK_ADDRESSES: MockAddress[] = [
  {
    id: 1,
    name: '홍길동',
    phone: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123',
    zipCode: '06236',
    isDefault: true,
  },
  {
    id: 2,
    name: '김철수',
    phone: '010-2345-6789',
    address: '경기도 성남시 분당구 판교역로 45',
    zipCode: '13561',
  },
  {
    id: 3,
    name: '이영희',
    phone: '010-3456-7890',
    address: '부산광역시 해운대구 센텀중앙로 97',
    zipCode: '48058',
  },
]

const DeliveryManageModal: React.FC<DeliveryManageModalProps> = ({
  onClose,
  onSelectAddress,
  closeOnBackdrop = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)

  // 모달 열릴 때 바디 스크롤 막기
  useEffect(() => {
    const prev = document.body.style.overflowY
    document.body.style.overflowY = 'hidden'
    return () => {
      document.body.style.overflowY = prev
    }
  }, [])

  // 선택된 아이템
  const selected = selectedIndex !== null ? MOCK_ADDRESSES[selectedIndex] : undefined

  // 하단 버튼 클릭
  const handleSelectButton = () => {
    if (!selected) return
    onSelectAddress?.({
      id: selected.id,
      name: selected.name,
      phone: selected.phone,
      address: selected.address,
      zipCode: selected.zipCode,
    })
    onClose?.()
  }

  // 배경 클릭 시 닫기
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!closeOnBackdrop) return
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose?.()
    }
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="배송지 선택"
      onMouseDown={handleBackdropClick}
    >
      <div className={styles.sheet} ref={sheetRef}>
        <div className={styles.headerSticky}>
          <Header onClose={() => onClose?.()} />
        </div>

        <div className={styles.body}>
          {MOCK_ADDRESSES.length === 0 ? (
            <div className={styles.emptyBox}>
              <p className={styles.info}>등록된 배송지가 없습니다.</p>
            </div>
          ) : (
            <ul className={styles.addressList} aria-label="배송지 목록">
              {MOCK_ADDRESSES.map((addr, idx) => {
                const isSelected = selectedIndex === idx
                return (
                  <li key={addr.id}>
                    <button
                      type="button"
                      className={`${styles.cardButton} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setSelectedIndex(idx)}
                      aria-pressed={isSelected}
                    >
                      <AddressItem
                        name={addr.name}
                        phone={addr.phone}
                        address={addr.address}
                        zipCode={addr.zipCode}
                        isDefault={!!addr.isDefault}
                        selected={isSelected}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className={styles.footerSticky}>
          <Footer onSelect={handleSelectButton} />
        </div>
      </div>
    </div>
  )
}

export default DeliveryManageModal
