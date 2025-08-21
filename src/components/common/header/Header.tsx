import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '@shared/assets/logo.png';
import { useUIStore } from '@/shared/store/uiStore';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { headerMode, headerTitle, resetHeader } = useUIStore();
  const [keyword, setKeyword] = useState('');

  const handleSearch = () => {
    const q = keyword.trim();
    // 검색어가 없으면 검색하지 않고, 검색창 모드만 종료
    if (!q) {
      resetHeader();
      navigate(-1); // 이전 페이지로 돌아가기
      return;
    }
    navigate(`/search?keyword=${encodeURIComponent(q)}&page=1`);
  };

  // ================================================================
  // ✅ 검색 모드일 때 보여줄 헤더
  // ================================================================
  if (headerMode === 'search') {
    return (
      <header className={`${styles.header} ${styles.searchHeader}`}>
        <button type="button" onClick={() => navigate(-1)} className={styles.iconButton}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="검색어를 입력해주세요."
            className={styles.searchInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <button type="button" onClick={handleSearch} className={styles.searchButton}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>
      </header>
    );
  }

  // ================================================================
  // ✅ 기본 모드일 때 보여줄 헤더
  // ================================================================
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src={logo} alt="logo" className={styles.logo} onClick={() => navigate('/')} />
      </div>
      <div className={styles.center}>
        {headerTitle && <h1 className={styles.title}>{headerTitle}</h1>}
      </div>
      <div className={styles.right}>
        <button type="button" onClick={() => navigate('/search')} className={styles.iconButton}>
          <i className="fa-solid fa-magnifying-glass" />
        </button>
      </div>
    </header>
  );
};

export default Header;