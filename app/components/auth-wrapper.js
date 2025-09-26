"use client";

import { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import {
	GoogleAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../lib/Firebase";

export default function AuthWrapper({ children }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-600">로딩 중...</div>
			</div>
		);
	}

	if (!user) {
		return <LoginCard />;
	}

	return children;
}

function LoginCard() {
	const [mode, setMode] = useState("login"); // "login" | "signup"
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleEmailSubmit(e) {
		e.preventDefault();
		setError("");
		setSubmitting(true);
		try {
			if (mode === "login") {
				await signInWithEmailAndPassword(auth, email, password);
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
			}
		} catch (err) {
			setError(getFriendlyAuthError(err));
		} finally {
			setSubmitting(false);
		}
	}

	async function handleGoogle() {
		setError("");
		setSubmitting(true);
		try {
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
		} catch (err) {
			setError(getFriendlyAuthError(err));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
			<div className="w-full max-w-sm bg-white rounded-lg shadow p-6">
				<h1 className="text-xl font-bold text-gray-900 mb-4 text-center">
					{mode === "login" ? "로그인" : "회원가입"}
				</h1>
				<form onSubmit={handleEmailSubmit} className="space-y-3">
					<label className="block">
						<span className="block text-sm text-gray-700">
							이메일
						</span>
						<input
							type="email"
							className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</label>
					<label className="block">
						<span className="block text-sm text-gray-700">
							비밀번호
						</span>
						<input
							type="password"
							className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</label>

					{error && (
						<div className="text-sm text-red-600">{error}</div>
					)}

					<button
						type="submit"
						className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 disabled:opacity-60"
						disabled={submitting}
					>
						{mode === "login"
							? "이메일로 로그인"
							: "이메일로 회원가입"}
					</button>
				</form>

				<div className="my-4 h-px bg-gray-200" />

				<button
					onClick={handleGoogle}
					className="w-full bg-gray-800 hover:bg-black text-white rounded py-2 disabled:opacity-60"
					disabled={submitting}
				>
					Google로 계속하기
				</button>

				<div className="mt-4 text-center text-sm text-gray-600">
					{mode === "login" ? (
						<button
							onClick={() => setMode("signup")}
							className="underline"
						>
							계정이 없나요? 회원가입
						</button>
					) : (
						<button
							onClick={() => setMode("login")}
							className="underline"
						>
							이미 계정이 있나요? 로그인
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

function getFriendlyAuthError(error) {
	const code = error?.code || "auth/unknown";
	switch (code) {
		case "auth/invalid-email":
			return "이메일 형식이 올바르지 않습니다.";
		case "auth/user-disabled":
			return "비활성화된 계정입니다.";
		case "auth/user-not-found":
			return "가입된 이메일이 아닙니다.";
		case "auth/wrong-password":
			return "비밀번호가 올바르지 않습니다.";
		case "auth/email-already-in-use":
			return "이미 사용 중인 이메일입니다.";
		case "auth/weak-password":
			return "비밀번호를 더 복잡하게 설정해 주세요.";
		default:
			return "로그인에 실패했습니다. 잠시 후 다시 시도하세요.";
	}
}
