import React, { useState, useEffect } from 'react';
import { Modal } from './ui';
import { Button, Input } from './ui';
import { BoardShare, User } from '../store/types';
import { boardService } from '../services/board.service';
import { userService } from '../services/user.service';

interface ShareBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
}

const ShareBoardModal: React.FC<ShareBoardModalProps> = ({ isOpen, onClose, boardId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shares, setShares] = useState<BoardShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccessType, setSelectedAccessType] = useState('read');

  // Загрузка текущих шарингов при открытии модального окна
  useEffect(() => {
    if (isOpen && boardId) {
      loadShares();
    }
  }, [isOpen, boardId]);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const sharesData = await boardService.getBoardShares(boardId);
      setShares(sharesData);
    } catch (error) {
      console.error('Error loading shares:', error);
      setError('Failed to load shared users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const users = await userService.searchUsers(searchQuery);

      // Фильтруем пользователей, которым уже предоставлен доступ
      const filteredUsers = users.filter(user =>
        !shares.some(share => share.user.id === user.id)
      );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleShareBoard = async (userId: number) => {
    try {
      await boardService.shareBoard(boardId, userId, selectedAccessType);

      // Обновляем список шарингов
      await loadShares();

      // Очищаем результаты поиска
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error sharing board:', error);
      setError('Failed to share board');
    }
  };

  const handleUpdateShare = async (userId: number, accessType: string) => {
    try {
      await boardService.updateBoardShare(boardId, userId, accessType);

      // Обновляем список шарингов
      await loadShares();
    } catch (error) {
      console.error('Error updating share:', error);
      setError('Failed to update share');
    }
  };

  const handleRemoveShare = async (userId: number) => {
    try {
      await boardService.removeBoardShare(boardId, userId);

      // Обновляем список шарингов
      await loadShares();
    } catch (error) {
      console.error('Error removing share:', error);
      setError('Failed to remove share');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Board" size="medium">
      <div className="p-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Add People</h3>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search by username or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              isLoading={isSearching}
            >
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border rounded-md divide-y">
              {searchResults.map(user => (
                <div key={user.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedAccessType}
                      onChange={(e) => setSelectedAccessType(e.target.value)}
                    >
                      <option value="read">Read only</option>
                      <option value="write">Can edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      onClick={() => handleShareBoard(user.id!)}
                      className="text-sm px-3 py-1"
                    >
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="mt-2 text-gray-500">No users found</div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">People with Access</h3>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : shares.length === 0 ? (
            <div className="text-gray-500 py-2">No one has access to this board yet</div>
          ) : (
            <div className="border rounded-md divide-y">
              {shares.map(share => (
                <div key={share.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{share.user.username}</div>
                    <div className="text-sm text-gray-500">{share.user.email}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={share.access_type}
                      onChange={(e) => handleUpdateShare(share.user.id!, e.target.value)}
                    >
                      <option value="read">Read only</option>
                      <option value="write">Can edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveShare(share.user.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ShareBoardModal;
