// src/pages/my/myInfo/changepassword/ChangePasswordPage.tsx
import React from 'react';
import Button from '@/components/common/button/Button';
import Input from '@/components/common/input/Input';
import MyHeader from '@/components/my/hedaer/MyHeader'; // 제목만 사용
import styles from './ChangePasswordPage.module.css';

const ChangePasswordPage: React.FC = () => {
  return (
    <section className={styles.page}>
      <MyHeader title="비밀번호 변경" />

      <div className={styles.body}>
        <div className={styles.card}>
          <Input type="password" placeholder="현재 비밀번호" />
          <Input type="password" placeholder="새 비밀번호" />
          <Input type="password" placeholder="새 비밀번호 확인" />

          <Button className={styles.button}>비밀번호 변경</Button>
        </div>
      </div>
    </section>
  );
};

export default ChangePasswordPage;
