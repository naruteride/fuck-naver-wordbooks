"use client"

import { useState, useEffect } from "react";
import Tabs from "@/app/components/tabs";
import WordList from "@/app/components/word-list";
import AddWordForm from "@/app/components/add-word-form";
import EditWordForm from "@/app/components/edit-word-form";
import { getWordsWithForgettingCurve, updateStudyCount, deleteWord, getWords } from "@/lib/Firestore";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

/**
 * @typedef {"random" | "createdAt" | "studyCount" | "lastStudiedAt" | "alphabetical"} SortOption
 */

/**
 * WordbookApp component
 * @returns {JSX.Element}
 */
export default function WordbookApp() {
	const [activeTab, setActiveTab] = useState("english");
	const [words, setWords] = useState([]);
	const [sortOption, setSortOption] = useState("random");
	const [useForgetCurve, setUseForgetCurve] = useState(true);
	const [editingWord, setEditingWord] = useState(null);

	useEffect(() => {
		fetchWords();
	}, [activeTab, useForgetCurve, sortOption]);

	/**
	 * Fetch words from the database and sort them
	 */
	async function fetchWords() {
		let fetchedWords;
		if (useForgetCurve) {
			fetchedWords = await getWordsWithForgettingCurve(activeTab);
		} else {
			fetchedWords = await getWords(activeTab);
		}
		setWords(sortWords(fetchedWords, sortOption));
	}

	/**
	 * Sort words based on the selected option
	 * @param {import("@/lib/Firestore").Word[]} words - The words to sort
	 * @param {SortOption} option - The sorting option
	 * @returns {import("@/lib/Firestore").Word[]}
	 */
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
					const aText = activeTab == "english" ? a.spelling : a.kanji;
					const bText = activeTab == "english" ? b.spelling : b.kanji;
					return aText.localeCompare(bText);
				});
			default:
				return words;
		}
	}

	/**
	 * Handle studied word
	 * @param {string} id - The word id
	 * @param {boolean} remembered - Whether the word was remembered
	 */
	async function handleStudied(id, remembered) {
		await updateStudyCount(id, activeTab, remembered);
		fetchWords();
	}

	/**
	 * Handle word deletion
	 * @param {string} id - The word id
	 */
	async function handleDelete(id) {
		if (window.confirm("정말로 이 단어를 삭제하시겠습니까?")) {
			await deleteWord(id, activeTab);
			fetchWords();
		}
	}

	/**
	 * Handle word edit
	 * @param {import("@/lib/Firestore").Word} word - The word to edit
	 */
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

	return (
		<>
			<Tabs onTabChange={setActiveTab} />
			<div className="p-4">
				<div className="mb-4 flex flex-col justify-center items-start gap-4">
					<select
						value={sortOption}
						onChange={(e) => setSortOption(e.target.value)}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option value="random">랜덤</option>
						<option value="createdAt">생성일</option>
						<option value="studyCount">학습 횟수</option>
						<option value="lastStudiedAt">최근 학습일</option>
						<option value="alphabetical">알파벳순</option>
					</select>
					<div className="flex items-center">
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
							interactive={true}
							placement="bottom"
						>
							<QuestionMarkCircleIcon className="h-5 w-5 ml-2 text-gray-500 cursor-pointer" />
						</Tippy>
					</div>
				</div>
				{editingWord ? (
					<EditWordForm
						word={editingWord}
						language={activeTab}
						onWordUpdated={handleWordUpdated}
						onCancel={handleCancelEdit}
					/>
				) : (
					<>
						<WordList
							words={words}
							language={activeTab}
							onStudied={handleStudied}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
						<AddWordForm language={activeTab} onWordAdded={fetchWords} />
					</>
				)}
			</div>
		</>
	);
}