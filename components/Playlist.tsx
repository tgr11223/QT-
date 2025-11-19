import React, { useState } from 'react';
import { VideoFile } from '../types';
import { TrashIcon, PlayIcon, DragHandleIcon } from './Icons';

interface PlaylistProps {
  files: VideoFile[];
  currentFileId: string | null;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onReorder: (newFiles: VideoFile[]) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ files, currentFileId, onRemove, onSelect, onReorder }) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newFiles = [...files];
    const draggedItem = newFiles[draggedItemIndex];
    newFiles.splice(draggedItemIndex, 1);
    newFiles.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    onReorder(newFiles);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-qt-surface transition-colors">
        <h2 className="font-semibold text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Playlist ({files.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-qt-darker p-2 transition-colors">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <p className="text-center text-sm">Drag files here or click + to add</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {files.map((file, index) => {
              const isActive = file.id === currentFileId;
              return (
                <li 
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? 'bg-qt-accent text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  } ${draggedItemIndex === index ? 'opacity-50 border-2 border-dashed border-qt-accent' : ''}`}
                  onClick={() => onSelect(file.id)}
                >
                  <span className="cursor-grab active:cursor-grabbing p-1 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <DragHandleIcon className="w-4 h-4" />
                  </span>
                  <span className="w-5 text-xs opacity-50 font-mono">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{file.name}</p>
                    <p className="text-[10px] opacity-60 truncate mt-0.5">{Math.round(file.file.size / 1024 / 1024)} MB</p>
                  </div>
                  
                  {isActive && <PlayIcon className="w-4 h-4 mr-2 animate-pulse" />}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(file.id);
                    }}
                    className={`p-1.5 rounded hover:bg-red-500 hover:text-white transition-colors ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-400'}`}
                    title="Remove"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};