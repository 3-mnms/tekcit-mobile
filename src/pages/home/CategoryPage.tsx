import React, {useEffect} from 'react';
import Header from '@components/common/header/Header'; // 실제 Header 경로에 맞게 수정해줘
import Hot from '@/components/festival/main/HotSection';
import Category from '@/components/festival/main/CategorySection';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';
import { useUIStore } from '@/shared/store/uiStore';
import { useParams } from 'react-router-dom';

const SLUG_TO_NAME: Record<string, string> = {
  theater: '뮤지컬/연극',
  classic: '클래식/국악',
  pop: '대중음악',
  dance: '무용',
  magic: '서커스/마술',
  mix: '복합',
};

const CategoryPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const { setHeader } = useUIStore();
  
  useEffect(() => {
    const categoryTitle = name ? SLUG_TO_NAME[name] : '카테고리';

    setHeader({
      leftIcon: 'logo',       // 왼쪽은 '뒤로가기'
      centerMode: 'title',    // 가운데는 '제목' 모드
      title: categoryTitle,
    });
   }, [name, setHeader]);

  return (
    <div>
      <Header />
      <Hot />
      <Category />
      <BottomNav/>
    </div>
  );
};

export default CategoryPage;