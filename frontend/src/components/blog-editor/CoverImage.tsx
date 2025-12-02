'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Upload } from 'lucide-react';
import { blogAPI, getImageUrl } from '@/lib/api';

interface CoverImageProps {
  coverImage: string | null;
  onUpdate: (url: string | null) => void;
}

export default function CoverImage({ coverImage, onUpdate }: CoverImageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await blogAPI.uploadImage(file);
      onUpdate(response.data.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(null);
  };

  if (coverImage) {
    return (
      <div
        className="relative w-full h-48 md:h-64 -mx-6 mb-6 group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img
          src={getImageUrl(coverImage) || ''}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        {isHovering && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 transition-opacity">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded-md hover:bg-white transition-colors"
            >
              <Upload className="w-4 h-4" />
              Change
            </button>
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/90 text-white rounded-md hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-32 -mx-6 mb-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
        dragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
        {isUploading ? (
          <>
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2" />
            <span className="text-sm">Uploading...</span>
          </>
        ) : (
          <>
            <ImagePlus className="w-8 h-8 mb-2" />
            <span className="text-sm">Add cover image</span>
            <span className="text-xs mt-1">Drag and drop or click to upload</span>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
