
import React from 'react';
import { LoaderCircle } from 'lucide-react';

const Loader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-sky-400">
      <LoaderCircle className="w-12 h-12 animate-spin" />
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
};

export default Loader;
