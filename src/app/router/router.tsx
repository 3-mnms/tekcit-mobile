import { createBrowserRouter } from 'react-router-dom'

// payment
import BookingPaymentPage from '@/pages/payment/BookingPaymentPage'
import TransferPaymentPage from '@/pages/payment/transfer/TransferPaymentPage'
import TransferFeePaymentPage from '@/pages/payment/transfer/TransferFeePaymentPage'
import RefundPage from '@/pages/payment/refund/RefundPage'
import WalletPointPage from '@/pages/payment/pay/WalletPointPage'
import WalletChargePage from '@/pages/payment/pay/WalletChargePage'
import ResultPage from '@/pages/payment/result/ResultPage' 

export const router = createBrowserRouter([

  // payment
  {
    path: '/payment',
    children: [
      { path: '', element: <BookingPaymentPage /> }, 
      { path: 'result', element: <ResultPage /> },
      {
        path: 'transfer',
        children: [
          { path: '', element: <TransferPaymentPage /> },
          { path: 'transfer-fee', element: <TransferFeePaymentPage /> },  
        ],
      },
      {
        path: 'refund',
        children: [
          { path: '', element: <RefundPage /> },
        ],
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
])
