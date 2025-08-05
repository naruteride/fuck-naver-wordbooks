import { db } from "./Firebase";
import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDocs,
	getDoc,
	query,
	where,
	orderBy,
	Timestamp,
	increment,
	arrayUnion,
	arrayRemove,
	setDoc,
} from "firebase/firestore";

/**
 * @typedef {Object} Wordbook
 * @property {string} id
 * @property {string} name
 * @property {"english" | "japanese"} language
 * @property {string} createdBy
 * @property {Date} createdAt
 * @property {string[]} collaborators
 */

/**
 * @typedef {Object} Word
 * @property {string} id
 * @property {string} [spelling]
 * @property {string} [kanji]
 * @property {string} [pronunciation]
 * @property {string[]} [kunyomi]
 * @property {string[]} [onyomi]
 * @property {string[]} meanings
 * @property {string[]} examples
 * @property {string} createdBy
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} UserWordStat
 * @property {string} wordId
 * @property {number} studyCount
 * @property {Date} lastStudiedAt
 */

// ========== 단어장 관리 ==========

/**
 * 사용자의 단어장들 가져오기 (생성한 것 + 공유받은 것)
 */
export async function getUserWordbooks(userId) {
	if (!userId) throw new Error("사용자 ID가 필요합니다");
	
	const querySnapshot = await getDocs(
		query(
			collection(db, "wordbooks"),
			where("collaborators", "array-contains", userId)
		)
	);
	
	return querySnapshot.docs.map(doc => ({
		id: doc.id,
		...doc.data(),
		createdAt: doc.data().createdAt.toDate(),
	}));
}

/**
 * 새 단어장 생성
 */
export async function createWordbook(name, language, userId) {
	if (!userId) throw new Error("사용자 ID가 필요합니다");
	
	const docRef = await addDoc(collection(db, "wordbooks"), {
		name,
		language,
		createdBy: userId,
		createdAt: Timestamp.now(),
		collaborators: [userId],
	});
	
	return docRef.id;
}

/**
 * 단어장에 협업자 추가
 */
export async function addCollaborator(wordbookId, userEmail) {
	const wordbookRef = doc(db, "wordbooks", wordbookId);
	await updateDoc(wordbookRef, {
		collaborators: arrayUnion(userEmail),
	});
}

/**
 * 단어장에서 협업자 제거
 */
export async function removeCollaborator(wordbookId, userEmail) {
	const wordbookRef = doc(db, "wordbooks", wordbookId);
	await updateDoc(wordbookRef, {
		collaborators: arrayRemove(userEmail),
	});
}

/**
 * 단어장 삭제
 */
export async function deleteWordbook(wordbookId, userId) {
	const wordbookRef = doc(db, "wordbooks", wordbookId);
	const wordbookDoc = await getDoc(wordbookRef);
	
	if (!wordbookDoc.exists() || wordbookDoc.data().createdBy !== userId) {
		throw new Error("권한이 없습니다");
	}
	
	await deleteDoc(wordbookRef);
}

// ========== 단어 관리 ==========

/**
 * 단어장의 단어들 가져오기
 */
export async function getWordsFromWordbook(wordbookId) {
	if (!wordbookId) throw new Error("단어장 ID가 필요합니다");
	
	const querySnapshot = await getDocs(
		query(
			collection(db, "wordbooks", wordbookId, "words"),
			orderBy("createdAt", "desc")
		)
	);
	
	return querySnapshot.docs.map(doc => ({
		id: doc.id,
		...doc.data(),
		createdAt: doc.data().createdAt.toDate(),
	}));
}

/**
 * 여러 단어장의 단어들 합쳐서 가져오기
 */
export async function getWordsFromWordbooks(wordbookIds) {
	if (!wordbookIds || wordbookIds.length === 0) return [];
	
	const allWords = [];
	
	for (const wordbookId of wordbookIds) {
		const words = await getWordsFromWordbook(wordbookId);
		allWords.push(...words.map(word => ({ ...word, wordbookId })));
	}
	
	return allWords;
}

/**
 * 단어장에 단어 추가
 */
export async function addWordToWordbook(word, wordbookId, userId) {
	if (!wordbookId || !userId) throw new Error("단어장 ID와 사용자 ID가 필요합니다");
	
	const docRef = await addDoc(collection(db, "wordbooks", wordbookId, "words"), {
		...word,
		createdBy: userId,
		createdAt: Timestamp.now(),
	});
	
	return docRef.id;
}

/**
 * 단어 수정
 */
export async function updateWordInWordbook(word, wordbookId) {
	if (!wordbookId) throw new Error("단어장 ID가 필요합니다");
	
	const wordRef = doc(db, "wordbooks", wordbookId, "words", word.id);
	await updateDoc(wordRef, {
		...word,
		createdAt: Timestamp.fromDate(word.createdAt),
	});
}

/**
 * 단어 삭제
 */
