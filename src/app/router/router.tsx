import { createBrowserRouter } from 'react-router-dom'
import '../styles/index.css'
// import HomePage from "@/pages/home/index";

// main
import MainPage from '@pages/home/MainPage'
import CategoryPage from '@pages/home/CategoryPage'
import CategoryListPage from '@/pages/home/CategoryListPage'
import SearchPage from '@/pages/home/SearchPage'
import FestivalDetailPage from '@pages/festival-detail/FestivalDetailPage'

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
import NoticeDetailPage from '@/pages/my/dropdown/NoticeDetailPage'
import MyPage from '@/pages/my/MyPage'
// import Sidebar from '@components/my/sidebar/Sidebar'
import MyInfoPage from '@/pages/my/myInfo/MyInfoPage'
import DetailPage from '@/pages/my/myInfo/basicinfo/DetailPage'
import VerifyPasswordPage from '@/pages/my/myInfo/basicinfo/VerifyPasswordPage'
import EditInfoPage from '@/pages/my/myInfo/basicinfo/EditInfoPage'
import ChangePasswordPage from '@/pages/my/myInfo/changepassword/ChangePasswordPage'
import LinkedAccounts from '@/pages/my/myInfo/linkedaccount/LinkedAccountsPage'
import AddressListPage from '@/pages/my/myInfo/address/AddressListPage'
import AddressFormPage from '@/pages/my/myInfo/address/AddressFormPage'
import WithdrawPage from '@/pages/my/myInfo/withdraw/WithdrawPage'
import BookmarkPage from '@/pages/my/myInfo/bookmark/BookmarkPage'
import TicketHistoryPage from '@/pages/my/ticket/TicketHistoryPage'
import MyTicketPage from '@/pages/my/ticket/MyTicketPage'
import TicketDetailPage from '@/pages/my/ticket/TicketDetailPage'
import TransferTicketPage from '@/pages/my/ticket/TransferTicketPage'
import EntranceCheckPage from '@/pages/entrancecount/EntranceCheckPage'
import AddressDetailPage from '@/pages/my/myInfo/address/AddressDetailPage'

// transfer
import TransferPage from '@/pages/transfer/TransferPage'

// payment
import BookingPaymentPage from '@/pages/payment/BookingPaymentPage'
import TransferPaymentPage from '@/pages/payment/transfer/TransferPaymentPage'
import TransferFeePaymentPage from '@/pages/payment/transfer/TransferFeePaymentPage'
import RefundPage from '@/pages/payment/refund/RefundPage'
import WalletPointPage from '@/pages/payment/pay/WalletPointPage'
import WalletChargePage from '@/pages/payment/pay/WalletChargePage'
import ResultPage from '@/pages/payment/result/ResultPage'
import QrScannerPage from '@/pages/qr-cord/QrScannerPage'
import HostHeader from '@/components/host/hostHeader/hostHeader'
import TeckitJoinPage from '@/pages/payment/pay/TeckitJoinPage'
import BookingResultPage from '@/pages/payment/result/BookingResultPage'
import TransferResultPage from '@/pages/payment/result/TransferResultPage'

// reservation
import QueuePage from '@/pages/booking/TicketQueuePage'
import OrderPage from '@/pages/booking/TicketOrderPage'
import OrderInfoPage from '@/pages/booking/TicketOrderInfoPage'

// ai
import NearbyShowsPage from '@/pages/ai/nearby/NearbyShowsPage'
import NotFound from '@/components/shared/NotFound'
import NearbySpotPage from '@/pages/ai/nearby/NearbySpotPage'

export const router = createBrowserRouter([
  { path: '/', element: <MainPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/signup', element: <SignupPage /> },
  { path: '/category/:name', element: <CategoryPage /> },
  { path: '/category', element: <CategoryListPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/festival/:fid', element: <FestivalDetailPage /> },
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
      { path: 'notification', element: <NotificationDropdown /> },
      { path: 'notification/:id', element: <NoticeDetailPage /> },
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
              { path: ':id', element: <AddressDetailPage /> },
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
          { path: 'detail/:reservationNumber', element: <TicketDetailPage /> },
          {
            path: 'transfer',
            children: [
              { path: '', element: <TransferTicketPage /> },
              { path: ':reservationNumber', element: <TransferPage /> },
            ],
          },
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

  // payment
  {
    path: '/payment',
    children: [
      { path: '', element: <BookingPaymentPage /> },
      { path: 'result', element: <ResultPage /> },
      { path: 'booking-result', element: <BookingResultPage/> },
      {
        path: 'wallet/join', // 최종 경로: /payment/wallet/join
        element: <TeckitJoinPage />,
      },
      {
        path: 'transfer',
        children: [
          { path: '', element: <TransferPaymentPage /> },
          { path: 'transfer-fee', element: <TransferFeePaymentPage /> },
          { path: 'result', element: <TransferResultPage/> },
        ],
      },
      {
        path: 'refund/:paymentId',
        children: [{ path: '', element: <RefundPage /> }],
      },
      {
        path: 'wallet-point',
        children: [
          { path: '', element: <WalletPointPage /> },
          { path: 'money-charge', element: <WalletChargePage /> },
        ],
      },
    ],
  },
  {
    path: '/reservation',
    children: [
      { path: ':fid/queue', element: <QueuePage /> },
      { path: ':fid', element: <OrderPage /> },
      { path: ':fid/order-info', element: <OrderInfoPage /> },
    ],
  },
  {
    path: '/host',
    element: <HostHeader title="관리자모드" />,
    children: [
      { index: true, element: <EntranceCheckPage /> },
      { path: 'qr-scanner', element: <QrScannerPage /> },
    ],
  },

  {
    path: 'nearby',
    children: [
      { path: '', element: <NearbyShowsPage /> },
      { path: 'spot/:fid', element: <NearbySpotPage  /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
