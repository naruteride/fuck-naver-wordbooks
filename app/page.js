"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthProvider";
import { createWordbook, getUserWordbooks } from "../lib/Firestore";

export default function HomePage() {
	const { user } = useAuth();
	const [wordbooks, setWordbooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState("");
	const [language, setLanguage] = useState("english");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!user) return;
		(async () => {
			try {
				const list = await getUserWordbooks(user.uid);
				setWordbooks(list);
			} catch (e) {
				setError("단어장 목록을 불러오지 못했습니다.");
			} finally {
				setLoading(false);
			}
		})();
	}, [user]);

	async function handleCreate(e) {
		e.preventDefault();
		if (!name.trim()) return;
		setError("");
		setCreating(true);
		try {
			await createWordbook(name.trim(), language, user.uid);
			setName("");
			const list = await getUserWordbooks(user.uid);
			setWordbooks(list);
		} catch (e) {
			setError("단어장을 생성하지 못했습니다.");
		} finally {
			setCreating(false);
		}
	}

	return (
		<div className="py-6 sm:px-6 space-y-6">
			<section className="bg-white rounded shadow p-4">
				<h2 className="font-bold mb-3">단어장 만들기</h2>
				<form
					onSubmit={handleCreate}
					className="flex flex-col sm:flex-row gap-2"
				>
					<input
						className="border rounded px-3 py-2 flex-1"
						placeholder="단어장 이름"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<select
						className="border rounded px-3 py-2"
						value={language}
						onChange={(e) => setLanguage(e.target.value)}
					>
						<option value="english">영어</option>
						<option value="japanese">일본어</option>
					</select>
					<button
						type="submit"
						className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
						disabled={creating}
					>
						생성
					</button>
				</form>
				{error && <p className="text-sm text-red-600 mt-2">{error}</p>}
			</section>

			<section className="bg-white rounded shadow p-4">
				<h2 className="font-bold mb-3">내 단어장</h2>
				{loading ? (
					<p className="text-gray-600">불러오는 중...</p>
				) : wordbooks.length === 0 ? (
					<p className="text-gray-600">
						아직 단어장이 없습니다. 새로 만들어 보세요.
					</p>
				) : (
					<ul className="divide-y">
						{wordbooks.map((w) => (
							<li
								key={w.id}
								className="py-3 flex items-center justify-between"
							>
								<div>
									<div className="font-medium">{w.name}</div>
									<div className="text-sm text-gray-600">
										{w.language === "japanese"
											? "일본어"
											: "영어"}
									</div>
								</div>
								<Link
									href={`/wordbooks/${w.id}`}
									className="text-blue-600 hover:underline"
								>
									열기
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
