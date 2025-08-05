"use client";

import { useAuth } from "../../lib/AuthProvider";
import { useState } from "react";

export default function UserInfo() {
	const { user } = useAuth();
	const [showUID, setShowUID] = useState(false);

	const showAlert = (message) => {
		if (typeof window !== 'undefined') {
			alert(message);
		} else {
			console.log(message);
		}
	};

	if (!user) return null;

	const copyUID = () => {
		if (typeof window !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(user.uid).then(() => {
				showAlert("UID가 클립보드에 복사되었습니다!");
			}).catch((error) => {
				console.error("클립보드 복사 오류:", error);
				showAlert("클립보드 복사에 실패했습니다.");
			});
		} else {
			showAlert("클립보드 기능을 사용할 수 없습니다.");
		}
	};

	return (
		<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
			<h3 className="font-semibold text-blue-800 mb-2">사용자 정보</h3>
			<div className="space-y-2 text-sm">
				<p><strong>이메일:</strong> {user.email}</p>
				<p><strong>이름:</strong> {user.displayName || "설정 안됨"}</p>
				<div className="flex items-center space-x-2">
					<button
						onClick={() => setShowUID(!showUID)}
						className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
					>
						{showUID ? "UID 숨기기" : "UID 보기"}
					</button>
					{showUID && (
						<>
							<button
								onClick={copyUID}
								className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
							>
								UID 복사
							</button>
						</>
					)}
				</div>
				{showUID && (
					<p className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
						<strong>UID:</strong> {user.uid}
					</p>
				)}
			</div>
		</div>
	);
} 