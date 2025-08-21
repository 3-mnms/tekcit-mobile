import React from 'react';
import Header from '@components/common/header/Header'; // 실제 Header 경로에 맞게 수정해줘
import Hot from '@/components/festival/main/HotSection';
import Category from '@/components/festival/main/CategorySection';

const MainPage: React.FC = () => {
    
  return (
    <div>
      <Header />
      <Hot />
      <Category />
    </div>
  );
};

export default MainPage;