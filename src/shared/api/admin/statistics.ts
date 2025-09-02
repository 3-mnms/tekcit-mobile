import type { EntranceStatsResponse } from "@/models/admin/statistics";
import { api } from "@/shared/config/axios";

export const getFestivalSchedules = async (fid: string): Promise<{ data: string[] }> => {
  const response = await api.get<{ data: string[] }>(`/statistics/schedules/${fid}`);
  return response.data;
};

export const getEntranceCount = async (festivalId: string, performanceDate: string): Promise<EntranceStatsResponse> => {
    // 삐약! 🐥 fid와 performanceDate를 쿼리 파라미터로 넘겨줘요.
    const response = await api.get<EntranceStatsResponse>(`/statistics/enter/${festivalId}`, {
        params: {
            performanceDate: performanceDate
        }
    });
    return response.data;
};