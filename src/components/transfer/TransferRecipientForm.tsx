// src/components/transfer/TransferRecipientForm.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import styles from './TransferRecipientForm.module.css';
import Button from '@/components/common/button/Button';
import IdSearchModal, { type AccountMini } from './IdSearchModal';
import { useVerifyFamilyCert, useTransferor, useRequestTransfer } from '@/models/transfer/tanstack-query/useTransfer';
import { normalizeRrn7 } from '@/shared/api/transfer/userApi';
import { useTekcitPayAccountQuery } from '@/models/transfer/tanstack-query/useTekcitPay';
import { isNoTekcitPayAccountError } from '@/shared/api/transfer/tekcitPay';
import { Users } from 'lucide-react'
import PdfCanvasPreview from './PdfCanvasPreview';

type Relation = 'FAMILY' | 'FRIEND' | null;

function toRrn7WithHyphen(input?: string): string {
  const raw = (input ?? '').toString().trim();
  const m = raw.match(/^(\d{6})-?(\d)$/);
  return m ? `${m[1]}-${m[2]}` : '';
}

function canInlinePdf(): boolean {
  const enabled = (navigator as any).pdfViewerEnabled;
  const hasMime = navigator.mimeTypes?.["application/pdf"];
  const ua = navigator.userAgent || "";
  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(ua);

  if (isMobileUA) return false;
  if (typeof enabled === "boolean") return enabled;
  return !!hasMime;
}

type Props = {
  currentName?: string;
  currentRrn7?: string;
  reservationNumber: string;
  onNext?: () => void;
};

const POPUP_WIDTH = 520;
const POPUP_HEIGHT = 720;

