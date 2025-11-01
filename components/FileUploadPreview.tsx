
import React from 'react';

interface FileUploadPreviewProps {
  files: File[];
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ files }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-200">Selected Files:</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
        {files.map((file, index) => (
          <div key={index} className="relative aspect-square border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-full object-cover"
              onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-1 text-center">
              <p className="text-xs text-white truncate">{file.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadPreview;
