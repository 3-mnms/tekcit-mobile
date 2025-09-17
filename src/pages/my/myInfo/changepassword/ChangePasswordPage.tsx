// src/pages/my/myInfo/changepassword/ChangePasswordPage.tsx
import React from 'react';
import MyHeader from '@/components/my/hedaer/MyHeader'; // 제목만 사용
import CheckPasswordForm from '@/components/my/myinfo/password/CheckPasswordForm';
import ResetPasswordForm from '@/components/my/myinfo/password/ResetPasswordForm';
import styles from './ChangePasswordPage.module.css';
import { useMyPageUserQuery } from '@/models/my/useMyPage';

const ChangePasswordPage: React.FC = () => {
  const [verified, setVerified] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const { data: user } = useMyPageUserQuery();

  if (user?.oauthProvider === 'KAKAO') {
    return (
      <section className={styles.container}>
        <div className={styles.header}>
        <h2 className={styles.title}>비밀번호 변경</h2>
        <div className={`${styles.card} ${styles.empty}`}>
          <div className={styles.emptyIcon} aria-hidden />
          <h3 className={styles.emptyTitle}>비밀번호 변경이 지원되지 않습니다</h3>
          <p className={styles.emptyDesc}>
            카카오 계정으로 로그인한 사용자는 비밀번호를 별도로 변경할 수 없습니다.
          </p>
        </div>
        </div>
      </section>
    );
  }

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
