"use client"

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

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
						<p className="text-sm font-medium text-gray-900 truncate mr-2">
							{language == "english" ? word.spelling : word.kanji}
						</p>
						{isOpen ? (
							<ChevronUpIcon className="h-5 w-5 text-gray-400" />
						) : (
							<ChevronDownIcon className="h-5 w-5 text-gray-400" />
						)}
					</button>
					{!isOpen && (
						<p className="text-sm text-gray-500 truncate">{word.examples[0]}</p>
					)}
				</div>
				{isOpen && (
				<div className="my-4 space-y-2">
					{language == "english" && (
						<>
							<p className="text-sm text-gray-600">
								<span className="font-medium">발음:</span> {word.pronunciation}
							</p>
							<div>
								<p className="text-sm font-medium text-gray-600">뜻:</p>
								<ul className="list-disc list-inside">
									{word.meanings.map((meaning, index) => (
										<li key={index} className="text-sm text-gray-600">
											{meaning}
										</li>
									))}
								</ul>
							</div>
						</>
					)}
					{language == "japanese" && (
						<>
							<p className="text-sm text-gray-600">
								<span className="font-medium">훈독:</span>{" "}
								{word.kunyomi?.join(", ")}
							</p>
							<p className="text-sm text-gray-600">
								<span className="font-medium">음독:</span>{" "}
								{word.onyomi?.join(", ")}
							</p>
							<div>
								<p className="text-sm font-medium text-gray-600">뜻:</p>
								<ul className="list-disc list-inside">
									{word.meanings.map((meaning, index) => (
										<li key={index} className="text-sm  text-gray-600">
											{meaning}
										</li>
									))}
								</ul>
							</div>
						</>
					)}
					<div>
						<p className="text-sm font-medium text-gray-600">예문:</p>
						<ul className="list-disc list-inside">
							{word.examples.map((example, index) => (
								<li key={index} className="text-sm text-gray-600">
									{example}
								</li>
							))}
						</ul>
					</div>
					<p className="text-sm text-gray-600">
						<span className="font-medium">생성일:</span>{" "}
						{word.createdAt.toLocaleDateString()}
					</p>
					<p className="text-sm text-gray-600">
						<span className="font-medium">마지막 학습일:</span>{" "}
						{word.lastStudiedAt.toLocaleDateString()}
					</p>
				</div>
			)}
				<div className="flex items-center gap-1 flex-end place-content-end">
					<div className="inline-flex items-center text-base font-semibold text-gray-900">
						{word.studyCount}회
					</div>
					<button
						onClick={() => onStudied(word.id, true)}
						className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
					>
						외움
					</button>
					<button
						onClick={() => onStudied(word.id, false)}
						className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
					>
						잊음
					</button>
					<button
						onClick={() => onEdit(word)}
						className="p-1 text-gray-400 hover:text-gray-500"
					>
						<PencilIcon className="h-5 w-5" />
					</button>
					<button
						onClick={() => onDelete(word.id)}
						className="p-1 text-gray-400 hover:text-gray-500"
					>
						<TrashIcon className="h-5 w-5" />
					</button>
				</div>
			</div>
			
		</li>
	);
}