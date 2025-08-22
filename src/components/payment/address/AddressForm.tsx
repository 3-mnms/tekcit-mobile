import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import DeliveryManageModal from '@/components/payment/modal/DeliveryManageModal'

import styles from './AddressForm.module.css'

interface AddressFormProps {
  /** 상위로 유효성 변경 여부 전달 (주소만 입력되면 true) 멍 */
  onValidChange?: (isValid: boolean) => void
}

/** 폼 스키마: 주소만 필수, 나머지는 선택 멍 */
const schema = z.object({
  name: z.string().optional(),
  phonePrefix: z.enum(['010', '011', '016', '017', '018', '019']).optional(),
  phonePart1: z.string().optional(),
  phonePart2: z.string().optional(),
  address: z.string().min(1, '주소를 입력해 주세요.'), // ✅ 유일한 필수값 멍
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const watchAll = watch()

  /** address만 채워지면 유효(true)로 상위에 전달 멍 */
  useEffect(() => {
    const isValid = !!watchAll.address?.trim()
    onValidChange?.(!!isValid)
  }, [watchAll, onValidChange])

  /** 모달에서 배송지 선택 시: address/zipCode만 주입(이름/전화는 그대로) 멍 */
  const handleAddressSelect = (addr: SelectedAddressPayload) => {
    setValue('address', addr.address ?? '', { shouldValidate: true })
    setValue('zipCode', addr.zipCode ?? '', { shouldValidate: true })
    setIsModalOpen(false)
  }

  /** 숫자만 허용하는 인풋 보정(사파리 대비) 멍 */
  const onlyDigits =
    (max = 4) =>
    (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget
      target.value = target.value.replace(/[^0-9]/g, '').slice(0, max)
    }

  return (
    // ✅ form 태그 정확히 열고, 파일 끝에서 정확히 닫습니다 멍
    <form className={styles['address-container']} autoComplete="on">
      {/* 상단 탭/관리 영역 멍 */}
      <div className={styles['address-tabs']}>
        {/* 모달 열기: 등록된 배송지 목록에서 선택 멍 */}
        <button
          type="button"
          className={`plain-button ${styles['tab-manage-btn']}`}
          onClick={() => setIsModalOpen(true)}
          aria-haspopup="dialog"             // ✅ aria - haspopup(X) → aria-haspopup(O) 멍
          aria-expanded={isModalOpen}        // ✅ aria - expanded(X) → aria-expanded(O) 멍
        >
          배송지 관리
        </button>
      </div>

      {/* 전체화면 모달 멍 */}
      {isModalOpen && (
        <div className={styles['modal-overlay']} role="dialog" aria-modal="true">
          <div className={styles['modal-sheet']}>
            {/* 모달 헤더 (모바일 상단 바) 멍 */}
            <div className={styles['modal-header']}>
              <button
                type="button"
                className={styles['modal-close']}
                onClick={() => setIsModalOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            {/* 실제 컨텐츠 멍 */}
            <div className={styles['modal-content']}>
              <DeliveryManageModal
                onClose={() => setIsModalOpen(false)}
                onSelectAddress={handleAddressSelect}
              />
            </div>
          </div>
        </div>
      )}

      {/* 폼 영역: 단일 컬럼 레이아웃 멍 */}
      <div className={styles['form-grid']}>
        {/* 받는 사람 멍 */}
        <div className={styles['form-field']}>
          <label htmlFor="name">받는 사람</label>
          <input id="name" type="text" {...register('name')} placeholder="예) 홍길동" />
          {errors.name && <p className={styles['error']}>{errors.name.message}</p>}
        </div>

        {/* 연락처 멍 */}
        <div className={styles['form-field']}>
          <label>연락처</label>

          {/* 앞자리 선택 멍 */}
          <div className={styles['phone-inputs']}>
            <div className={styles['phone-box']}>
              <select {...register('phonePrefix')} aria-label="연락처 앞자리">
                {/* ✅ '...' 제거하고 실제 옵션만 유지 멍 */}
                <option value="010">010</option>
                <option value="011">011</option>
                <option value="016">016</option>
                <option value="017">017</option>
                <option value="018">018</option>
                <option value="019">019</option>
              </select>
            </div>

            {/* 중간 4자리 멍 */}
            <div className={`${styles['phone-box']} ${styles['phone-part1']}`}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                {...register('phonePart1')}
                onInput={onlyDigits(4)}
                aria-label="연락처 중간"
              />
              <div className={styles['error-space']}>
                {errors.phonePart1 && <p className={styles['error']}>{errors.phonePart1.message}</p>}
              </div>
            </div>

            {/* 끝 4자리 멍 */}
            <div className={`${styles['phone-box']} ${styles['phone-part2']}`}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="5678"
                {...register('phonePart2')}
                onInput={onlyDigits(4)}
                aria-label="연락처 끝"
              />
              <div className={styles['error-space']}>
                {errors.phonePart2 && <p className={styles['error']}>{errors.phonePart2.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* 주소(필수) 멍 */}
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

        {/* 우편번호(선택) 멍 */}
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
    </form> // ✅ 여기서 form 닫힘 멍
  )
}

export default AddressForm
