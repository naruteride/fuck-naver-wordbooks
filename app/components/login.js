"use client";

import { useEffect, useRef } from "react";
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { auth } from "../../lib/Firebase";

export default function Login() {
	const uiRef = useRef(null);

	useEffect(() => {
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
					window.location.reload();
					return false;
				},
			},
		};

		// FirebaseUI 인스턴스 생성
		if (!uiRef.current) {
			uiRef.current = new firebaseui.auth.AuthUI(auth);
		}

		// FirebaseUI 시작
		if (uiRef.current.isPendingRedirect()) {
			uiRef.current.start("#firebaseui-auth-container", uiConfig);
		} else {
			uiRef.current.start("#firebaseui-auth-container", uiConfig);
		}

		return () => {
			if (uiRef.current) {
				uiRef.current.reset();
			}
		};
	}, []);

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
				</div>
			</div>
		</div>
	);
} 