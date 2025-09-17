import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '@shared/assets/logo.png';
import { useUIStore } from '@/shared/store/uiStore';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { leftIcon, centerMode, headerTitle, setHeader } = useUIStore();
  const [keyword, setKeyword] = useState('');

  const isHome = location.pathname === '/';
  const isNearBy = location.pathname === '/nearby';
  const isSearchPage = location.pathname.startsWith('/search');

  useEffect(() => {
    if (isHome) {
      setHeader({ leftIcon: undefined, title: '', centerMode: 'title' });
      setKeyword('');
    }
  }, [isHome, setHeader]);

  const handleSearch = () => {
    const q = keyword.trim();
    if (!q) {
      navigate(-1);
      return;
    }
    navigate(`/search?keyword=${encodeURIComponent(q)}&page=1`);
  };

  const showSearchBar = centerMode === 'searchBar' && !isHome;
  const showTitle = centerMode === 'title' && !!headerTitle && !isHome;
  const showRightSearchIcon = isHome || (!isSearchPage && centerMode !== 'searchBar');

  return (
    <header className={styles.header}>
      {/* 왼쪽 영역 */}
      <div className={styles.left}>
        {(!isHome && !isNearBy && leftIcon === 'back') ? (
          <button type="button" onClick={() => navigate(-1)} className={styles.iconButton}>
            <i className="fa-solid fa-arrow-left" />
          </button>
        ) : (
          <img
            src={logo}
            alt="logo"
            className={styles.logo}
            onClick={() => navigate('/')}
          />
        )}
      </div>

      {/* 가운데 영역 */}
      <div className={styles.center}>
        {showSearchBar  && (
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="검색어를 입력하세요"
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
        )}
        {showTitle && (
          <h1 className={`${styles.title} ${styles.titleWithEllipsis}`}>{headerTitle}</h1>
        )}
      </div>

      {/* 오른쪽 영역 */}
      <div className={styles.right}>
        {showRightSearchIcon && (
          <button type="button" onClick={() => navigate('/search')} className={styles.iconButton}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
