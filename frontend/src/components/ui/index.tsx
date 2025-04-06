import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Modal from './Modal';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
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
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = "relative w-full flex justify-center items-center py-2.5 px-4 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out";

  const variantStyles = {
    primary: "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-indigo-500 border border-indigo-700",
    secondary: "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-violet-500 border border-violet-700",
    outline: "bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50 shadow-sm transform hover:-translate-y-0.5 focus:ring-indigo-500 hover:border-indigo-400"
  };

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
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
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`input-primary ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      className={`card p-6 ${hover ? 'card-hover' : ''} ${className}`}
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
    <div className="rounded-lg bg-red-50 p-4 border border-red-100 shadow-sm">
      <div className="flex">
        <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="text-sm text-red-700">{message}</div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'indigo' | 'purple' | 'pink' | 'blue' | 'green' | 'yellow' | 'red' }> =
  ({ children, color = 'indigo' }) => {

  const colorClasses = {
    indigo: 'tag',
    purple: 'tag-purple',
    pink: 'tag-pink',
    blue: 'tag-blue',
    green: 'tag-green',
    yellow: 'tag-yellow',
    red: 'tag-red'
  };

  return (
    <span className={colorClasses[color]}>
      {children}
    </span>
  );
};

export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {children}
      </div>
    </div>
  );
};

export const PageHeader: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode }> =
  ({ title, subtitle, icon }) => {
  return (
    <div className="text-center">
      {icon ? (
        <div className="flex justify-center mb-3">
          {icon}
        </div>
      ) : (
        <div className="flex justify-center mb-3">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>
      )}
      <h2 className="text-3xl font-bold text-gray-900">
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

export { Modal };
