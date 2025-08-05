"use client";

import { useState } from "react";
import { FunnelIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function WordbookSelector({ wordbooks, selectedWordbooks, onSelectionChange, currentLanguage }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 현재 언어에 맞는 단어장들만 필터링
  const filteredWordbooks = wordbooks.filter(wb => wb.language === currentLanguage);
  
  const handleToggleWordbook = (wordbookId) => {
    const newSelection = selectedWordbooks.includes(wordbookId)
      ? selectedWordbooks.filter(id => id !== wordbookId)
      : [...selectedWordbooks, wordbookId];
    
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    onSelectionChange(filteredWordbooks.map(wb => wb.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const getSelectedNames = () => {
    const selectedNames = filteredWordbooks
      .filter(wb => selectedWordbooks.includes(wb.id))
      .map(wb => wb.name);
    
    if (selectedNames.length === 0) return "단어장을 선택하세요";
    if (selectedNames.length === filteredWordbooks.length) return "모든 단어장";
    if (selectedNames.length === 1) return selectedNames[0];
    return `${selectedNames[0]} 외 ${selectedNames.length - 1}개`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left hover:bg-gray-50"
      >
        <div className="flex items-center">
          <FunnelIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm">{getSelectedNames()}</span>
        </div>
        <span className="text-xs text-gray-500">
          {selectedWordbooks.length}/{filteredWordbooks.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  전체 선택
                </button>
                <button
                  onClick={selectNone}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                >
                  전체 해제
                </button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {filteredWordbooks.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {currentLanguage === "english" ? "영어" : "일본어"} 단어장이 없습니다
                </div>
              ) : (
                filteredWordbooks.map((wordbook) => (
                  <div
                    key={wordbook.id}
                    onClick={() => handleToggleWordbook(wordbook.id)}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-4 h-4 mr-3">
                      {selectedWordbooks.includes(wordbook.id) && (
                        <CheckIcon className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {wordbook.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {wordbook.collaborators.length}명 참여
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 클릭 외부 영역 감지 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 