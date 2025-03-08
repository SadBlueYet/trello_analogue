import React from 'react';

const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]"></div>

      {/* Glass panel in the background */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
    </div>
  );
};

export default AuthBackground; 