// src/pages/my/myInfo/edit/EditInfoPage.tsx  (경로는 맞춰서 사용해줘!)
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import MyHeader from '@/components/my/hedaer/MyHeader'
import Button from '@/components/common/button/Button'
import Input from '@/components/common/input/Input'
import styles from './EditInfoPage.module.css'
import Spinner from '@/components/common/spinner/Spinner'
import { isUser, type UpdateUserRequestDTO } from '@/models/my/userTypes'
import { useMyPageUserQuery, useUpdateUserMutation } from '@/models/my/useMyPage'
import { FaUser, FaPhone, FaIdCard } from 'react-icons/fa'

const schema = z.object({
  name: z.string().min(1, '이름은 필수입니다.'),
  phone: z
    .string()
    .regex(/^01[016789]-\d{3,4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678'),
  residentFront: z
    .string()
    .regex(/^\d{6}$/, '앞자리는 6자리 숫자입니다. 예: YYMMDD'),
  residentBack: z
    .string()
    .regex(/^[1-4]$/, '뒷자리는 성별코드 1자리(1~4)입니다.'),
})

type FormValues = z.infer<typeof schema>

const EditInfoPage: React.FC = () => {
  const nav = useNavigate()
  const { data, isLoading, isError } = useMyPageUserQuery()
  const { mutateAsync, isPending } = useUpdateUserMutation()

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', residentFront: '', residentBack: '' },
  })

  React.useEffect(() => {
    if (!data) return
    const resident = isUser(data) ? (data.residentNum ?? '') : ''
    const [front, back] = resident.split('-')
    reset({
      name: data.name ?? '',
      phone: data.phone ?? '',
      residentFront: /^\d{6}$/.test(front ?? '') ? front! : '',
      residentBack: /^[1-4]$/.test(back ?? '') ? back! : '',
    })
  }, [data, reset])

  const onSubmit = async (vals: FormValues) => {
    const payload: UpdateUserRequestDTO = {
      name: vals.name,
      phone: vals.phone,
      residentNum: `${vals.residentFront}-${vals.residentBack}`,
    }
    try {
      await mutateAsync(payload)
      alert('저장되었습니다.')
    } catch (err) {
      console.error('[EditInfo] update failed:', err)
      alert('저장 중 오류가 발생했어요.')
    }
  }
  return (
    <section className={styles.page}>
      <MyHeader title="정보 수정" />

      <div className={styles.body}>
        {isLoading ? (
          <Spinner />
        ) : isError || !data ? (
          <div className={styles.card}>불러오기에 실패했어요.</div>
        ) : (
          <form className={styles.card} onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={`${styles.formGrid} ${styles.compact}`}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    label={
                      <span className={styles.labelWithIcon}>
                        <FaUser className={styles.labelIcon} aria-hidden />
                        이름
                      </span>
                    }
                    className={styles.input}
                    {...field}
                  />
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field: { onChange, value, ...rest } }) => {
                  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (
                    e,
                  ) => {
                    let input = String((e.target as HTMLInputElement).value || '').replace(/\D/g, '')
                    if (input.length > 11) input = input.slice(0, 11) // 최대 11자리
                    if (input.length > 7) {
                      input = input.replace(/(\d{3})(\d{4})(\d{0,4}).*/, '$1-$2-$3')
                    } else if (input.length > 3) {
                      input = input.replace(/(\d{3})(\d{0,4}).*/, '$1-$2')
                    }

                    onChange(input)
                  }

                  return (
                    <Input
                      label={
                        <span className={styles.labelWithIcon}>
                          <FaPhone className={styles.labelIcon} aria-hidden />
                          전화번호
                        </span>
                      }
                      placeholder="010-1234-5678 (숫자만 입력)"
                      className={styles.input}
                      value={value ?? ''}
                      onChange={handleChange}
                      type="tel"
                      inputMode="numeric"
                      {...rest}
                    />
                  )
                }}
              />
              {/* 주민번호 */}
              <div className={styles.residentField}>
                <span className={styles.labelWithIcon}>
                  <FaIdCard className={styles.labelIcon} aria-hidden />
                  주민번호
                </span>

                <div className={styles.residentRow}>
                  <Controller
                    name="residentFront"
                    control={control}
                    render={({ field }) => (
                      <Input
                        // 라벨은 위에서 따로 출력했으니 생략
                        placeholder="YYMMDD"
                        className={`${styles.residentInputFront} ${styles.noMb}`}
                        maxLength={6}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                          field.onChange(v)
                        }}
                        type="text"
                        inputMode="numeric"
                      />
                    )}
                  />

                  <div className={styles.residentDash}>-</div>

                  <div className={styles.residentBackGroup}>
                    <Controller
                      name="residentBack"
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="#"
                          className={`${styles.residentInputBack} ${styles.noMb}`}
                          maxLength={1}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 1)
                            field.onChange(v)
                          }}
                          type="text"
                          inputMode="numeric"
                        />
                      )}
                    />
                    <span className={styles.mask} aria-hidden>******</span>
                  </div>
                </div>
              </div>


            </div>

            <div className={`${styles.card} ${styles.actionsCard}`}>
              <div className={styles.actions}>
                <Button
                  className={styles.btnPrimary}
                  type="button"
                  onClick={() => nav(-1)}
                  disabled={isPending}
                >
                  취소
                </Button>
                {isPending && <Spinner />}
                <Button
                  className={styles.btnPrimary}
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  저장
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default EditInfoPage
