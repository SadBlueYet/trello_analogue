import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import { Board } from '../store/types';

interface BoardSettingsFormProps {
  board: Board;
  onSave: (updatedBoard: { title: string; description?: string; backgroundColor?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Список предустановленных цветов для доски
const boardColors = [
  { name: 'Blue', value: 'from-blue-600 to-indigo-700' },
  { name: 'Green', value: 'from-green-500 to-teal-600' },
  { name: 'Purple', value: 'from-purple-600 to-indigo-800' },
  { name: 'Red', value: 'from-red-500 to-pink-600' },
  { name: 'Orange', value: 'from-orange-500 to-amber-600' },
  { name: 'Gray', value: 'from-gray-600 to-gray-800' }
];

const BoardSettingsForm: React.FC<BoardSettingsFormProps> = ({
  board,
  onSave,
  onCancel,
  isSubmitting
}) => {
  const [title, setTitle] = useState(board.title || '');
  const [description, setDescription] = useState(board.description || '');
  const [selectedColor, setSelectedColor] = useState(boardColors[0].value);
  const [error, setError] = useState('');

  useEffect(() => {
    // Можно добавить логику для определения текущего цвета доски
    // и установки соответствующего значения в selectedColor
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Board title is required');
      return;
    }
    
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        backgroundColor: selectedColor
      });
    } catch (err) {
      setError('Failed to update board settings');
      console.error('Error updating board:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <Input
          label="Board Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter board title"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Board Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter board description (optional)"
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150 ease-in-out"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Board Color
          </label>
          <div className="grid grid-cols-3 gap-2">
            {boardColors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`h-10 rounded-md cursor-pointer bg-gradient-to-r ${color.value} flex items-center justify-center ${
                  selectedColor === color.value ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-90'
                }`}
                onClick={() => setSelectedColor(color.value)}
              >
                <span className="text-xs text-white font-medium">{color.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};

export default BoardSettingsForm; 