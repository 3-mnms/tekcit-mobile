// src/pages/payment/wallet/WalletChargePage.tsx

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import PortOne, { Currency, PayMethod } from '@portone/browser-sdk/v2'

import styles from './WalletChargePage.module.css'
import Input from '@/components/common/input/Input'
import Button from '@/components/common/button/Button'
import Header from '@/components/common/header/Header'
import { useUIStore } from '@/shared/store/uiStore'

import { requestTossPointCharge, type PointChargeRequest } from '@/shared/api/payment/pointToss'
import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery'
import { getEnv } from '@/shared/config/env'

// 포트원 환경변수(웹 버전과 동일하게 사용)
const STORE_ID = getEnv("VITE_PORTONE_STORE_ID")
const CHANNEL_KEY = getEnv("VITE_PORTONE_CHANNEL_KEY")

// 금액 검증 스키마(웹 버전과 동일)
const AmountSchema = z.number().int().positive().min(1000, '최소 1,000원 이상 충전해 주세요.')

// 금액 프리셋(모바일 UI 유지)
const AMOUNT_PRESETS = [
  { value: 10000, label: '1만원' },
  { value: 50000, label: '5만원' },
  { value: 100000, label: '10만원' },
  { value: 500000, label: '50만원' },
  { value: 1000000, label: '100만원' },
]

const WalletChargePage: React.FC = () => {
  // 입력 금액(문자열로 관리 → 숫자만 허용)
  const [amount, setAmount] = useState('')
  const navigate = useNavigate()
  const { setHeader } = useUIStore()
  const orderName = '지갑 포인트 충전'

  // Header 설정
  useEffect(() => {
    setHeader({
      leftIcon: 'back',
      centerMode: 'title',
      title: '포인트 충전하기',
      showSearch: false // 검색 버튼 숨김
    })
  }, [setHeader])

  // 사용자 토큰 정보(웹과 동일)
  const { data: tokenInfo } = useTokenInfoQuery()
  const userId = tokenInfo?.userId

  // 결제 식별자 보관
  const paymentIdRef = useRef<string>('')

  // 포트원 설정 체크(웹과 동일)
  useEffect(() => {
    if (!STORE_ID || !CHANNEL_KEY) {
      alert('결제 설정이 올바르지 않습니다. 관리자에게 문의하세요.')
    }
  }, [])

  // 숫자 파싱
  const amountNumber = useMemo(
    () => parseInt((amount || '').replace(/[^0-9]/g, ''), 10) || 0,
    [amount]
  )

  // 금액 표시
  const formattedAmount = useMemo(() => {
    if (!amountNumber) return '0원'
    return new Intl.NumberFormat('ko-KR').format(amountNumber) + '원'
  }, [amountNumber])

  // 사전 결제 요청(웹과 동일 로직)
  const preRequestMutation = useMutation({
    mutationFn: (vars: { input: PointChargeRequest; userId: number }) =>
      requestTossPointCharge(vars.input, vars.userId),
  })

  // 프리셋 버튼 누르면 누적 입력
  const handlePresetClick = (preset: number) => {
    const prev = parseInt((amount || '').replace(/[^0-9]/g, ''), 10) || 0
    setAmount(String(prev + preset))
  }

  // 입력 핸들러(숫자만)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setAmount(val)
  }

  // 결제 완료 후 돌아올 리다이렉트 URL(웹과 동일 쿼리 규약)
  const buildPortOneRedirect = (paymentId: string) => {
    const url = new URL('/payment/wallet-point', window.location.origin)
    url.searchParams.set('type', 'wallet-charge')
    url.searchParams.set('paymentId', paymentId)
    url.searchParams.set('success', 'true') // 결제 성공 플로우 유지
    return url.toString()
  }

  // 예외 등으로 직접 이동이 필요할 때 사용(웹과 동일)
  const navigateToResult = (qs: Record<string, string>) => {
    const search = new URLSearchParams(qs).toString()
    navigate({ pathname: '/payment/wallet-point', search: `?${search}` }, { replace: true })
  }

  // 결제 버튼
  const handleCharge = async () => {
    try {
      if (!userId) {
        alert('로그인이 필요합니다.')
        return
      }

      const parsed = AmountSchema.safeParse(amountNumber)
      if (!parsed.success) {
        alert(parsed.error.errors[0]?.message ?? '충전 금액을 확인해 주세요.')
        return
      }

      // 결제 식별자 생성(웹과 동일)
      paymentIdRef.current =
        (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

      // 1) 백엔드 사전 요청(웹과 동일)
      await preRequestMutation.mutateAsync({
        input: { paymentId: paymentIdRef.current, amount: parsed.data },
        userId,
      })

      // 2) 포트원 결제 요청
      if (!STORE_ID || !CHANNEL_KEY) {
        alert('결제 설정이 올바르지 않습니다. 관리자에게 문의하세요.')
        navigateToResult({ type: 'wallet-charge', success: 'false' })
        return
      }

      await PortOne.requestPayment({
        storeId: STORE_ID!,
        channelKey: CHANNEL_KEY!,
        paymentId: paymentIdRef.current,
        orderName,
        totalAmount: parsed.data,
        currency: Currency.KRW,
        payMethod: PayMethod.CARD,
        redirectUrl: buildPortOneRedirect(paymentIdRef.current),
      })

      // 3) 결제 직후 결과 페이지로 선이동(웹과 동일, 쿼리 포함)
      navigateToResult({
        type: 'wallet-charge',
        paymentId: paymentIdRef.current,
        success: 'true',
      })
    } catch {
      navigateToResult({ type: 'wallet-charge', success: 'false' })
    }
  }

  const disabled = !amountNumber || preRequestMutation.isPending

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* 기존 topbar 삭제 - Header 컴포넌트 사용 */}

        {/* 본문 */}
        <div className={styles.wrapper}>
          <section className={styles.section}>
            <div className={styles.labelRow}>
              <div className={styles.label}>포인트 충전 금액</div>
              <div className={styles.helper}>{formattedAmount}</div>
            </div>

            <div className={styles.inputWrapper}>
              <Input
                type="text"
                placeholder="금액 입력"
                value={amount}
                onChange={handleInputChange}
                aria-label="충전 금액"
                className={styles.amountInput}
              />
            </div>

            <div className={styles.presetGroup}>
              {AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetClick(preset.value)}
                >
                  +{preset.label}
                </button>
              ))}
            </div>
          </section>

          {/* 기존 모바일 UI의 결제 섹션은 유지하되,
              실제 결제는 PortOne.requestPayment로 처리하므로 별도 컴포넌트는 생략 */}
          <section className={styles.section}>
            <div className={styles.pgInfo} aria-live="polite">
              신용/체크카드로 결제가 진행됩니다.
            </div>
          </section>

          <Button
            type="button"
            className={styles.chargeBtn}
            onClick={handleCharge}
            disabled={disabled}
            aria-disabled={disabled}
          >
            {preRequestMutation.isPending ? '요청 중…' : '충전하기'}
          </Button>
        </div>
      </div>
    </>
  )
}

export default WalletChargePage