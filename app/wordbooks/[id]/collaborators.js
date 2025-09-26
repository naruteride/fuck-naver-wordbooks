"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
	addCollaborator,
	getWordbookCollaborators,
	removeCollaborator,
} from "../../../lib/Firestore";

export default function CollaboratorsSection() {
	const params = useParams();
	const wordbookId = params?.id;
	const [list, setList] = useState([]);
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function refresh() {
		try {
			const res = await getWordbookCollaborators(wordbookId);
			setList(res);
		} catch (e) {
			setError("협업자 정보를 가져오지 못했습니다.");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (!wordbookId) return;
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wordbookId]);

	async function handleAdd(e) {
		e.preventDefault();
		setError("");
		try {
			await addCollaborator(wordbookId, email.trim());
			setEmail("");
			refresh();
		} catch (e) {
			setError(e?.message || "초대에 실패했습니다.");
		}
	}

	async function handleRemove(targetEmail) {
		setError("");
		if (!confirm(`정말 ${targetEmail} 협업자를 제거할까요?`)) return;
		try {
			await removeCollaborator(wordbookId, targetEmail);
			refresh();
		} catch (e) {
			setError("제거에 실패했습니다.");
		}
	}

	return (
		<section className="bg-white rounded shadow p-4">
			<h2 className="font-bold mb-3">협업자</h2>
			<form onSubmit={handleAdd} className="flex gap-2 mb-3">
				<input
					className="border rounded px-3 py-2 flex-1"
					type="email"
					placeholder="이메일로 초대"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<button
					type="submit"
					className="bg-blue-600 text-white rounded px-4 py-2"
				>
					초대
				</button>
			</form>
			{error && <p className="text-sm text-red-600 mb-2">{error}</p>}
			{loading ? (
				<p className="text-gray-600">불러오는 중...</p>
			) : list.length === 0 ? (
				<p className="text-gray-600">협업자가 없습니다.</p>
			) : (
				<ul className="divide-y">
					{list.map((c) => (
						<li
							key={c.id}
							className="py-3 flex items-center justify-between"
						>
							<div>
								<div className="font-medium">
									{c.displayName || c.email}
								</div>
								<div className="text-sm text-gray-600">
									{c.email}
								</div>
							</div>
							<button
								onClick={() => handleRemove(c.email)}
								className="text-red-600 hover:underline"
							>
								제거
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
