import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './hostHeader.module.css';

import { logout as logoutApi } from '@/shared/api/auth/login'
import { useAuthStore } from '@/shared/storage/useAuthStore';

import { tokenStore } from '@/shared/storage/tokenStore';

type Props = {
  title: string;
  sticky?: boolean;
  withDivider?: boolean;
  className?: string;
};

const HostHeader: React.FC<Props> = ({
  title,
  sticky = true,
  withDivider = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const clearUser = useAuthStore((s) => s.clearUser)
  const [loading, setLoading] = useState(false)
  

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
        navigate('/')
      }
    }

return (
    <header
      className={[
        styles.header,
        sticky ? styles.sticky : '',
        withDivider ? styles.withDivider : '',
        className,
      ].join(' ').trim()}
    >
      <h1 className={styles.title}>{title}</h1>

      {/* 오른쪽 로그아웃 버튼 */}
      <div className={styles.right}>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="로그아웃"
        >
          {/* ✅ '로그아웃' 글자 대신 아이콘을 쏙! */}
          <i className="fa-solid fa-right-from-bracket" />
        </button>
      </div>
    </header>
  );
};

export default HostHeader;
