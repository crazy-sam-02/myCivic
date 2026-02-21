import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { simulateLocation } from '@/lib/helpers';
import { aiApi } from '@/lib/api';
import type { IssueCategory, IssueSeverity } from '@/types/issue';
import { Camera, Upload, Loader2, Sparkles, X, MapPin, Zap } from 'lucide-react';

const CATEGORIES: IssueCategory[] = [
  'Streetlights', 'Roads & Infrastructure', 'Waste Management', 'Water Supply', 'Other',
];

const SEVERITIES: IssueSeverity[] = ['Low', 'Medium', 'High', 'Critical'];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2.5 text-[13px] font-semibold text-gray-700">{children}</p>
);

const ReportScreen = () => {
  const { addIssue, user } = useApp();
  const [photoUrl, setPhotoUrl] = useState('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [category, setCategory] = useState<IssueCategory | ''>('');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [aiDetecting, setAiDetecting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setShowCamera(false);
  }, [stream]);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch {
      alert('Could not access camera.');
      setShowCamera(false);
    }
  };

  useEffect(() => {
    if (showCamera) startCamera();
    else stopCamera();
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [showCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) { processFile(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })); stopCamera(); }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  const getCurrentLocation = useCallback((): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }), []);

  const processFile = async (file: File) => {
    setPhotoUrl(URL.createObjectURL(file));
    setIsUploading(true); setAiDetecting(true);
    try {
      try { setLocation(await getCurrentLocation()); } catch { if (!location) setLocation(simulateLocation()); }
      const uploadRes = await aiApi.uploadImage(file);
      if (!uploadRes.ok || !uploadRes.data?.imageUrl) { setIsUploading(false); setAiDetecting(false); return; }
      const url = uploadRes.data.imageUrl;
      setCloudinaryUrl(url);
      const [desc, cat] = await Promise.all([aiApi.describeImage(url, description), aiApi.categorizeImage(url)]);
      if (desc.ok && desc.data?.description) setDescription(desc.data.description);
      if (cat.ok && cat.data?.category) setCategory(cat.data.category as IssueCategory);
    } catch (e) { console.error(e); }
    finally { setIsUploading(false); setAiDetecting(false); }
  };

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file);
  }, [description, location]);

  const handleSummarize = useCallback(async () => {
    setIsSummarizing(true);
    try {
      if (cloudinaryUrl) {
        const { ok, data } = await aiApi.describeImage(cloudinaryUrl, description);
        if (ok && data?.description) setDescription(data.description);
        else alert('Could not generate description.');
      } else if (description) {
        const { ok, data } = await aiApi.summarize(description);
        if (ok && data?.summary) setDescription(data.summary);
        else alert('Could not summarize text.');
      }
    } catch { alert('Failed to summarize.'); }
    finally { setIsSummarizing(false); }
  }, [cloudinaryUrl, description]);

  const handleSubmit = useCallback(async () => {
    if (!category || !description) { alert('Please fill in category and description'); return; }
    if (isUploading) { alert('Please wait for the image to upload'); return; }
    setIsSubmitting(true);
    const ok = await addIssue({
      category: category as IssueCategory, description,
      location: location || simulateLocation(), severity,
      imageUrl: cloudinaryUrl || photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop',
      reporterName: user.name, reporterEmail: user.email,
    });
    setIsSubmitting(false);
    if (!ok) { alert('Failed to submit report'); return; }
    setPhotoUrl(''); setCloudinaryUrl(''); setCategory(''); setDescription(''); setLocation(''); setSeverity('Medium');
    alert('Issue reported successfully! 🎉');
  }, [category, description, location, severity, photoUrl, cloudinaryUrl, user, addIssue, isUploading]);

  return (
    <div className="fade-in pb-12 pt-6 sm:pt-8">

      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Report an Issue</h1>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          Capture or upload a photo — our AI will detect the problem automatically.
        </p>
      </div>

      {/*
        Layout:
        - Mobile/tablet: single column, image upload on top
        - Desktop (lg+): two columns — form left | upload right (sticky)
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] lg:items-start">

        {/* ── Upload panel — shows above form on mobile/tablet ── */}
        <div className="order-first lg:order-last lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-2xl border border-[#e8edf2] bg-white shadow-sm">
            {photoUrl ? (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Captured"
                  className="h-[220px] w-full object-cover sm:h-[260px]"
                />
                <button
                  onClick={() => { setPhotoUrl(''); setCloudinaryUrl(''); }}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  <X size={15} />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
                    <Loader2 size={28} className="animate-spin text-white" />
                    <p className="text-xs font-semibold text-white">Uploading &amp; analyzing…</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5">
                <div
                  className="upload-zone flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl p-5 text-center sm:min-h-[210px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7f5] sm:h-14 sm:w-14">
                    <Camera size={20} className="text-[#2a9d8f] sm:text-[22px]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Add Photo</p>
                    <p className="mt-0.5 text-xs text-gray-400">AI will auto-detect the issue</p>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setShowCamera(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#2a9d8f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#237f72] transition-colors sm:px-4"
                    >
                      <Camera size={13} /> Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-[#e8edf2] bg-white px-3.5 py-2 text-xs font-medium text-gray-600 hover:border-[#2a9d8f] hover:text-[#2a9d8f] transition-colors sm:px-4"
                    >
                      <Upload size={13} /> Upload
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips card — hidden on mobile to save space */}
          <div className="mt-3 hidden rounded-2xl border border-[#e8edf2] bg-white p-4 shadow-sm sm:block">
            <p className="mb-2 text-[12px] font-semibold text-gray-700">📸 Photo Tips</p>
            <ul className="space-y-1 text-[11px] text-gray-500">
              <li>• Take a clear, well-lit photo of the issue</li>
              <li>• Include surrounding context in the frame</li>
              <li>• AI will auto-fill description &amp; category</li>
              <li>• Location is auto-detected from your device</li>
            </ul>
          </div>
        </div>

        {/* ── Form column ── */}
        <div className="order-last space-y-4 lg:order-first">

          {/* AI Detecting banner */}
          {aiDetecting && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#b2e4df] bg-[#e8f7f5] px-4 py-3.5">
              <Sparkles size={17} className="flex-shrink-0 text-[#2a9d8f] pulse-green" />
              <div>
                <p className="text-sm font-semibold text-gray-900">AI Analyzing Image…</p>
                <p className="text-xs text-gray-500">Detecting category &amp; severity automatically</p>
              </div>
              <Loader2 size={15} className="ml-auto animate-spin text-[#2a9d8f]" />
            </div>
          )}

          {/* Description */}
          <div className="rounded-2xl border border-[#e8edf2] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Description</SectionLabel>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || (!description && !cloudinaryUrl)}
                className="flex items-center gap-1.5 rounded-lg bg-[#e8f7f5] px-2.5 py-1.5 text-[11px] font-semibold text-[#2a9d8f] transition-all hover:bg-[#d0f0eb] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[12px]"
              >
                {isSummarizing
                  ? <Loader2 size={11} className="animate-spin" />
                  : <Sparkles size={11} />
                }
                <span className="hidden sm:inline">Smart </span>Summarize
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Large pothole on the main road near the school..."
              rows={4}
              className="w-full resize-none rounded-xl border border-[#e8edf2] bg-[#fafafa] px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#2a9d8f] focus:bg-white focus:ring-2 focus:ring-[#2a9d8f]/10"
            />
          </div>

          {/* Category */}
          <div className="rounded-2xl border border-[#e8edf2] bg-white p-4 shadow-sm sm:p-5">
            <SectionLabel>Category</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2
                    ${category === cat
                      ? 'border-[#2a9d8f] bg-[#2a9d8f] text-white shadow-sm shadow-[#2a9d8f]/20'
                      : 'border-[#e8edf2] bg-white text-gray-600 hover:border-[#2a9d8f]/50 hover:text-[#2a9d8f]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#b2e4df] bg-[#f0faf9] px-4 py-3">
              <MapPin size={14} className="flex-shrink-0 text-[#2a9d8f]" />
              <span className="text-[11px] font-medium text-[#237f72]">Auto-detected:</span>
              <span className="min-w-0 truncate text-[11px] text-gray-600">{location}</span>
            </div>
          )}

          {/* Severity */}
          <div className="rounded-2xl border border-[#e8edf2] bg-white p-4 shadow-sm sm:p-5">
            <SectionLabel>Severity Level</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITIES.map(s => {
                const colorMap: Record<string, string> = {
                  Low: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100',
                  Medium: 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100',
                  High: 'border-red-200 bg-red-50 text-red-600 shadow-red-100',
                  Critical: 'border-red-300 bg-red-100 text-red-700 shadow-red-200',
                };
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all sm:py-2.5
                      ${severity === s
                        ? `${colorMap[s]} shadow-sm`
                        : 'border-[#e8edf2] bg-white text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2a9d8f] text-sm font-semibold text-white shadow-md shadow-[#2a9d8f]/25 transition-all hover:bg-[#237f72] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
          >
            {isSubmitting
              ? <><Loader2 size={17} className="animate-spin" /> Submitting Report…</>
              : <><Zap size={16} /> Analyze &amp; Submit with AI</>
            }
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <video ref={videoRef} autoPlay playsInline className="flex-1 w-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-8 py-6 sm:px-10 sm:py-8">
            <button onClick={stopCamera} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 sm:h-12 sm:w-12">
              <X size={20} />
            </button>
            <button onClick={capturePhoto} className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-[3px] border-white bg-white/10 sm:h-[70px] sm:w-[70px]">
              <div className="h-[50px] w-[50px] rounded-full bg-white sm:h-[56px] sm:w-[56px]" />
            </button>
            <div className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportScreen;
