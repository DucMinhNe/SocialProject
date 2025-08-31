export type BlueTickStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface BlueTick {
  status: BlueTickStatus;   // Trạng thái yêu cầu
  reason: string;           // Lý do xin cấp tick
  requestedAt: Date;        // Thời điểm user gửi yêu cầu

  processedBy?: string;     // Admin xử lý
  processedAt?: Date;       // Thời điểm xử lý
  processedReason?: string; // Ghi chú lý do (duyệt hoặc từ chối)
}