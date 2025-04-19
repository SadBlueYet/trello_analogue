import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import { Board } from '../store/types';

interface BoardSettingsFormProps {
  board: Board;
  onSave: (updatedBoard: { title: string; description?: string; background_color?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Список предустановленных цветов для доски
const boardColors = [
  { name: 'Indigo', value: 'from-indigo-600 to-indigo-500' },
  { name: 'Purple', value: 'from-purple-600 to-indigo-500' },
  { name: 'Blue', value: 'from-blue-600 to-indigo-600' },
  { name: 'Green', value: 'from-green-500 to-teal-600' },
  { name: 'Red', value: 'from-red-500 to-pink-600' },
  { name: 'Orange', value: 'from-orange-500 to-amber-600' },
  { name: 'Teal', value: 'from-teal-500 to-emerald-700' },
  { name: 'Pink', value: 'from-pink-500 to-rose-700' },
  { name: 'Amber', value: 'from-amber-500 to-yellow-600' },
  { name: 'Cyan', value: 'from-cyan-500 to-blue-600' },
  { name: 'Sky', value: 'from-sky-500 to-blue-700' },
  { name: 'Violet', value: 'from-violet-500 to-purple-700' }
];

const BoardSettingsForm: React.FC<BoardSettingsFormProps> = ({
  board,
  onSave,
  onCancel,
  isSubmitting
}) => {
  const [title, setTitle] = useState(board.title || '');
  const [description, setDescription] = useState(board.description || '');
  const [selectedColor, setSelectedColor] = useState(board.background_color || boardColors[0].value);
  const [error, setError] = useState('');

  useEffect(() => {
    // Устанавливаем цвет доски из текущих настроек или используем дефолтный
    if (board.background_color) {
      setSelectedColor(board.background_color);
    } else {
      setSelectedColor(boardColors[0].value);
    }

    // Обновляем заголовок и описание при изменении доски
    setTitle(board.title || '');
    setDescription(board.description || '');
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
        background_color: selectedColor
      });

      // Reset error state after successful save
      setError('');
    } catch (err) {
      setError('Failed to update board settings');
      console.error('Error updating board:', err);
    }
  };

  // Функция для предпросмотра цвета
  const getPreviewStyle = (color: string) => {
    return {
      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
      backgroundColor: color.includes('from-') ? undefined : color,
    };
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
          <div className="grid grid-cols-4 gap-2">
            {boardColors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`h-12 rounded-md cursor-pointer bg-gradient-to-r ${color.value} flex items-center justify-center ${
                  selectedColor === color.value ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-90'
                }`}
                onClick={() => setSelectedColor(color.value)}
              >
                {selectedColor === color.value && (
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Предпросмотр доски */}
          <div className="mt-4">
            <div
              className={`h-16 rounded-md bg-gradient-to-r ${selectedColor} p-3 flex items-center justify-center shadow-md`}
            >
              <span className="text-white font-medium">Board color preview</span>
            </div>
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
