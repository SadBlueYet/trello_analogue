import React from 'react';

const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Яркие анимированные круги */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply opacity-15 animate-blob-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply opacity-15 animate-blob-slow animation-delay-2000"></div>
      <div className="absolute -bottom-16 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply opacity-15 animate-blob-slow animation-delay-4000"></div>

      {/* Декоративные элементы */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse-soft"></div>
      <div className="absolute bottom-10 right-10 w-28 h-28 bg-green-400 rounded-full opacity-20 animate-pulse-soft animation-delay-2000"></div>

      {/* Градиентные лучи */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-200 to-pink-200 rotate-45 opacity-20 transform origin-bottom-right"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-indigo-200 to-blue-200 -rotate-45 opacity-20 transform origin-top-left"></div>

      {/* Сетка */}
      <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:40px_40px]"></div>

      {/* Яркие линии */}
      <div className="absolute h-px w-screen top-1/3 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-30"></div>
      <div className="absolute h-screen w-px left-1/3 bg-gradient-to-b from-transparent via-pink-300 to-transparent opacity-30"></div>
    </div>
  );
};

export default AuthBackground;
