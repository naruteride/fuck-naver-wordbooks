"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/AuthProvider";
import {
	addWordToWordbook,
	getWordbookName,
	getWordsFromWordbook,
} from "../../../lib/Firestore";
import dynamic from "next/dynamic";

const CollaboratorsSection = dynamic(() => import("./collaborators"), { ssr: false });

export default function WordbookDetailPage() {
	const params = useParams();
	const wordbookId = params?.id;
	const { user } = useAuth();

	const [name, setName] = useState("");
	const [loading, setLoading] = useState(true);
	const [list, setList] = useState([]);
	const [error, setError] = useState("");

	// 공통 필드
	const [meanings, setMeanings] = useState("");
	const [examples, setExamples] = useState("");

	// 영어 전용
	const [spelling, setSpelling] = useState("");
	const [pronunciation, setPronunciation] = useState("");

	// 일본어 전용
	const [kanji, setKanji] = useState("");
	const [onyomi, setOnyomi] = useState("");
	const [kunyomi, setKunyomi] = useState("");

	const language = useMemo(() => {
		// 간단: 단어 데이터의 첫 아이템을 보고 유추, 없으면 영어 기본
		if (list.length > 0) {
			return list[0].spelling ? "english" : "japanese";
		}
		return "english";
	}, [list]);

	useEffect(() => {
		if (!wordbookId) return;
		(async () => {
			try {
				const title = await getWordbookName(wordbookId);
				setName(title);
				const words = await getWordsFromWordbook(wordbookId);
				setList(words);
			} catch (e) {
				setError("단어장을 불러오지 못했습니다.");
			} finally {
				setLoading(false);
			}
		})();
	}, [wordbookId]);

	async function handleAddWord(e) {
		e.preventDefault();
		setError("");
		try {
			if (language === "english") {
				await addWordToWordbook(
					{
						spelling: spelling || undefined,
						pronunciation: pronunciation || undefined,
						meanings: splitLines(meanings),
						examples: splitLines(examples),
					},
					wordbookId,
					user.uid
				);
			} else {
				await addWordToWordbook(
					{
						kanji: kanji || undefined,
						onyomi: splitLines(onyomi),
						kunyomi: splitLines(kunyomi),
						meanings: splitLines(meanings),
						examples: splitLines(examples),
					},
					wordbookId,
					user.uid
				);
			}

			// reset and refresh list
			setSpelling("");
			setPronunciation("");
			setKanji("");
			setOnyomi("");
			setKunyomi("");
			setMeanings("");
			setExamples("");

			const words = await getWordsFromWordbook(wordbookId);
			setList(words);
		} catch (e) {
			setError("단어를 추가하지 못했습니다.");
		}
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold">{name || "단어장"}</h1>
				<Link href="/" className="text-blue-600 hover:underline">← 목록으로</Link>
			</div>

			<section className="bg-white rounded shadow p-4">
				<h2 className="font-bold mb-3">단어 추가</h2>
				<form onSubmit={handleAddWord} className="space-y-2">
					{language === "english" ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<input
								className="border rounded px-3 py-2"
								placeholder="스펠링"
								value={spelling}
								onChange={(e) => setSpelling(e.target.value)}
							/>
							<input
								className="border rounded px-3 py-2"
								placeholder="발음"
								value={pronunciation}
								onChange={(e) => setPronunciation(e.target.value)}
							/>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
							<input
								className="border rounded px-3 py-2"
								placeholder="한자"
								value={kanji}
								onChange={(e) => setKanji(e.target.value)}
							/>
							<input
								className="border rounded px-3 py-2"
								placeholder="음독 (줄바꿈으로 여러 개)"
								value={onyomi}
								onChange={(e) => setOnyomi(e.target.value)}
							/>
							<input
								className="border rounded px-3 py-2"
								placeholder="훈독 (줄바꿈으로 여러 개)"
								value={kunyomi}
								onChange={(e) => setKunyomi(e.target.value)}
							/>
						</div>
					)}

					<textarea
						className="border rounded px-3 py-2 w-full"
						placeholder="한국어 뜻 (줄바꿈으로 여러 개)"
						rows={3}
						value={meanings}
						onChange={(e) => setMeanings(e.target.value)}
					/>
					<textarea
						className="border rounded px-3 py-2 w-full"
						placeholder="예문 (줄바꿈으로 여러 개)"
						rows={3}
						value={examples}
						onChange={(e) => setExamples(e.target.value)}
					/>
					<button
						type="submit"
						className="bg-blue-600 text-white rounded px-4 py-2"
					>
						추가
					</button>
					{error && <p className="text-sm text-red-600">{error}</p>}
				</form>
			</section>

			<section className="bg-white rounded shadow p-4">
				<h2 className="font-bold mb-3">단어 목록</h2>
				{loading ? (
					<p className="text-gray-600">불러오는 중...</p>
				) : list.length === 0 ? (
					<p className="text-gray-600">아직 단어가 없습니다. 위에서 추가하세요.</p>
				) : (
					<ul className="divide-y">
						{list.map((w) => (
							<li key={w.id} className="py-3">
								<WordRow w={w} />
							</li>
						))}
					</ul>
				)}
			</section>

			<CollaboratorsSection />
		</div>
	);
}

function WordRow({ w }) {
	if (w.spelling) {
		return (
			<div>
				<div className="font-medium">{w.spelling}</div>
				{w.pronunciation && (
					<div className="text-sm text-gray-600">{w.pronunciation}</div>
				)}
				<WordCommon w={w} />
			</div>
		);
	}

	return (
		<div>
			<div className="font-medium">{w.kanji}</div>
			{(w.onyomi?.length || 0) > 0 && (
				<div className="text-sm text-gray-600">음독: {w.onyomi.join(", ")}</div>
			)}
			{(w.kunyomi?.length || 0) > 0 && (
				<div className="text-sm text-gray-600">훈독: {w.kunyomi.join(", ")}</div>
			)}
			<WordCommon w={w} />
		</div>
	);
}

function WordCommon({ w }) {
	return (
		<div className="mt-1 space-y-1">
			{(w.meanings?.length || 0) > 0 && (
				<div className="text-sm">뜻: {w.meanings.join(", ")}</div>
			)}
			{(w.examples?.length || 0) > 0 && (
				<div className="text-sm text-gray-700">예문: {w.examples.join(" | ")}</div>
			)}
		</div>
	);
}

function splitLines(value) {
	return value
		.split(/\r?\n/)
		.map((v) => v.trim())
		.filter(Boolean);
}


