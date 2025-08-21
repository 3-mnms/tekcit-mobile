// src/components/my/dropdown/UserDropdown.tsx
import React, { useState, useMemo } from 'react'
import styles from './UserDropdown.module.css'
import PointBox from '@components/my/dropdown/PointBox'
import MenuItem from '@components/my/dropdown/MenuItem'
import { HiOutlineSpeakerphone } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

import { logout as logoutApi } from '@/shared/api/auth/login'
import { tokenStore } from '@/shared/storage/tokenStore'
import { useAuthStore } from '@/shared/storage/useAuthStore'

import { sidebarItems } from '@/components/my/sidebar/Sidebar'

const UserDropdown: React.FC = () => {
  const navigate = useNavigate()
  const clearUser = useAuthStore((s) => s.clearUser)
  const [loading, setLoading] = useState(false)

  const handleAlarmClick = () => {
    alert('알림 클릭됨!')
  }

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      await logoutApi()
    } catch (e) {
      console.error('logout failed (server):', e)
    } finally {
      tokenStore.clear()
      clearUser()
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
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <div className={styles.usernameWrap}>
          <span className={styles.username}>사용자명</span>
        </div>
        <button className={styles.alarmButton} onClick={handleAlarmClick} aria-label="알림">
          <HiOutlineSpeakerphone className={styles.alarmIcon} />
        </button>
      </div>

      <PointBox />

      <div className={styles.menuGroupWrap}>
        {sections.map((sec) => (
          <div key={sec.parent} className={styles.menuSection}>
            <div className={styles.parentLabel}>{sec.parent}</div>
            {sec.items?.map((it) => (
              <MenuItem key={it.label} label={it.label} to={it.path} showArrow />
            ))}
            {!sec.items && <MenuItem key={sec.parent} label={sec.parent} to={sec.path} showArrow />}
          </div>
        ))}
      </div>

      <button className={styles.logoutButton} onClick={handleLogout} disabled={loading}>
        {loading ? '로그아웃 중...' : '로그아웃'}
      </button>
    </div>
  )
}

export default UserDropdown
