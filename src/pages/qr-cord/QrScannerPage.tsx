import { useZxing } from 'react-zxing';
import { useValidateQr } from '@/shared/api/qr/QRcord'; // 이건 그대로 사용!
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';
import styles from './QrScannerPage.module.css';

const QrScannerPage = () => {
  const { mutate: validateQr, isPending } = useValidateQr();

  // react-zxing은 결과 객체(result)만 인자로 줘, 삐약!
  const handleScan = (result: any) => {
    if (result) {
      const qrCodeId = result.getText();
      console.log('스캔된 QR ID:', qrCodeId);

      if (!isPending) {
        validateQr({ qrCodeId });
      }
    }
  };
  const { ref } = useZxing({
    onDecodeResult: handleScan,
  });
  return (
    <div className={styles.container}>
      <div className={styles.title}>QR 스캐너 </div>
      <p className={styles.description}>티켓 확인을 위해 QR 코드를 스캔해주세요. </p>

     <video ref={ref} style={{ width: '100%', height: '100%', border: '1px solid gray' }} />


      {isPending && <p>QR 코드를 확인하고 있어요... </p>}
      <BottomNav/>
    </div>
  );
};

export default QrScannerPage;