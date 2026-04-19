import { useState, useRef } from "react";
import axios from "axios";
import Timeline from "./Timeline.jsx";
const API_URL = import.meta.env.VITE_API_URL;
const Home = () => {
    const [videoSource, setVideoSource] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [backendPath, setBackendPath] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [projectAssets, setProjectAssets] = useState(null);
    
    // New state for mobile menu toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const videoRef = useRef(null);
    const playheadRef = useRef(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === "video" && file.type.startsWith("video/")) {
            if (videoSource) URL.revokeObjectURL(videoSource);
            setVideoFile(file);
            setVideoSource(URL.createObjectURL(file));
        } else if (type === "audio" && file.type.startsWith("audio/")) {
            setAudioFile(file);
        }
        // Auto-close sidebar on mobile after selection to show the video
        if(window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    const handleProjectUpload = async () => {
        if (!videoFile) return alert("Please select a video first");
        const formData = new FormData();
        formData.append("video", videoFile);
        if (audioFile) formData.append("audio", audioFile);

        try {
            setIsUploading(true);
            const response = await axios.post(`${API_URL}/api/v1/videdit/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const data = response.data.data;
            setProjectAssets(data);
            setBackendPath(data.videoData.path);
            alert("Project Initialized!");
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && playheadRef.current) {
            const video = videoRef.current;
            const progress = (video.currentTime / video.duration) * 100;
            playheadRef.current.style.left = `${progress}%`;
        }
    };
    
    return (
        <div className="flex flex-col w-full h-screen bg-black text-white overflow-hidden">
            {/* MOBILE HEADER WITH HAMBURGER */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-700">
                <h1 className="text-sm font-bold tracking-tighter">VIDEO EDITOR</h1>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-zinc-800 rounded-md"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row h-[60%] lg:h-[70%] w-full border-b border-gray-700 relative">
                
                {/* SIDEBAR / ASSETS PANEL */}
                <aside className={`
                    absolute lg:relative z-20 inset-0 lg:inset-auto
                    h-full w-full lg:w-[250px] xl:w-[300px] 
                    bg-zinc-900 border-r border-gray-700 p-4 
                    flex flex-col gap-4 transition-transform duration-300
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}>
                    <div className="flex justify-between items-center lg:mb-2">
                        <h2 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Project Assets</h2>
                        <button className="lg:hidden text-zinc-400" onClick={() => setIsSidebarOpen(false)}>Close</button>
                    </div>

                    {/* Compact Button Style Inputs */}
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Video Clip</label>
                            <label className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-750 active:scale-95 transition">
                                <span className="bg-blue-600 p-2 rounded">🎬</span>
                                <span className="text-xs truncate flex-1">{videoFile ? videoFile.name : "Select Video"}</span>
                                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, "video")} />
                            </label>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Background Audio</label>
                            <label className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-750 active:scale-95 transition">
                                <span className="bg-purple-600 p-2 rounded">🎵</span>
                                <span className="text-xs truncate flex-1">{audioFile ? audioFile.name : "Select Audio"}</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileChange(e, "audio")} />
                            </label>
                        </div>
                    </div>

                    <button
                        disabled={isUploading || !videoFile}
                        className="mt-auto lg:mt-4 w-full py-3 bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded font-bold text-xs uppercase tracking-widest"
                        onClick={handleProjectUpload}
                    >
                        {isUploading ? "Uploading..." : "Initialize Project"}
                    </button>
                </aside>

                {/* MAIN PREVIEW AREA */}
                <main className="flex-1 bg-zinc-950 flex items-center justify-center p-4 lg:p-10">
                    <div className="aspect-video w-full max-w-4xl bg-black shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                        {videoSource ? (
                            <video key={videoSource} ref={videoRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} controls className="w-full h-full" playsInline>
                                <source src={videoSource} type="video/mp4" />
                            </video>
                        ) : (
                            <div className="text-gray-500 italic text-sm text-center py-20">
                                <p>Select media to begin</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Timeline
                videoRef={videoRef}
                backendPath={backendPath}
                setVideoSource={setVideoSource}
                videoSource={videoSource}
                // TIP: You might want to pass projectAssets to Timeline too
                audioPath={projectAssets?.audioData?.path}
                playheadRef={playheadRef}
                handleTimeUpdate={handleTimeUpdate}
            />
        </div>
    );
};

export default Home;