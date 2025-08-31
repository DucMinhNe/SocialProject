'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import AdminSidebar from '@/features/admin/components/AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Lấy thông tin user từ Firestore để check role
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;

                        // Kiểm tra role admin
                        if (userData.role === 'ADMIN') {
                            setUser(userData);
                        } else {
                            // Không phải admin, redirect về trang chat
                            router.push('/chat');
                            return;
                        }
                    } else {
                        // User không tồn tại trong database
                        router.push('/auth/login');
                        return;
                    }
                } catch (error) {
                    console.error('Error checking admin role:', error);
                    router.push('/auth/login');
                    return;
                }
            } else {
                // Chưa đăng nhập
                router.push('/auth/login');
                return;
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex h-screen">
                {/* Sidebar */}
                <AdminSidebar 
                    user={user} 
                    isOpen={sidebarOpen} 
                    onToggle={toggleSidebar} 
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col md:ml-0">
                    {/* Header */}
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center py-4">
                                <div className="flex items-center">
                                    {/* Mobile menu button */}
                                    <button
                                        onClick={toggleSidebar}
                                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 mr-3"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                    <div>
                                        <h1 className="text-lg md:text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4">
                                    <span className="hidden sm:block text-sm text-gray-600">Xin chào, {user.name}</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <span className="text-white text-sm font-medium">
                                                {user.name[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
