import React, { useEffect, useRef, useState, useCallback } from 'react';
import FilterPanel from './FilterPanel';
import styles from './FilterModal.module.css';

type Props = { open: boolean; onClose: () => void };

const CLOSE_THRESHOLD_PX = 90;    
const START_ZONE_PX = 24;         
const MAX_DRAG_PX = 320;          

const FilterModal: React.FC<Props> = ({ open, onClose }) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const startYRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const draggingRef = useRef<boolean>(false);
  const [dragY, setDragY] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // 드래그 시작 가능한지 체크: 핸들이나 상단 영역, 혹은 내용 스크롤이 맨 위일 때
  const canStartFrom = useCallback((target: EventTarget | null) => {
    const node = target as Node | null;
    const inHandle = handleRef.current ? handleRef.current.contains(node) : false;
    if (inHandle) return true;

    const sheet = sheetRef.current;
    if (!sheet) return false;

    // 시트 상단에서 시작했는지
    const rect = sheet.getBoundingClientRect();
    // 터치 좌표는 onTouchStart에서만 알 수 있으므로 여기선 상단 zone은 이후에 별도 체크

    // 내용 스크롤이 맨 위인가?
    const bodyEl = bodyRef.current;
    const atTop = bodyEl ? bodyEl.scrollTop <= 0 : true;

    return atTop;
  }, []);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!open) return;

    if (!canStartFrom(e.target)) return;

    const touch = e.touches[0];
    const startY = touch.clientY;

    // 시트 상단 zone 체크
    const sheet = sheetRef.current;
    if (sheet) {
      const rect = sheet.getBoundingClientRect();
      if (startY - rect.top > START_ZONE_PX && !(handleRef.current?.contains(e.target as Node))) {
        // 상단 영역(또는 핸들)에서 시작하지 않았고, 내용 스크롤이 맨 위도 아니라면 무시
        const bodyEl = bodyRef.current;
        if (bodyEl && bodyEl.scrollTop > 0) return;
      }
    }

    draggingRef.current = true;
    startYRef.current = startY;
    lastYRef.current = startY;
    startTimeRef.current = performance.now();
    setDragY(0);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!draggingRef.current) return;

    const touch = e.touches[0];
    const dy = Math.max(0, Math.min(MAX_DRAG_PX, touch.clientY - startYRef.current));

    // 내용 스크롤이 위로 당겨질 때만 드래그 허용: 위로 올리는(음수) 제스처는 무시
    if (dy <= 0) return;

    // 드래그 중에는 내부 스크롤을 막기
    e.preventDefault();

    lastYRef.current = touch.clientY;
    setDragY(dy);
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const dy = Math.max(0, dragY);
    const duration = performance.now() - startTimeRef.current;
    const velocity = dy / Math.max(1, duration); // px per ms

    // 빠르게 내리면 적은 거리에서도 닫기(플릭)
    const flickToClose = velocity > 0.6 && dy > 40;

    if (dy > CLOSE_THRESHOLD_PX || flickToClose) {
      // 닫기 애니메이션을 위해 잠깐 더 내려주고 close
      setDragY(Math.min(MAX_DRAG_PX, Math.max(dy, CLOSE_THRESHOLD_PX + 40)));
      // transition 끝난 뒤 닫기 (애니메이션 180ms와 비슷하게)
      window.setTimeout(() => {
        setDragY(0);
        onClose();
      }, 160);
    } else {
      // 원위치
      setDragY(0);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${dragY > 0 ? styles.dragging : ''}`}
        role="document"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined }}
      >
        <div ref={handleRef} className={styles.handle} />
        <div className={styles.sheetHeader}>
          <strong>필터</strong>
        </div>

        <div ref={bodyRef} className={styles.sheetBody}>
          <FilterPanel onApplied={onClose} onReset={onClose} />
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
