// src/components/my/dropdown/MenuItem.tsx
import React from 'react';
import styles from './MenuItem.module.css';

interface MenuItemProps {
  label: string;
  to?: string;                      
  onClick?: () => void | Promise<void>; 
  showArrow?: boolean;
  reload?: 'assign' | 'replace';      
  newTab?: boolean;                  
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  to,
  onClick,
  showArrow = false,
  reload = 'assign',
  newTab = false,
}) => {
  const content = (
    <>
      <span>{label}</span>
      {showArrow && <span className={styles.arrow}>›</span>}
    </>
  );

  if (to) {
    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = async (e) => {
      if (!onClick) return;    
      e.preventDefault();        
      try { await onClick(); } catch { /* noop */ }

      if (newTab) {
        window.open(to, '_blank', 'noopener');
        return;
      }
      if (reload === 'replace') {
        window.location.replace(to);
      } else {
        window.location.assign(to);
      }
    };


    return (
      <a
        href={to}
        className={styles.item}
        onClick={handleClick}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={styles.item}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

export default MenuItem;
