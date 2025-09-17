import React, { useState, useMemo } from 'react'
import styles from './UserDropdown.module.css'
import PointBox from '@components/my/dropdown/PointBox'
import MenuItem from '@components/my/dropdown/MenuItem'
import { User, Lock, MapPin, UserX, Ticket, ArrowRightLeft, Heart, LogOut } from 'lucide-react'
import { HiOutlineSpeakerphone } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

import { logout as logoutApi } from '@/shared/api/auth/login'
import { useAuthStore } from '@/shared/storage/useAuthStore'
import Spinner from '@/components/common/spinner/Spinner'
import { sidebarItems } from '@/components/my/sidebar/Sidebar'

const UserDropdown: React.FC = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [loading, setLoading] = useState(false)
  const userName = useAuthStore((s) => s.user?.name) || '사용자명'

  // TODO: 실제 안읽음 여부 연동
  const hasUnread = false

  const handleAlarmClick = () => {
    navigate('./notification')
  }

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      await logoutApi()
    } catch (e) {
      console.error('logout failed (server):', e)
    } finally {
      logout()
      setLoading(false)
      alert('로그아웃!')
      navigate('/login')
    }
  }

  const sections = useMemo(() => {
    return sidebarItems.map((p) => ({
      parent: p.label,
      items: p.children?.map((c) => ({ label: c.label, path: c.path })),
      path: p.path,
    }))
  }, [])

  return (
    <div className={styles.dropdown} role="menu" aria-label="사용자 드롭다운">
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.userBox}>
          <div className={styles.avatar} aria-hidden>
            <User className={styles.avatarIcon} />
          </div>
          <div className={styles.usernameWrap}>
            <span className={styles.username}>{userName}</span>
          </div>
        </div>

        <button
          className={`${styles.iconBtn} ${hasUnread ? styles.hasUnread : ''}`}
          onClick={handleAlarmClick}
          aria-label="알림"
        >
          <HiOutlineSpeakerphone className={styles.icon} />
          <span className={styles.unreadDot} aria-hidden />
        </button>
      </div>

      {/* 포인트 카드 */}
      <PointBox />

      {/* 섹션 + 아이템 */}
      <div className={styles.menuGroupWrap}>
        {sections.map((sec) => (
          <div key={sec.parent} className={styles.menuSection}>
            <div className={styles.parentLabel}>
              <span>{sec.parent}</span>
            </div>

            {sec.items?.map((it, idx) => (
              <MenuItem
                key={`${it.label}-${idx}`}
                label={it.label}
                to={it.path}
                showArrow
                icon={
                  it.label === '기본정보' ? User :
                    it.label === '비밀번호 변경' ? Lock :
                      it.label === '배송지 관리' ? MapPin :
                        it.label === '회원 탈퇴' ? UserX :
                          it.label === '예매 / 취소 내역' ? Ticket :
                            it.label === '양도' ? ArrowRightLeft :
                              it.label === '관심목록' ? Heart :
                                undefined
                }
                description={
                  it.label === '예매 / 취소 내역' ? '' :
                    it.label === '양도' ? '' :
                      it.label === '관심목록' ? '' :
                        undefined
                }
              />
            ))}

            {!sec.items && (
              <MenuItem
                key={sec.parent}
                label={sec.parent}
                to={sec.path}
                showArrow
              />
            )}
          </div>
        ))}
      </div>

      {loading && <Spinner />}
      <button
        className={styles.logoutButton}
        onClick={handleLogout}
        disabled={loading}
        aria-busy={loading}
      >
        <LogOut />
        로그아웃
      </button>
    </div>
  )
}

export default UserDropdown
