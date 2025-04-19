import React, { useState, useRef, useEffect } from 'react';
import { Board } from '../../store/types';

interface BoardCardProps {
    board: Board;
    onClick?: () => void;
}

// Default board color
const DEFAULT_BOARD_COLOR = '#4F46E5'; // indigo

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick }) => {
    const { title, description, lists, background_color, created_at } = board;

    // Состояние для отслеживания, можно ли прокручивать описание
    const [isScrollable, setIsScrollable] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);

    // Определяем, является ли фон градиентом (начинается с 'from-')
    const isGradient = background_color?.startsWith('from-');

    // Используем установленный цвет или цвет по умолчанию
    const gradient = isGradient ? background_color : 'from-indigo-600 to-indigo-500';

    // Format date from database if available
    const formatDate = () => {
        if (created_at) {
            return new Date(created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
        return 'Нет даты';
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
            style={{ minWidth: 'calc(100% - 1rem)', minHeight: '150px', maxHeight: '250px' }}
        >
            <div
                className={`w-full h-full p-3 text-white flex flex-col ${isGradient ? 'bg-gradient-to-r' : ''} ${isGradient ? gradient : ''}`}
                style={background_color && !isGradient ? { backgroundColor: background_color } :
                    !background_color ? { backgroundColor: DEFAULT_BOARD_COLOR } : {}}
            >
                {/* Заголовок и количество списков */}
                <div className="flex items-start justify-between mb-1.5">
                    <h3 className="text-base font-bold truncate max-w-[75%]">{title}</h3>
                    <div className="bg-white/20 text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 ml-1">
                        {lists?.length || 0}
                    </div>
                </div>

                {/* Описание - с ограничением высоты и возможностью прокрутки */}
                <div className="overflow-hidden mb-16 flex-grow">
                    <div
                        ref={descriptionRef}
                        className="bg-black/10 rounded-md p-2 text-sm text-white/90 break-words overflow-y-auto h-full"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                        }}
                        onClick={handleDescriptionClick}
                    >
                        {description || <span className="italic text-white/70">No description</span>}
                    </div>

                    {/* Простой индикатор прокрутки */}
                    {isScrollable && (
                        <div className="absolute bottom-20 right-1 w-1.5 h-1.5 rounded-full bg-white/40"></div>
                    )}
                </div>

                {/* Нижняя информационная панель - абсолютно позиционированная для гарантированного отображения */}
                <div className="absolute left-3 right-3 bottom-3">
                    <div className="flex items-center justify-between mb-1.5 bg-black/15 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10 overflow-hidden">
                        <span className="text-xs flex items-center font-medium whitespace-nowrap mr-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate max-w-[80px]">{formatDate()}</span>
                        </span>

                        <span className="text-xs flex items-center font-medium whitespace-nowrap ml-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="truncate">{lists?.length || 0} {(lists?.length || 0) === 1 ? 'list' : 'lists'}</span>
                        </span>
                    </div>

                    <div className="flex justify-end">
                        <span className="bg-black/15 hover:bg-black/25 px-2 py-1 rounded-full text-xs flex items-center transition-colors cursor-pointer border border-white/10 font-medium">
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
