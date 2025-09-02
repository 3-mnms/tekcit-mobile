import type { Festival } from '@/models/admin/festival';
import { api } from '@/shared/config/axios';


// 공연 조회
export const getProducts = async (): Promise<Festival[]> => {
    console.log('삐약! 공연 목록을 서버에 요청해요!');
    const response = await api.get<Festival[]>('/festival/manage');
    
    return response.data;
};

export const getProductsAdmin = async (): Promise<Festival> => {
  const response = await api.get<Festival>('/festival/manage');
  if (response.data && !Array.isArray(response.data.data)) {
    return {
      ...response.data,
      data: [response.data.data], // 삐약! 🐥 배열로 바꿔서 반환해요.
    };
  }
  return response.data;
};

/**
 * 공연 등록 (POST /api/festival/manage)
 * @param formData 폼 데이터 (JSON + 파일들)
 */
export const createProduct = async (formData: FormData): Promise<Festival> => {
    
    const response = await api.post<Festival>('/festival/manage', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;

};

/**
 * 공연 수정 (put /api/festival/manage/{fid})
 * @param fid 수정할 공연의 ID
 * @param formData 수정할 내용이 담긴 FormData (JSON + 파일)
 */
export const updateProduct = async (fid: string, formData: FormData): Promise<Festival> => {
    const response = await api.put<Festival>(`/festival/manage/${fid}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * 공연 삭제 (DELETE /api/festival/manage/{productId})
 * @param id 삭제할 공연의 ID
 */
export const deleteProduct = async (fid: string): Promise<void> => {
    console.log(`삐약! ${fid}번 공연을 서버에 삭제 요청해요!`);
    await api.delete(`/festival/manage/${fid}`);
};

/**
 * 공연 상세 정보 조회 (GET /api/festival/{fid})
 * @param fid 조회할 공연의 ID
 */
export const getProductDetail = async (fid: string): Promise<Festival> => {
    console.log(`삐약! ${fid}번 공연 상세 정보를 서버에 요청해요!`);
    const response = await api.get<Festival>(`/festival/manage/${fid}`);
    return response.data;
};

