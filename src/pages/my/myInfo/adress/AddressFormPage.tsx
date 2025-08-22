// src/pages/my/myinfo/AddressFormPage.tsx
import React from 'react';
import AddressForm from '@/components/my/myinfo/AddressForm';
import styles from './AddressFormPage.module.css';
import MyHeader from '@/components/my/hedaer/MyHeader';

const AddressFormPage: React.FC = () => {
  return (
    <section className={styles.page}>
      <div className={styles.top}>
        <MyHeader title="배송지 추가" />
      </div>

      <div className={styles.body}>
        <AddressForm />
      </div>
    </section>
  );
};

export default AddressFormPage;
