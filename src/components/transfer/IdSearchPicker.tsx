import React, { useEffect, useRef, useState } from 'react';
import styles from './IdSearchPicker.module.css';
import Button from '@/components/common/Button';

export type AccountMini = { id: string; name: string };

type Props = {
  idValue: string;
  onSelect: (acc: AccountMini) => void;
  label?: string;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
  disabled?: boolean;
};

const IdSearchPicker: React.FC<Props> = ({
  idValue,
  onSelect,
  label = '전송할 EMAIL',
  placeholder = '이메일 검색으로만 입력됩니다',
  buttonLabel = '이메일 검색',
  className = '',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  // 모달 상태
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AccountMini[]>([]);
  const [sel, setSel] = useState<number>(-1);

  const emailRef = useRef<HTMLInputElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement | null;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => emailRef.current?.focus(), 0);
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', onKey);
      return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    } else prevFocusRef.current?.focus();
  }, [open]);

  const doSearch = () => {
    if (q.trim().toLowerCase() === 'demo@tekcit.com') {
      setResults([{ id: 'demo@tekcit.com', name: '이*별' }]);
      setSel(0);
    } else {
      setResults([]);
      setSel(-1);
      alert('일치하는 결과가 없습니다 (데모)');
    }
  };

  const confirm = () => {
    if (sel < 0) return;
    onSelect(results[sel]);
    setOpen(false);
  };

  return (
    <>
      <label className={`${styles.label} ${className}`}>
        {label}
        <div className={styles.row}>
          <input
            className={`${styles.input} ${styles.inputAttached}`}
            value={idValue}
            placeholder={placeholder}
            readOnly                
            aria-readonly="true"
            onKeyDown={(e) => e.preventDefault()} 
          />
          <Button
            type="button"
            className={`${styles.actionBtn} rounded-l-none px-4`}
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            {buttonLabel}
          </Button>
        </div>
      </label>

      {open && (
        <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className={styles.card} onClick={(e) => e.stopPropagation()}>
            <div className={styles.title}>이메일로 계정 검색</div>

            <label className={styles.modalLabel}>
              검색할 이메일
              <div className={styles.searchRow}>
                <input
                  ref={emailRef}
                  className={`${styles.input} ${styles.inputAttached}`}
                  placeholder="example@domain.com"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                />
                <Button type="button" className={`${styles.searchBtn} rounded-l-none px-4`} onClick={doSearch}>
                  검색
                </Button>
              </div>
            </label>

            <div className={styles.resultBox}>
              {results.length ? (
                <ul className={styles.resultList}>
                  {results.map((r, i) => (
                    <li
                      key={r.id}
                      className={`${styles.resultItem} ${sel === i ? styles.resultItemSel : ''}`}
                      onClick={() => setSel(i)}
                    >
                      ○ {r.name} / {r.id}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.resultHint}>검색 결과가 여기에 표시됩니다.</div>
              )}
            </div>

            <div className={styles.actions}>
              <Button type="button" className={`${styles.confirmBtn} px-5`} onClick={confirm} disabled={sel < 0}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IdSearchPicker;