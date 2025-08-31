'use client';

import { useState } from 'react';
import { requestBlueTick } from '@/lib/blueTickService';
import { User, BlueTick } from '@/types';

interface BlueTickVerificationProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BlueTickVerification({ user, onClose, onSuccess }: BlueTickVerificationProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do xin cấp tick xanh');
      return;
    }

    if (reason.trim().length < 20) {
      setError('Lý do phải có ít nhất 20 ký tự');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await requestBlueTick(user.id, reason.trim());
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (blueTick: BlueTick) => {
    switch (blueTick.status) {
      case 'PENDING':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3 animate-pulse"></div>
              <div>
                <h4 className="font-medium text-yellow-800">Đang chờ xét duyệt</h4>
                <p className="text-sm text-yellow-600 mt-1">
                  Yêu cầu của bạn đã được gửi và đang chờ admin xét duyệt
                </p>
                <p className="text-xs text-yellow-500 mt-2">
                  Gửi lúc: {blueTick.requestedAt.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        );
      case 'VERIFIED':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-green-800">Đã được xác minh</h4>
                <p className="text-sm text-green-600 mt-1">
                  Tài khoản của bạn đã được xác minh với tick xanh
                </p>
                {blueTick.processedAt && (
                  <p className="text-xs text-green-500 mt-2">
                    Xác minh lúc: {blueTick.processedAt.toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
              <div>
                <h4 className="font-medium text-red-800">Yêu cầu bị từ chối</h4>
                <p className="text-sm text-red-600 mt-1">
                  Yêu cầu tick xanh của bạn đã bị từ chối
                </p>
                {blueTick.processedReason && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    Lý do: {blueTick.processedReason}
                  </p>
                )}
                {blueTick.processedAt && (
                  <p className="text-xs text-red-500 mt-2">
                    Từ chối lúc: {blueTick.processedAt.toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  // Nếu user đã có blue tick request
  if (user.blueTick && user.blueTick.status) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              Tick xanh
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
            >
              ×
            </button>
          </div>

          {getStatusDisplay(user.blueTick)}

          {user.blueTick.reason && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">Lý do yêu cầu:</h5>
              <p className="text-sm text-gray-600">{user.blueTick.reason}</p>
            </div>
          )}

          {user.blueTick.status === 'REJECTED' && (
            <div className="mt-6">
              <button
                onClick={() => {
                  // Allow resubmit after rejection
                  // Reset user.blueTick to allow new request
                  onClose();
                  // You might want to implement a way to reset blueTick status
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gửi yêu cầu mới
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form để gửi yêu cầu tick xanh
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            Xin cấp tick xanh
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Tick xanh là gì?</h4>
            <p className="text-sm text-blue-600">
              Tick xanh xác minh rằng tài khoản của bạn là chính thức và đáng tin cậy. 
              Tick này thường được cấp cho người nổi tiếng, thương hiệu, tổ chức đáng chú ý.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do xin cấp tick xanh *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Vui lòng mô tả lý do bạn muốn được cấp tick xanh. Ví dụ: Tôi là người nổi tiếng/influencer, có trang web chính thức, hoặc đại diện cho một tổ chức..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối thiểu 20 ký tự. Hãy cung cấp thông tin chi tiết để tăng khả năng được duyệt.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </div>
              ) : (
                'Gửi yêu cầu'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Lưu ý:</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Yêu cầu sẽ được admin xem xét trong vòng 1-3 ngày làm việc</li>
            <li>• Chỉ được gửi một yêu cầu tại một thời điểm</li>
            <li>• Cung cấp thông tin chính xác để tăng khả năng được duyệt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
