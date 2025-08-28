import { Metadata } from 'next';
import { RegisterFeature } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng ký - Chat App',
  description: 'Tạo tài khoản Chat App mới',
};

export default function RegisterPage() {
  return <RegisterFeature />;
}
