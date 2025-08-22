import React, { useState } from 'react';
import Button from '@/components/common/button/Button';
import FormInput from '@/components/common/input/Input';
import AddressSearchModal from '@/components/auth/signup/AddressSearchModal';
import styles from './AddressForm.module.css';

const AddressForm: React.FC = () => {
  const [name, setName] = useState('');
  const [zonecode, setZonecode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [openPostcode, setOpenPostcode] = useState(false);

  const handleSearchAddress = () => setOpenPostcode(true);

  return (
    <form className={styles.form}>
      <div className={styles.field}>
        <FormInput
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>배송지</label>

        <div className={styles.row}>
          <FormInput
            placeholder="우편번호"
            value={zonecode}
            disabled
            className={`${styles.zonecode} ${styles.control}`}
          />
          <Button
            type="button"
            className={styles.searchBtn}
            onClick={handleSearchAddress}
          >
            주소 검색
          </Button>
        </div>

        <FormInput
          placeholder="주소"
          value={address}
          disabled
          className={styles.addressInput}
        />
        <FormInput
          placeholder="상세주소"
          value={addressDetail}
          onChange={(e) => setAddressDetail(e.target.value)}
          className={styles.detailInput}
        />
      </div>

      <div className={styles.field}>
        <FormInput
          label="전화번호"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className={styles.checkboxWrapper}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={() => setIsDefault(!isDefault)}
          />
          <span>기본 배송지로 설정</span>
        </label>
      </div>

      <Button className={styles.submitButton} type="submit">저장</Button>

      {openPostcode && (
        <AddressSearchModal
          onComplete={({ zipCode, address }) => {
            setZonecode(zipCode);
            setAddress(address);
            setOpenPostcode(false);
          }}
          onClose={() => setOpenPostcode(false)}
        />
      )}
    </form>
  );
};

export default AddressForm;
