"use client";

import { signOut } from "firebase/auth";
import { auth } from "../../lib/Firebase";
import { useAuth } from "../../lib/AuthProvider";

export default function LogoutButton() {
	const { user } = useAuth();

	const handleLogout = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			console.error("로그아웃 오류:", error);
		}
	};

	if (!user) return null;

	return (
		<div className="flex items-center space-x-4">
			<span className="text-sm text-gray-700">
				{user.email || user.displayName || "사용자"}님
			</span>
			<button
				onClick={handleLogout}
				className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
			>
				로그아웃
			</button>
		</div>
	);
} 