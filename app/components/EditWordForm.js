"use client"

import { useState, useEffect } from "react";
import { updateWord } from "@/lib/Firestore";

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
	const [editedWord, setEditedWord] = useState(word);

	useEffect(() => {
		setEditedWord(word);
	}, [word]);

	/**
	 * Handle form submission
	 * @param {React.FormEvent} e
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		await updateWord(editedWord, language);
		onWordUpdated();
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{language == "english" ? (
				<>
					<input
						type="text"
						value={editedWord.spelling}
						onChange={(e) => setEditedWord({ ...editedWord, spelling: e.target.value })}
						placeholder="단어"
						className="w-full px-3 py-2 border rounded-md"
						required
					/>
					<input
						type="text"
						value={editedWord.pronunciation}
						onChange={(e) => setEditedWord({ ...editedWord, pronunciation: e.target.value })}
						placeholder="발음"
						className="w-full px-3 py-2 border rounded-md"
					/>
				</>
			) : (
				<>
					<input
						type="text"
						value={editedWord.kanji}
						onChange={(e) => setEditedWord({ ...editedWord, kanji: e.target.value })}
						placeholder="한자"
						className="w-full px-3 py-2 border rounded-md"
						required
					/>
					<input
						type="text"
						value={editedWord.kunyomi?.join(", ")}
						onChange={(e) => setEditedWord({ ...editedWord, kunyomi: e.target.value.split(", ") })}
						placeholder="훈독 (쉼표로 구분)"
						className="w-full px-3 py-2 border rounded-md"
					/>
					<input
						type="text"
						value={editedWord.onyomi?.join(", ")}
						onChange={(e) => setEditedWord({ ...editedWord, onyomi: e.target.value.split(", ") })}
						placeholder="음독 (쉼표로 구분)"
						className="w-full px-3 py-2 border rounded-md"
					/>
				</>
			)}
			<textarea
				value={editedWord.meanings.join("\n")}
				onChange={(e) => setEditedWord({ ...editedWord, meanings: e.target.value.split("\n") })}
				placeholder="뜻 (줄바꿈으로 구분)"
				className="w-full px-3 py-2 border rounded-md"
				rows={3}
				required
			/>
			<textarea
				value={editedWord.examples.join("\n")}
				onChange={(e) => setEditedWord({ ...editedWord, examples: e.target.value.split("\n") })}
				placeholder="예문 (줄바꿈으로 구분)"
				className="w-full px-3 py-2 border rounded-md"
				rows={3}
				required
			/>
			<div className="flex justify-end space-x-2">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
				>
					취소
				</button>
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					수정
				</button>
			</div>
		</form>
	);
}