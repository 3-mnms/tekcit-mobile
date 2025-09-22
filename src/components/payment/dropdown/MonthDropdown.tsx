// src/components/payment/dropdown/MonthDropdown.tsx

import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import styles from './MonthDropdown.module.css'

/** YYYY-MM 형식 스키마 */
const MonthSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM 형식이어야 합니다.'),
})

export type MonthDropdownProps = {
  value: string            // 예: '2025-09'
  onChange: (v: string) => void
  months?: number          // 최근 개월 수
  disabled?: boolean
  label?: string
  id?: string
}

export default function MonthDropdown({
  value,
  onChange,
  months = 6,
  disabled = false,
  id = 'month-select',
}: MonthDropdownProps) {
  // 폼 초기화: 외부 value를 초기값으로 사용
  const { control, setValue, watch } = useForm<z.infer<typeof MonthSchema>>({
    resolver: zodResolver(MonthSchema),
    defaultValues: { month: value },
    mode: 'onChange',
  })

  // 외부 value가 바뀌면 폼 값도 동기화
  useEffect(() => {
    setValue('month', value, { shouldValidate: true, shouldDirty: false })
  }, [value, setValue])

  // 최근 N개월 옵션 생성 (value는 YYYY-MM, 라벨은 '9월')
  const options = useMemo(() => {
    return Array.from({ length: months }).map((_, i) => {
      const d = new Date()
      d.setDate(1)               // 월 말 이슈 방지
      d.setMonth(d.getMonth() - i)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${d.getMonth() + 1}월`
      return { value: ym, label }
    })
  }, [months])

  // 폼 값 구독 → 외부에 반영
  const current = watch('month')
  useEffect(() => {
    if (current && current !== value) onChange(current)
  }, [current, value, onChange])

  return (
    // ▼ 화살표 기준이 되는 래퍼에 클래스 지정
    <div className={styles.selectWrap}>
      <Controller
        name="month"
        control={control}
        render={({ field }) => (
          <select
            id={id}
            className={styles.select}
            disabled={disabled}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            aria-label="월 선택"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      />
    </div>
  )
}

