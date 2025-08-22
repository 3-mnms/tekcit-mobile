import React from 'react';
import Button from '@/components/common/button/Button';
import DetailInfoField from '@/components/my/myinfo/DetailInfoField';
import MyHeader from '@/components/my/hedaer/MyHeader';
import styles from './DetailPage.module.css';

const DetailPage: React.FC = () => {
  const user = {
    id: 'example123',
    name: '홍길동',
    birth: '2025.07.28',
    gender: '여성',
    phone: '010-1234-5678',
    email: 'a@example.com',
  };

  return (
    <section className={styles.page}>
      <MyHeader title="기본정보" />

      <div className={styles.body}>
        <div className={styles.card}>
          <DetailInfoField label="이름" value={user.name} />
          <DetailInfoField label="생년월일" value={user.birth} />
          <DetailInfoField label="성별" value={user.gender} />
          <DetailInfoField label="전화번호" value={user.phone} />
          <div className={styles.buttonWrapper}>
            <Button className={styles.button}>정보 수정</Button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionTitle}>계정정보</div>
          <DetailInfoField label="아이디" value={user.id} />
          <DetailInfoField label="이메일" value={user.email} />
        </div>
      </div>
    </section>
  );
};

export default DetailPage;
