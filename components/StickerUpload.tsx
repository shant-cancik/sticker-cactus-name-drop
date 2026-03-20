'use client';

import { useCallback, useRef } from 'react';

interface Props {
  onUpload: (files: File[]) => void;
}

export default function StickerUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length > 0) onUpload(imageFiles);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropRef.current?.classList.remove('drop-active');
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.add('drop-active');
  };

  const handleDragLeave = () => {
    dropRef.current?.classList.remove('drop-active');
  };

  return (
    <div
      ref={dropRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer
                 hover:border-cactus-400 hover:bg-cactus-50 transition-all duration-200"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="text-5xl mb-3">📤</div>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-cactus-500">Click to upload</span> or
        drag stickers here
      </p>
      <p className="text-xs text-gray-400 mt-1">
        PNG, JPG, or any image — upload one or many
      </p>
    </div>
  );
}
