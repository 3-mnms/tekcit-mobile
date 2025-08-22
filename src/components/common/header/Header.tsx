import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '@shared/assets/logo.png';
import { useUIStore } from '@/shared/store/uiStore';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { leftIcon, centerMode, headerTitle, resetHeader } = useUIStore();
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

  return (
    <header className={styles.header}>
      {/* 왼쪽 영역 */}
      <div className={styles.left}>
        {leftIcon === 'back' ? (
          <button type="button" onClick={() => navigate(-1)} className={styles.iconButton}>
            <i className="fa-solid fa-arrow-left" />
          </button>
        ) : (
          <img src={logo} alt="logo" className={styles.logo} onClick={() => navigate('/')} />
        )}
      </div>

      {/* 가운데 영역 */}
      <div className={styles.center}>
        {centerMode === 'searchBar' && (
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
        {centerMode === 'title' && headerTitle && (
          <h1 className={styles.title}>{headerTitle}</h1>
        )}
      </div>

      {/* 오른쪽 영역 */}
      <div className={styles.right}>
        {/* 검색 페이지가 아닐 때만 검색 아이콘을 보여줘서 중복을 피함 */}
        {centerMode !== 'searchBar' && (
          <button type="button" onClick={() => navigate('/search')} className={styles.iconButton}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;