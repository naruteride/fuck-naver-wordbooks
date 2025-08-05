"use client";

import { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { db } from "../../lib/Firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export default function DataMigration() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const migrateData = async () => {
    if (!user || !confirm("기존 데이터를 현재 계정으로 마이그레이션하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    setMigrationResult(null);

    try {
      const result = { english: 0, japanese: 0, errors: [] };

      // 영어 단어 마이그레이션
      try {
        const englishSnapshot = await getDocs(collection(db, "englishWords"));
        for (const wordDoc of englishSnapshot.docs) {
          const wordData = wordDoc.data();
          await addDoc(collection(db, "users", user.uid, "englishWords"), wordData);
          await deleteDoc(wordDoc.ref);
          result.english++;
        }
      } catch (error) {
        result.errors.push(`영어 단어 마이그레이션 오류: ${error.message}`);
      }

      // 일본어 단어 마이그레이션
      try {
        const japaneseSnapshot = await getDocs(collection(db, "japaneseWords"));
        for (const wordDoc of japaneseSnapshot.docs) {
          const wordData = wordDoc.data();
          await addDoc(collection(db, "users", user.uid, "japaneseWords"), wordData);
          await deleteDoc(wordDoc.ref);
          result.japanese++;
        }
      } catch (error) {
        result.errors.push(`일본어 단어 마이그레이션 오류: ${error.message}`);
      }

      setMigrationResult(result);
    } catch (error) {
      setMigrationResult({ 
        english: 0, 
        japanese: 0, 
        errors: [`전체 마이그레이션 오류: ${error.message}`] 
      });
    }

    setIsLoading(false);
  };

  const checkOldData = async () => {
    try {
      const englishSnapshot = await getDocs(collection(db, "englishWords"));
      const japaneseSnapshot = await getDocs(collection(db, "japaneseWords"));
      
      alert(`기존 데이터 확인:\n영어 단어: ${englishSnapshot.size}개\n일본어 단어: ${japaneseSnapshot.size}개`);
    } catch (error) {
      alert(`데이터 확인 오류: ${error.message}`);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">데이터 마이그레이션</h3>
      <p className="text-sm text-yellow-700 mb-4">
        기존 공유 데이터를 현재 계정으로 이동시킵니다. 
        <br />
        <strong>⚠️ 주의: 이 작업은 되돌릴 수 없습니다!</strong>
      </p>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={checkOldData}
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
          disabled={isLoading}
        >
          기존 데이터 확인
        </button>
        
        <button
          onClick={migrateData}
          className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
          disabled={isLoading}
        >
          {isLoading ? "마이그레이션 중..." : "데이터 마이그레이션"}
        </button>
      </div>

      {migrationResult && (
        <div className="bg-white border rounded p-3 text-sm">
          <h4 className="font-semibold mb-2">마이그레이션 결과:</h4>
          <p>영어 단어: {migrationResult.english}개 이동</p>
          <p>일본어 단어: {migrationResult.japanese}개 이동</p>
          {migrationResult.errors.length > 0 && (
            <div className="mt-2 text-red-600">
              <strong>오류:</strong>
              <ul className="list-disc list-inside">
                {migrationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 