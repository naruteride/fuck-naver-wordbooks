import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
	apiKey: "AIzaSyAwsv4WdZHkM9vjXjv5qYVYDGcVSQGDFHw",
	authDomain: "fuck-naver-wordbooks.firebaseapp.com",
	projectId: "fuck-naver-wordbooks",
	storageBucket: "fuck-naver-wordbooks.appspot.com",
	messagingSenderId: "951724915672",
	appId: "1:951724915672:web:dd9afc7b0229d83be410ad"
};

// Initialize Firebase
const app = getApps().length == 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }