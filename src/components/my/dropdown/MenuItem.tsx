// src/components/my/dropdown/MenuItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './MenuItem.module.css';

interface MenuItemProps {
  label: string;
  to?: string;        
  onClick?: () => void;   
  showArrow?: boolean;   
}

const MenuItem: React.FC<MenuItemProps> = ({ label, to, onClick, showArrow = false }) => {
  const content = (
    <>
      <span>{label}</span>
      {showArrow && <span className={styles.arrow}>›</span>}
    </>
  );

  return to ? (
    <Link
      to={to}
      className={styles.item}
      onClick={onClick}
    >
      {content}
    </Link>
  ) : (
    <div
      className={styles.item}
      role={onClick ? 'button' : 'presentation'}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
    >
      {content}
    </div>
  );
};

export default MenuItem;
