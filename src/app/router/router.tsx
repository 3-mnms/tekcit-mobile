import { createBrowserRouter } from "react-router-dom";
// main
import MainPage from '@pages/home/MainPage'
import CategoryPage from '@pages/home/CategoryPage';
import SearchPage from '@/pages/home/SearchPage';
// import FestivalDetailPage from '@pages/festival-detail/FestivalDetailPage'

export const router = createBrowserRouter([
  { path: '/', element: <MainPage /> },
  { path: '/category/:name', element: <CategoryPage /> },
  { path: '/search', element: <SearchPage /> },
  // { path: "/festival/:fid", element: <FestivalDetailPage /> },
  // { path: '/login', element: <LoginPage /> },
  // { path: '/auth/signup', element: <SignupPage /> },
])
