// src/components/my/ticket/FilterTabs.tsx
import React from 'react';
import styles from './FilterTabs.module.css';
import { IoChevronDown } from 'react-icons/io5';

export type Tab = '전체' | '예매완료' | '예매취소' | '관람일정 조회';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
  /** 관람일정 조회 달력 열기/닫기 */
  isCalendarOpen: boolean;
  onToggleCalendar: () => void;
}

const FilterTabs: React.FC<Props> = ({ active, onChange, isCalendarOpen, onToggleCalendar }) => {
  return (
    <nav className={styles.tabs}>
      <button
        className={`${styles.tab} ${active === '전체' ? styles.active : ''}`}
        onClick={() => onChange('전체')}
      >
        전체
      </button>
      <button
        className={`${styles.tab} ${active === '예매완료' ? styles.active : ''}`}
        onClick={() => onChange('예매완료')}
      >
        예매완료
      </button>
      <button
        className={`${styles.tab} ${active === '예매취소' ? styles.active : ''}`}
        onClick={() => onChange('예매취소')}
      >
        예매취소
      </button>

      {/* 관람일정 조회: 탭 + 드롭 아이콘 */}
      <button
        className={`${styles.tab} ${active === '관람일정 조회' ? styles.active : ''}`}
        onClick={() => onChange('관람일정 조회')}
      >
        <span>관람일정 조회</span>
        <IoChevronDown
          className={`${styles.chev} ${isCalendarOpen ? styles.chevOpen : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCalendar();
          }}
          aria-label="날짜 선택 열기"
        />
      </button>
    </nav>
  );
};

export default FilterTabs;
