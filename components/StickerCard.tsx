'use client';

import { StickerJob, TextRegion } from '@/lib/types';

interface Props {
  job: StickerJob;
  onUpdateReplacement: (originalText: string, newText: string) => void;
  onProcess: () => void;
  onRemove: () => void;
  onDownload: () => void;
}

const STATUS_LABELS: Record<StickerJob['status'], { label: string; color: string }> = {
  uploaded: { label: 'Ready', color: 'bg-gray-200 text-gray-700' },
  analyzing: { label: 'Analyzing...', color: 'bg-yellow-100 text-yellow-800' },
  analyzed: { label: 'Text Detected', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Replacing Text...', color: 'bg-purple-100 text-purple-800' },
  done: { label: 'Complete', color: 'bg-green-100 text-green-800' },
  error: { label: 'Error', color: 'bg-red-100 text-red-800' },
};

export default function StickerCard({ job, onUpdateReplacement, onProcess, onRemove, onDownload }: Props) {
  const statusInfo = STATUS_LABELS[job.status];
  const isProcessing = job.status === 'analyzing' || job.status === 'processing';
  const hasReplacements = Object.values(job.replacements).some((v) => v.trim() !== '');

  return (
    <div className="sticker-card bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Image section */}
      <div className="relative bg-gray-100 flex items-center justify-center" style={{ minHeight: 200 }}>
        {/* Show processed image if done, otherwise original */}
        <img
          src={job.status === 'done' && job.processedImage ? job.processedImage : job.originalImage}
          alt={job.fileName}
          className="max-h-72 w-auto object-contain"
        />

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="pulse-ring inline-block text-4xl mb-2">
                {job.status === 'analyzing' ? '🔍' : '✨'}
              </div>
              <p className="text-sm font-medium text-gray-600">
                {job.status === 'analyzing' ? 'Detecting text...' : 'Replacing text...'}
              </p>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
          {statusInfo.label}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-red-500 text-white text-xs
                     flex items-center justify-center hover:bg-red-600 transition-colors shadow"
          title="Remove sticker"
        >
          ×
        </button>
      </div>

      {/* Info section */}
      <div className="p-4">
        <p className="text-sm font-medium text-gray-700 truncate mb-3">{job.fileName}</p>

        {/* Error message */}
        {job.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs text-red-700">
            {job.error}
          </div>
        )}

        {/* Detected text regions with replacement inputs */}
        {job.analysis && job.analysis.textRegions.length > 0 && (
          <div className="space-y-3 mb-3">
            {job.analysis.textRegions.map((region: TextRegion, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Detected Text
                  </span>
                  <span className="text-xs bg-cactus-100 text-cactus-600 px-2 py-0.5 rounded-full font-medium">
                    {Math.round(region.confidence * 100)}% confident
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-800 mb-2">
                  &quot;{region.text}&quot;
                </p>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Replace with
                </label>
                <input
                  type="text"
                  placeholder={`e.g., ${region.text === 'ARIZONA' ? 'NEVADA' : 'New text...'}`}
                  value={job.replacements[region.text] || ''}
                  onChange={(e) => onUpdateReplacement(region.text, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-cactus-400/30 focus:border-cactus-400
                             transition-all"
                  disabled={isProcessing}
                />
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {job.status === 'uploaded' && (
            <button
              onClick={onProcess}
              className="flex-1 px-4 py-2.5 bg-cactus-500 text-white text-sm font-semibold
                         rounded-lg hover:bg-cactus-600 transition-colors"
            >
              🔍 Detect Text
            </button>
          )}

          {job.status === 'analyzed' && (
            <button
              onClick={onProcess}
              disabled={!hasReplacements}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors
                ${hasReplacements
                  ? 'bg-cactus-500 text-white hover:bg-cactus-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              ✨ Replace Text
            </button>
          )}

          {job.status === 'done' && (
            <>
              <button
                onClick={onDownload}
                className="flex-1 px-4 py-2.5 bg-cactus-500 text-white text-sm font-semibold
                           rounded-lg hover:bg-cactus-600 transition-colors"
              >
                📥 Download
              </button>
              <button
                onClick={onProcess}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold
                           rounded-lg hover:bg-gray-200 transition-colors"
                title="Redo with different text"
              >
                🔄
              </button>
            </>
          )}

          {job.status === 'error' && (
            <button
              onClick={onProcess}
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold
                         rounded-lg hover:bg-orange-600 transition-colors"
            >
              🔄 Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
