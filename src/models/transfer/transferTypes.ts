/** 백엔드 PersonInfoResponseDTO 대응 */
export type PersonInfo = {
  name: string;
  rrnFront: string;   // 앞 6자리 (YYMMDD)
};

/** extract 요청 payload (프론트 내부 표현) */
export type ExtractPayload = {
  file: File;
  /** 서버는 String(JSON)으로 받으므로 API 단에서 stringify 합니다. */
  targetInfo: Record<string, string>; // { [이름]: 'YYMMDD-#' }
};

/** extract 응답 */
export type ExtractResponse = PersonInfo[];

/** 양도 완료(승인) 요청 DTO - 백엔드 UpdateTicketRequestDTO와 맞춰서 정의 */
export type UpdateTicketRequest = {
  receiverUserId?: number;
  note?: string;
  // 필요 시 백엔드 스펙에 맞춰 필드 추가
};

/* ===========================
 *  🆕 watch 응답 타입들
 * =========================== */

/** 백엔드 TransferType 추정: 가족/지인 등 (백엔드 enum과 맞추세요) */
export type TransferType = 'FAMILY' | 'OTHERS' | string;

/** 백엔드 TransferStatus (명세 주신 값과 정확히 일치) */
export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'CANCELED';

/** 백엔드 TicketTransferResponseDTO 대응 */
export type TransferWatchItem = {
  // TRANSFER
  senderId: number;
  senderName: string;
  type: TransferType;
  createdAt: string; // ISO
  status: TransferStatus | string;

  // FESTIVAL
  fname: string;
  posterFile?: string | null;
  fcltynm?: string | null;
  ticketPrice: number;

  // TICKET
  performanceDate: string; // ISO
  selectedTicketCount: number;

  // ⚠️ 만약 백엔드가 transferId도 내려주면 여기에 추가:
  // transferId?: number;
};

/** 공통 API 래퍼 */
export type ApiOk<T> = { success: true; data: T; message?: string };
export type ApiErr = { success: false; errorCode?: string; errorMessage?: string; message?: string };
export type ApiEnvelope<T> = ApiOk<T> | ApiErr | T;
