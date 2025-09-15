// src/pages/payment/TeckitJoinPage.tsx

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'

import styles from './TeckitJoinPage.module.css'
import Header from '@/components/common/header/Header'

import { useAuthStore } from '@/shared/storage/useAuthStore'
import { useUIStore } from '@/shared/store/uiStore'
import {
  CreateAccountRequestSchema,
  createTekcitPayAccount,
} from '@/shared/api/payment/join'

/* ───────────────────────── 폼 스키마 ─────────────────────────
   - 결제 PIN: 숫자 6자리
   - 확인 입력과의 일치 검사
   - 약관 동의 필수
---------------------------------------------------------------- */
const joinSchema = z
  .object({
    payPin: z.string().regex(/^\d{6}$/, '결제 PIN은 숫자 6자리여야 합니다.'),
    payPinConfirm: z.string(),
    agree: z.boolean().refine((v) => v === true, '약관에 동의해야 개설할 수 있습니다.'),
  })
  .refine((v) => v.payPin === v.payPinConfirm, {
    message: '결제 PIN이 일치하지 않습니다.',
    path: ['payPinConfirm'],
  })

type JoinFormValues = z.infer<typeof joinSchema>

/* ───────────────────────── 컴포넌트 ───────────────────────── */
export default function TeckitJoinPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // 인증 스토어: 로그인 여부 판단 및 사용자 표시명 사용
  const { authReady, isLoggedIn, user } = useAuthStore()

  // UI 스토어: 헤더 타이틀/아이콘 제어
  const { setHeader, setBaseHeader } = useUIStore()

  /* 진입 가드
     - 스토어 복원되면 로그인 상태 확인
     - 비로그인 시 로그인 페이지로 리다이렉트 */
  useEffect(() => {
    if (!authReady) return
    if (!isLoggedIn) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [authReady, isLoggedIn, navigate, location.pathname])

  // 스토어 복원 전/비로그인 중에는 렌더 방지
  if (!authReady || !isLoggedIn) return null

  // 헤더 구성: 좌측 뒤로가기, 중앙 타이틀 "계정 생성"
  useEffect(() => {
    setHeader({ leftIcon: 'back', centerMode: 'title', title: '계정 생성' })
    // 언마운트 시 기본 헤더로 원복(필요 없으면 제거 가능)
    return () => setBaseHeader()
  }, [setHeader, setBaseHeader])

  // 표시용 이름(스토어 기반)
  const displayName = user?.name ?? '사용자'

  // 폼 초기값
  const defaultValues = useMemo<Partial<JoinFormValues>>(
    () => ({ payPin: '', payPinConfirm: '', agree: false }),
    []
  )

  // react-hook-form + zod
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    mode: 'onChange',
    defaultValues,
  })

  /* 계좌 개설 뮤테이션
     - API 스펙: { password: string }
     - 성공 시: 지갑 내역 페이지로 이동 */
  const createMutation = useMutation({
    mutationFn: async (payload: { payPin: string; agree: boolean }) => {
      const requestBody = CreateAccountRequestSchema.parse({
        password: payload.payPin,
      })
      await createTekcitPayAccount(requestBody)
    },
    onSuccess: () => {
      navigate('/payment/wallet-point', { replace: true })
    },
  })

  // 제출 핸들러
  const onSubmit = (v: JoinFormValues) => {
    createMutation.mutate({ payPin: v.payPin, agree: v.agree })
  }

  // 서버 에러 상태 코드 추출 헬퍼
  const getErrorStatus = () =>
    (createMutation.error as any)?.response?.status as number | undefined

  return (
    <>
      {/* Header는 전역 스토어를 읽기 때문에 props 없이 그대로 사용 */}
      <Header />

      <main className={styles.page}>
        {/* 상단 안내 섹션 */}
        <section className={styles.header}>
          <h1 className={styles.title}>테킷 페이 계정 개설</h1>
          <p className={styles.subtitle}>
            결제 PIN은 꼭 기억해 두세요. 분실 시 본인 확인 절차가 필요할 수 있어요.
          </p>
        </section>

        {/* 카드 레이아웃 */}
        <section className={styles.card}>
          {/* 읽기 전용 프로필 정보 */}
          <div className={styles.profileBox}>
            <div className={styles.pair}>
              <span className={styles.pairKey}>이름</span>
              <span className={styles.pairVal}>{displayName}</span>
            </div>
          </div>

          {/* 개설 폼 */}
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* 결제 PIN */}
            <div className={styles.field}>
              <label htmlFor="payPin" className={styles.label}>결제 PIN(6자리)</label>
              <input
                id="payPin"
                type="password"
                className={styles.input}
                placeholder="숫자 6자리"
                {...register('payPin')}
                aria-invalid={!!errors.payPin}
                autoComplete="new-password"
                inputMode="numeric"
                maxLength={6}
              />
              {errors.payPin && <p className={styles.error}>{errors.payPin.message}</p>}
            </div>

            {/* 결제 PIN 확인 */}
            <div className={styles.field}>
              <label htmlFor="payPinConfirm" className={styles.label}>결제 PIN 확인</label>
              <input
                id="payPinConfirm"
                type="password"
                className={styles.input}
                placeholder="한 번 더 입력"
                {...register('payPinConfirm')}
                aria-invalid={!!errors.payPinConfirm}
                autoComplete="new-password"
                inputMode="numeric"
                maxLength={6}
              />
              {errors.payPinConfirm && (
                <p className={styles.error}>{errors.payPinConfirm.message}</p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className={styles.agreeRow}>
              <input id="agree" type="checkbox" className={styles.checkbox} {...register('agree')} />
              <label htmlFor="agree" className={styles.agreeLabel}>
                (필수) 테킷 페이 서비스 이용약관 및 개인정보 처리방침에 동의합니다
              </label>
            </div>
            {errors.agree && <p className={styles.error}>{errors.agree.message}</p>}

            {/* 액션 영역 */}
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={!isValid || isSubmitting || createMutation.isPending}
                aria-busy={isSubmitting || createMutation.isPending}
              >
                {createMutation.isPending ? '개설 중...' : '계정 개설하기'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate(-1)}
              >
                이전으로
              </button>
            </div>

            {/* 서버 에러 메시지 */}
            {createMutation.isError && (
              <p className={styles.serverError}>
                {getErrorStatus() === 401
                  ? '세션이 만료되었어요. 다시 로그인해 주세요.'
                  : getErrorStatus() === 409
                    ? '이미 테킷 페이 계정이 존재합니다.'
                    : '계정 개설 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
              </p>
            )}
          </form>
        </section>
      </main>
    </>
  )
}
