import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MenuItem.module.css';

interface MenuItemProps {
  label: string;
  to?: string;
  onClick?: () => void | Promise<void>;
  showArrow?: boolean;
  reload?: 'assign' | 'replace';
  newTab?: boolean;
}

const isExternal = (url: string) => /^https?:\/\//i.test(url);

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  to,
  onClick,
  showArrow = false,
  reload = 'assign',
  newTab = false,
}) => {
  const navigate = useNavigate();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    if (onClick) {
      try { await onClick(); } catch {/* noop */}
    }

    if (!to) return;

    if (newTab) {
      window.open(to, '_blank', 'noopener');
      return;
    }

    if (isExternal(to)) {
      window.location.assign(to);
      return;
    }

    navigate(to, { replace: reload === 'replace' });
  };

  return (
    <button type="button" className={styles.item} onClick={handleClick}>
      <span>{label}</span>
      {showArrow && <span className={styles.arrow}>›</span>}
    </button>
  );
};

export default MenuItem;
