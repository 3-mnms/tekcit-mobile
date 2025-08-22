import React from 'react';
import styles from './MyHeader.module.css';
import { FaChevronLeft } from 'react-icons/fa6';

type Props = {
  title: string;
  onBack?: () => void;            
  right?: React.ReactNode;   
  sticky?: boolean;               
  withDivider?: boolean;        
  className?: string;
};

const MyHeader: React.FC<Props> = ({
  title,
  onBack,
  sticky = true,
  withDivider = true,
  className = '',
}) => {
  const handleBack = () => (onBack ? onBack() : window.history.back());

  return (
    <header
      className={[
        styles.header,
        sticky ? styles.sticky : '',
        withDivider ? styles.withDivider : '',
        className,
      ].join(' ')}
    >
      <button
        type="button"
        aria-label="뒤로가기"
        className={styles.backBtn}
        onClick={handleBack}
      >
        <FaChevronLeft size={16} />
      </button>

      <h1 className={styles.title}>{title}</h1>
    </header>
  );
};

export default MyHeader;
