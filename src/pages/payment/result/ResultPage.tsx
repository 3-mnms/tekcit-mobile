// src/pages/result/ResultPage.tsx
import { useSearchParams } from 'react-router-dom'
import ResultLayout from '@/components/common/result/ResultLayout'
import { RESULT_CONFIG, type ResultType, type ResultStatus } from '@/shared/config/resultConfig'

export default function ResultPage() {
  const [sp] = useSearchParams()
  const type = sp.get('type') as ResultType | null
  const status = sp.get('status') as ResultStatus | null
  
  const view = type && status ? RESULT_CONFIG[type]?.[status] : null

  if (!view) {
    return (
      <ResultLayout
        title="결과 확인 불가"
        message="결제 결과를 확인할 수 없습니다."
        primary={{ label: '메인으로', to: '/' }}
      />
    )
  }

  return <ResultLayout {...view} />
}