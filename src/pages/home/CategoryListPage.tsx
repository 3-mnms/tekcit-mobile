import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CategoryListPage.module.css';
import { useUIStore } from '@/shared/store/uiStore';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Header from '@/components/common/header/Header';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';


// 카테고리 이름과 URL 경로(슬러그) 맵
const CATEGORIES = {
  '뮤지컬/연극': 'theater',
  '클래식/국악': 'classic',
  '대중음악': 'pop',
  '무용': 'dance',
  '서커스/마술': 'magic',
  '복합': 'mix',
};

const CATEGORY_ICONS: Record<string, string> = {
  '뮤지컬/연극': 'fa-masks-theater',
  '클래식/국악': 'fa-guitar',
  '대중음악': 'fa-music',
  '무용': 'fa-person-running',
  '서커스/마술': 'fa-wand-magic-sparkles',
  '복합': 'fa-layer-group',
};

const CategoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { setHeader } = useUIStore();

  useEffect(() => {
    setHeader({
      leftIcon: 'back',       // 왼쪽은 '뒤로가기'
      centerMode: 'title',    // 가운데는 '제목' 모드
      title: '카테고리',        // 제목 내용은 '카테고리'
    });
  }, [setHeader]);

  return (
    <>
      <Header />
      <div className={styles.page}>
        <ul className={styles.categoryList}>
          {Object.entries(CATEGORIES).map(([name, slug]) => (
            <li key={slug}>
              <button 
                type="button" 
                onClick={() => navigate(`/category/${slug}`)} 
                className={styles.categoryButton}
              >
                <div className={styles.iconWrapper}>
                  <i className={`fa-solid ${CATEGORY_ICONS[name]}`} />
                </div>
                <span>{name}</span>
                <i className="fa-solid fa-chevron-right" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav /> 
    </>
  );
};

export default CategoryListPage;