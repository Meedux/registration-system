'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Button = ({ 
  children, 
  className, 
  variant = 'default', 
  size = 'default', 
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    default: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500",
    outline: "border-2 border-transparent hover:bg-gray-800 text-gray-300 hover:text-white focus:ring-gray-500",
    ghost: "hover:bg-gray-800 text-gray-300 hover:text-white focus:ring-gray-500",
    destructive: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
};

export const Input = ({ 
  className, 
  type = 'text', 
  error,
  label,
  required = false,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "w-full px-3 py-2 bg-gray-800 border-0 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200",
          error && "ring-1 ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export const Select = ({ 
  className, 
  children, 
  error,
  label,
  required = false,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        className={cn(
          "w-full px-3 py-2 bg-gray-800 border-0 rounded-lg text-white focus:outline-none focus:ring-0 transition-all duration-200",
          error && "ring-1 ring-red-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export const Checkbox = ({ 
  className, 
  children, 
  error,
  checked,
  onChange,
  id,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            className={cn(
              "peer h-5 w-5 appearance-none rounded-md bg-gray-700 border-2 border-gray-600 checked:bg-blue-600 checked:border-blue-600 focus:ring-0 focus:ring-offset-0 transition-all duration-200 cursor-pointer",
              error && "border-red-500 checked:bg-red-600 checked:border-red-600",
              className
            )}
            {...props}
          />
          {/* Custom checkmark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {children && (
          <label htmlFor={id} className="text-sm text-gray-300 cursor-pointer select-none">
            {children}
          </label>
        )}
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export const Card = ({ className, children, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gray-800 border-0 rounded-lg shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div
      className={cn("p-6 pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div
      className={cn("p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const Alert = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: "bg-gray-800 text-gray-300",
    destructive: "bg-red-900/20 text-red-300",
    success: "bg-green-900/20 text-green-300",
    warning: "bg-yellow-900/20 text-yellow-300"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-4 border-0 rounded-lg",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "bg-gray-800 border-0 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
