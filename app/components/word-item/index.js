"use client"

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import InfoItem from "./info-item";
import ListDisplay from "./list-display";
import ActionButtons from "./action-buttons";

/**
 * @typedef {import("../lib/firestore").Word} Word
 */

/**
 * @typedef {Object} WordItemProps
 * @property {Word} word
 * @property {"english" | "japanese"} language
 * @property {(id: string, remembered: boolean) => void} onStudied
 * @property {(word: Word) => void} onEdit
 * @property {(id: string) => void} onDelete
 */

/**
 * WordItem component
 * @param {WordItemProps} props
 * @returns {JSX.Element}
 */
export default function WordItem({ word, language, onStudied, onEdit, onDelete }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<li className="py-4">
			<div className="flex flex-col">
				<div className="flex-1 min-w-0">
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="flex items-center w-full text-left"
					>
						<p className="text-2xl font-medium text-gray-900 truncate mr-2">
							{language == "english" ? word.spelling : word.kanji}
						</p>
						{isOpen ? (
							<ChevronUpIcon className="h-5 w-5 text-gray-400" />
						) : (
							<ChevronDownIcon className="h-5 w-5 text-gray-400" />
						)}
					</button>
					{!isOpen && (
						<p className="text-sm text-gray-500">{word.examples[0]}</p>
					)}
				</div>
				{isOpen && (
					<div className="my-4 space-y-2">
						{language == "english" && (
							<>
								<InfoItem label="발음" value={word.pronunciation} />
								<ListDisplay title="뜻" items={word.meanings} />
							</>
						)}
						{language == "japanese" && (
							<>
								<InfoItem 
									label="음독" 
									value={word.onyomi?.join(", ")} 
								/>
								<InfoItem 
									label="훈독" 
									value={word.kunyomi?.join(", ")} 
								/>
								<ListDisplay title="뜻" items={word.meanings} />
							</>
						)}
						<ListDisplay title="예문" items={word.examples} />
						<InfoItem 
							label="생성일" 
							value={word.createdAt.toLocaleDateString()} 
						/>
						<InfoItem 
							label="마지막 학습일" 
							value={word.lastStudiedAt.toLocaleDateString()} 
						/>
					</div>
				)}
				<ActionButtons
					wordId={word.id}
					studyCount={word.studyCount}
					word={word}
					onStudied={onStudied}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			</div>
		</li>
	);
}