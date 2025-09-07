"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/AuthProvider";
import {
	addWordToWordbook,
	getWordbookName,
	getWordsFromWordbook,
	getUserWordStats,
	updateStudyCount,
	getAllUserWordStats,
	getWordbookCollaborators,
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
	const [stats, setStats] = useState({}); // { [wordId]: { studyCount, lastStudiedAt } }
	const [collaborators, setCollaborators] = useState([]); // [{id,email,displayName}]
	const [allStats, setAllStats] = useState({}); // { [wordId]: { [userId]: {studyCount,lastStudiedAt} } }
	const [useForgetting, setUseForgetting] = useState(false);
	const [sort, setSort] = useState("none"); // none | random | asc
	const [revealed, setRevealed] = useState({}); // { [wordId]: boolean }
	const [isAllStatsVisible, setIsAllStatsVisible] = useState(false); // boolean

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

	const displayList = useMemo(() => {
		let items = [...list];
		if (useForgetting) {
			items = items.filter((w) => shouldShowNow(w, stats));
		}
		if (sort === "asc") {
			items.sort(compareAsc(language));
		} else if (sort === "random") {
			items.sort(compareRandomStable);
		}
		return items;
	}, [list, stats, useForgetting, sort, language]);

function compareAsc(language) {
    return (a, b) => {
        const getKey = (w) => (language === "english" ? (w.spelling || "") : (w.kanji || ""));
        return getKey(a).localeCompare(getKey(b));
    };
}

function compareRandomStable() {
    return Math.random() - 0.5;
}

function shouldShowNow(word, stats) {
    const s = stats[word.id];
    if (!s) return true;
    const count = s.studyCount || 0;
    const last = s.lastStudiedAt ? new Date(s.lastStudiedAt) : new Date();
    const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (count === 0) return true;
    if (count === 1) return diffDays >= 1;
    if (count === 2) return diffDays >= 2;
    if (count === 3) return diffDays >= 3;
    if (count === 4) return diffDays >= 7;
    return diffDays >= 30;
}

	useEffect(() => {
		if (!wordbookId) return;
		(async () => {
			try {
				const title = await getWordbookName(wordbookId);
				setName(title);
				const words = await getWordsFromWordbook(wordbookId);
				setList(words);
				if (user) {
					const s = await getUserWordStats(wordbookId, user.uid);
					setStats(s);
				}
			} catch (e) {
				setError("단어장을 불러오지 못했습니다.");
			} finally {
				setLoading(false);
			}
		})();
	}, [wordbookId, user]);

	useEffect(() => {
		if (!wordbookId) return;
		(async () => {
			try {
				const cols = await getWordbookCollaborators(wordbookId);
				setCollaborators(cols);
			} catch {
				// ignore
			}
		})();
	}, [wordbookId]);

	async function handleAddWord(e) {
		e.preventDefault();
		setError("");
		try {
			let newId;
			if (language === "english") {
				newId = await addWordToWordbook(
					{
						spelling: spelling || undefined,
						pronunciation: pronunciation || undefined,
						meanings: splitLines(meanings),
						examples: splitLines(examples),
					},
					wordbookId,
					user.uid
				);
				setList((prev) => [
					{
						id: newId,
						spelling: spelling || undefined,
						pronunciation: pronunciation || undefined,
						meanings: splitLines(meanings),
						examples: splitLines(examples),
						createdBy: user.uid,
						createdAt: new Date(),
					},
					...prev,
				]);
			} else {
				newId = await addWordToWordbook(
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
				setList((prev) => [
					{
						id: newId,
						kanji: kanji || undefined,
						onyomi: splitLines(onyomi),
						kunyomi: splitLines(kunyomi),
						meanings: splitLines(meanings),
						examples: splitLines(examples),
						createdBy: user.uid,
						createdAt: new Date(),
					},
					...prev,
				]);
			}

			// reset inputs
			setSpelling("");
			setPronunciation("");
			setKanji("");
			setOnyomi("");
			setKunyomi("");
			setMeanings("");
			setExamples("");
		} catch (e) {
			setError("단어를 추가하지 못했습니다.");
		}
	}

	async function handleRemember(event, wordId) {
		event.stopPropagation();
		try {
			// 낙관적 업데이트로 즉시 반영 후 Firestore에 기록
			setStats((prev) => ({
				...prev,
				[wordId]: {
					studyCount: (prev[wordId]?.studyCount || 0) + 1,
					lastStudiedAt: new Date(),
				},
			}));
			// 협업자 섹션은 사용자가 요청한 경우에만 표시되어야 하므로,
			// allStats에는 로딩 여부 플래그가 존재할 때만 값을 유지한다.
			setAllStats((prev) => {
				const current = prev[wordId] || {};
				if (!current.__loaded) return prev; // 아직 로드 안 한 경우 표시 변화 방지
				return {
					...prev,
					[wordId]: {
						...current,
						[user.uid]: {
							studyCount: (current[user.uid]?.studyCount || 0) + 1,
							lastStudiedAt: new Date(),
						},
					},
				};
			});
			await updateStudyCount(wordId, wordbookId, true, user.uid);
		} catch (e) {
			setError("학습 기록을 저장하지 못했습니다.");
		}
	}

	async function ensureAllStats(wordId) {
		if (allStats[wordId]) return;
		const s = await getAllUserWordStats(wordbookId, wordId);
		setAllStats((prev) => ({ ...prev, [wordId]: { ...s, __loaded: true } }));
	}

	function toggleReveal(wordId) {
		setRevealed((prev) => ({ ...prev, [wordId]: !prev[wordId] }));
	}

	return (
		<div className="py-6 sm:px-6 space-y-6">
			<div className="flex items-center justify-between sm:px-0 px-4">
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
				<div className="mb-3 flex items-center gap-4 flex-wrap">
					<label className="inline-flex items-center gap-2 text-sm text-gray-700">
						<input
							type="checkbox"
							checked={useForgetting}
							onChange={(e) => setUseForgetting(e.target.checked)}
							className="h-4 w-4"
						/>
						<span>망각곡선 적용</span>
					</label>
					<div className="inline-flex items-center gap-2">
						<label className="text-sm text-gray-700">정렬</label>
						<select
							className="border rounded px-2 py-1"
							value={sort}
							onChange={(e) => setSort(e.target.value)}
						>
							<option value="none">기본</option>
							<option value="random">랜덤</option>
							<option value="asc">오름차순</option>
						</select>
					</div>
				</div>
				{loading ? (
					<p className="text-gray-600">불러오는 중...</p>
				) : list.length === 0 ? (
					<p className="text-gray-600">아직 단어가 없습니다. 위에서 추가하세요.</p>
				) : (
					<ul className="divide-y">
						{displayList.map((w) => (
							<li key={w.id} className="py-3">
								<WordRow
									w={w}
									stat={stats[w.id]}
									onRemember={(event) => handleRemember(event, w.id)}
									collaborators={collaborators}
									perUserStats={allStats[w.id]}
									onNeedAllStats={() => ensureAllStats(w.id)}
									isRevealed={!!revealed[w.id]}
									onToggleReveal={() => toggleReveal(w.id)}
								/>
							</li>
						))}
					</ul>
				)}
			</section>

			<CollaboratorsSection />
		</div>
	);
}

function WordRow({ w, stat, onRemember, collaborators, perUserStats, onNeedAllStats, isRevealed, onToggleReveal }) {
	if (w.spelling) {
		return (
			<div onClick={onToggleReveal} className="flex flex-col items-start justify-between gap-4 cursor-pointer">
				<h3 className="font-bold text-2xl">{w.spelling}</h3>
				{w.pronunciation && (
					<div className="text-sm text-gray-600">
						{isRevealed ? (
							<span>발음: {w.pronunciation}</span>
						) : (
							<span>발음: [가려짐]</span>
						)}
					</div>
				)}
				<WordCommon w={w} revealed={isRevealed} />
				<div className="ml-auto flex items-center gap-3">
					<StudyInfo stat={stat} />
					<button onClick={onRemember} className="text-sm px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">외움</button>
				</div>
				<AllUsersStats collaborators={collaborators} perUserStats={perUserStats} onNeedAllStats={onNeedAllStats} />
			</div>
		);
	}

	return (
		<div onClick={onToggleReveal} className="flex flex-col gap-1 cursor-pointer">
			<div className="font-medium">{w.kanji}</div>
			{(w.onyomi?.length || 0) > 0 && (
				<div className="text-sm text-gray-600">음독: {w.onyomi.join(", ")}</div>
			)}
			{(w.kunyomi?.length || 0) > 0 && (
				<div className="text-sm text-gray-600">훈독: {w.kunyomi.join(", ")}</div>
			)}
			<div className="flex items-center gap-3">
				<StudyInfo stat={stat} />
				<button onClick={onRemember} className="text-sm px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">외움</button>
			</div>
			<WordCommon w={w} revealed={isRevealed} />
			<AllUsersStats collaborators={collaborators} perUserStats={perUserStats} onNeedAllStats={onNeedAllStats} />
		</div>
	);
}

function WordCommon({ w, revealed }) {
	return (
		<div className="mt-1 space-y-1">
			{(w.meanings?.length || 0) > 0 && (
				<ul className="text-sm list-disc list-inside">
					뜻:
					{revealed ? (
						w.meanings.map((m) => <li key={m}>{m}</li>)
					) : (
						<li>[가려짐]</li>
					)}
				</ul>
			)}
			{(w.examples?.length || 0) > 0 && (
				<ul className="text-sm text-gray-700 list-disc list-inside">예문: {w.examples.map((e) => <li key={e}>{e}</li>)}</ul>
			)}
		</div>
	);
}

function StudyInfo({ stat }) {
	const count = stat?.studyCount ?? 0;
	const last = stat?.lastStudiedAt
		? formatDate(stat.lastStudiedAt)
		: "-";
	return (
		<div className="text-sm text-gray-700">
			<span>외운 횟수: {count}</span>
			<span className="ml-2">마지막: {last}</span>
		</div>
	);
}

function AllUsersStats({ collaborators, perUserStats, onNeedAllStats }) {
    const hasStats = perUserStats && perUserStats.__loaded;
    return (
        <div className="mt-2">
            {!hasStats ? (
                <button onClick={onNeedAllStats} className="text-xs text-blue-600 underline">협업자 학습기록 보기</button>
            ) : (
                <ul className="mt-1 grid grid-cols-1 gap-1">
                    {collaborators.map((c) => {
                        const s = perUserStats[c.id];
                        const count = s?.studyCount ?? 0;
                        const last = s?.lastStudiedAt ? formatDate(s.lastStudiedAt) : "-";
                        return (
                            <li key={c.id} className="text-xs text-gray-700">
                                <span className="font-medium">{c.displayName || c.email}</span>
                                <span className="ml-2">횟수 {count}</span>
                                <span className="ml-2">마지막 {last}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function formatDate(value) {
	try {
		const d = value instanceof Date ? value : new Date(value);
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	} catch {
		return "-";
	}
}

function splitLines(value) {
	return value
		.split(/\r?\n/)
		.map((v) => v.trim())
		.filter(Boolean);
}


