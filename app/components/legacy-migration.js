"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { db } from "../../lib/Firebase";
import { createWordbook, addWordToWordbook } from "../../lib/Firestore";
import {
	collection,
	getDocs,
	deleteDoc,
	doc,
} from "firebase/firestore";
import { ArrowRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function LegacyMigration({ onMigrationComplete }) {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [migrationResult, setMigrationResult] = useState(null);
	const [showMigration, setShowMigration] = useState(false);
	const [legacyDataCounts, setLegacyDataCounts] = useState(null);
	const [hasLegacyData, setHasLegacyData] = useState(false);

	const showAlert = (message) => {
		if (typeof window !== 'undefined') {
			alert(message);
		} else {
			console.log(message);
		}
	};

	const showConfirm = (message) => {
		if (typeof window !== 'undefined') {
			return confirm(message);
		}
		return false;
	};

	// 컴포넌트 로드 시 자동으로 기존 데이터 확인
	useEffect(() => {
		if (user) {
			checkAndShowLegacyData();
		}
	}, [user]);

	const checkLegacyData = async () => {
		if (!user) return { english: 0, japanese: 0 };

		try {
			const englishSnapshot = await getDocs(collection(db, "users", user.uid, "englishWords"));
			const japaneseSnapshot = await getDocs(collection(db, "users", user.uid, "japaneseWords"));

			return {
				english: englishSnapshot.size,
				japanese: japaneseSnapshot.size
			};
		} catch (error) {
			console.error("기존 데이터 확인 오류:", error);
			return { english: 0, japanese: 0 };
		}
	};

	const checkAndShowLegacyData = async () => {
		const counts = await checkLegacyData();
		setLegacyDataCounts(counts);

		if (counts.english > 0 || counts.japanese > 0) {
			setHasLegacyData(true);
			setShowMigration(true); // 데이터가 있으면 바로 마이그레이션 버튼 표시
		}
	};

	const migrateData = async () => {
		if (!user || !showConfirm("기존 단어들을 새로운 단어장 구조로 이동시키시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!")) {
			return;
		}

		setIsLoading(true);
		setMigrationResult(null);

		try {
			const result = {
				english: { words: 0, wordbookId: null },
				japanese: { words: 0, wordbookId: null },
				errors: []
			};

			// 영어 단어 마이그레이션
			try {
				const englishSnapshot = await getDocs(collection(db, "users", user.uid, "englishWords"));
				if (englishSnapshot.size > 0) {
					// 영어 단어장 생성
					const englishWordbookId = await createWordbook("내 영어 단어장 (기존)", "english", user.uid);
					result.english.wordbookId = englishWordbookId;

					for (const wordDoc of englishSnapshot.docs) {
						try {
							const wordData = wordDoc.data();
							const migratedWord = {
								spelling: wordData.spelling,
								pronunciation: wordData.pronunciation || "",
								meanings: Array.isArray(wordData.meanings) ? wordData.meanings : [wordData.meanings].filter(Boolean),
								examples: Array.isArray(wordData.examples) ? wordData.examples : [wordData.examples].filter(Boolean),
							};

							await addWordToWordbook(migratedWord, englishWordbookId, user.uid);
							await deleteDoc(wordDoc.ref);
							result.english.words++;
						} catch (error) {
							result.errors.push(`영어 단어 "${wordData.spelling || 'Unknown'}" 마이그레이션 오류: ${error.message}`);
						}
					}
				}
			} catch (error) {
				result.errors.push(`영어 단어 전체 마이그레이션 오류: ${error.message}`);
			}

			// 일본어 단어 마이그레이션
			try {
				const japaneseSnapshot = await getDocs(collection(db, "users", user.uid, "japaneseWords"));
				if (japaneseSnapshot.size > 0) {
					// 일본어 단어장 생성
					const japaneseWordbookId = await createWordbook("내 일본어 단어장 (기존)", "japanese", user.uid);
					result.japanese.wordbookId = japaneseWordbookId;

					for (const wordDoc of japaneseSnapshot.docs) {
						try {
							const wordData = wordDoc.data();
							const migratedWord = {
								kanji: wordData.kanji,
								kunyomi: Array.isArray(wordData.kunyomi) ? wordData.kunyomi : [],
								onyomi: Array.isArray(wordData.onyomi) ? wordData.onyomi : [],
								meanings: Array.isArray(wordData.meanings) ? wordData.meanings : [wordData.meanings].filter(Boolean),
								examples: Array.isArray(wordData.examples) ? wordData.examples : [wordData.examples].filter(Boolean),
							};

							await addWordToWordbook(migratedWord, japaneseWordbookId, user.uid);
							await deleteDoc(wordDoc.ref);
							result.japanese.words++;
						} catch (error) {
							result.errors.push(`일본어 단어 "${wordData.kanji || 'Unknown'}" 마이그레이션 오류: ${error.message}`);
						}
					}
				}
			} catch (error) {
				result.errors.push(`일본어 단어 전체 마이그레이션 오류: ${error.message}`);
			}

			setMigrationResult(result);

			if (result.english.words > 0 || result.japanese.words > 0) {
				// 마이그레이션이 성공하면 부모 컴포넌트에 알림
				setHasLegacyData(false); // 마이그레이션 완료 후 컴포넌트 숨김
				if (onMigrationComplete) {
					onMigrationComplete();
				}
			}
		} catch (error) {
			setMigrationResult({
				english: { words: 0, wordbookId: null },
				japanese: { words: 0, wordbookId: null },
				errors: [`전체 마이그레이션 오류: ${error.message}`]
			});
		}

		setIsLoading(false);
	};

	// 기존 데이터가 없으면 컴포넌트를 표시하지 않음
	if (!hasLegacyData) {
		return null;
	}

	return (
		<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
			<div className="flex items-start">
				<ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
				<div className="flex-1">
					<h3 className="font-semibold text-yellow-800 mb-2">기존 단어 데이터 발견!</h3>
					<p className="text-sm text-yellow-700 mb-2">
						이전 버전의 개인 단어장 데이터가 감지되었습니다:
					</p>

					{legacyDataCounts && (
						<div className="bg-white rounded p-2 mb-3 text-sm">
							<p><strong>영어 단어:</strong> {legacyDataCounts.english}개</p>
							<p><strong>일본어 단어:</strong> {legacyDataCounts.japanese}개</p>
						</div>
					)}

					<p className="text-sm text-yellow-700 mb-4">
						새로운 협업 단어장 구조로 이동시켜서 친구들과 함께 학습할 수 있도록 하세요!
					</p>

					<div className="space-y-2">
						{showMigration && (
							<button
								onClick={migrateData}
								className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 flex items-center font-medium"
								disabled={isLoading}
							>
								{isLoading ? (
									"마이그레이션 중..."
								) : (
									<>
										데이터 마이그레이션 시작 <ArrowRightIcon className="h-4 w-4 ml-1" />
									</>
								)}
							</button>
						)}
					</div>

					{migrationResult && (
						<div className="mt-4 bg-white border rounded p-3 text-sm">
							<h4 className="font-semibold mb-2">✅ 마이그레이션 완료!</h4>

							{migrationResult.english.words > 0 && (
								<p className="text-green-600 mb-1">
									✅ 영어 단어 {migrationResult.english.words}개 → &ldquo;내 영어 단어장 (기존)&rdquo;
								</p>
							)}

							{migrationResult.japanese.words > 0 && (
								<p className="text-green-600 mb-1">
									✅ 일본어 단어 {migrationResult.japanese.words}개 → &ldquo;내 일본어 단어장 (기존)&dquo;
								</p>
							)}

							{migrationResult.english.words === 0 && migrationResult.japanese.words === 0 && (
								<p className="text-gray-600">마이그레이션할 데이터가 없었습니다.</p>
							)}

							{migrationResult.errors.length > 0 && (
								<div className="mt-2 text-red-600">
									<strong>⚠️ 오류:</strong>
									<ul className="list-disc list-inside mt-1">
										{migrationResult.errors.map((error, index) => (
											<li key={index} className="text-xs">{error}</li>
										))}
									</ul>
								</div>
							)}

							{(migrationResult.english.words > 0 || migrationResult.japanese.words > 0) && (
								<p className="mt-3 text-blue-600 text-sm font-medium">
									🎉 이제 새로운 단어장에서 기존 단어들을 확인할 수 있습니다!
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
} 