import { createBrowserRouter } from "react-router-dom";
import '../styles/index.css';

// main
import MainPage from '@pages/home/MainPage'
import CategoryPage from '@pages/home/CategoryPage';
import SearchPage from '@/pages/home/SearchPage';
// import FestivalDetailPage from '@pages/festival-detail/FestivalDetailPage'
        
//auth
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import FindIdPage from '@/pages/auth/find/FindIdPage'
import FindPasswordPage from '@/pages/auth/find/FindPasswordPage'
import ResetPasswordPage from '@/pages/auth/find/ResetPasswordPage'
import KakaoSignupPage from '@/pages/auth/KakaoSignupPage'
import KakaoAuthorizeGate from '@/components/auth/signup/KakaoAuthorizeGate'

export const router = createBrowserRouter([
  { path: "/", element: <MainPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/signup', element: <SignupPage /> },
  { path: '/category/:name', element: <CategoryPage /> },
  { path: '/search', element: <SearchPage /> },
  // { path: "/festival/:fid", element: <FestivalDetailPage /> },
  {
    path: '/auth/signup/kakao',
    element: <KakaoAuthorizeGate />, 
    children: [{ index: true, element: <KakaoSignupPage /> }],
  },
  { path: '/find-id', element: <FindIdPage /> },
  { path: '/find-password', element: <FindPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

]);
