import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Playlist } from './components/Playlist';
import { 
  PlayIcon, PauseIcon, StopIcon, SkipBackIcon, SkipForwardIcon, 
  VolumeIcon, MuteIcon, MaximizeIcon, MinimizeIcon, PlusIcon, 
  SunIcon, MoonIcon, CameraIcon, PipIcon, ListIcon,
  RepeatIcon, Repeat1Icon, ScissorsIcon
} from './components/Icons';
import { VideoFile, PlaybackSpeed, LoopMode } from './types';

const App: React.FC = () => {
  // --- State ---
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(PlaybackSpeed.Normal);
  const [loopMode, setLoopMode] = useState<LoopMode>(LoopMode.None);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string | null>(null);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // --- Initialization & Theme ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Video Logic ---
  const activeFile = files.find(f => f.id === currentFileId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: VideoFile[] = Array.from(event.target.files).map(file => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        url: URL.createObjectURL(file)
      }));
      setFiles(prev => [...prev, ...newFiles]);
      
      // Auto-play if it's the first file
      if (!currentFileId && newFiles.length > 0) {
        setCurrentFileId(newFiles[0].id);
      }
    }
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const stopVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const seek = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + amount, 0), duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.playbackRate = speed;
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) videoRef.current.volume = vol;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuteState = !isMuted;
      setIsMuted(nextMuteState);
      videoRef.current.volume = nextMuteState ? 0 : volume;
    }
  };

  const changeSpeed = (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const toggleLoopMode = () => {
    if (loopMode === LoopMode.None) setLoopMode(LoopMode.All);
    else if (loopMode === LoopMode.All) setLoopMode(LoopMode.Single);
    else setLoopMode(LoopMode.None);
  };

  const handleEnded = () => {
    if (loopMode === LoopMode.Single) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      return;
    }

    const currentIndex = files.findIndex(f => f.id === currentFileId);
    
    if (currentIndex !== -1 && currentIndex < files.length - 1) {
      // Play next
      setCurrentFileId(files[currentIndex + 1].id);
    } else if (loopMode === LoopMode.All && files.length > 0) {
      // Loop back to start
      setCurrentFileId(files[0].id);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying && videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentFileId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // --- Extended Features ---
  const takeScreenshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `screenshot-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    }
  };

  // Simulate Video Clip Export using MediaRecorder on the Video Element
  const exportClip = async (seconds: number) => {
    if (!videoRef.current || isRecording) return;
    
    try {
      setRecordingStatus(`Recording ${seconds}s...`);
      setIsRecording(true);
      
      // Capture the stream from the video element
      // @ts-ignore - captureStream is experimental in some types but widely supported
      const stream = videoRef.current.captureStream() as MediaStream;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clip-${Date.now()}.webm`;
        link.click();
        setIsRecording(false);
        setRecordingStatus(null);
      };

      recorder.start();
      
      // Ensure video is playing
      if (videoRef.current.paused) videoRef.current.play();
      setIsPlaying(true);

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, seconds * 1000);

    } catch (e) {
      console.error("Export failed", e);
      setRecordingStatus("Export failed");
      setIsRecording(false);
      setTimeout(() => setRecordingStatus(null), 2000);
    }
  };

  const togglePip = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (videoRef.current) {
      await videoRef.current.requestPictureInPicture();
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(-5);
          break;
        case 'ArrowRight':
          seek(5);
          break;
        case 'ArrowUp':
          setVolume(v => Math.min(v + 0.1, 1));
          break;
        case 'ArrowDown':
          setVolume(v => Math.max(v - 0.1, 0));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);


  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div 
      ref={containerRef} 
      className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-qt-darker text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans"
    >
      {/* --- Title Bar (Simulating Qt Window) --- */}
      <div className="flex-none h-10 bg-white dark:bg-qt-dark border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between z-10 select-none">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm tracking-wider text-qt-accent">Qt-Stream</span>
          <span className="text-xs text-gray-400">v6.0.0</span>
        </div>
        <div className="flex items-center space-x-3">
           <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-2 py-1 text-xs font-medium bg-qt-accent hover:bg-blue-600 text-white rounded transition-colors">
            <PlusIcon className="w-3 h-3 mr-1.5" /> Open File
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept="video/*" 
            className="hidden" 
            onChange={handleFileSelect}
          />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-500 hover:text-qt-accent transition-colors">
            {isDarkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsPlaylistOpen(!isPlaylistOpen)} className={`transition-colors ${isPlaylistOpen ? 'text-qt-accent' : 'text-gray-500 hover:text-gray-700'}`}>
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex flex-col justify-center items-center group">
          {activeFile ? (
             <video 
             ref={videoRef}
             src={activeFile.url}
             className="max-h-full max-w-full w-auto h-auto shadow-2xl outline-none"
             onClick={togglePlay}
             onTimeUpdate={handleTimeUpdate}
             onLoadedMetadata={handleLoadedMetadata}
             onEnded={handleEnded}
             crossOrigin="anonymous"
           />
          ) : (
            <div className="text-center text-gray-500 select-none">
              <div className="w-24 h-24 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-50">
                <PlusIcon className="w-8 h-8" />
              </div>
              <p className="text-xl font-light text-gray-400">No Media Loaded</p>
              <p className="text-sm text-gray-600 mt-2">Drag & Drop files or click Open File</p>
            </div>
          )}

          {/* Recording Toast */}
          {recordingStatus && (
            <div className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
              <span className="text-xs font-bold">{recordingStatus}</span>
            </div>
          )}

          {/* Floating Controls Overlay (Bottom) */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${activeFile ? 'opacity-0 group-hover:opacity-100' : 'opacity-50 pointer-events-none'}`}>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-3 mb-3 text-xs font-mono text-gray-300">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 relative h-1 group/seek">
                <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                <div 
                  className="absolute top-0 left-0 h-full bg-qt-accent rounded-full" 
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                ></div>
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={handleSeekChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="w-10">{formatTime(duration)}</span>
            </div>

            {/* Control Buttons Row */}
            <div className="flex items-center justify-between">
              
              <div className="flex items-center space-x-3">
                <button onClick={stopVideo} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><StopIcon className="w-4 h-4" /></button>
                <button onClick={() => seek(-5)} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><SkipBackIcon className="w-4 h-4" /></button>
                
                <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg hover:shadow-qt-accent/50">
                  {isPlaying ? <PauseIcon className="w-5 h-5 fill-current" /> : <PlayIcon className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                
                <button onClick={() => seek(5)} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><SkipForwardIcon className="w-4 h-4" /></button>
                
                {/* Volume Group */}
                <div className="flex items-center space-x-2 group/vol relative pl-2">
                  <button onClick={toggleMute} className="text-gray-400 hover:text-white p-1">
                    {isMuted || volume === 0 ? <MuteIcon className="w-5 h-5" /> : <VolumeIcon className="w-5 h-5" />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                     <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={isMuted ? 0 : volume} 
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-gray-600 rounded-lg accent-white ml-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Clip Export Dropdown */}
                <div className="relative group/clip">
                  <button className="text-gray-400 hover:text-qt-accent p-2 hover:bg-white/10 rounded-full transition-all" title="Export Clip">
                    <ScissorsIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/clip:flex flex-col bg-qt-darker border border-gray-700 rounded shadow-xl py-1 min-w-[100px]">
                    <button onClick={() => exportClip(5)} className="text-xs text-gray-300 hover:bg-qt-accent hover:text-white px-3 py-2 text-left">Export 5s</button>
                    <button onClick={() => exportClip(10)} className="text-xs text-gray-300 hover:bg-qt-accent hover:text-white px-3 py-2 text-left">Export 10s</button>
                  </div>
                </div>

                {/* Loop Toggle */}
                <button onClick={toggleLoopMode} className={`p-2 rounded-full transition-all hover:bg-white/10 ${loopMode !== LoopMode.None ? 'text-qt-accent' : 'text-gray-400'}`} title={`Loop Mode: ${loopMode}`}>
                  {loopMode === LoopMode.Single ? <Repeat1Icon className="w-4 h-4" /> : <RepeatIcon className="w-4 h-4" />}
                </button>

                <div className="w-px h-4 bg-gray-700 mx-1"></div>

                {/* Speed Selector */}
                <select 
                  value={speed} 
                  onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                  className="bg-transparent text-xs font-medium text-gray-400 hover:text-white border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-qt-accent"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1.0">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2.0">2.0x</option>
                </select>

                <button onClick={takeScreenshot} title="Screenshot" className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                  <CameraIcon className="w-4 h-4" />
                </button>
                <button onClick={togglePip} title="Picture in Picture" className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                  <PipIcon className="w-4 h-4" />
                </button>
                <button onClick={toggleFullscreen} title="Fullscreen" className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                  {isFullscreen ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar */}
        <div 
          className={`border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-qt-dark transition-all duration-300 ease-in-out flex-none overflow-hidden flex flex-col shadow-2xl z-20 ${isPlaylistOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'}`}
        >
          <Playlist 
            files={files} 
            currentFileId={currentFileId}
            onRemove={(id) => {
              setFiles(prev => prev.filter(f => f.id !== id));
              if (currentFileId === id) stopVideo();
            }}
            onSelect={(id) => {
              setCurrentFileId(id);
              setIsPlaying(true);
            }}
            onReorder={setFiles}
          />
        </div>
      </div>
    </div>
  );
};

export default App;