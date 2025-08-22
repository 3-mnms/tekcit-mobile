import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BottomNav.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import { useTokenInfoQuery } from '@/shared/api/useTokenInfoQuery';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  const { data: tokenInfo } = useTokenInfoQuery();
  const userRole = tokenInfo?.role;

  if (userRole === 'ADMIN' || userRole === 'HOST') {
    return (
      <nav className={`${styles.bottomNav} ${styles.hostNav}`}>
        <button type="button" onClick={() => navigate('/host')} className={styles.navItem}>
          <i className="fa-solid fa-users" />
          <span>인원수 조회</span>
        </button>
        <button type="button" onClick={() => navigate('/host/qr-scanner')} className={styles.navItem}>
          <i className="fa-solid fa-qrcode" />
          <span>QR 찍기</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className={styles.bottomNav}>
      <button type="button" onClick={() => navigate('/')} className={styles.navItem}>
        <i className="fa-solid fa-house" />
        <span>홈</span>
      </button>
      <button type="button" onClick={() => navigate('/search')} className={styles.navItem}>
        <i className="fa-solid fa-magnifying-glass" />
        <span>검색</span>
      </button>
      <button type="button" onClick={() => navigate('/category')} className={styles.navItem}>
        <i className="fa-solid fa-bars" />
        <span>카테고리</span>
      </button>
       <button 
        type="button" 
        onClick={() => {
          if (tokenInfo) {
            navigate('/mypage');
          } else {
            navigate('/login');
          }
        }} 
        className={styles.navItem}
      >
        <i className="fa-solid fa-user" />
        <span>마이페이지</span>
      </button>
    </nav>
  );
};

export default BottomNav;