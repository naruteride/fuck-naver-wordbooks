/**
 * @typedef {Object} ListDisplayProps
 * @property {string} title - 리스트 제목
 * @property {string[]} items - 표시할 항목들
 * @property {string} [className] - 추가 CSS 클래스
 */

/**
 * ListDisplay component - 배열을 불릿 리스트로 표시하는 컴포넌트
 * @param {ListDisplayProps} props
 * @returns {JSX.Element}
 */
export default function ListDisplay({ title, items, className = "" }) {
	return (
		<div className={className}>
			<p className="text-sm font-medium text-gray-600">{title}:</p>
			<ul className="list-disc list-inside">
				{items.map((item, index) => (
					<li key={index} className="text-sm text-gray-600">
						{item}
					</li>
				))}
			</ul>
		</div>
	);
} 