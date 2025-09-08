// 📄 src/components/payment/address/AddressForm.tsx
// - 아이폰 SE 기준 모바일 고정 레이아웃
// - 주소만 필수, 나머지는 선택
// - 연락처 인풋은 flex 고정폭 + 숫자만 허용 보강

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPortal } from 'react-dom'

import DeliveryManageModal from '@/components/payment/modal/DeliveryManageModal'

import styles from './AddressForm.module.css'

interface AddressFormProps {
  /** 상위로 유효성 변경 여부 전달 (주소만 입력되면 true) 멍 */
  onValidChange?: (isValid: boolean) => void
}

/** ✅ 폼 스키마: 주소만 필수, 나머지는 선택 멍 */
const schema = z.object({
  name: z.string().optional(),
  phonePrefix: z.enum(['010', '011', '016', '017', '018', '019']).optional(),
  phonePart1: z.string().optional(),
  phonePart2: z.string().optional(),
  address: z.string().min(1, '주소를 입력해 주세요.'),
  zipCode: z.string().optional(),
})

type AddressFormInputs = z.infer<typeof schema>

type SelectedAddressPayload = {
  address: string
  zipCode?: string
  id?: number
}

const AddressForm: React.FC<AddressFormProps> = ({ onValidChange }) => {
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
    },
  })

  // ✅ 모달 열림/닫힘 상태 멍
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ✅ 모든 값 감시 → address만 있으면 valid 처리 멍
  const watchAll = watch()
  useEffect(() => {
    const isValid = !!watchAll.address?.trim()
    onValidChange?.(!!isValid)
  }, [watchAll, onValidChange])

  // AddressForm.tsx
  useEffect(() => {
    if (!isModalOpen) return

    // 페이지 스크롤 잠금
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    // ✅ 푸터 높이 측정 → --sheet-offset 세팅
    const footer = document.getElementById('payment-cta')
    const footerH = footer?.getBoundingClientRect().height ?? 0

    // 안전 여백 + 안전영역
    const safe = 0 // env()는 JS에서 못 읽으니 CSS에서 처리
    const offset = footerH + 8 + safe

    document.documentElement.style.setProperty('--sheet-offset', `${offset}px`)

    return () => {
      html.style.overflow = prevOverflow
      document.documentElement.style.removeProperty('--sheet-offset')
    }
  }, [isModalOpen])

  // ✅ 모달에서 배송지 선택 시 address/zipCode만 세팅 멍
  const handleAddressSelect = (addr: SelectedAddressPayload) => {
    setValue('address', addr.address ?? '', { shouldValidate: true })
    setValue('zipCode', addr.zipCode ?? '', { shouldValidate: true })
    setIsModalOpen(false)
  }

  // ✅ 숫자만 허용하는 인풋 보정(사파리/안드로이드 대비) 멍
  const onlyDigits =
    (max = 4) =>
    (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget
      target.value = target.value.replace(/[^0-9]/g, '').slice(0, max)
    }

  return (
    <form className={styles['address-container']} autoComplete="on">
      {/* ───────── 상단: 배송지 관리 버튼 ───────── */}
      <div className={styles['address-tabs']}>
        <span className={styles['tabs-label']}>배송지 선택</span>
        <button
          type="button"
          className={`plain-button ${styles['tab-manage-btn']}`}
          onClick={() => setIsModalOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
        >
          배송지 관리
        </button>
      </div>
      {/* ───────── 전체화면 모달(시트) ───────── */}
      {isModalOpen &&
        createPortal(
          <div
            className={styles['modal-overlay']}
            role="dialog"
            aria-modal="true"
            onClick={() => setIsModalOpen(false)}
          >
            <div className={styles['modal-sheet']} onClick={(e) => e.stopPropagation()}>
              {/* ✅ 바깥 헤더/닫기 버튼 삭제, 내부 모달만 렌더 */}
              <DeliveryManageModal
                onClose={() => setIsModalOpen(false)}
                onSelectAddress={handleAddressSelect}
              />
            </div>
          </div>,
          document.body,
        )}
      {/* ───────── 폼: 단일 컬럼 ───────── */}
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

          {/* ✅ flex 고정폭 배치로 높이/간격 일관화 */}
          <div className={styles['phone-inputs']}>
            <select
              {...register('phonePrefix')}
              aria-label="연락처 앞자리"
              className={styles['phone-prefix']}
            >
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

          {/* 에러 라인 고정 공간 */}
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

        {/* 주소(필수) */}
        <div className={styles['form-field']}>
          <label htmlFor="address">주소 *</label>
          <div className={styles['address-row']}>
            <input
              id="address"
              type="text"
              placeholder="주소를 선택하거나 입력해 주세요"
              {...register('address')}
            />
            <button
              type="button"
              className={`plain-button ${styles['address-search-btn']}`}
              onClick={() => setIsModalOpen(true)}
            >
              주소 검색
            </button>
          </div>
          {errors.address && <p className={styles['error']}>{errors.address.message}</p>}
        </div>

        {/* 우편번호(선택) */}
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
      </div>
    </form>
  )
}

export default AddressForm
