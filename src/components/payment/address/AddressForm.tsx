// src/pages/payment/.../AddressForm.tsx
import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import AddressSearchModal from '@/components/auth/signup/AddressSearchModal'
import DeliveryManageModal from '@/components/payment/modal/DeliveryManageModal'

import styles from './AddressForm.module.css'

interface AddressFormProps {
  onValidChange?: (isValid: boolean) => void
}

const schema = z.object({
  name: z.string().optional(),
  phonePrefix: z.enum(['010', '011', '016', '017', '018', '019']).optional(),
  phonePart1: z.string().optional(),
  phonePart2: z.string().optional(),
  address: z.string().min(1, '주소를 입력해 주세요.'),
  zipCode: z.string().optional(),
  addressDetail: z.string().optional(),
})

type AddressFormInputs = z.infer<typeof schema>

// 배송지 관리 모달에서 내려주는 페이로드(웹과 동일 컨벤션 가정)
type SelectedAddressPayload = {
  name?: string
  phone?: string
  address: string
  zipCode?: string
  id?: number
}

// phonePrefix 정확한 타입 별칭
type PhonePrefix = NonNullable<AddressFormInputs['phonePrefix']>

const splitKoreanPhone = (raw?: string): {
  prefix?: PhonePrefix
  part1?: string
  part2?: string
} => {
  if (!raw) return {}
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 9) return {}
  const pfx = digits.slice(0, 3) as PhonePrefix
  if (digits.length === 11) return { prefix: pfx, part1: digits.slice(3, 7), part2: digits.slice(7, 11) }
  if (digits.length === 10) return { prefix: pfx, part1: digits.slice(3, 6), part2: digits.slice(6, 10) }
  return { prefix: pfx, part1: digits.slice(3, 7), part2: digits.slice(7) }
}

