"use client"

import { useState } from "react";
import { addWord } from "@/lib/Firestore";

/**
 * @typedef {Object} AddWordFormProps
 * @property {"english" | "japanese"} language
 * @property {() => void} onWordAdded
 */

/**
 * AddWordForm component
 * @param {AddWordFormProps} props
 * @returns {JSX.Element}
 */
export default function AddWordForm({ language, onWordAdded }) {
	const [isOpen, setIsOpen] = useState(false);
	const [word, setWord] = useState({
		spelling: "",
		kanji: "",
		pronunciation: "",
		kunyomi: "",
		onyomi: "",
		meanings: "",
		examples: "",
	});

	/**
	 * Handle form submission
	 * @param {React.FormEvent} e
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		const newWord = {
			...(language == "english"
				? { spelling: word.spelling, pronunciation: word.pronunciation }
				: { kanji: word.kanji, kunyomi: word.kunyomi.split(","), onyomi: word.onyomi.split(",") }),
			meanings: word.meanings.split("\n"),
			examples: word.examples.split("\n"),
			createdAt: new Date(),
			studyCount: 0,
			lastStudiedAt: new Date(),
		};
		await addWord(newWord, language);
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
	};

	return (
		<div className="mt-4">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="mb-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
			>
				{isOpen ? "닫기" : "단어 추가"}
			</button>
			{isOpen && (
				<form onSubmit={handleSubmit} className="space-y-4">
					{language == "english" ? (
						<>
							<input
								type="text"
								value={word.spelling}
								onChange={(e) => setWord({ ...word, spelling: e.target.value })}
								placeholder="단어"
								className="w-full px-3 py-2 border rounded-md"
								required
							/>
							<input
								type="text"
								value={word.pronunciation}
								onChange={(e) => setWord({ ...word, pronunciation: e.target.value })}
								placeholder="발음"
								className="w-full px-3 py-2 border rounded-md"
							/>
						</>
					) : (
						<>
							<input
								type="text"
								value={word.kanji}
								onChange={(e) => setWord({ ...word, kanji: e.target.value })}
								placeholder="한자"
								className="w-full px-3 py-2 border rounded-md"
								required
							/>
							<input
								type="text"
								value={word.onyomi}
								onChange={(e) => setWord({ ...word, onyomi: e.target.value })}
								placeholder="음독 (쉼표로 구분)"
								className="w-full px-3 py-2 border rounded-md"
							/>
							<input
								type="text"
								value={word.kunyomi}
								onChange={(e) => setWord({ ...word, kunyomi: e.target.value })}
								placeholder="훈독 (쉼표로 구분)"
								className="w-full px-3 py-2 border rounded-md"
							/>
						</>
					)}
					<textarea
						value={word.meanings}
						onChange={(e) => setWord({ ...word, meanings: e.target.value })}
						placeholder="뜻 (줄바꿈으로 구분)"
						className="w-full px-3 py-2 border rounded-md"
						rows={3}
						required
					/>
					<textarea
						value={word.examples}
						onChange={(e) => setWord({ ...word, examples: e.target.value })}
						placeholder="예문 (줄바꿈으로 구분)"
						className="w-full px-3 py-2 border rounded-md"
						rows={3}
						required
					/>
					<button
						type="submit"
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					>
						추가
					</button>
				</form>
			)}
		</div>
	);
}