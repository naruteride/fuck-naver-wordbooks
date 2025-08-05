"use client"

import { useState, useEffect } from "react";
import { updateWordInWordbook } from "@/lib/Firestore";
import { useAuth } from "@/lib/AuthProvider";

/**
 * @typedef {import("../lib/firestore").Word} Word
 */

/**
 * @typedef {Object} EditWordFormProps
 * @property {Word} word
 * @property {"english" | "japanese"} language
 * @property {() => void} onWordUpdated
 * @property {() => void} onCancel
 */

/**
 * EditWordForm component
 * @param {EditWordFormProps} props
 * @returns {JSX.Element}
 */
export default function EditWordForm({ word, language, onWordUpdated, onCancel }) {
	const { user } = useAuth();
	const [editedWord, setEditedWord] = useState(word);

	const showAlert = (message) => {
		if (typeof window !== 'undefined') {
			alert(message);
		} else {
			console.log(message);
		}
	};

	useEffect(() => {
		setEditedWord(word);
	}, [word]);

	/**
	 * Handle form submission
	 * @param {React.FormEvent} e
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!user) return;
		
		try {
			const updatedWord = {
				...editedWord,
				meanings: Array.isArray(editedWord.meanings) 
					? editedWord.meanings 
					: editedWord.meanings.split("\n").filter(s => s.trim()),
				examples: Array.isArray(editedWord.examples) 
					? editedWord.examples 
					: editedWord.examples.split("\n").filter(s => s.trim()),
				...(language === "japanese" && {
					kunyomi: Array.isArray(editedWord.kunyomi) 
						? editedWord.kunyomi 
						: (editedWord.kunyomi || "").split(",").map(s => s.trim()).filter(s => s),
					onyomi: Array.isArray(editedWord.onyomi) 
						? editedWord.onyomi 
						: (editedWord.onyomi || "").split(",").map(s => s.trim()).filter(s => s),
				})
			};
			
			await updateWordInWordbook(updatedWord, word.wordbookId);
			onWordUpdated();
		} catch (error) {
			showAlert(`단어 수정 오류: ${error.message}`);
		}
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-4">
			<h3 className="text-lg font-medium text-gray-900 mb-4">단어 수정</h3>
			
			<form onSubmit={handleSubmit} className="space-y-4">
				{language === "english" && (
					<>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								영어 단어 *
							</label>
							<input
								type="text"
								value={editedWord.spelling || ""}
								onChange={(e) => setEditedWord({ ...editedWord, spelling: e.target.value })}
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
								value={editedWord.pronunciation || ""}
								onChange={(e) => setEditedWord({ ...editedWord, pronunciation: e.target.value })}
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
								value={editedWord.kanji || ""}
								onChange={(e) => setEditedWord({ ...editedWord, kanji: e.target.value })}
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
								value={Array.isArray(editedWord.kunyomi) ? editedWord.kunyomi.join(", ") : (editedWord.kunyomi || "")}
								onChange={(e) => setEditedWord({ ...editedWord, kunyomi: e.target.value })}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								음독 (쉼표로 구분)
							</label>
							<input
								type="text"
								value={Array.isArray(editedWord.onyomi) ? editedWord.onyomi.join(", ") : (editedWord.onyomi || "")}
								onChange={(e) => setEditedWord({ ...editedWord, onyomi: e.target.value })}
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
						value={Array.isArray(editedWord.meanings) ? editedWord.meanings.join("\n") : (editedWord.meanings || "")}
						onChange={(e) => setEditedWord({ ...editedWord, meanings: e.target.value })}
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
						value={Array.isArray(editedWord.examples) ? editedWord.examples.join("\n") : (editedWord.examples || "")}
						onChange={(e) => setEditedWord({ ...editedWord, examples: e.target.value })}
						rows={3}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>

				<div className="flex space-x-3">
					<button
						type="submit"
						className="flex-1 py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						저장
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						취소
					</button>
				</div>
			</form>
		</div>
	);
}