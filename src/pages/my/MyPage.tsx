// MyPageLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';

const MyPageLayout: React.FC = () => {
  return (
    <div>
      <Outlet />
      <BottomNav /> 
    </div>
  );
};

export default MyPageLayout;
