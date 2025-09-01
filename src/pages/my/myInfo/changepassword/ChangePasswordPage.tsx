// src/pages/my/myInfo/changepassword/ChangePasswordPage.tsx
import React from 'react';
import MyHeader from '@/components/my/hedaer/MyHeader'; // 제목만 사용
import CheckPasswordForm from '@/components/my/myinfo/password/CheckPasswordForm';
import ResetPasswordForm from '@/components/my/myinfo/password/ResetPasswordForm';
import styles from './ChangePasswordPage.module.css';

const ChangePasswordPage: React.FC = () => {
  const [verified, setVerified] = React.useState(false);
  const [done, setDone] = React.useState(false);

  return (
    <section className={styles.page}>
      <MyHeader title="비밀번호 변경" />

      <div className={styles.body}>
        {!verified && (
          <CheckPasswordForm onVerified={() => setVerified(true)} />
        )}

        {verified && !done && (
          <ResetPasswordForm onSuccess={() => setDone(true)} />
        )}

        {done && (
          <div className={styles.successBox}>
            ✅ 비밀번호가 성공적으로 변경되었어요!
          </div>
        )}
      </div>
    </section>
  );
};

export default ChangePasswordPage;
