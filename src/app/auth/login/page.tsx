import { Metadata } from 'next';
import { LoginFormFeature } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Đăng nhập - Chat App',
  description: 'Đăng nhập vào tài khoản Chat App của bạn',
};

export default function LoginPage() {
  return <LoginFormFeature />;
}
