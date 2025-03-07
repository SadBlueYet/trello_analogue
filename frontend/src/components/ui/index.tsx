import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface LinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const baseStyles = "group relative w-full flex justify-center py-2.5 px-4 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out";
  const variantStyles = {
    primary: "border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500"
  };

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
};

export const Input: React.FC<InputProps> = ({ 
  label, 
  error,
  className = '',
  ...props 
}) => {
  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-150 ease-in-out ${
          error ? 'border-red-500' : ''
        } ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white p-8 rounded-lg shadow-md ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const Link: React.FC<LinkProps> = ({ children, className = '', ...props }) => {
  return (
    <RouterLink
      {...props}
      className={`font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out ${className}`}
    >
      {children}
    </RouterLink>
  );
};

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="text-sm text-red-700">{message}</div>
    </div>
  );
};

export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {children}
      </div>
    </div>
  );
};

export const PageHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <div>
      <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-center text-sm text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}; 