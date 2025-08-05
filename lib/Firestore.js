import { db } from "./Firebase";
import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDocs,
	query,
	where,
	orderBy,
	Timestamp,
	increment,
} from "firebase/firestore";

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
 * @property {Date} createdAt
 * @property {number} studyCount
 * @property {Date} lastStudiedAt
 */

/**
 * Get collection reference for user
 * @param {string} userId 
 * @param {"english" | "japanese"} language
 * @returns {import("firebase/firestore").CollectionReference}
 */
function getUserWordsCollection(userId, language) {
	const collectionName = language === "english" ? "englishWords" : "japaneseWords";
	return collection(db, "users", userId, collectionName);
}

/**
 * Get words from Firestore for specific user
 * @param {"english" | "japanese"} language
 * @param {string} userId
 * @returns {Promise<Word[]>}
 */
export async function getWords(language, userId) {
	if (!userId) {
		throw new Error("사용자 ID가 필요합니다");
	}
	
	const wordsCollection = getUserWordsCollection(userId, language);
	const querySnapshot = await getDocs(wordsCollection);
	return querySnapshot.docs.map(doc => ({
		id: doc.id,
		...doc.data(),
		createdAt: doc.data().createdAt.toDate(),
		lastStudiedAt: doc.data().lastStudiedAt.toDate(),
	}));
}

/**
 * Add a new word to Firestore for specific user
 * @param {Omit<Word, "id">} word
 * @param {"english" | "japanese"} language
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function addWord(word, language, userId) {
	if (!userId) {
		throw new Error("사용자 ID가 필요합니다");
	}
	
	const wordsCollection = getUserWordsCollection(userId, language);
	const docRef = await addDoc(wordsCollection, {
		...word,
		createdAt: Timestamp.fromDate(word.createdAt),
		lastStudiedAt: Timestamp.fromDate(word.lastStudiedAt),
	});
	return docRef.id;
}

/**
 * Update a word in Firestore for specific user
 * @param {Word} word
 * @param {"english" | "japanese"} language
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function updateWord(word, language, userId) {
	if (!userId) {
		throw new Error("사용자 ID가 필요합니다");
	}
	
	const wordRef = doc(getUserWordsCollection(userId, language), word.id);
	await updateDoc(wordRef, {
		...word,
		createdAt: Timestamp.fromDate(word.createdAt),
		lastStudiedAt: Timestamp.fromDate(word.lastStudiedAt),
	});
}

/**
 * Delete a word from Firestore for specific user
 * @param {string} id
 * @param {"english" | "japanese"} language
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function deleteWord(id, language, userId) {
	if (!userId) {
		throw new Error("사용자 ID가 필요합니다");
	}
	
	await deleteDoc(doc(getUserWordsCollection(userId, language), id));
}

/**
 * Update study count for a word for specific user
 * @param {string} id
 * @param {"english" | "japanese"} language
 * @param {boolean} remembered
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function updateStudyCount(id, language, remembered, userId) {
	if (!userId) {
		throw new Error("사용자 ID가 필요합니다");
	}
	
	const wordRef = doc(getUserWordsCollection(userId, language), id);
	await updateDoc(wordRef, {
		studyCount: remembered ? increment(1) : 0,
		lastStudiedAt: Timestamp.now(),
	});
}

/**
 * Get words with forgetting curve applied for specific user
 * @param {"english" | "japanese"} language
 * @param {string} userId
 * @returns {Promise<Word[]>}
 */
export async function getWordsWithForgettingCurve(language, userId) {
	if (!userId) {
		throw new Error("사용자 ID가 필요합니다");
	}
	
	const wordsCollection = getUserWordsCollection(userId, language);
	const now = Timestamp.now();

	const querySnapshot = await getDocs(
		query(
			wordsCollection,
			orderBy("lastStudiedAt", "desc")
		)
	);

	return querySnapshot.docs
		.map(doc => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt.toDate(),
			lastStudiedAt: doc.data().lastStudiedAt.toDate(),
		}))
		.filter(word => {
			const daysSinceLastStudy = (now.toDate().getTime() - word.lastStudiedAt.getTime()) / (1000 * 3600 * 24);
			if (word.studyCount == 0) return true;
			if (word.studyCount == 1 && daysSinceLastStudy >= 1) return true;
			if (word.studyCount == 2 && daysSinceLastStudy >= 2) return true;
			if (word.studyCount == 3 && daysSinceLastStudy >= 3) return true;
			if (word.studyCount == 4 && daysSinceLastStudy >= 7) return true;
			if (word.studyCount >= 5 && daysSinceLastStudy >= 30) return true;
			return false;
		});
}