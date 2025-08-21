// MyPageLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';

const MyPageLayout: React.FC = () => {
  return (
    <div>
      <Outlet />
      <BottomNav />   {/* ✅ 마이페이지 어디서든 고정 */}
    </div>
  );
};

export default MyPageLayout;
