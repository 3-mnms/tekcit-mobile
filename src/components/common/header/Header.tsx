import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '@shared/assets/logo.png';
import { useUIStore } from '@/shared/store/uiStore';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  // ✅ 이제 헤더는 오직 '제목' 정보만 신경쓰면 돼!
  const { headerTitle } = useUIStore();

  return (
    <header className={styles.header}>
      {/* 왼쪽: 로고 (항상 고정) */}
      <div className={styles.left}>
        <img 
          src={logo} 
          alt="logo" 
          className={styles.logo} 
          onClick={() => navigate('/')} 
        />
      </div>

      {/* 가운데: 페이지 제목 (스토어에 따라 바뀜) */}
      <div className={styles.center}>
        {headerTitle && <h1 className={styles.title}>{headerTitle}</h1>}
      </div>

      {/* 오른쪽: 검색 아이콘 (항상 고정) */}
      <div className={styles.right}>
        <button 
          type="button" 
          onClick={() => navigate('/search')} 
          className={styles.iconButton}
        >
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </div>
    </header>
  );
};

export default Header;