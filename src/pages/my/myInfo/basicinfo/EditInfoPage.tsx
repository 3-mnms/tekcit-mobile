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

import { isUser, type UpdateUserRequestDTO } from '@/models/my/userTypes'
import { useMyPageUserQuery, useUpdateUserMutation } from '@/models/my/useMyPage'
import { FaUser, FaPhone, FaIdCard } from 'react-icons/fa'

const schema = z.object({
  name: z.string().min(1, '이름은 필수입니다.'),
  phone: z
    .string()
    .regex(/^01[016789]-\d{3,4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678'),
  residentNum: z
    .string()
    .regex(/^\d{6}-[1-4]$/, '주민번호 형식은 6자리-성별코드(1~4)입니다. 예: 990101-1'),
})

type FormValues = z.infer<typeof schema>

const EditInfoPage: React.FC = () => {
  const nav = useNavigate()
  const { data, isLoading, isError } = useMyPageUserQuery()
  const { mutateAsync, isPending } = useUpdateUserMutation()

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', residentNum: '' },
  })

  React.useEffect(() => {
    if (!data) return
    reset({
      name: data.name ?? '',
      phone: data.phone ?? '',
      residentNum: isUser(data) ? (data.residentNum ?? '') : '',
    })
  }, [data, reset])

  const onSubmit = async (vals: FormValues) => {
    const payload: UpdateUserRequestDTO = {
      name: vals.name,
      phone: vals.phone,
      residentNum: vals.residentNum,
    }
    try {
      await mutateAsync(payload)
      alert('저장되었습니다.')
      nav('/mypage/myinfo/detail')
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
          <div className={styles.card}>불러오는 중…</div>
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
                      placeholder="010-1234-5678"
                      className={styles.input}
                      value={value ?? ''}
                      onChange={handleChange}
                      type="tel"
                      {...rest}
                    />
                  )
                }}
              />
              <Controller
                name="residentNum"
                control={control}
                render={({ field }) => (
                  <Input
                    label={
                      <span className={styles.labelWithIcon}>
                        <FaIdCard className={styles.labelIcon} aria-hidden />
                        주민번호(앞6+뒤1)
                      </span>
                    }
                    placeholder="YYMMDD-#"
                    className={styles.input}
                    {...field}
                  />
                )}
              />
            </div>

            <div className={`${styles.card} ${styles.actionsCard}`}>
              <div className={styles.actions}>
                <Button
                  className={styles.btnPrimary}
                  type="button"
                  onClick={() => nav('/mypage/myinfo/detail')}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button
                  className={styles.btnPrimary}
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? '저장 중…' : '저장'}
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
