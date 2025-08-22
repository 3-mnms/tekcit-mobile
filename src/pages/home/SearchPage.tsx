// src/pages/search/SearchPage.tsx
import React, { useLayoutEffect  } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import Header from '@components/common/header/Header';
import Filter from '@components/festival/search/FilterPanel';
import Result from '@components/festival/search/ResultPanel';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav'
import { useUIStore } from '@/shared/store/uiStore';

import styles from './SearchPage.module.css';

const DEFAULT_STATUSES = ['공연예정', '공연중'];

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');
  const { setHeader } = useUIStore();

  useLayoutEffect (() => {
    setHeader({ centerMode: 'searchBar', leftIcon: 'back' });
  }, [setHeader]); 

  // ✅ 1) 렌더 전에 쿼리 정규화 (가드)
  const params = new URLSearchParams(location.search);
  const hasStatus = !!params.get('status');
  if (!hasStatus) {
    params.set('status', DEFAULT_STATUSES.join(','));
    if (!params.get('page')) params.set('page', '1');
    return <Navigate to={`/search?${params.toString()}`} replace />;
  }

  return (
    <>
      <Header />
      <div className={styles.page}>
        <aside className={styles.filterCol}>
          <Filter />
        </aside>
        <main className={styles.resultsCol}>
          <Result keyword={keyword} />
        </main>
        <BottomNav/>
      </div>
    </>
  );
};

export default SearchPage;
