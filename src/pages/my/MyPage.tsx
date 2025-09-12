// MyPageLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/festival/main/bottomnav/BottomNav';
import TikiChatWidget from '@/components/ai/chatbot/TikiChatWidget';

const MyPageLayout: React.FC = () => {
  return (
    <div>
      <TikiChatWidget />
      <Outlet />
      <BottomNav /> 
    </div>
  );
};

export default MyPageLayout;
