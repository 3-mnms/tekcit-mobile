import React from 'react'
import Header from '@components/common/header/Header'
import Hot from '@/components/festival/main/HotSection'
import Category from '@/components/festival/main/CategorySection'
import KakaoPopupBridge from '@/components/auth/login/KakaoPopupBridge'
import BottomNav from '@/components/festival/main/bottomnav/BottomNav'

const MainPage: React.FC = () => {
  return (
    <div>
      {typeof window !== 'undefined' && !!window.opener && <KakaoPopupBridge status="existing" />}
      <Header />
      <Hot />
      <Category />
      <BottomNav/>
    </div>
  )
}

export default MainPage
