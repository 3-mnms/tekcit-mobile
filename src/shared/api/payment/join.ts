// src/shared/api/payment/Join.ts
import { z } from 'zod'
import { api } from '@/shared/config/axios'

export const CreateAccountRequestSchema = z.object({
  password: z.string().regex(/^\d{6}$/, '결제 PIN은 숫자 6자리여야 합니다.'),
})
export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>

export async function createTekcitPayAccount(
  input: CreateAccountRequest
): Promise<void> {
  const parsed = CreateAccountRequestSchema.parse(input) // 입력값 검증
  await api.post('/tekcitpay/create-account', parsed, {
    headers: { 'Content-Type': 'application/json' },
  })
}
