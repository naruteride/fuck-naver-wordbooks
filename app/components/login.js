"use client";

import { useEffect, useRef, useState } from "react";
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../lib/Firebase";

export default function Login() {
	const uiRef = useRef(null);
	const [firebaseui, setFirebaseui] = useState(null);

	useEffect(() => {
		// 클라이언트 사이드에서만 FirebaseUI 동적 import
		const loadFirebaseUI = async () => {
			if (typeof window !== 'undefined') {
				try {
					const firebaseuiModule = await import("firebaseui");
					await import("firebaseui/dist/firebaseui.css");
					setFirebaseui(firebaseuiModule);
				} catch (error) {
					console.error("FirebaseUI 로딩 오류:", error);
				}
			}
		};

		loadFirebaseUI();
	}, []);

	useEffect(() => {
		if (!firebaseui || typeof window === 'undefined') return;

		// FirebaseUI 설정
		const uiConfig = {
			signInSuccessUrl: "/",
			signInOptions: [
				{
					provider: EmailAuthProvider.PROVIDER_ID,
					requireDisplayName: false,
				},
				GoogleAuthProvider.PROVIDER_ID,
			],
			signInFlow: "popup",
			callbacks: {
				signInSuccessWithAuthResult: () => {
					// 로그인 성공 시 페이지 새로고침
					if (typeof window !== 'undefined') {
						window.location.reload();
					}
					return false;
				},
			},
		};

		// FirebaseUI 인스턴스 생성
		if (!uiRef.current && firebaseui.auth) {
			uiRef.current = new firebaseui.auth.AuthUI(auth);
		}

		// FirebaseUI 시작
		if (uiRef.current && typeof document !== 'undefined') {
			const container = document.getElementById("firebaseui-auth-container");
			if (container) {
				if (uiRef.current.isPendingRedirect()) {
					uiRef.current.start("#firebaseui-auth-container", uiConfig);
				} else {
					uiRef.current.start("#firebaseui-auth-container", uiConfig);
				}
			}
		}

		return () => {
			if (uiRef.current) {
				uiRef.current.reset();
			}
		};
	}, [firebaseui]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						로그인
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						망할네이버단어장을 사용하려면 로그인이 필요합니다
					</p>
				</div>
				<div className="bg-white p-8 rounded-lg shadow-md">
					<div id="firebaseui-auth-container"></div>
					{!firebaseui && typeof window !== 'undefined' && (
						<div className="text-center text-gray-500">로그인 컴포넌트를 로딩 중...</div>
					)}
				</div>
			</div>
		</div>
	);
} 