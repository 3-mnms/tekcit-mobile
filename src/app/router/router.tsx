import { createBrowserRouter } from 'react-router-dom'
import '../styles/index.css'
// import HomePage from "@/pages/home/index";

// main
import MainPage from '@pages/home/MainPage'
import CategoryPage from '@pages/home/CategoryPage'
import SearchPage from '@/pages/home/SearchPage'
// import FestivalDetailPage from '@pages/festival-detail/FestivalDetailPage'

//auth
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import FindIdPage from '@/pages/auth/find/FindIdPage'
import FindPasswordPage from '@/pages/auth/find/FindPasswordPage'
import ResetPasswordPage from '@/pages/auth/find/ResetPasswordPage'
import KakaoSignupPage from '@/pages/auth/KakaoSignupPage'
import KakaoAuthorizeGate from '@/components/auth/signup/KakaoAuthorizeGate'

// mypage
import UserDropdown from '@/pages/my/dropdown/UserDropdown'
import NotificationDropdown from '@/pages/my/dropdown/NotificationDropdown'
import MyPage from '@/pages/my/MyPage'
// import Sidebar from '@components/my/sidebar/Sidebar'
import MyInfoPage from '@/pages/my/myInfo/MyInfoPage'
import DetailPage from '@/pages/my/myInfo/basicinfo/DetailPage'
import VerifyPasswordPage from '@/pages/my/myInfo/basicinfo/VerifyPasswordPage'
import EditInfoPage from '@/pages/my/myInfo/basicinfo/EditInfoPage'
import ChangePasswordPage from '@/pages/my/myInfo/changepassword/ChangePasswordPage'
import LinkedAccounts from '@/pages/my/myInfo/linkedaccount/LinkedAccountsPage'
import AddressListPage from '@/pages/my/myInfo/adress/AddressListPage'
import AddressFormPage from '@/pages/my/myInfo/adress/AddressFormPage'
import WithdrawPage from '@/pages/my/myInfo/withdraw/WithdrawPage'
import BookmarkPage from '@/pages/my/myInfo/bookmark/BookmarkPage'
import TicketHistoryPage from '@/pages/my/ticket/TicketHistoryPage'
import MyTicketPage from '@/pages/my/ticket/MyTicketPage'
import TicketDetailPage from '@/pages/my/ticket/TicketDetailPage'
import TransferTicketPage from '@/pages/my/ticket/TransferTicketPage'
import EntranceCheckPage from '@/pages/my/ticket/EntranceCheckPage'

export const router = createBrowserRouter([
  { path: '/', element: <MainPage /> },
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

  {
    path: '/mypage',
    element: <MyPage />,
    children: [
      { index: true, element: <UserDropdown /> },
      { path: 'notification', element: <NotificationDropdown/>},
      {
        path: 'myinfo',
        children: [
          { path: '', element: <MyInfoPage /> },
          { path: 'detail', element: <DetailPage /> },
          { path: 'detail/editinfo', element: <EditInfoPage /> },
          { path: 'changepassword', element: <ChangePasswordPage /> },
          { path: 'linkedaccount', element: <LinkedAccounts /> },
          { path: 'verifypassword', element: <VerifyPasswordPage /> },
          {
            path: 'address',
            children: [
              { path: '', element: <AddressListPage /> },
              { path: 'new', element: <AddressFormPage /> },
            ],
          },
          { path: 'withdraw', element: <WithdrawPage /> },
        ],
      },
      { path: 'bookmark', element: <BookmarkPage /> },
      {
        path: 'ticket',
        children: [
          { path: '', element: <MyTicketPage /> },
          { path: 'history', element: <TicketHistoryPage /> },
          { path: 'detail/:id', element: <TicketDetailPage /> },
          { path: 'transfer', element: <TransferTicketPage /> },
          { path: 'entrancecheck', element: <EntranceCheckPage /> },
          // {
          //   path: 'address',
          //   children: [
          //     { path: '', element: <AddressListPage /> },
          //     { path: 'new', element: <AddressFormPage /> },
          //   ],
          // },
        ],
      },
    ],
  },
])
