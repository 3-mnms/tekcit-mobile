import { useMutation } from '@tanstack/react-query';
import  { api } from '../axios';

interface ValidateQrParams {
  qrCodeId: string;
}

const validateQrCode = async ({ qrCodeId }: ValidateQrParams) => {
  const { data } = await api.post(`/api/validate/${qrCodeId}`);
  return data;
};

// 다른 컴포넌트에서 이 훅을 불러서 사용할 거야, 삐약!
export const useValidateQr = () => {
  return useMutation({
    mutationFn: validateQrCode,
    onSuccess: (data) => {
      // 성공했을 때! "QR 스캔 완료" 메시지를 보여주면 돼.
      console.log('QR 검증 성공!', data);
      alert('QR 스캔 완료!'); // 간단하게 alert으로 처리하거나, toast UI를 사용하면 더 예뻐 삐약!
    },
    onError: (error) => {
      // 실패했을 때! 에러 메시지를 보여주자.
      console.error('QR 검증 실패ㅠㅠ', error);
      alert('유효하지 않은 QR 코드입니다.');
    },
  });
};