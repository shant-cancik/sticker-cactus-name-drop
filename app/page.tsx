'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import StickerUpload from '@/components/StickerUpload';
import StickerCard from '@/components/StickerCard';
import { StickerJob } from '@/lib/types';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/png';
}

export default function HomePage() {
  const [jobs, setJobs] = useState<StickerJob[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchOriginal, setBatchOriginal] = useState('');
  const [batchReplacement, setBatchReplacement] = useState('');

  // Track which jobs have been auto-analyzed to avoid re-triggering
  const analyzedIdsRef = useRef<Set<string>>(new Set());

  // Update a specific job
  const updateJob = useCallback((id: string, updates: Partial<StickerJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  }, []);

  // Handle file uploads
  const handleUpload = useCallback(
    async (files: File[]) => {
      const newJobs: StickerJob[] = [];
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        newJobs.push({
          id: generateId(),
          originalImage: dataUrl,
          fileName: file.name,
          status: 'uploaded',
          replacements: {},
        });
      }
      setJobs((prev) => [...prev, ...newJobs]);
    },
    []
  );

  // Update replacement text for a specific text region
  const handleUpdateReplacement = useCallback(
    (jobId: string, originalText: string, newText: string) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, replacements: { ...j.replacements, [originalText]: newText } }
            : j
        )
      );
    },
    []
  );

  // Step 1: Analyze sticker (detect text)
  const analyzeSticker = useCallback(
    async (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      updateJob(jobId, { status: 'analyzing', error: undefined });

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: job.originalImage,
            mimeType: getMimeType(job.originalImage),
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Analysis failed');
        }

        const analysis = await response.json();
        updateJob(jobId, {
          status: 'analyzed',
          analysis,
          replacements: {},
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Analysis failed';
        updateJob(jobId, { status: 'error', error: message });
      }
    },
    [jobs, updateJob]
  );

  // Auto-analyze newly uploaded stickers
  useEffect(() => {
    jobs.forEach((job) => {
      if (job.status === 'uploaded' && !analyzedIdsRef.current.has(job.id)) {
        analyzedIdsRef.current.add(job.id);
        analyzeSticker(job.id);
      }
    });
  }, [jobs, analyzeSticker]);

  // Step 2: Replace text using Gemini
  const replaceText = useCallback(
    async (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job || !job.analysis) return;

      // Get the first replacement that has a value
      const replacementEntries = Object.entries(job.replacements).filter(
        ([, v]) => v.trim() !== ''
      );
      if (replacementEntries.length === 0) return;

      updateJob(jobId, { status: 'processing', error: undefined });

      try {
        // Process replacements sequentially - start with the original image
        let currentImage = job.originalImage;
        let currentMimeType = getMimeType(job.originalImage);

        for (const [originalText, newText] of replacementEntries) {
          // Find the matching text region for style info
          const region = job.analysis.textRegions.find(
            (r) => r.text === originalText
          );

          const response = await fetch('/api/replace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: currentImage,
              mimeType: currentMimeType,
              originalText,
              newText,
              style: region?.style,
            }),
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || err.details || 'Text replacement failed');
          }

          const result = await response.json();
          currentImage = `data:${result.mimeType};base64,${result.image}`;
          currentMimeType = result.mimeType;
        }

        updateJob(jobId, {
          status: 'done',
          processedImage: currentImage,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Replacement failed';
        updateJob(jobId, { status: 'error', error: message });
      }
    },
    [jobs, updateJob]
  );

  // Handle the main action button for a sticker
  const handleProcess = useCallback(
    (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      if (job.status === 'uploaded' || job.status === 'error') {
        analyzeSticker(jobId);
      } else if (job.status === 'analyzed' || job.status === 'done') {
        replaceText(jobId);
      }
    },
    [jobs, analyzeSticker, replaceText]
  );

  // Download processed sticker
  const handleDownload = useCallback(
    (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job || !job.processedImage) return;

      const link = document.createElement('a');
      link.href = job.processedImage;
      const ext = job.processedImage.includes('image/jpeg') ? '.jpg' : '.png';
      const baseName = job.fileName.replace(/\.[^.]+$/, '');
      link.download = `${baseName}-namedrop${ext}`;
      link.click();
    },
    [jobs]
  );

  // Remove a sticker
  const handleRemove = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  // Batch: apply same text replacement to all analyzed stickers
  const handleBatchApply = useCallback(() => {
    if (!batchOriginal.trim() || !batchReplacement.trim()) return;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.status === 'analyzed' && j.analysis) {
          // Check if any detected text matches (case-insensitive)
          const match = j.analysis.textRegions.find(
            (r) => r.text.toLowerCase() === batchOriginal.toLowerCase()
          );
          if (match) {
            return { ...j, replacements: { ...j.replacements, [match.text]: batchReplacement } };
          }
        }
        return j;
      })
    );
  }, [batchOriginal, batchReplacement]);

  // Batch process all analyzed stickers
  const handleBatchProcess = useCallback(() => {
    jobs.forEach((j) => {
      if (j.status === 'uploaded') {
        analyzeSticker(j.id);
      } else if (j.status === 'analyzed') {
        const hasRepl = Object.values(j.replacements).some((v) => v.trim() !== '');
        if (hasRepl) replaceText(j.id);
      }
    });
  }, [jobs, analyzeSticker, replaceText]);

  const hasJobs = jobs.length > 0;
  const analyzedCount = jobs.filter((j) => j.status === 'analyzed').length;
  const doneCount = jobs.filter((j) => j.status === 'done').length;
  const uploadedCount = jobs.filter((j) => j.status === 'uploaded').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Upload area - always visible */}
        <div className="mb-6">
          <StickerUpload onUpload={handleUpload} />
        </div>

        {/* Batch controls */}
        {hasJobs && jobs.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Batch Mode</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {jobs.length} stickers
                </span>
              </div>
              <button
                onClick={() => setBatchMode(!batchMode)}
                className="text-xs font-medium text-cactus-500 hover:text-cactus-600"
              >
                {batchMode ? 'Hide' : 'Show'} Batch Controls
              </button>
            </div>

            {batchMode && (
              <div className="space-y-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Find text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Arizona"
                      value={batchOriginal}
                      onChange={(e) => setBatchOriginal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-cactus-400/30 focus:border-cactus-400"
                    />
                  </div>
                  <div className="text-gray-400 pb-2">→</div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Replace with
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Nevada"
                      value={batchReplacement}
                      onChange={(e) => setBatchReplacement(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-cactus-400/30 focus:border-cactus-400"
                    />
                  </div>
                  <button
                    onClick={handleBatchApply}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg
                               hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>

                <div className="flex gap-2">
                  {uploadedCount > 0 && (
                    <button
                      onClick={handleBatchProcess}
                      className="px-4 py-2 bg-cactus-500 text-white text-sm font-semibold rounded-lg
                                 hover:bg-cactus-600 transition-colors"
                    >
                      🔍 Detect All ({uploadedCount})
                    </button>
                  )}
                  {analyzedCount > 0 && (
                    <button
                      onClick={handleBatchProcess}
                      className="px-4 py-2 bg-cactus-500 text-white text-sm font-semibold rounded-lg
                                 hover:bg-cactus-600 transition-colors"
                    >
                      ✨ Replace All ({analyzedCount})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {hasJobs && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cactus-400 rounded-full progress-bar"
                style={{
                  width: `${jobs.length > 0 ? (doneCount / jobs.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
              {doneCount} / {jobs.length} complete
            </span>
          </div>
        )}

        {/* Sticker grid */}
        {hasJobs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <StickerCard
                key={job.id}
                job={job}
                onUpdateReplacement={(orig, newT) =>
                  handleUpdateReplacement(job.id, orig, newT)
                }
                onProcess={() => handleProcess(job.id)}
                onRemove={() => handleRemove(job.id)}
                onDownload={() => handleDownload(job.id)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasJobs && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌵</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No stickers yet
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Upload sticker images above to get started. The Name Drop tool will
              detect text on each sticker and let you replace it with your custom
              branding.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