const AddressForm: React.FC<AddressFormProps> = ({ onValidChange }) => {
  // RHF 초기화
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormInputs>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      phonePrefix: '010',
      phonePart1: '',
      phonePart2: '',
      address: '',
      zipCode: '',
      addressDetail: '',
    },
  })

  // 모달 상태: 배송지 관리 / 주소 검색을 분리
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false) // 다음 주소 검색

  // 모든 값 감시 → 주소만 있으면 valid
  const watchAll = watch()
  useEffect(() => {
    const isValid = !!watchAll.address?.trim()
    onValidChange?.(isValid)
  }, [watchAll, onValidChange])

  // 숫자만 허용하는 인풋 보정
  const onlyDigits =
    (max = 4) =>
      (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.currentTarget
        target.value = target.value.replace(/[^0-9]/g, '').slice(0, max)
      }

  // 전체 화면 시트 모달 열릴 때 스크롤 잠금 + 안전 오프셋 적용
  useEffect(() => {
    const opened = isManageOpen || isSearchOpen
    if (!opened) return

    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    const footer = document.getElementById('payment-cta')
    const footerH = footer?.getBoundingClientRect().height ?? 0
    const offset = footerH + 8 // 여백 8px
    document.documentElement.style.setProperty('--sheet-offset', `${offset}px`)

    return () => {
      html.style.overflow = prevOverflow
      document.documentElement.style.removeProperty('--sheet-offset')
    }
  }, [isManageOpen, isSearchOpen])

  // 주소 검색(다음/카카오) 완료 → address/zipCode 주입
  const handleAddressCompleteFromDaum = useCallback(
    (data: { zipCode: string; address: string }) => {
      setValue('address', data.address ?? '', { shouldValidate: true })
      setValue('zipCode', data.zipCode ?? '', { shouldValidate: true })
      setIsSearchOpen(false)
    },
    [setValue]
  )

  // 배송지 관리에서 선택 → address/zipCode + 가능하면 name/phone도 주입
  const handleAddressSelectFromManage = useCallback(
    (addr: SelectedAddressPayload) => {
      setValue('address', addr.address ?? '', { shouldValidate: true })
      setValue('zipCode', addr.zipCode ?? '', { shouldValidate: true })

      if (addr.name) setValue('name', addr.name, { shouldValidate: false })
      if (addr.phone) {
        const { prefix, part1, part2 } = splitKoreanPhone(addr.phone)
        if (prefix) setValue('phonePrefix', prefix, { shouldValidate: false })
        if (part1 !== undefined) setValue('phonePart1', part1, { shouldValidate: false })
        if (part2 !== undefined) setValue('phonePart2', part2, { shouldValidate: false })
      }

      setIsManageOpen(false)
    },
    [setValue]
  )

  return (
    <form className={styles['address-container']} autoComplete="on">
      {/* 상단: 배송지 관리/주소 검색 버튼(모바일 UI 유지) */}
      <div className={styles['address-tabs']}>
        <span className={styles['tabs-label']}>배송지 선택</span>
        <div className={styles['tabs-actions']}>
          <button
            type="button"
            className={`plain-button ${styles['tab-manage-btn']}`}
            onClick={() => setIsManageOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isManageOpen}
          >
            배송지 관리
          </button>
        </div>
      </div>

      {/* 배송지 관리 모달(풀스크린 시트) */}
      {isManageOpen &&
        createPortal(
          <div
            className={styles['modal-overlay']}
            role="dialog"
            aria-modal="true"
            onClick={() => setIsManageOpen(false)}
          >
            <div className={styles['modal-sheet']} onClick={(e) => e.stopPropagation()}>
              <DeliveryManageModal
                onClose={() => setIsManageOpen(false)}
                onSelectAddress={handleAddressSelectFromManage}
              />
            </div>
          </div>,
          document.body
        )}

      {/* 주소 검색 모달(다음/카카오) */}
      {isSearchOpen &&
        createPortal(
          <div
            className={styles['modal-overlay']}
            role="dialog"
            aria-modal="true"
            onClick={() => setIsSearchOpen(false)}
          >
            <div className={styles['modal-sheet']} onClick={(e) => e.stopPropagation()}>
              <AddressSearchModal
                onComplete={handleAddressCompleteFromDaum}
                onClose={() => setIsSearchOpen(false)}
              />
            </div>
          </div>,
          document.body
        )}

      {/* 폼 본문: 모바일 단일 컬럼 UI 유지 */}
      <div className={styles['form-grid']}>
        {/* 받는 사람 */}
        <div className={styles['form-field']}>
          <label htmlFor="name">받는 사람</label>
          <input id="name" type="text" {...register('name')} placeholder="예) 홍길동" />
          {errors.name && <p className={styles['error']}>{errors.name.message}</p>}
        </div>

        {/* 연락처 */}
        <div className={styles['form-field']}>
          <label>연락처</label>
          <div className={styles['phone-inputs']}>
            <select {...register('phonePrefix')} aria-label="연락처 앞자리" className={styles['phone-prefix']}>
              <option value="010">010</option>
              <option value="011">011</option>
              <option value="016">016</option>
              <option value="017">017</option>
              <option value="018">018</option>
              <option value="019">019</option>
            </select>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              {...register('phonePart1')}
              onInput={onlyDigits(4)}
              aria-label="연락처 중간"
              className={styles['phone-mid']}
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="5678"
              {...register('phonePart2')}
              onInput={onlyDigits(4)}
              aria-label="연락처 끝"
              className={styles['phone-end']}
            />
          </div>

          <div className={styles['error-space']}>
            {(errors.phonePrefix || errors.phonePart1 || errors.phonePart2) && (
              <p className={styles['error']}>
                {errors.phonePrefix?.message ||
                  errors.phonePart1?.message ||
                  errors.phonePart2?.message}
              </p>
            )}
          </div>
        </div>

        {/* 주소(필수) + 우편번호/상세주소(선택) */}
        <div className={styles['form-field']}>
          <div>
            <label className={styles['address-text']}>주소 *</label>
            <button
              type="button"
              className={`${styles['btn']} ${styles['address-search-btn']}`}
              onClick={() => setIsSearchOpen(true)}
            >
              주소 검색
            </button>
          </div>
          <div className={styles['address-row']}>
            <input
              id="address"
              type="text"
              placeholder="주소를 선택하거나 입력해 주세요"
              {...register('address')}
            />
          </div>
          {errors.address && <p className={styles['error']}>{errors.address.message}</p>}
        </div>

        <div className={styles['form-field']}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="우편번호 (선택)"
            {...register('zipCode')}
            onInput={onlyDigits(6)}
          />
          {errors.zipCode && <p className={styles['error']}>{errors.zipCode.message}</p>}
        </div>

        <div className={styles['form-field']}>
          <input
            type="text"
            placeholder="상세 주소 (동/호수 등)"
            {...register('addressDetail')}
          />
          {errors.addressDetail && <p className={styles['error']}>{errors.addressDetail.message}</p>}
        </div>
      </div>
      
      {isSearchOpen && (
        <AddressSearchModal
          onComplete={handleAddressCompleteFromDaum}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </form>
  )
}

export default AddressForm
