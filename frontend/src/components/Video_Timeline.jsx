import React, { useRef, useState } from "react";
import axios from "axios";
import Audio_timeline from "./Audio_timeline.jsx";

// const API_URL = import.meta.env.VITE_API_URL;
const Timeline = ({ videoRef, backendPath, setVideoSource, audioPath, playheadRef }) => {

    const [isTrimming, setIsTrimming] = useState(false);
    const [lastTrimmedFile, setLastTrimmedFile] = useState("");
    const trimStartRef = useRef(null);
    const trimEndRef = useRef(null);
    const trimRangeRef = useRef(null);
    const hoverLineRef = useRef(null);
    const timelineRef = useRef(null);
    const draggingHandle = useRef(null);

    React.useEffect(() => {
        if (isTrimming && timelineRef.current && trimEndRef.current && trimRangeRef.current) {
            const width = timelineRef.current.clientWidth;

            // Initialize End Handle <data value=""></data>
            trimEndRef.current.dataset.x = width;
            trimEndRef.current.dataset.percent = 100;

            // Initialize Start Handle data
            trimStartRef.current.dataset.x = 0;
            trimStartRef.current.dataset.percent = 0;

            // Reset highlight to full width
            trimRangeRef.current.style.left = "0px";
            trimRangeRef.current.style.width = `${width}px`;
        }
    }, [isTrimming]);

    const handleMouseMove = (e) => {
        if (!timelineRef.current || !hoverLineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        hoverLineRef.current.style.transform = `translateX(${x}px)`;
        hoverLineRef.current.style.opacity = "1";
    };

    const handleMouseLeave = () => {
        if (hoverLineRef.current) {
            hoverLineRef.current.style.opacity = "0";
        }
    };

    const startTrimDragging = (type) => (e) => {
        e.stopPropagation(); // Prevents playhead from jumping
        draggingHandle.current = type;

        const onMouseMove = (moveEvent) => {
            if (!draggingHandle.current || !timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            let x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;

            const startPercent = parseFloat(trimStartRef.current.dataset.percent || "0");
            const endPercent = parseFloat(trimEndRef.current.dataset.percent || "100");

            if (draggingHandle.current === 'start') {
                if (percentage < endPercent - 2) {
                    trimStartRef.current.style.transform = `translateX(${x}px)`;
                    trimStartRef.current.dataset.percent = percentage;
                    trimStartRef.current.dataset.x = x; // <--- ADD THIS
                }
            } else if (draggingHandle.current === 'end') {
                if (percentage > startPercent + 2) {
                    trimEndRef.current.style.transform = `translateX(${x - 16}px)`;
                    trimEndRef.current.dataset.percent = percentage;
                    trimEndRef.current.dataset.x = x; // <--- ADD THIS
                }
            }

            // UPDATE THE HIGHLIGHT BOX
            if (trimRangeRef.current) {
                // Use the pixels we just saved. Fallback to 0/Width if not moved yet.
                const sX = parseFloat(trimStartRef.current.dataset.x || "0");
                const eX = parseFloat(trimEndRef.current.dataset.x || rect.width.toString());

                trimRangeRef.current.style.left = `${sX}px`;
                trimRangeRef.current.style.width = `${eX - sX}px`;
            }
        };

        const onMouseUp = () => {
            draggingHandle.current = null;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleTimelineClick = (e) => {
        if (!videoRef.current || isTrimming) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const timelineWidth = rect.width;
        const clickedPosition = (x / timelineWidth) * videoRef.current.duration;

        videoRef.current.currentTime = clickedPosition; // Set video time to clicked position

        // Update playhead position
        const progress = (clickedPosition / videoRef.current.duration) * 100;
        playheadRef.current.style.left = `${progress}%`;
    };

    // const handleTrim = async () => {
    //     const video = videoRef.current;
    //     // Ensure you have access to the audioPath here
    //     // If audioPath is coming from props, use props.audioPath
    //     if (!video || !backendPath) return;

    //     const startPercent = parseFloat(trimStartRef.current.dataset.percent || 0);
    //     const endPercent = parseFloat(trimEndRef.current.dataset.percent || 100);

    //     const startSeconds = (startPercent / 100) * video.duration;
    //     const endSeconds = (endPercent / 100) * video.duration;

    //     try {
    //         const response = await axios.post("http://localhost:5000/api/v1/videdit/trim", {
    //             filePath: backendPath,
    //             audioPath: audioPath, // <--- ADD THIS LINE
    //             startTime: startSeconds,
    //             endTime: endSeconds
    //         });

    //         setLastTrimmedFile(response.data.data.fileName);
    //         // 4. Update the player with the new short video// 4. Update the player
    //         const newUrl = `http://localhost:5000/${response.data.data.trimmedPath}`;
    //         setVideoSource(newUrl);
    //         // IMPORTANT: Give React a millisecond to update the DOM, then force a reload
    //         setTimeout(() => {
    //             if (videoRef.current) {
    //                 videoRef.current.load(); // Forces browser to re-check MIME type/format
    //             }
    //         }, 100);
    //         setIsTrimming(false); // Close trim mode
    //         alert(response.data.message);
    //     } catch (err) {
    //         console.error("Trim request failed", err);
    //     }
    // };

    // const handleTimeUpdate = () => {
    //     if (videoRef.current && playheadRef.current) {
    //         const video = videoRef.current;
    //         const progress = (video.currentTime / video.duration) * 100;
    //         playheadRef.current.style.left = `${progress}%`;
    //     }
    // };

    // const handleExport = async () => {
    //     if (!lastTrimmedFile) return alert("Please trim a video first!");

    //     try {
    //         const response = await axios.post(
    //             "http://localhost:5000/api/v1/videdit/export",
    //             { fileName: lastTrimmedFile },
    //             { responseType: "blob" } // CRUCIAL: Tells axios to handle binary data
    //         );

    //         // Create a hidden link and click it to trigger the "Save As" box
    //         const url = window.URL.createObjectURL(new Blob([response.data]));
    //         const link = document.createElement("a");
    //         link.href = url;
    //         link.setAttribute("download", "Exported_Video.mp4");
    //         document.body.appendChild(link);
    //         link.click();

    //         // Cleanup memory
    //         link.remove();
    //         window.URL.revokeObjectURL(url);
    //     } catch (err) {
    //         console.error("Export failed", err);
    //     }
    // };

    return (
        <section className="flex flex-col h-[30%] w-full bg-zinc-900 p-4 overflow-x-auto gap-4 ">
            
            <div ref={timelineRef} className="w-full h-20 bg-zinc-800/50 rounded-lg border border-zinc-700 relative overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleTimelineClick}>
                {isTrimming && (
                    <>
                        {/* Selection Overlay (The Highlight) */}
                        <div
                            ref={trimRangeRef}
                            className="absolute top-0 h-full bg-blue-500/20 border-x border-blue-500/50 pointer-events-none z-30"
                            style={{ left: '0px', width: '0px' }} // Start at 0 width
                        />
                        {/* Trim Start Handle */}
                        <div
                            ref={trimStartRef}
                            onMouseDown={startTrimDragging('start')}
                            className="absolute top-0 left-0 w-4 h-full bg-blue-600 cursor-ew-resize z-40 flex items-center justify-center border-r border-blue-400 select-none"
                            style={{ transform: 'translateX(0px)' }}
                            data-percent="0"
                        >
                            <div className="w-[1px] h-4 bg-white/50" />
                        </div>

                        {/* Trim End Handle - Anchored LEFT, not right */}
                        <div
                            ref={trimEndRef}
                            onMouseDown={startTrimDragging('end')}
                            className="absolute top-0 left-0 w-4 h-full bg-blue-600 cursor-ew-resize z-40 flex items-center justify-center border-l border-blue-400 select-none"
                            /* We calculate initial position based on timeline width */
                            style={{ transform: `translateX(${timelineRef.current?.clientWidth - 16 || 500}px)` }}
                            data-percent="100"
                        >
                            <div className="w-[1px] h-4 bg-white/50" />
                        </div>
                    </>
                )}
                <div
                    ref={hoverLineRef}
                    className="absolute top-0 left-0 w-[2px] h-full border-l border-dashed border-zinc-400 opacity-0 pointer-events-none z-20" // Changed z-0 to z-20
                    style={{ transition: 'opacity 0.2s' }}
                />
                <div ref={playheadRef} className="absolute left-0 top-0 w-[2px] h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 cursor-pointer" />
            </div>
            <Audio_timeline audioPath={audioPath} />
        </section>

    );
};

export default Timeline;