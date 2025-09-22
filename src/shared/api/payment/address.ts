import { api } from '@/shared/config/axios'
import { useAuthStore } from '@/shared/storage/useAuthStore'

// 🔹 백엔드 DTO
export type AddressDTO = {
  name: string               // 수령인 이름
  phone: string              // 전화번호
  address: string            // 단일 주소(도로명/지번 등)
  zipCode?: string           // 우편번호
  default: boolean           // 기본 배송지 여부
  isDefault?: boolean
}

// 🔹 공통 응답 래퍼 
export type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

function unwrapOrThrow<T>(resp: ApiResponse<T>): T {
  if (!resp?.success) {
    // 서버에서 내려준 message 우선 사용
    throw new Error(resp?.message || '요청 처리에 실패했습니다.')
  }
  return resp.data
}

function getAuthHeaders() {
  const { accessToken } = useAuthStore.getState()

  if (!accessToken) {
    throw new Error('로그인이 필요합니다.')
  }

  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
}

function DefaultAddress(raw: any): AddressDTO {
  return {
    id: raw.id,
    name: raw.name || '',
    phone: raw.phone || '',
    address: raw.address || '',
    zipCode: raw.zipCode,
    default: Boolean(raw.default || raw.isDefault),
    isDefault: Boolean(raw.default || raw.isDefault), // 호환성
  }
}

// 주소 목록 조회
export async function getAddress(): Promise<AddressDTO[]> {

  // 백엔드 api 엔드포인트 호출
  const { data } = await api.get<ApiResponse<any[]>>('/addresses/allAddress', {
    headers: getAuthHeaders(),
    params: { _: Date.now() },
  })

  const addresses = unwrapOrThrow(data)
  const normalized = addresses.map(DefaultAddress)


  return normalized
}

export async function getDefaultAddress(): Promise<AddressDTO | null> {
  try {

    const { data } = await api.get<ApiResponse<any | null>>('/addresses/defaultAddress', {
      headers: getAuthHeaders(),
    })


    const address = unwrapOrThrow(data)
    return address ? DefaultAddress(address) : null

  } catch (error: any) {

    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.')
    }

    // 기본 배송지가 없는 경우는 null 반환
    if (error.response?.status === 404) {
      return null
    }

    throw error
  }
}

export const AddressQueryKeys = {
  all: ['addresses'] as const,
  list: () => ['addresses'] as const,
  default: () => ['addresses', 'default'] as const,
}
