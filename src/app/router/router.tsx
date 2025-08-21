import { createBrowserRouter } from "react-router-dom";
import '../styles/index.css';
import HomePage from "@/pages/home/index";

//auth
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import FindIdPage from '@/pages/auth/find/FindIdPage'
import FindPasswordPage from '@/pages/auth/find/FindPasswordPage'
import ResetPasswordPage from '@/pages/auth/find/ResetPasswordPage'
import KakaoSignupPage from '@/pages/auth/KakaoSignupPage'
import KakaoAuthorizeGate from '@/components/auth/signup/KakaoAuthorizeGate'

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/signup', element: <SignupPage /> },
  {
    path: '/auth/signup/kakao',
    element: <KakaoAuthorizeGate />, 
    children: [{ index: true, element: <KakaoSignupPage /> }],
  },
  { path: '/find-id', element: <FindIdPage /> },
  { path: '/find-password', element: <FindPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

]);
