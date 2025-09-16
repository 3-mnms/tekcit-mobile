import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DaumPostcodeEmbed, { type Address } from 'react-daum-postcode';
import DeliveryManageModal from '@/components/payment/modal/DeliveryManageModal';

import styles from './AddressForm.module.css';

interface AddressFormProps {
  onValidChange?: (isValid: boolean) => void;
}

// 폼 스키마: 주소만 필수
const schema = z.object({
  name: z.string().optional(),
  phonePrefix: z.enum(['010', '011', '016', '017', '018', '019']).optional(),
  phonePart1: z.string().optional(),
  phonePart2: z.string().optional(),
  address: z.string().min(1, '주소를 입력해 주세요.'),
  zipCode: z.string().optional(),
  addressDetail: z.string().optional(),
});

type AddressFormInputs = z.infer<typeof schema>;
type SelectedAddressPayload = {
  name?: string;
  phone?: string;
  address: string;
  zipCode?: string;
  id?: number;
};
type PhonePrefix = NonNullable<AddressFormInputs['phonePrefix']>;

// 휴대폰 번호 010-1234-5678 포맷 분리 유틸
const splitKoreanPhone = (raw?: string): {
  prefix?: PhonePrefix;
  part1?: string;
  part2?: string;
} => {
  if (!raw) return {};
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return {};
  const pfx = digits.slice(0, 3) as PhonePrefix;
  if (digits.length === 11) return { prefix: pfx, part1: digits.slice(3, 7), part2: digits.slice(7, 11) };
  if (digits.length === 10) return { prefix: pfx, part1: digits.slice(3, 6), part2: digits.slice(6, 10) };
  return { prefix: pfx, part1: digits.slice(3, 7), part2: digits.slice(7) };
};

// 모달: 헤더/바디 분리해 겹침 제거 + 모든 스타일은 CSS 모듈로 이동
const AddressSearchModal = ({
  onComplete,
  onClose,
}: {
  onComplete: (data: { zipCode: string; address: string }) => void;
  onClose: () => void;
}) => {
  // 다음 우편번호 완료 콜백
  const handleComplete = (data: Address) => {
    onComplete({
      zipCode: data.zonecode,
      address: data.roadAddress || data.jibunAddress,
    });
    onClose();
  };

  return (
    <div
      className={styles['modal-overlay']}
      role="dialog"
      aria-modal="true"
      onClick={onClose}              // 바깥(오버레이) 클릭 시 닫기
    >
      <div
        className={`${styles['modal-sheet']} ${styles['search-sheet']}`}
        onClick={(e) => e.stopPropagation()} // 내부 클릭 버블링 방지
      >
        {/* 헤더: 닫기 버튼을 임베드 외부에 둬서 클릭 충돌 방지 */}
        <div className={styles['search-header']}>
          <button
            type="button"
            onClick={onClose}
            className={styles['search-close']}
          >
            X
          </button>
        </div>

        {/* 바디: DaumPostcodeEmbed를 남은 영역에 꽉 채움 */}
        <div className={styles['search-body']}>
          <DaumPostcodeEmbed
            onComplete={handleComplete}
            autoClose={true}
            style={{ width: '100%', height: '100%' }} // 라이브러리 자체 props는 유지
          />
        </div>
      </div>
    </div>
  );
};

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
      addressDetail: '',
    },
  });

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 상위로 유효성 변경 알림
  const watchAll = watch();
  useEffect(() => {
    const isValid = !!watchAll.address?.trim();
    onValidChange?.(isValid);
  }, [watchAll, onValidChange]);

  // 숫자만 입력되게 제한
  const onlyDigits =
    (max = 4) =>
      (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.currentTarget;
        target.value = target.value.replace(/[^0-9]/g, '').slice(0, max);
      };

  // 바텀 CTA와 겹치지 않도록 시트 오프셋 관리
  useEffect(() => {
    const opened = isManageOpen || isSearchOpen;
    if (!opened) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const footer = document.getElementById('payment-cta');
    const footerH = footer?.getBoundingClientRect().height ?? 0;
    const offset = footerH + 8;
    document.documentElement.style.setProperty('--sheet-offset', `${offset}px`);

    return () => {
      html.style.overflow = prevOverflow;
      document.documentElement.style.removeProperty('--sheet-offset');
    };
  }, [isManageOpen, isSearchOpen]);

  // 다음 주소 검색 완료 핸들러
  const handleAddressCompleteFromDaum = useCallback(
    (data: { zipCode: string; address: string }) => {
      setValue('address', data.address ?? '', { shouldValidate: true });
      setValue('zipCode', data.zipCode ?? '', { shouldValidate: true });
      setIsSearchOpen(false);
    },
    [setValue]
  );

  // 저장된 주소 선택 핸들러
  const handleAddressSelectFromManage = useCallback(
    (addr: SelectedAddressPayload) => {
      setValue('address', addr.address ?? '', { shouldValidate: true });
      setValue('zipCode', addr.zipCode ?? '', { shouldValidate: true });

      if (addr.name) setValue('name', addr.name, { shouldValidate: false });
      if (addr.phone) {
        const { prefix, part1, part2 } = splitKoreanPhone(addr.phone);
        if (prefix) setValue('phonePrefix', prefix, { shouldValidate: false });
        if (part1 !== undefined) setValue('phonePart1', part1, { shouldValidate: false });
        if (part2 !== undefined) setValue('phonePart2', part2, { shouldValidate: false });
      }

      setIsManageOpen(false);
    },
    [setValue]
  );

  return (
    <form className={styles['address-container']} autoComplete="on">
      {/* 필드 그룹 */}
      <div className={styles['form-grid']}>

        <div className={styles['address-tabs']}>
          <span className={styles['tabs-label']}>배송지</span>
          <button
            type="button"
            className={styles['tab-manage-btn']}
            onClick={() => setIsManageOpen(true)}
          >
            배송지 선택
          </button>
        </div>

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

        {/* 주소 */}
        <div className={styles['form-field']}>
          <div className={styles['address-header']}>
            <label className={styles['address-text']}>주소 *</label>
          </div>
        <div className={styles['address-row']}>
          <input
            id="address"
            type="text"
            placeholder="주소를 선택하거나 입력해 주세요"
            {...register('address')}
            className={styles['address-input']}
          />
          <button
            type="button"
            className={`${styles['btn']} ${styles['address-search-btn']}`}
            onClick={() => setIsSearchOpen(true)}
          >
            주소 검색
          </button>
        </div>
        {errors.address && <p className={styles['error']}>{errors.address.message}</p>}
      </div>

      {/* 우편번호 */}
      <div className={styles['form-field']}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="우편번호"
          {...register('zipCode')}
          onInput={onlyDigits(6)}
        />
        {errors.zipCode && <p className={styles['error']}>{errors.zipCode.message}</p>}
      </div>

      {/* 상세 주소 */}
      <div className={styles['form-field']}>
        <input
          type="text"
          placeholder="상세 주소 (동/호수 등)"
          {...register('addressDetail')}
        />
        {errors.addressDetail && <p className={styles['error']}>{errors.addressDetail.message}</p>}
      </div>
    </div>

      {/* 주소 관리 모달 */ }
  {
    isManageOpen &&
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
      )
  }

  {/* 주소 검색 모달 */ }
  {
    isSearchOpen && (
      <AddressSearchModal
        onComplete={handleAddressCompleteFromDaum}
        onClose={() => setIsSearchOpen(false)}
      />
    )
  }
    </form >
  );
};

export default AddressForm;
