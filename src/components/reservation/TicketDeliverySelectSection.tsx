// src/components/reservation/TicketDeliverySelectSection.tsx
import React from 'react';
import styles from './TicketDeliverySelectSection.module.css';

export type DeliveryMethod = 'QR' | 'PAPER';

type Props = {
  value?: DeliveryMethod | null;
  onChange?: (v: DeliveryMethod | null) => void;
  defaultValue?: DeliveryMethod;
  name?: string;
  disabled?: boolean;
  className?: string;
  available?: DeliveryMethod[] | null;     // (최우선) 직접 지정
  ticketPick?: 1 | 2 | null;               // 1(또는 null)=둘 다, 2=QR만
  loading?: boolean;
  hideUnavailable?: boolean;
};

const TicketDeliverySelectSection: React.FC<Props> = ({
  value,
  onChange,
  defaultValue,
  name = 'delivery',
  disabled = false,
  className = '',
  available = null,
  ticketPick = null,
  loading = false,
  hideUnavailable = false,
}) => {
  const [internal, setInternal] = React.useState<DeliveryMethod | null>(defaultValue ?? null);
  const current = value ?? internal;

  // 허용 세트 계산: available(최우선) → ticketPick → 모두 가능
  const allowedSet = React.useMemo<Set<DeliveryMethod>>(() => {
    if (available && available.length > 0) {
      return new Set(available);
    }
    if (ticketPick === 2) {
      return new Set<DeliveryMethod>(['QR']); // 2면 QR만
    }
    return new Set<DeliveryMethod>(['QR', 'PAPER']); // 기본: 둘 다
  }, [available, ticketPick]);

  const isAllowed = React.useCallback((m: DeliveryMethod) => allowedSet.has(m), [allowedSet]);

  // 허용 변경 시 현재 선택 불가하면 해제
  React.useEffect(() => {
    if (current && !isAllowed(current)) {
      setInternal(null);
      onChange?.(null);
    }
  }, [current, isAllowed, onChange]);

  const select = (v: DeliveryMethod) => {
    if (disabled || loading || !isAllowed(v)) return;
    setInternal(v);
    onChange?.(v);
  };

  const cx = (...tokens: Array<string | false | null | undefined>) => tokens.filter(Boolean).join(' ');

  const renderItem = (m: DeliveryMethod, label: string) => {
    const allowed = isAllowed(m);
    if (hideUnavailable && !allowed) return null;

    const active = current === m;
    const itemClass = cx(
      styles.item,
      active && styles.itemActive,
      (!allowed || disabled || loading) && styles.itemDisabled
    );

    return (
      <label key={m} className={itemClass}>
        <input
          type="radio"
          className={styles.srOnly}
          name={name}
          checked={current === m}
          onChange={() => select(m)}
          disabled={disabled || loading || !allowed}
        />
        <span className={styles.labelText}>
          {label}
          {!allowed && !loading && <span className={styles.labelUnsupported}>(미지원)</span>}
        </span>
      </label>
    );
  };

  return (
    <section className={cx(styles.section, className)}>
      <h2 className={styles.title}>티켓 수령 방법</h2>
      {loading ? (
        <div className={styles.group}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : (
        <div role="radiogroup" aria-label="티켓 수령 방법" className={styles.group}>
          {renderItem('QR', 'QR 코드(모바일)')}
          {renderItem('PAPER', '지류 티켓(실물 티켓)')}
        </div>
      )}
    </section>
  );
};

export default TicketDeliverySelectSection;
