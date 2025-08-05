"use client"

import { useState, useEffect } from "react";
import Tabs from "@/app/components/tabs";
import WordList from "@/app/components/word-list";
import AddWordForm from "@/app/components/add-word-form";
import EditWordForm from "@/app/components/edit-word-form";
import UserInfo from "@/app/components/user-info";
import WordbookManager from "@/app/components/wordbook-manager";
import WordbookSelector from "@/app/components/wordbook-selector";
import LegacyMigration from "@/app/components/legacy-migration";
import { 
	getUserWordbooks, 
	getWordsFromWordbooks, 
	getWordsWithForgettingCurve, 
	updateStudyCount, 
	deleteWordFromWordbook, 
	getUserWordStats 
} from "@/lib/Firestore";
import { useAuth } from "@/lib/AuthProvider";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

/**
 * @typedef {"random" | "createdAt" | "studyCount" | "lastStudiedAt" | "alphabetical"} SortOption
 */

export default function WordbookApp() {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState("english");
	const [wordbooks, setWordbooks] = useState([]);
	const [selectedWordbooks, setSelectedWordbooks] = useState([]);
	const [words, setWords] = useState([]);
	const [sortOption, setSortOption] = useState("random");
	const [useForgetCurve, setUseForgetCurve] = useState(true);
	const [editingWord, setEditingWord] = useState(null);

	useEffect(() => {
		if (user) {
			loadWordbooks();
		}
	}, [user]);

	useEffect(() => {
		if (user && selectedWordbooks.length > 0) {
			fetchWords();
		} else {
			setWords([]);
		}
	}, [activeTab, selectedWordbooks, useForgetCurve, sortOption, user]);

	// 언어가 바뀔 때 선택된 단어장 초기화
	useEffect(() => {
		const currentLanguageWordbooks = wordbooks
			.filter(wb => wb.language === activeTab)
			.map(wb => wb.id);
		setSelectedWordbooks(currentLanguageWordbooks);
	}, [activeTab, wordbooks]);

	async function loadWordbooks() {
		try {
			const userWordbooks = await getUserWordbooks(user.uid);
			setWordbooks(userWordbooks);
		} catch (error) {
			console.error("단어장 로딩 오류:", error);
		}
	}

	async function fetchWords() {
		if (!user || selectedWordbooks.length === 0) return;
		
		try {
			let fetchedWords;
			
			if (useForgetCurve) {
				fetchedWords = await getWordsWithForgettingCurve(selectedWordbooks, user.uid);
			} else {
				fetchedWords = await getWordsFromWordbooks(selectedWordbooks);
				
				// 일반 모드에서는 사용자의 학습 통계를 따로 가져와서 합침
				const allWordsWithStats = [];
				for (const word of fetchedWords) {
					const stats = await getUserWordStats(word.wordbookId, user.uid);
					const wordStat = stats[word.id] || { studyCount: 0, lastStudiedAt: new Date() };
					allWordsWithStats.push({
						...word,
						studyCount: wordStat.studyCount,
						lastStudiedAt: wordStat.lastStudiedAt,
					});
				}
				fetchedWords = allWordsWithStats;
			}
			
			setWords(sortWords(fetchedWords, sortOption));
		} catch (error) {
			console.error("단어 로딩 오류:", error);
		}
	}

	function sortWords(words, option) {
		switch (option) {
			case "random":
				return [...words].sort(() => Math.random() - 0.5);
			case "createdAt":
				return [...words].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			case "studyCount":
				return [...words].sort((a, b) => b.studyCount - a.studyCount);
			case "lastStudiedAt":
				return [...words].sort((a, b) => b.lastStudiedAt.getTime() - a.lastStudiedAt.getTime());
			case "alphabetical":
				return [...words].sort((a, b) => {
					const aText = activeTab === "english" ? a.spelling : a.kanji;
					const bText = activeTab === "english" ? b.spelling : b.kanji;
					return aText.localeCompare(bText);
				});
			default:
				return words;
		}
	}

	async function handleStudied(wordId, remembered) {
		if (!user) return;
		
		const word = words.find(w => w.id === wordId);
		if (!word) return;
		
		try {
			await updateStudyCount(wordId, word.wordbookId, remembered, user.uid);
			fetchWords();
		} catch (error) {
			console.error("학습 기록 오류:", error);
		}
	}

	async function handleDelete(wordId) {
		if (!user) return;
		
		const word = words.find(w => w.id === wordId);
		if (!word) return;
		
		if (window.confirm("정말로 이 단어를 삭제하시겠습니까?")) {
			try {
				await deleteWordFromWordbook(wordId, word.wordbookId);
				fetchWords();
			} catch (error) {
				console.error("단어 삭제 오류:", error);
			}
		}
	}

	function handleEdit(word) {
		setEditingWord(word);
	}

	function handleCancelEdit() {
		setEditingWord(null);
	}

	function handleWordUpdated() {
		setEditingWord(null);
		fetchWords();
	}

	function handleMigrationComplete() {
		// 마이그레이션 완료 후 단어장 목록 새로고침
		loadWordbooks();
	}

	const forgettingCurveTooltip = (
		<div className="text-sm leading-relaxed">
			<p className="mb-4">에빙하우스의 망각곡선: 새로운 정보를 학습한 후, 시간이 지남에 따라 기억이 감소하는 현상을 나타내는 이론. 학습 직후 빠르게 망각되다가 복습 할수록 망각 속도가 느려집니다. 이를 이용해 효율적인 복습 주기를 설정할 수 있습니다.</p>
			<p className="mb-2">학습 횟수에 따른 단어 숨김 기간:</p>
			<ul className="list-disc pl-5 my-1">
				<li>1회 학습: 1일 후</li>
				<li>2회 학습: 2일 후</li>
				<li>3회 학습: 3일 후</li>
				<li>4회 학습: 7일 후</li>
				<li>5회 이상 학습: 30일 후</li>
			</ul>
		</div>
	);

	if (!user) {
		return <div>로딩 중...</div>;
	}

	return (
		<>
			<UserInfo />
			<LegacyMigration onMigrationComplete={handleMigrationComplete} />
			<WordbookManager wordbooks={wordbooks} onWordbooksChange={loadWordbooks} />
			<Tabs onTabChange={setActiveTab} />
			<div className="p-4">
				{editingWord ? (
					<EditWordForm
						word={editingWord}
						language={activeTab}
						onWordUpdated={handleWordUpdated}
						onCancel={handleCancelEdit}
					/>
				) : (
					<>	
						<div className="mb-4 space-y-3">
							<WordbookSelector
								wordbooks={wordbooks}
								selectedWordbooks={selectedWordbooks}
								onSelectionChange={setSelectedWordbooks}
								currentLanguage={activeTab}
							/>
							
							<select
								value={sortOption}
								onChange={(e) => setSortOption(e.target.value)}
								className="w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
							>
								<option value="random">랜덤</option>
								<option value="createdAt">생성일</option>
								<option value="studyCount">학습 횟수</option>
								<option value="lastStudiedAt">최근 학습일</option>
								<option value="alphabetical">알파벳순</option>
							</select>
							
							<div className="flex items-center justify-between">
								<label className="inline-flex items-center">
									<input
										type="checkbox"
										className="form-checkbox h-5 w-5 text-indigo-600"
										checked={useForgetCurve}
										onChange={(e) => setUseForgetCurve(e.target.checked)}
									/>
									<span className="ml-2 text-gray-700">망각곡선 사용</span>
								</label>
								<Tippy
									content={forgettingCurveTooltip}
									placement="bottom"
									interactive={true}
									arrow={true}
									maxWidth={300}
								>
									<QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
								</Tippy>
							</div>
							
							<p className="text-gray-600 text-sm">총 {words.length}개의 단어</p>
						</div>

						<AddWordForm 
							language={activeTab} 
							selectedWordbooks={selectedWordbooks}
							onWordAdded={fetchWords} 
						/>
						
						<div className="min-h-svh">
						{selectedWordbooks.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								단어장을 선택하거나 새로 만들어주세요
							</div>
						) : (
							<WordList
								words={words}
								language={activeTab}
								onStudied={handleStudied}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						)}</div>
					</>
				)}
			</div>
		</>
	);
}