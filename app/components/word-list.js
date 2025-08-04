"use client"

import WordItem from "./word-item";

/**
 * @typedef {import("@/lib/Firestore").Word} Word
 */

/**
 * @typedef {Object} WordListProps
 * @property {Word[]} words
 * @property {"english" | "japanese"} language
 * @property {(id: string, remembered: boolean) => void} onStudied
 * @property {(word: Word) => void} onEdit
 * @property {(id: string) => void} onDelete
 */

/**
 * WordList component
 * @param {WordListProps} props
 * @returns {JSX.Element}
 */
export default function WordList({ words, language, onStudied, onEdit, onDelete }) {
	return (
		<div className="mt-6">
			<ul className="divide-y divide-gray-200">
				{words.map((word) => (
					<WordItem
						key={word.id}
						word={word}
						language={language}
						onStudied={onStudied}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</ul>
		</div>
	)
}