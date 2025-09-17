// src/pages/my/myinfo/address/AddressListPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddressItem from '@/components/my/myinfo/address/AddressItem';
import AddressEmpty from '@/components/my/myinfo/address/AddressEmpty';
import Button from '@/components/common/button/Button';
import MyHeader from '@/components/my/hedaer/MyHeader';
import styles from './AddressListPage.module.css';
import { useAddressesQuery, useDeleteAddressMutation } from '@/models/auth/tanstack-query/useAddress'
import { useQueryClient } from '@tanstack/react-query'
import Spinner from '@/components/common/spinner/Spinner'

const AddressListPage: React.FC = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useAddressesQuery()
  const deleteAddressMut = useDeleteAddressMutation()

  const goNew = () => navigate('new')

  const handleDelete = (addressId: number) => {
    if (!addressId) return
    if (!window.confirm('정말 이 배송지를 삭제하시겠습니까?')) return

    deleteAddressMut.mutate(addressId, {
      onSuccess: () => {
        alert('배송지가 삭제되었습니다.')
        qc.invalidateQueries({ queryKey: ['addresses'] })
        qc.invalidateQueries({ queryKey: ['addresses', 'default'] })
      },
      onError: (e: any) => {
        alert(e?.response?.data?.message || '배송지 삭제에 실패했습니다.')
      },
    })
  }
  
  return (
    <section className={styles.page}>
      <MyHeader title="배송지 관리" />

      <div className={styles.body}>
        {(isLoading || isError) && (
          <div className={styles.card}>
            {isLoading && (
              <Spinner />
            )}
            {isError && (
              <div className={styles.errorText}>
                {(error as any)?.message ?? '주소 목록을 불러오지 못했어요.'}
              </div>
            )}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {!(data && data.some((addr) => addr.address && addr.address.trim() !== '')) ? (
              <AddressEmpty />
            ) : (
              <div className={styles.card}>
                {(data ?? []).map((addr) => (
                  <AddressItem
                  key={addr.id}
                  id={Number(addr.id)}
                  name={addr.name}
                  phone={addr.phone}
                  zipCode={addr.zipCode}
                  address={addr.address}
                  isDefault={addr.isDefault}
                  onEdit={() => navigate(`/mypage/myinfo/address/${addr.id}`)}
                  onClick={() => navigate(`/mypage/myinfo/address/${addr.id}`)}
                  onDelete={() => handleDelete(Number(addr.id))}
                />
                ))}
              </div>
            )}
          </>
        )}

        <Button className={styles.addButton} onClick={goNew}>
          + 새 배송지 추가
        </Button>
      </div>
    </section>
  );
};

export default AddressListPage;
