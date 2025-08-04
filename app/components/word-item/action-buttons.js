import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

/**
 * @typedef {Object} ActionButtonsProps
 * @property {string} wordId - 단어 ID
 * @property {number} studyCount - 학습 횟수
 * @property {Object} word - 단어 객체
 * @property {(id: string, remembered: boolean) => void} onStudied - 학습 처리 함수
 * @property {(word: Object) => void} onEdit - 편집 함수
 * @property {(id: string) => void} onDelete - 삭제 함수
 */

/**
 * ActionButtons component - 단어 아이템의 액션 버튼들
 * @param {ActionButtonsProps} props
 * @returns {JSX.Element}
 */
export default function ActionButtons({ 
	wordId, 
	studyCount, 
	word, 
	onStudied, 
	onEdit, 
	onDelete 
}) {
	return (
		<div className="flex items-center gap-1 flex-end place-content-end">
			<div className="inline-flex items-center text-base font-semibold text-gray-900">
				{studyCount}회
			</div>
			<button
				onClick={() => onStudied(wordId, true)}
				className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
			>
				외움
			</button>
			<button
				onClick={() => onStudied(wordId, false)}
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
				onClick={() => onDelete(wordId)}
				className="p-1 text-gray-400 hover:text-gray-500"
			>
				<TrashIcon className="h-5 w-5" />
			</button>
		</div>
	);
} 