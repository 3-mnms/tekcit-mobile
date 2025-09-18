import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MenuItem.module.css'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

interface MenuItemProps {
  label: string
  to?: string
  onClick?: () => void | Promise<void>
  showArrow?: boolean
  reload?: 'assign' | 'replace'
  newTab?: boolean
  icon?: LucideIcon
  iconColor?: string           
  description?: string         
}

const isExternal = (url: string) => /^https?:\/\//i.test(url)

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  to,
  onClick,
  showArrow = false,
  reload = 'assign',
  newTab = false,
  icon: Icon,
  iconColor,
  description,
}) => {
  const navigate = useNavigate()

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async () => {
    if (onClick) {
      try { await onClick() } catch { /* noop */ }
    }
    if (!to) return

    if (newTab) {
      window.open(to, '_blank', 'noopener')
      return
    }
    if (isExternal(to)) {
      window.location.assign(to)
      return
    }
    navigate(to, { replace: reload === 'replace' })
  }

  return (
    <button
      type="button"
      className={styles.item}
      onClick={handleClick}
      style={iconColor ? ({ ['--icon-color']: iconColor } as React.CSSProperties) : undefined}
    >
      <div className={styles.left}>
        {Icon ? <Icon className={styles.icon} aria-hidden /> : null}
        <div className={styles.meta}>
          <span className={styles.label}>{label}</span>
          {description ? <span className={styles.desc}>{description}</span> : null}
        </div>
      </div>
      {showArrow && <ChevronRight className={styles.chev} aria-hidden />}
    </button>
  )
}

export default MenuItem