const TransferRecipientForm: React.FC<Props> = (props) => {
  const propName = props.currentName?.trim();
  const propRrn7 = props.currentRrn7?.trim();
  const inlineOk = useMemo(canInlinePdf, []);
  const needFetchMe = !(propName && propRrn7);
  const { data: me, isLoading: meLoading, isError: meError, error: meErr } = useTransferor({ enabled: needFetchMe });

  const donorName = propName || me?.name || '';
  const donorRrn7 = toRrn7WithHyphen(propRrn7 || normalizeRrn7(me?.residentNum) || '');

  const [relation, setRelation] = useState<Relation>(null);

  const [loginId, setLoginId] = useState<string>(''); 
  const [name, setName] = useState<string>('');       
  const [recipientRrn7, setRecipientRrn7] = useState<string>(''); 
  const [recipientId, setRecipientId] = useState<number | null>(null); 

  const [searchOpen, setSearchOpen] = useState(false);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tempUrl = useMemo(() => (tempFile ? URL.createObjectURL(tempFile) : ''), [tempFile]);

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0); // 0~100
  const [verifyDone, setVerifyDone] = useState(false);
  const [verifyOk, setVerifyOk] = useState(false);

  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: verifyFamily } = useVerifyFamilyCert();

  const { refetch: refetchAccount } = useTekcitPayAccountQuery(false);

  const { mutateAsync: requestTransfer, isPending: isRequesting } = useRequestTransfer();

  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const submittedRef = useRef(false); 

  useEffect(() => () => { if (tempUrl) URL.revokeObjectURL(tempUrl); }, [tempUrl]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (modalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = prev || '';
    return () => { document.body.style.overflow = prev || ''; };
  }, [modalOpen]);

  const isPdf = !!tempFile && /^application\/pdf$/.test(tempFile.type);
  const isImage = !!tempFile && /^image\//.test(tempFile.type);
  const needProof = relation === 'FAMILY';

  const safeLoginId = loginId ?? '';
  const safeName = name ?? '';
  const baseValid = safeLoginId.trim().length > 0 && safeName.trim().length > 0 && recipientId !== null;
  const canSubmit = baseValid && relation !== null && (!needProof || !!proofFile) && !isRequesting;

  const handleFileChange = (f?: File) => {
    if (!f) return;
    setTempFile(f);
    setModalOpen(true);
    setPreviewLoading(true);

    setExtracting(false);
    setProgress(0);
    setVerifyDone(false);
    setVerifyOk(false);
    setHintMsg(null);
    setErrorMsg(null);
  };

  const confirmFile = () => {
    if (!verifyOk) return;
    setProofFile(tempFile);
    setModalOpen(false);
  };
  const cancelFile = () => {
    setTempFile(null);
    setModalOpen(false);
    setExtracting(false);
    setProgress(0);
    setVerifyDone(false);
    setVerifyOk(false);
    setHintMsg(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    const shouldRun =
      modalOpen &&
      !previewLoading &&
      relation === 'FAMILY' &&
      !!tempFile &&
      !!donorName &&
      !!donorRrn7 &&
      !!name &&
      !!recipientRrn7;

    if (!shouldRun) return;

    let intervalId: any;
    let cancelled = false;

    const run = async () => {
      try {
        setExtracting(true);
        setHintMsg(null);
        setErrorMsg(null);
        setVerifyDone(false);
        setVerifyOk(false);

        // 가짜 진행률: 94%까지 천천히
        setProgress(8);
        intervalId = setInterval(() => {
          setProgress((prev) => (prev < 94 ? prev + 2 : prev));
        }, 120);

        const dict: Record<string, string> = {
          [donorName]: toRrn7WithHyphen(donorRrn7),
          [name]: toRrn7WithHyphen(recipientRrn7),
        };

        const result = await verifyFamily({ file: tempFile!, targetInfo: dict });
        if (cancelled) return;

        const ok = !!result?.success;
        setVerifyOk(ok);
        setVerifyDone(true);
        setProgress(100);

        setHintMsg(ok ? null : (result?.message ?? '인증에 실패했어요.'));
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'OCR 인증 실패');
          setVerifyOk(false);
          setVerifyDone(true);
          setProgress(100);
        }
      } finally {
        if (!cancelled) setExtracting(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    run();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [modalOpen, previewLoading, relation, tempFile, donorName, donorRrn7, name, recipientRrn7, verifyFamily]);

  function pickErr(e: any) {
    const status = e?.response?.status ?? e?.status;
    const code = e?.response?.data?.errorCode || e?.response?.data?.code;
    const message =
      e?.response?.data?.message ||
      e?.message ||
      '';
    return { status, code, message };
  }

  const submitRequest = async () => {
    if (submittedRef.current) return;
    if (!props.reservationNumber) {
      alert('reservationNumber가 없습니다. 상위 컴포넌트에서 전달해 주세요.');
      return;
    }
    if (recipientId == null || !relation) {
      alert('수신자 정보 또는 관계가 누락되었습니다.');
      return;
    }

    const transferType = relation === 'FAMILY' ? 'FAMILY' : 'OTHERS';

    const payload = {
      reservationNumber: props.reservationNumber,
      recipientId,
      transferType,
      senderName: donorName || '',
    };

    console.groupCollapsed(
      '%c[TransferRecipientForm] Request → /api/transfer/request',
      'color:#2563eb;font-weight:700'
    );
    console.groupEnd();

    try {
      await requestTransfer(payload);
      submittedRef.current = true;

      alert('양도요청 되었습니다.');

      console.info(
        '%c[TransferRecipientForm] ✅ requestTransfer success',
        'color:#16a34a;font-weight:700',
        { reservationNumber: props.reservationNumber, recipientId, transferType }
      );
    } catch (e: any) {
      const { status, code, message } = pickErr(e);

      const msgHasTransferOnce =
        typeof message === 'string' &&
        (message.includes('양도 1회') ||
          message.includes('이미 양도') ||
          message.includes('진행되고 있는 양도'));

      if (
        status === 409 ||
        code === 'ALREADY_TRANSFERRED' ||
        code === 'TRANSFER_ALREADY_COMPLETED' ||
        msgHasTransferOnce
      ) {
        alert('이미 양도처리된 티켓입니다.');
        console.warn('%c[TransferRecipientForm] 409 handled: already transferred', 'color:#f59e0b');
        return;
      }

      console.error(
        '%c[TransferRecipientForm] ❌ requestTransfer failed',
        'color:#b91c1c;font-weight:700',
        e
      );
      throw e;
    }
  };

  useEffect(() => {
    const onMessage = async (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      if (!ev.data || typeof ev.data !== 'object') return;

      if (ev.data.type === 'TEKCIT_PAY_ACCOUNT_CREATED') {
        try {
          const res = await refetchAccount();
          if (res?.data) {
            if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
            if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
            await submitRequest();
            props.onNext?.();
          }
        } catch {
          // 무시
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [refetchAccount, props]);

  const openTekcitPayJoinPopup = () => {
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
    const width = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
    const height = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;

    const left = dualScreenLeft + Math.max(0, (width - POPUP_WIDTH) / 2);
    const top = dualScreenTop + Math.max(0, (height - POPUP_HEIGHT) / 2);

    const url = `/payment/wallet/join?popup=1`;
    const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    popupRef.current = window.open(url, 'tekcitpay_join', features);

    // 폴링: 2초 간격으로 계정 생성 여부 확인
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = window.setInterval(async () => {
      const popup = popupRef.current;
      if (!popup || popup.closed) {
        window.clearInterval(pollTimerRef.current!);
        pollTimerRef.current = null;
        return;
      }
      try {
        const res = await refetchAccount();
        if (res?.data) {
          popup.close();
          window.clearInterval(pollTimerRef.current!);
          pollTimerRef.current = null;
          await submitRequest();
          props.onNext?.();
        }
      } catch (e) {
        // keep polling
      }
    }, 2000);
  };

  if (needFetchMe) {
    if (meLoading) return <div className={styles.card}>내 정보(양도자) 불러오는 중…</div>;
    if (meError)
      return (
        <div className={styles.card} style={{ color: '#b91c1c' }}>
          내 정보 조회 실패: {(meErr as any)?.message ?? '알 수 없는 오류'}
        </div>
      );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      if (relation === 'FAMILY') {
        // OCR까지 통과했다고 가정(파일 선택/확인 플로우)
        await submitRequest();
        props.onNext?.();
        return;
      }

      // FRIEND: 테킷페이 계정 확인 → 없으면 팝업 가입 후 자동 진행
      const res = await refetchAccount();
      if (res?.data) {
        await submitRequest();
        props.onNext?.();
        return;
      }
      if (isNoTekcitPayAccountError(res.error as any)) {
        openTekcitPayJoinPopup();
        return;
      }
      throw (res.error || new Error('계정 조회 실패'));
    } catch (err: any) {
      alert(err?.message || '양도 요청 중 오류가 발생했어요.');
    }
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h2 className={styles.title}><Users className={styles.iconTitle} aria-hidden />
        양도/환불 안내</h2>

      <div className={styles.radioRow}>
        <label className={styles.radio}>
          <input
            type="radio"
            name="relation"
            value="FAMILY"
            checked={relation === 'FAMILY'}
            onChange={() => setRelation('FAMILY')}
          />
          가족에게
        </label>
        <label className={styles.radio}>
          <input
            type="radio"
            name="relation"
            value="FRIEND"
            checked={relation === 'FRIEND'}
            onChange={() => setRelation('FRIEND')}
          />
          친구에게
        </label>
      </div>

      {/* 전송할 EMAIL */}
      <label className={styles.label}>
        전송할 EMAIL
        <div className={styles.idRow}>
          <input
            className={`${styles.inputShort} ${styles.inputAttached}`}
            value={safeLoginId}
            placeholder="이메일 검색을 해주세요."
            readOnly
            aria-readonly="true"
            onKeyDown={(e) => e.preventDefault()}
          />
          <Button type="button" className={styles.searchBtn} onClick={() => setSearchOpen(true)}>
            이메일 검색
          </Button>
        </div>
      </label>

      {/* 이름(읽기전용) */}
      <label className={styles.label}>
        이름
        <input
          className={styles.input}
          value={safeName}
          readOnly
          aria-readonly="true"
          placeholder="이메일 검색으로 자동 채워집니다"
          onKeyDown={(e) => e.preventDefault()}
        />
      </label>

      {/* 가족 증빙 업로드 */}
      {relation === 'FAMILY' && (
        <>
          <div className={styles.proofWrap}>
            <span className={styles.proofLabel}>가족증명서</span>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className={styles.fileInput}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = '';
                if (f) {
                  if (f.size > 10 * 1024 * 1024) {
                    alert('파일은 10MB 이하만 가능합니다.');
                    return;
                  }
                  const ok = /^application\/pdf$/.test(f.type) || /^image\//.test(f.type);
                  if (!ok) {
                    alert('PDF 또는 이미지 파일만 업로드할 수 있습니다.');
                    return;
                  }
                }
                handleFileChange(f);
              }}
            />

            <div className={styles.dropzone}>
              <button type="button" className={styles.fileButton} onClick={() => fileInputRef.current?.click()}>
                파일 선택
              </button>
              <span className={styles.fileHelp}>PDF 가능 · 10MB 이하</span>

            </div>
          </div>

          {proofFile && (
            <div className={styles.fileMeta}>
              <span className={styles.fileName}>{proofFile.name}</span>
              <button type="button" className={styles.clearBtn} onClick={() => setProofFile(null)}>
                제거
              </button>
            </div>
          )}
        </>
      )}

      <Button
        type="submit"
        className={`${styles.submitBtn} ${canSubmit ? '' : styles.submitBtnDisabled}`}
        disabled={!canSubmit}
      >
        {isRequesting ? '전송 중…' : '다음'}
      </Button>

      {/* ===== 파일 미리보기 + OCR 검사 모달 ===== */}
      {modalOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="ocr-modal-title">
          <div className={styles.modalCard}>
            <div id="ocr-modal-title" className={styles.modalTitle}>
              첨부파일 등록 · 인증 진행
            </div>

            {/* 스크롤/리사이즈에 안전한 flex 레이아웃 */}
            <div className={styles.modalContent}>
              <div className={styles.previewBox}>
                <div className={styles.previewArea}>
                  {isPdf ? (
                    inlineOk ? (
                      <embed
                        title="가족증명서 미리보기"
                        src={`${tempUrl}#view=FitH&zoom=page-width`}
                        type="application/pdf"
                        className={styles.previewPdf}
                        onLoad={() => setPreviewLoading(false)}
                      />
                    ) : (
                      <PdfCanvasPreview
                        fileUrl={tempUrl}
                        onReady={() => setPreviewLoading(false)}
                        className={styles.previewPdf}
                      />
                    )
                  ) : isImage ? (
                    <img
                      src={tempUrl}
                      alt="첨부 이미지 미리보기"
                      className={styles.previewImg}
                      onLoad={() => setPreviewLoading(false)}
                      onError={() => setPreviewLoading(false)}
                    />
                  ) : tempFile ? (
                    <div className={styles.previewFallback}>
                      <p>미리보기를 지원하지 않는 형식이에요.</p>
                      <p className={styles.previewFilename}>{tempFile.name}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className={styles.progressBar}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={extracting ? '인증 진행률' : '로딩 진행률'}
              >
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <div className={styles.progressText} aria-live="polite">
                {verifyDone
                  ? (verifyOk ? '두 인원 매칭 완료' : (hintMsg ?? '일치하는 인원을 찾지 못했어요'))
                  : (extracting ? '인증 중…' : '로딩 중…')}
              </div>
              {!!errorMsg && (
                <div className={styles.progressError} role="alert">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className={styles.modalBtns}>
              <Button
                className={`${styles.modalBtn} ${!verifyOk ? styles.modalBtnDisabled : ''}`}
                onClick={confirmFile}
                disabled={!verifyOk}
              >
                확인
              </Button>
              <Button className={styles.modalBtnGray} onClick={cancelFile} disabled={extracting}>
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 이메일 검색 모달 ===== */}
      <IdSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(acc: AccountMini) => {
          // 이메일/이름 세팅
          setLoginId((acc as any)?.id ?? '');
          setName((acc as any)?.name ?? '');

          // 숫자형 userId 추출
          const rawUserId =
            (acc as any)?.userId ??
            (acc as any)?.uid ??
            (acc as any)?.idNumeric ??
            null;
          setRecipientId(typeof rawUserId === 'number' ? rawUserId : Number.isFinite(Number(rawUserId)) ? Number(rawUserId) : null);

          // 주민번호 앞자리
          const rrn7Raw = (acc as any)?.rrn7 ?? (acc as any)?.residentNum ?? '';
          setRecipientRrn7(toRrn7WithHyphen(rrn7Raw));
        }}
      />
    </form>
  );
};

export default TransferRecipientForm;
