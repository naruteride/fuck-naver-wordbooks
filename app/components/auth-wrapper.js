"use client";

import { useAuth } from "../../lib/AuthProvider";
import Login from "./login";

export default function AuthWrapper({ children }) {
	const { user, loading } = useAuth();

	// 로딩 중일 때
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	// 로그인하지 않은 경우
	if (!user) {
		return <Login />;
	}

	// 로그인한 경우
	return children;
} 