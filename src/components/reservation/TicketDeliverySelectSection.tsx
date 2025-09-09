// src/components/reservation/TicketDeliverySelectSection.tsx
import React from 'react';

export type DeliveryMethod = 'QR' | 'PAPER';

type Props = {
  value?: DeliveryMethod | null;                 // 제어형 값
  onChange?: (v: DeliveryMethod | null) => void; // 변경 콜백
  defaultValue?: DeliveryMethod;                 // 비제어 기본값
  name?: string;                                 // 라디오 name
  disabled?: boolean;                            // 전체 비활성
  className?: string;                            // 외부 클래스
  available?: DeliveryMethod[] | null;           // 사용 가능 목록 (null이면 모두 가능)
  loading?: boolean;                             // 로딩 시 스켈레톤 표시
  hideUnavailable?: boolean;                     // 미지원 항목 숨김
};

const TicketDeliverySelectSection: React.FC<Props> = ({
  value,
  onChange,
  defaultValue,
  name = 'delivery',
  disabled = false,
  className = '',
  available = null,
  loading = false,
  hideUnavailable = false,
}) => {
  // 비제어 내부 상태 (제어형이면 value 우선)
  const [internal, setInternal] = React.useState<DeliveryMethod | null>(
    defaultValue ?? null
  );
  const current = value ?? internal;

  // 허용 여부
  const isAllowed = React.useCallback(
    (m: DeliveryMethod) => (available ? available.includes(m) : true),
    [available]
  );

  // available 변경 시 현재 선택이 불가해지면 해제
  React.useEffect(() => {
    if (current && !isAllowed(current)) {
      setInternal(null);
      onChange?.(null);
    }
  }, [available, current, isAllowed, onChange]);

  // 선택 핸들러
  const select = (v: DeliveryMethod) => {
    if (disabled || loading || !isAllowed(v)) return;
    setInternal(v);
    onChange?.(v);
  };

  // 라벨 스타일 생성
  const itemCls = (active: boolean, allowed: boolean) =>
    [
      'flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors',
      active ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-400',
      (!allowed || disabled || loading) ? 'opacity-50 cursor-not-allowed' : '',
    ]
      .filter(Boolean)
      .join(' ');

  // 항목 렌더
  const renderItem = (m: DeliveryMethod, label: string) => {
    const allowed = isAllowed(m);
    if (hideUnavailable && !allowed) return null;

    return (
      <label key={m} className={itemCls(current === m, allowed)}>
        <input
          type="radio"
          className="sr-only"
          name={name}
          checked={current === m}
          onChange={() => select(m)}
          disabled={disabled || loading || !allowed}
        />
        <span className="text-sm font-medium">
          {label}
          {!allowed && !loading && (
            <span className="ml-1 text-xs text-gray-500">(미지원)</span>
          )}
        </span>
      </label>
    );
  };

  return (
    <section className={['w-full rounded-2xl border p-5 bg-white', className].join(' ')}>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">티켓 수령 방법</h2>

      {loading ? (
        <div className="grid gap-2">
          <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-10 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <div role="radiogroup" aria-label="티켓 수령 방법" className="grid gap-2">
          {renderItem('QR', 'QR 코드(모바일)')}
          {renderItem('PAPER', '지류 티켓(실물 티켓)')}
        </div>
      )}
    </section>
  );
};

export default TicketDeliverySelectSection;
