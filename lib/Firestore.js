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

const ENGLISH_COLLECTION = "englishWords";
const JAPANESE_COLLECTION = "japaneseWords";

/**
 * Get words from Firestore
 * @param {"english" | "japanese"} language
 * @returns {Promise<Word[]>}
 */
export async function getWords(language) {
	const collectionName = language === "english" ? ENGLISH_COLLECTION : JAPANESE_COLLECTION;
	const querySnapshot = await getDocs(collection(db, collectionName));
	return querySnapshot.docs.map(doc => ({
		id: doc.id,
		...doc.data(),
		createdAt: doc.data().createdAt.toDate(),
		lastStudiedAt: doc.data().lastStudiedAt.toDate(),
	}));
}

/**
 * Add a new word to Firestore
 * @param {Omit<Word, "id">} word
 * @param {"english" | "japanese"} language
 * @returns {Promise<string>}
 */
export async function addWord(word, language) {
	const collectionName = language === "english" ? ENGLISH_COLLECTION : JAPANESE_COLLECTION;
	const docRef = await addDoc(collection(db, collectionName), {
		...word,
		createdAt: Timestamp.fromDate(word.createdAt),
		lastStudiedAt: Timestamp.fromDate(word.lastStudiedAt),
	});
	return docRef.id;
}

/**
 * Update a word in Firestore
 * @param {Word} word
 * @param {"english" | "japanese"} language
 * @returns {Promise<void>}
 */
export async function updateWord(word, language) {
	const collectionName = language === "english" ? ENGLISH_COLLECTION : JAPANESE_COLLECTION;
	const wordRef = doc(db, collectionName, word.id);
	await updateDoc(wordRef, {
		...word,
		createdAt: Timestamp.fromDate(word.createdAt),
		lastStudiedAt: Timestamp.fromDate(word.lastStudiedAt),
	});
}

/**
 * Delete a word from Firestore
 * @param {string} id
 * @param {"english" | "japanese"} language
 * @returns {Promise<void>}
 */
export async function deleteWord(id, language) {
	const collectionName = language === "english" ? ENGLISH_COLLECTION : JAPANESE_COLLECTION;
	await deleteDoc(doc(db, collectionName, id));
}

/**
 * Update study count for a word
 * @param {string} id
 * @param {"english" | "japanese"} language
 * @param {boolean} remembered
 * @returns {Promise<void>}
 */
export async function updateStudyCount(id, language, remembered) {
	const collectionName = language === "english" ? ENGLISH_COLLECTION : JAPANESE_COLLECTION;
	const wordRef = doc(db, collectionName, id);
	await updateDoc(wordRef, {
		studyCount: remembered ? increment(1) : 0,
		lastStudiedAt: Timestamp.now(),
	});
}

/**
 * Get words with forgetting curve applied
 * @param {"english" | "japanese"} language
 * @returns {Promise<Word[]>}
 */
export async function getWordsWithForgettingCurve(language) {
	const collectionName = language === "english" ? ENGLISH_COLLECTION : JAPANESE_COLLECTION;
	const now = Timestamp.now();

	const querySnapshot = await getDocs(
		query(
			collection(db, collectionName),
			where("lastStudiedAt", "<=", now),
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
			if (word.studyCount === 0) return true;
			if (word.studyCount === 1 && daysSinceLastStudy >= 1) return true;
			if (word.studyCount === 2 && daysSinceLastStudy >= 2) return true;
			if (word.studyCount === 3 && daysSinceLastStudy >= 3) return true;
			if (word.studyCount === 4 && daysSinceLastStudy >= 7) return true;
			if (word.studyCount >= 5 && daysSinceLastStudy >= 30) return true;
			return false;
		});
}