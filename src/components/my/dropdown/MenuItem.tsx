// src/components/my/dropdown/MenuItem.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MenuItem.module.css';

interface MenuItemProps {
  label: string;
  to?: string;                      
  onClick?: () => void | Promise<void>; 
  showArrow?: boolean;
  replace?: boolean;   
  newTab?: boolean;                  
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  to,
  onClick,
  showArrow = false,
  replace = false,
  newTab = false,
}) => {
  const navigate = useNavigate();

  const content = (
    <>
      <span>{label}</span>
      {showArrow && <span className={styles.arrow}>›</span>}
    </>
  );

  if (to) {
    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = async (e) => {
      if (!onClick && !newTab) return;    
      e.preventDefault();        

      try { 
        if (onClick) await onClick(); 
      } catch { /* noop */ }

      navigate(to, { replace });
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
