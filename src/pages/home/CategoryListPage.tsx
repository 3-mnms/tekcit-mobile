import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CategoryListPage.module.css';
import { useUIStore } from '@/shared/store/uiStore';
import { useQuery } from '@tanstack/react-query'
import { getFestivalCategories } from '@/shared/api/festival/festivalApi'
import '@fortawesome/fontawesome-free/css/all.min.css';
import Header from '@/components/common/header/Header';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';

const CATEGORY_ORDER = ['무용', '대중음악', '뮤지컬/연극', '클래식/국악', '서커스/마술']

const CATEGORY_ICONS: Record<string, string> = {
  '뮤지컬/연극': 'fa-masks-theater',
  '클래식/국악': 'fa-guitar',
  '대중음악': 'fa-music',
  '무용': 'fa-person-running',
  '서커스/마술': 'fa-wand-magic-sparkles',
  '복합': 'fa-layer-group',
};

const categoryMap: Record<string, string> = {
  '무용': 'dance',
  '대중음악': 'pop',
  '뮤지컬/연극': 'theater',
  '클래식/국악': 'classic',
  '서커스/마술': 'magic',
}

const CategoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { setHeader } = useUIStore();

  const { data: categories } = useQuery({
    queryKey: ['festivalCategories'],
    queryFn: getFestivalCategories,
  })

  const groupCategories = (original: string[] = []): string[] => {
    const grouped = new Set<string>()
    original.forEach((c) => {
      if (['대중무용', '무용(서양/한국무용)'].includes(c)) grouped.add('무용')
      else if (c === '대중음악') grouped.add('대중음악')
      else if (['뮤지컬', '연극'].includes(c)) grouped.add('뮤지컬/연극')
      else if (['서양음악(클래식)', '한국음악(국악)'].includes(c)) grouped.add('클래식/국악')
      else if (['서커스/마술', '미술'].includes(c)) grouped.add('서커스/마술')
      else if (c === '복합') grouped.add('복합')
    })
    return CATEGORY_ORDER.filter((cat) => grouped.has(cat))
  }

  const groupedCategories = groupCategories(categories)

  useEffect(() => {
    setHeader({
      leftIcon: 'back',       
      centerMode: 'title',    
      title: '카테고리',      
    });
  }, [setHeader]);

  return (
    <>
      <Header />
      <div className={styles.page}>
        <ul className={styles.categoryList}>
          {groupedCategories.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => navigate(`/category/${categoryMap[cat]}`)}
                className={styles.categoryButton}
              >
                <div className={styles.iconWrapper}>
                  <i className={`fa-solid ${CATEGORY_ICONS[cat]}`} />
                </div>
                <span>{cat}</span>
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