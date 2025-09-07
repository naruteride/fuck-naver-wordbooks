"use client";

import { signOut } from "firebase/auth";
import { auth } from "../../lib/Firebase";

export default function LogoutButton() {
	async function handleLogout() {
		try {
			await signOut(auth);
		} catch (e) {
			console.error(e);
		}
	}

	return (
		<button
			onClick={handleLogout}
			className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
		>
			로그아웃
		</button>
	);
}


