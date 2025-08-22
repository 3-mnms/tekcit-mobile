import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BottomNav.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();

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
      <button type="button" onClick={() => navigate('/mypage')} className={styles.navItem}>
        <i className="fa-solid fa-user" />
        <span>마이페이지</span>
      </button>
    </nav>
  );
};

export default BottomNav;