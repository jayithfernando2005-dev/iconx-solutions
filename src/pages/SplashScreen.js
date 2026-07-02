import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import introVideo from "../assets/introduction_video.mp4";

const INTRO_SEEN_KEY = "iconx_intro_seen";

export default function IntroductionVideo() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [ready, setReady] = useState(false);

  const goHome = () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    setFadeOut(true);
    setTimeout(() => navigate("/home", { replace: true }), 600);
  };

  useEffect(() => {
    // If the intro already played this session, skip straight to home
    if (sessionStorage.getItem(INTRO_SEEN_KEY) === "true") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fallback = setTimeout(goHome, 9000);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleCanPlay = () => setReady(true);
    video.addEventListener("canplay", handleCanPlay);
    return () => video.removeEventListener("canplay", handleCanPlay);
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className={`iv-root ${fadeOut ? "iv-fade-out" : ""}`}>
        <div className="iv-video-wrap">
          <video
            ref={videoRef}
            className={`iv-video ${ready ? "iv-video-ready" : ""}`}
            src={introVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noplaybackrate nofullscreen"
            onEnded={goHome}
          />
        </div>

       
      </div>
    </>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.iv-root {
  position: fixed;
  inset: 0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 9999;
  font-family: 'DM Sans', sans-serif;
  transition: opacity 0.6s ease;
  opacity: 1;
}

.iv-fade-out {
  opacity: 0;
  pointer-events: none;
}

.iv-video-wrap {
  display: grid;
  grid-template-rows: auto;
  justify-items: center;
  width: fit-content;
  max-width: 100%;
  max-height: 100%;
}

.iv-video {
  display: block;
  max-width: 100%;
  max-height: 85vh;
  width: auto;
  height: auto;
  object-fit: contain;

  opacity: 0;
  filter: blur(6px);
  transform: translateZ(0) scale(0.98);
  transition: opacity 0.6s ease, filter 0.6s ease, transform 0.6s ease;
}

.iv-video-ready {
  opacity: 1;
  filter: blur(0);
  transform: translateZ(0) scale(1);
}

.iv-skip {
  position: absolute;
  top: 28px;
  right: 28px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(6px);
  color: #1a1a1a;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
  opacity: 0;
  animation: ivFadeSimple 0.6s ease 0.8s forwards;
  transition: background 0.2s ease, transform 0.2s ease;
}
.iv-skip:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
.iv-skip:active {
  transform: translateY(0);
}

@keyframes ivFadeSimple {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;