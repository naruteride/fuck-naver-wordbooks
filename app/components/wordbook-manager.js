"use client";

import { useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { createWordbook, deleteWordbook, addCollaborator, removeCollaborator } from "../../lib/Firestore";
import { PlusIcon, TrashIcon, UserPlusIcon, UserMinusIcon } from "@heroicons/react/24/outline";

export default function WordbookManager({ wordbooks, onWordbooksChange }) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newWordbook, setNewWordbook] = useState({ name: "", language: "english" });
  const [expandedWordbook, setExpandedWordbook] = useState(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user || !newWordbook.name.trim()) return;

    try {
      await createWordbook(newWordbook.name.trim(), newWordbook.language, user.uid);
      setNewWordbook({ name: "", language: "english" });
      setIsCreating(false);
      onWordbooksChange();
    } catch (error) {
      alert(`단어장 생성 오류: ${error.message}`);
    }
  };

  const handleDelete = async (wordbookId) => {
    if (!confirm("단어장을 삭제하시겠습니까? 모든 단어가 삭제됩니다.")) return;

    try {
      await deleteWordbook(wordbookId, user.uid);
      onWordbooksChange();
    } catch (error) {
      alert(`삭제 오류: ${error.message}`);
    }
  };

  const handleAddCollaborator = async (wordbookId) => {
    if (!collaboratorEmail.trim()) return;

    try {
      await addCollaborator(wordbookId, collaboratorEmail.trim());
      setCollaboratorEmail("");
      onWordbooksChange();
      alert("협업자가 추가되었습니다!");
    } catch (error) {
      alert(`협업자 추가 오류: ${error.message}`);
    }
  };

  const handleRemoveCollaborator = async (wordbookId, userEmail) => {
    if (!confirm("이 사용자를 단어장에서 제거하시겠습니까?")) return;

    try {
      await removeCollaborator(wordbookId, userEmail);
      onWordbooksChange();
    } catch (error) {
      alert(`협업자 제거 오류: ${error.message}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">내 단어장</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          새 단어장
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-4 p-3 bg-gray-50 rounded">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="단어장 이름"
              value={newWordbook.name}
              onChange={(e) => setNewWordbook({ ...newWordbook, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              required
            />
            <select
              value={newWordbook.language}
              onChange={(e) => setNewWordbook({ ...newWordbook, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="english">영어</option>
              <option value="japanese">일본어</option>
            </select>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                생성
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {wordbooks.map((wordbook) => (
          <div key={wordbook.id} className="border border-gray-200 rounded p-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{wordbook.name}</h4>
                <p className="text-sm text-gray-500">
                  {wordbook.language === "english" ? "영어" : "일본어"} •{" "}
                  {wordbook.createdBy === user.uid ? "내가 생성" : "공유받음"} •{" "}
                  {wordbook.collaborators.length}명 참여
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setExpandedWordbook(expandedWordbook === wordbook.id ? null : wordbook.id)}
                  className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                >
                  {expandedWordbook === wordbook.id ? "접기" : "관리"}
                </button>
                {wordbook.createdBy === user.uid && (
                  <button
                    onClick={() => handleDelete(wordbook.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {expandedWordbook === wordbook.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="font-medium mb-2">협업자 관리</h5>
                
                <div className="mb-3">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      value={collaboratorEmail}
                      onChange={(e) => setCollaboratorEmail(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleAddCollaborator(wordbook.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex items-center"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-1" />
                      추가
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {wordbook.collaborators.map((collaborator) => (
                    <div key={collaborator} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                      <span className="text-sm">
                        {collaborator} {collaborator === user.uid && "(나)"}
                      </span>
                      {wordbook.createdBy === user.uid && collaborator !== user.uid && (
                        <button
                          onClick={() => handleRemoveCollaborator(wordbook.id, collaborator)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <UserMinusIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 