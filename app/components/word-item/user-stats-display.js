"use client";

import { useState, useEffect } from "react";
import { getAllUserWordStats, getUserProfile } from "../../../lib/Firestore";
import { useAuth } from "../../../lib/AuthProvider";
import { UsersIcon } from "@heroicons/react/24/outline";

export default function UserStatsDisplay({ wordbookId, wordId }) {
  const { user } = useAuth();
  const [allStats, setAllStats] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showAll && wordbookId && wordId) {
      loadAllStats();
    }
  }, [showAll, wordbookId, wordId]);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const stats = await getAllUserWordStats(wordbookId, wordId);
      setAllStats(stats);
      
      // 각 사용자의 프로필 정보 로드
      const profiles = {};
      for (const userId of Object.keys(stats)) {
        const profile = await getUserProfile(userId);
        if (profile) {
          profiles[userId] = profile;
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error("학습 통계 로딩 오류:", error);
    }
    setLoading(false);
  };

  const formatDate = (date) => {
    if (!date) return "없음";
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (userId) => {
    if (userId === user?.uid) return "나";
    
    const profile = userProfiles[userId];
    if (profile) {
      return profile.displayName || profile.email.split("@")[0];
    }
    
    // 프로필이 없는 경우 UID의 일부만 표시
    return userId.slice(-6);
  };

  const currentUserStat = allStats[user?.uid];

  return (
    <div className="border-t border-gray-200 pt-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          <strong>내 학습:</strong> {currentUserStat?.studyCount || 0}회
          {currentUserStat?.lastStudiedAt && (
            <span className="text-gray-500 ml-2">
              (최근: {formatDate(currentUserStat.lastStudiedAt)})
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center text-xs text-blue-600 hover:text-blue-800"
        >
          <UsersIcon className="h-4 w-4 mr-1" />
          {showAll ? "숨기기" : "전체 통계"}
        </button>
      </div>

      {showAll && (
        <div className="mt-2 bg-gray-50 rounded p-3">
          <h6 className="text-sm font-medium text-gray-700 mb-2">모든 사용자 학습 통계</h6>
          
          {loading ? (
            <div className="text-center text-gray-500 text-sm">로딩 중...</div>
          ) : (
            <div className="space-y-1">
              {Object.entries(allStats).map(([userId, stats]) => (
                <div key={userId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 flex-1">
                    {getUserDisplayName(userId)}
                    {userId === user?.uid && <span className="text-blue-600 ml-1">(현재 사용자)</span>}
                    {userProfiles[userId] && userId !== user?.uid && (
                      <div className="text-xs text-gray-500">
                        {userProfiles[userId].email}
                      </div>
                    )}
                  </span>
                  <div className="text-right">
                    <span className="font-medium">{stats.studyCount}회</span>
                    {stats.lastStudiedAt && (
                      <div className="text-xs text-gray-500">
                        {formatDate(stats.lastStudiedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {Object.keys(allStats).length === 0 && (
                <div className="text-center text-gray-500 text-sm">아직 학습한 사용자가 없습니다</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 