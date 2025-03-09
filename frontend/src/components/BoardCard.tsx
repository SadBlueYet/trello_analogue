import React, { useState, useRef, useEffect } from 'react';

interface BoardCardProps {
  title: string;
  listsCount?: number;
  background?: string;
  boardId: number;
  description?: string;
  onClick: () => void;
}

// Яркие цветовые градиенты для карточек досок
const BOARD_GRADIENTS = [
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-orange-400 to-pink-500',
  'from-green-400 to-cyan-500',
  'from-blue-500 to-indigo-500',
  'from-purple-500 to-indigo-500',
  'from-yellow-400 to-orange-500',
  'from-red-500 to-pink-500',
  'from-teal-400 to-cyan-500',
];

// Получение градиента на основе ID доски
const getGradientByBoardId = (id: number): string => {
  // Используем ID доски для детерминированного выбора градиента
  const gradientIndex = id % BOARD_GRADIENTS.length;
  return BOARD_GRADIENTS[gradientIndex];
};

const BoardCard: React.FC<BoardCardProps> = ({ 
  title, 
  listsCount = 0, 
  background, 
  boardId, 
  description, 
  onClick 
}) => {
  // Состояние для отслеживания, можно ли прокручивать описание
  const [isScrollable, setIsScrollable] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  
  // Определяем, является ли фон градиентом (начинается с 'from-')
  const isGradient = background?.startsWith('from-');
  
  // Если это градиент TailwindCSS или нет фона, используем предустановленные градиенты
  // Иначе считаем, что это обычный цвет (HEX, RGB и т.д.)
  const gradient = isGradient ? background : getGradientByBoardId(boardId);
  
  // Создаем случайную дату для демо
  const randomDate = () => {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30) + 1; // Случайное число от 1 до 30 дней
    now.setDate(now.getDate() - daysAgo);
    return now.toLocaleDateString();
  };
  
  // Проверяем, можно ли прокручивать описание при монтировании и обновлении
  useEffect(() => {
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsScrollable(element.scrollHeight > element.clientHeight);
    }
  }, [description]);
  
  // Предотвращаем запуск onClick при скролле
  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className="aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col relative"
      onClick={onClick}
    >
      <div 
        className={`w-full h-full p-4 text-white flex flex-col ${isGradient || !background ? 'bg-gradient-to-r' : ''} ${isGradient || !background ? gradient : ''}`}
        style={background && !isGradient ? { backgroundColor: background } : {}}
      >
        {/* Заголовок и количество списков */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold truncate max-w-[80%]">{title}</h3>
          <div className="bg-white/20 text-xs px-2 py-1 rounded-md flex-shrink-0">
            {listsCount}
          </div>
        </div>
        
        {/* Описание - с ограничением высоты и возможностью прокрутки */}
        <div className="overflow-hidden mb-24 relative">
          <div 
            ref={descriptionRef}
            className="bg-black/10 rounded-md p-2 text-sm text-white/90 break-words overflow-y-auto max-h-[120px]"
            onClick={handleDescriptionClick}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.2) transparent',
            }}
          >
            {description || <span className="italic text-white/70">No description</span>}
          </div>
          
          {/* Индикатор прокрутки - показывается только если описание можно прокручивать */}
          {isScrollable && (
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
              <div className="h-6 w-full bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-1 w-6 h-1.5 rounded-full bg-white/30 animate-pulse"></div>
            </div>
          )}
        </div>
        
        {/* Нижняя информационная панель - абсолютно позиционированная для гарантированного отображения */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between mb-2 bg-black/15 backdrop-blur-sm rounded-md px-2 py-1.5 border border-white/10">
            <span className="text-xs flex items-center font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {randomDate()}
            </span>
            
            <span className="text-xs flex items-center font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {listsCount} {listsCount === 1 ? 'list' : 'lists'}
            </span>
          </div>
          
          <div className="flex justify-end">
            <span className="bg-black/15 hover:bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center transition-colors cursor-pointer border border-white/10 font-medium">
              <span className="mr-1">Open</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardCard; 