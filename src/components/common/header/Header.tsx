// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react'
import styles from './Header.module.css'
import logo from '@shared/assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFestivalCategories } from '@shared/api/festival/FestivalApi'
import { useAuthStore } from '@shared/storage/useAuthStore'
import UserDropdown from '@/pages/my/dropdown/UserDropdown'
import '@fortawesome/fontawesome-free/css/all.min.css'

const CATEGORY_ORDER = ['무용', '대중음악', '뮤지컬/연극', '복합', '클래식/국악', '서커스/마술']

const categoryMap: Record<string, string> = {
  무용: 'dance',
  대중음악: 'pop',
  '뮤지컬/연극': 'theater',
  복합: 'mix',
  '클래식/국악': 'classic',
  '서커스/마술': 'magic',
}

const Header: React.FC = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const { isLoggedIn, user } = useAuthStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleSearch = () => {
    const q = keyword.trim()
    if (!q) return
    navigate(`/search?keyword=${encodeURIComponent(q)}&page=1`)
  }

  const { data: categories } = useQuery({
    queryKey: ['festivalCategories'],
    queryFn: getFestivalCategories,
  })

  const groupCategories = (original: string[] = []): string[] => {
    const grouped = new Set<string>()
    original.forEach((c) => {
      if (['대중무용', '무용(서양/한국무용)'].includes(c)) grouped.add('무용')
      else if (c === '대중음악') grouped.add('대중음악')
      else if (['뮤지컬', '연극'].includes(c)) grouped.add('뮤지컬/연극')
      else if (['서양음악(클래식)', '한국음악(국악)'].includes(c)) grouped.add('클래식/국악')
      else if (['서커스/마술', '미술'].includes(c)) grouped.add('서커스/마술')
      else if (c === '복합') grouped.add('복합')
    })
    return CATEGORY_ORDER.filter((cat) => grouped.has(cat))
  }

  const groupedCategories = groupCategories(categories)

  const getRoleDisplayName = () => {
    if (!user) return '사용자'
    switch (user.role) {
      case 'USER':  return `${user.name} 님`
      case 'HOST':  return '호스트 님'
      case 'ADMIN': return '관리자 님'
      default:      return '사용자 님'
    }
  }

  const isStaff = user?.role === 'ADMIN' || user?.role === 'HOST'

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img
          src={logo}
          alt="tekcit logo"
          className={styles.logo}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
        <div className={styles.categoryList}>
          {groupedCategories.map((cat) => (
            <span
              key={cat}
              className={styles.categoryItem}
              onClick={() => navigate(`/category/${categoryMap[cat]}`)}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="검색창"
            className={styles.searchInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button type="button" onClick={handleSearch} className={styles.searchButton}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>
      </div>

      <div className={styles.right} ref={dropdownRef}>
        {isLoggedIn ? (
          isStaff ? (
            // ✅ 같은 SPA 라우트로 이동
            <div className={styles.rightButton} onClick={() => navigate('/admin')}>
              <i className="fa-regular fa-user" />
              <span>관리자 페이지</span>
            </div>
          ) : (
            <>
              <div className={styles.rightButton} onClick={() => setIsDropdownOpen((p) => !p)}>
                <i className="fa-regular fa-user" />
                <span>{getRoleDisplayName()}</span>
              </div>
              {isDropdownOpen && (
                <div className={styles.dropdownWrapper}>
                  <UserDropdown />
                </div>
              )}
            </>
          )
        ) : (
          <div className={styles.rightButton} onClick={() => navigate('/login')}>
            <i className="fa-regular fa-user" />
            <span>로그인</span>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
