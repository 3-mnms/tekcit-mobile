import { api } from '@/shared/config/axios'             // ✅ 공용 axios 인스턴스
import type { Festival, FestivalDetail } from '@/models/festival/festivalType'

type SuccessResponse<T> = { data: T; message?: string }

// 필요하면 요청 취소를 위해 옵션으로 signal 받기
type ReqOpt = { signal?: AbortSignal }

function toArray(payload: any): any[] {
  if (!payload) return []
  if (typeof payload === 'string') return [] // HTML/문자열 응답 가드
  if (Array.isArray(payload)) return payload

  // 흔한 래핑
  if (payload.data !== undefined) return toArray(payload.data)
  if (payload.result !== undefined) return toArray(payload.result)
  if (payload.response !== undefined) return toArray(payload.response)

  // 페이지네이션 스타일
  if (Array.isArray(payload.content)) return payload.content
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.list)) return payload.list

  // 단일 객체 하나만 온 경우
  if (typeof payload === 'object') return [payload]

  return []
}

// 목록
export const getFestivals = async (opt?: ReqOpt): Promise<Festival[]> => {
  const res = await api.get('/festival', { signal: opt?.signal })

  // ❗문자열(HTML) 응답이면 프록시/경로 문제
  if (typeof res?.data === 'string') {
    console.error('[getFestivals] string response (likely HTML). Check proxy/baseURL.')
    return []
  }

  const list = toArray(res?.data)
  // 최소 필드 가드(오염 데이터 제거)
  return list
    .filter((x) => x && typeof x === 'object')
    .map((raw) => ({
      fid: String(raw.fid ?? raw.id ?? raw.festivalId ?? raw.prfid ?? raw.prf_id ?? ''),
      prfnm: String(raw.prfnm ?? raw.title ?? raw.performanceName ?? raw.name ?? ''),
      fcltynm: String(raw.fcltynm ?? raw.venue ?? raw.theater ?? raw.place ?? ''),
      genrenm: String(raw.genrenm ?? raw.genre ?? raw.category ?? ''),
      poster: String(raw.poster ?? raw.poster_file ?? raw.posterFile ?? raw.posterUrl ?? raw.posterurl ?? ''),
      prfpdfrom: String(raw.prfpdfrom ?? raw.startDate ?? raw.from ?? ''),
      prfpdto: String(raw.prfpdto ?? raw.endDate ?? raw.to ?? ''),
    }))
    .filter((f) => f.prfnm || f.fid)
}

// 카테고리
export const getFestivalCategories = async (opt?: ReqOpt): Promise<string[]> => {
  const res = await api.get<SuccessResponse<string[]>>('/festival/categories', {
    signal: opt?.signal,
  })
  return res.data.data
}

// 조회수 단건 조회
export const getFestivalViews = async (fid: string, opt?: ReqOpt): Promise<number> => {
  const res = await api.get<SuccessResponse<number>>(`/festival/views/${fid}`, {
    signal: opt?.signal,
  })
  return res.data.data
}

// 상세
export const getFestivalDetail = async (fid: string, opt?: ReqOpt): Promise<FestivalDetail> => {
  const res = await api.get<SuccessResponse<FestivalDetail>>(`/festival/${fid}`, {
    signal: opt?.signal,
  })
  return res.data.data
}

// 조회수 증가(POST)
export const increaseFestivalViews = async (fid: string, opt?: ReqOpt): Promise<number> => {
  const res = await api.post<SuccessResponse<number>>(`/festival/views/${fid}`, undefined, {
    signal: opt?.signal,
  })
  return res.data.data
}
