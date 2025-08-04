/**
 * @typedef {Object} InfoItemProps
 * @property {string} label - 라벨 텍스트
 * @property {string | React.ReactNode} value - 표시할 값
 * @property {string} [className] - 추가 CSS 클래스
 */

/**
 * InfoItem component - 라벨과 값을 표시하는 컴포넌트
 * @param {InfoItemProps} props
 * @returns {JSX.Element}
 */
export default function InfoItem({ label, value, className = "" }) {
	return (
		<p className={`text-sm text-gray-600 ${className}`}>
			<span className="font-medium">{label}:</span>{" "}
			{value}
		</p>
	);
} 