import React from 'react';

const TransparentLoader = () => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default TransparentLoader;
