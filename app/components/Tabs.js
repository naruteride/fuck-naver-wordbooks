"use client"

import { useState } from "react";

/**
 * @typedef {"english" | "japanese"} Tab
 */

/**
 * @typedef {Object} TabsProps
 * @property {(tab: Tab) => void} onTabChange
 */

/**
 * Tabs component
 * @param {TabsProps} props
 * @returns {JSX.Element}
 */
export default function Tabs({ onTabChange }) {
	const [activeTab, setActiveTab] = useState("english");

	/**
	 * Handle tab change
	 * @param {Tab} tab
	 */
	const handleTabChange = (tab) => {
		setActiveTab(tab);
		onTabChange(tab);
	};

	return (
		<div className="border-b border-gray-200">
			<nav className="-mb-px flex" aria-label="Tabs">
				<button
					onClick={() => handleTabChange("english")}
					className={`${activeTab === "english"
							? "border-indigo-500 text-indigo-600"
							: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						} w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
				>
					영어
				</button>
				<button
					onClick={() => handleTabChange("japanese")}
					className={`${activeTab === "japanese"
							? "border-indigo-500 text-indigo-600"
							: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						} w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
				>
					일본어
				</button>
			</nav>
		</div>
	)
}