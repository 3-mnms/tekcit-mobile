// src/components/festival/search/FilterModal.tsx
import React, { useEffect } from 'react';
import FilterPanel from './FilterPanel';
import styles from './FilterModal.module.css';

type Props = { open: boolean; onClose: () => void };

const FilterModal: React.FC<Props> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    // ↓ 백드롭을 클릭하면 닫히게
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      {/* ↓ 시트 내부 클릭은 전파 막기 (닫히지 않게) */}
      <div className={styles.sheet} role="document" onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.sheetHeader}>
          <strong>필터</strong>
          {/* <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">닫기</button> */}
        </div>

        <div className={styles.sheetBody}>
          {/* 적용/초기화 후 닫히도록 콜백 전달 */}
          <FilterPanel onApplied={onClose} onReset={onClose} />
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
