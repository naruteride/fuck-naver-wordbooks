"use client"

import { useState, useEffect } from "react";
import { addWordToWordbook, getWordbookName } from "@/lib/Firestore";
import { useAuth } from "@/lib/AuthProvider";

/**
 * @typedef {Object} AddWordFormProps
 * @property {"english" | "japanese"} language
 * @property {string[]} selectedWordbooks
 * @property {() => void} onWordAdded
 */

/**
 * AddWordForm component
 * @param {AddWordFormProps} props
 * @returns {JSX.Element}
 */
export default function AddWordForm({ language, selectedWordbooks, onWordAdded }) {
	const { user } = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const [selectedWordbookId, setSelectedWordbookId] = useState("");
	const [wordbookNames, setWordbookNames] = useState({});
	const [word, setWord] = useState({
		spelling: "",
		kanji: "",
		pronunciation: "",
		kunyomi: "",
		onyomi: "",
		meanings: "",
		examples: "",
	});

	const showAlert = (message) => {
		if (typeof window !== 'undefined') {
			alert(message);
		} else {
			console.log(message);
		}
	};

	// 단어장 이름들 로드
	useEffect(() => {
		const loadWordbookNames = async () => {
			const names = {};
			for (const wordbookId of selectedWordbooks) {
				names[wordbookId] = await getWordbookName(wordbookId);
			}
			setWordbookNames(names);
		};
		
		if (selectedWordbooks.length > 0) {
			loadWordbookNames();
		}
	}, [selectedWordbooks]);

	/**
	 * Handle form submission
	 * @param {React.FormEvent} e
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!user || !selectedWordbookId) return;
		
		const newWord = {
			...(language === "english"
				? { spelling: word.spelling, pronunciation: word.pronunciation }
				: { kanji: word.kanji, kunyomi: word.kunyomi.split(",").map(s => s.trim()).filter(s => s), onyomi: word.onyomi.split(",").map(s => s.trim()).filter(s => s) }),
			meanings: word.meanings.split("\n").filter(s => s.trim()),
			examples: word.examples.split("\n").filter(s => s.trim()),
		};
		
		try {
			await addWordToWordbook(newWord, selectedWordbookId, user.uid);
			setWord({
				spelling: "",
				kanji: "",
				pronunciation: "",
				kunyomi: "",
				onyomi: "",
				meanings: "",
				examples: "",
			});
			setIsOpen(false);
			onWordAdded();
		} catch (error) {
			showAlert(`단어 추가 오류: ${error.message}`);
		}
	};

	// 기본 선택된 단어장 설정
	const openForm = () => {
		if (selectedWordbooks.length === 1) {
			setSelectedWordbookId(selectedWordbooks[0]);
		} else {
			setSelectedWordbookId("");
		}
		setIsOpen(true);
	};

	if (selectedWordbooks.length === 0) {
		return (
			<div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
				단어를 추가하려면 먼저 단어장을 선택하세요
			</div>
		);
	}

	return (
		<div className="mt-4">
			{!isOpen && (
				<button
					onClick={openForm}
					className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					+ 새 단어 추가
				</button>
			)}

			{isOpen && (
				<div className="bg-white border border-gray-200 rounded-lg p-4">
					<h3 className="text-lg font-medium text-gray-900 mb-4">새 단어 추가</h3>
					
					{selectedWordbooks.length > 1 && (
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								추가할 단어장 선택
							</label>
							<select
								value={selectedWordbookId}
								onChange={(e) => setSelectedWordbookId(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								required
							>
								<option value="">단어장을 선택하세요</option>
								{selectedWordbooks.map((wordbookId) => (
									<option key={wordbookId} value={wordbookId}>
										{wordbookNames[wordbookId] || "로딩 중..."}
									</option>
								))}
							</select>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{language === "english" && (
							<>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										영어 단어 *
									</label>
									<input
										type="text"
										value={word.spelling}
										onChange={(e) => setWord({ ...word, spelling: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										발음
									</label>
									<input
										type="text"
										value={word.pronunciation}
										onChange={(e) => setWord({ ...word, pronunciation: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									/>
								</div>
							</>
						)}

						{language === "japanese" && (
							<>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										한자 *
									</label>
									<input
										type="text"
										value={word.kanji}
										onChange={(e) => setWord({ ...word, kanji: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										훈독 (쉼표로 구분)
									</label>
									<input
										type="text"
										value={word.kunyomi}
										onChange={(e) => setWord({ ...word, kunyomi: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										음독 (쉼표로 구분)
									</label>
									<input
										type="text"
										value={word.onyomi}
										onChange={(e) => setWord({ ...word, onyomi: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									/>
								</div>
							</>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								뜻 (줄바꿈으로 구분) *
							</label>
							<textarea
								value={word.meanings}
								onChange={(e) => setWord({ ...word, meanings: e.target.value })}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								예문 (줄바꿈으로 구분)
							</label>
							<textarea
								value={word.examples}
								onChange={(e) => setWord({ ...word, examples: e.target.value })}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>

						<div className="flex space-x-3">
							<button
								type="submit"
								disabled={!selectedWordbookId}
								className="flex-1 py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300"
							>
								추가
							</button>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
							>
								취소
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}