export async function deleteWordFromWordbook(wordId, wordbookId) {
	if (!wordbookId) throw new Error("단어장 ID가 필요합니다");
	
	await deleteDoc(doc(db, "wordbooks", wordbookId, "words", wordId));
}

// ========== 학습 통계 관리 ==========

/**
 * 사용자의 단어별 학습 통계 가져오기
 */
export async function getUserWordStats(wordbookId, userId) {
	if (!wordbookId || !userId) throw new Error("단어장 ID와 사용자 ID가 필요합니다");
	
	const querySnapshot = await getDocs(collection(db, "wordbooks", wordbookId, "userStats", userId, "words"));
	
	const stats = {};
	querySnapshot.docs.forEach(doc => {
		const data = doc.data();
		stats[doc.id] = {
			studyCount: data.studyCount || 0,
			lastStudiedAt: data.lastStudiedAt ? data.lastStudiedAt.toDate() : new Date(),
		};
	});
	
	return stats;
}

/**
 * 모든 사용자의 단어별 학습 통계 가져오기
 */
export async function getAllUserWordStats(wordbookId, wordId) {
	if (!wordbookId || !wordId) throw new Error("단어장 ID와 단어 ID가 필요합니다");
	
	const wordbookRef = doc(db, "wordbooks", wordbookId);
	const wordbookDoc = await getDoc(wordbookRef);
	
	if (!wordbookDoc.exists()) return {};
	
	const collaborators = wordbookDoc.data().collaborators || [];
	const allStats = {};
	
	for (const userId of collaborators) {
		try {
			const statDoc = await getDoc(doc(db, "wordbooks", wordbookId, "userStats", userId, "words", wordId));
			if (statDoc.exists()) {
				const data = statDoc.data();
				allStats[userId] = {
					studyCount: data.studyCount || 0,
					lastStudiedAt: data.lastStudiedAt ? data.lastStudiedAt.toDate() : new Date(),
				};
			} else {
				allStats[userId] = { studyCount: 0, lastStudiedAt: new Date() };
			}
		} catch (error) {
			allStats[userId] = { studyCount: 0, lastStudiedAt: new Date() };
		}
	}
	
	return allStats;
}

/**
 * 학습 횟수 업데이트
 */
export async function updateStudyCount(wordId, wordbookId, remembered, userId) {
	if (!wordbookId || !userId) throw new Error("단어장 ID와 사용자 ID가 필요합니다");
	
	const statRef = doc(db, "wordbooks", wordbookId, "userStats", userId, "words", wordId);
	
	const updateData = {
		lastStudiedAt: Timestamp.now(),
	};
	
	if (remembered) {
		updateData.studyCount = increment(1);
	} else {
		updateData.studyCount = 0;
	}
	
	try {
		await updateDoc(statRef, updateData);
	} catch (error) {
		// 문서가 없으면 생성
		await setDoc(statRef, {
			lastStudiedAt: Timestamp.now(),
			studyCount: remembered ? 1 : 0,
		});
	}
}

/**
 * 단어장 이름 가져오기
 */
export async function getWordbookName(wordbookId) {
	if (!wordbookId) return "알 수 없는 단어장";
	
	try {
		const wordbookDoc = await getDoc(doc(db, "wordbooks", wordbookId));
		if (wordbookDoc.exists()) {
			return wordbookDoc.data().name;
		}
		return "알 수 없는 단어장";
	} catch (error) {
		console.error("단어장 이름 가져오기 오류:", error);
		return "알 수 없는 단어장";
	}
}

/**
 * 망각곡선을 적용한 단어들 가져오기
 */
export async function getWordsWithForgettingCurve(wordbookIds, userId) {
	if (!wordbookIds || wordbookIds.length === 0 || !userId) return [];
	
	const allWords = await getWordsFromWordbooks(wordbookIds);
	const filteredWords = [];
	
	for (const word of allWords) {
		const stats = await getUserWordStats(word.wordbookId, userId);
		const wordStat = stats[word.id] || { studyCount: 0, lastStudiedAt: new Date() };
		
		const daysSinceLastStudy = (new Date().getTime() - wordStat.lastStudiedAt.getTime()) / (1000 * 3600 * 24);
		
		let shouldShow = false;
		if (wordStat.studyCount === 0) shouldShow = true;
		else if (wordStat.studyCount === 1 && daysSinceLastStudy >= 1) shouldShow = true;
		else if (wordStat.studyCount === 2 && daysSinceLastStudy >= 2) shouldShow = true;
		else if (wordStat.studyCount === 3 && daysSinceLastStudy >= 3) shouldShow = true;
		else if (wordStat.studyCount === 4 && daysSinceLastStudy >= 7) shouldShow = true;
		else if (wordStat.studyCount >= 5 && daysSinceLastStudy >= 30) shouldShow = true;
		
		if (shouldShow) {
			filteredWords.push({
				...word,
				studyCount: wordStat.studyCount,
				lastStudiedAt: wordStat.lastStudiedAt,
			});
		}
	}
	
	return filteredWords;
}