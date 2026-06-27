import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import iconxLogo from "../assets/iconx-logo.jpg";

export default function SplashScreen() {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  /* ── Auto-redirect to /home after 4s ── */
  useEffect(() => {
    const t = setTimeout(() => navigate("/home", { replace: true }), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  /* ── Particle canvas background ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 1.6 + 0.3,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.45 + 0.1,
    }));

    let tick = 0;
    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const pulse = Math.sin(tick * 0.018 + p.x * 0.01) * 0.2 + 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(45,136,224," + (p.alpha * pulse) + ")";
        ctx.fill();
      });

      /* Connection lines */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "rgba(45,136,224," + ((1 - dist / 110) * 0.1) + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="sx-root">

        {/* Canvas particles */}
        <canvas className="sx-canvas" ref={canvasRef} />

        {/* Grid overlay */}
        <div className="sx-grid" />

        {/* Scan line */}
        <div className="sx-scan" />

        {/* Glow behind center */}
        <div className="sx-glow" />

        {/* Floating orbs */}
        <div className="sx-orb sx-orb-1" />
        <div className="sx-orb sx-orb-2" />

        {/* Corner brackets */}
        <div className="sx-corner sx-tl">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(10,132,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sx-corner sx-tr">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(10,132,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sx-corner sx-bl">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(10,132,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="sx-corner sx-br">
          <svg viewBox="0 0 40 40" fill="none"><path d="M2 20 L2 2 L20 2" stroke="rgba(10,132,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        {/* Center content */}
        <div className="sx-center">

          {/* Logo + spinning rings centered perfectly */}
          <div className="sx-logo-wrap">
            <div className="sx-ring-a" />
            <div className="sx-ring-b" />
            <img src={iconxLogo} alt="iconX" className="sx-logo-img" />
          </div>

          {/* Cleaned progress loading tracking */}
          <div className="sx-progress-wrap">
            <div className="sx-progress-bar" />
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── Adjusted Clean Layout Styles ─── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght=700;800&family=DM+Sans:wght=300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.sx-root {
  position: fixed; inset: 0;
  background: #050810;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  animation: sxFadeOut 0.6s ease 3.4s both;
}
@keyframes sxFadeOut {
  to { opacity: 0; pointer-events: none; }
}

/* Canvas */
.sx-canvas {
  position: absolute; inset: 0; z-index: 0;
}

/* Grid */
.sx-grid {
  position: absolute; inset: 0; z-index: 1;
  background-image:
    linear-gradient(rgba(45,136,224,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45,136,224,0.04) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0;
  animation: sxGridIn 1.4s ease 0.1s forwards;
}
@keyframes sxGridIn { to { opacity: 1; } }

/* Scan line */
.sx-scan {
  position: absolute; left: 0; right: 0; height: 1.5px;
  background: linear-gradient(90deg, transparent 0%, rgba(10,132,255,0.7) 50%, transparent 100%);
  z-index: 2; top: 0;
  animation: sxScan 2.8s ease-in-out 0.6s infinite;
}
@keyframes sxScan {
  0%   { top: 0;    opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 0.6; }
  100% { top: 100%; opacity: 0; }
}

/* Central glow */
.sx-glow {
  position: absolute; z-index: 1;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(10,132,255,0.15) 0%, transparent 70%);
  animation: sxGlowPulse 3s ease-in-out infinite;
}
@keyframes sxGlowPulse {
  0%, 100% { transform: scale(1);    opacity: 0.7; }
  50%       { transform: scale(1.2);  opacity: 1;   }
}

/* Floating orbs */
.sx-orb {
  position: absolute; border-radius: 50%;
  filter: blur(70px); pointer-events: none; z-index: 1;
}
.sx-orb-1 {
  width: 380px; height: 380px;
  top: -100px; right: -60px;
  background: radial-gradient(circle, rgba(10,132,255,0.13), transparent 70%);
  animation: sxOrbFloat 7s ease-in-out infinite;
}
.sx-orb-2 {
  width: 280px; height: 280px;
  bottom: -80px; left: -50px;
  background: radial-gradient(circle, rgba(94,94,230,0.1), transparent 70%);
  animation: sxOrbFloat 9s ease-in-out 1s infinite reverse;
}
@keyframes sxOrbFloat {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(20px, -20px); }
}

/* Corner brackets */
.sx-corner {
  position: absolute; z-index: 3; width: 36px; height: 36px;
  opacity: 0; animation: sxCornerIn 0.7s ease forwards;
}
.sx-tl { top: 24px; left: 24px;             animation-delay: 0.3s; }
.sx-tr { top: 24px; right: 24px;            animation-delay: 0.45s; transform: scaleX(-1); }
.sx-bl { bottom: 24px; left: 24px;          animation-delay: 0.5s;  transform: scaleY(-1); }
.sx-br { bottom: 24px; right: 24px;         animation-delay: 0.6s;  transform: scale(-1,-1); }
@keyframes sxCornerIn {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
.sx-tr { animation-name: sxCornerInFlipX; }
.sx-bl { animation-name: sxCornerInFlipY; }
.sx-br { animation-name: sxCornerInFlipXY; }
@keyframes sxCornerInFlipX  { from { opacity:0; transform:scaleX(-1) scale(0.4); } to { opacity:1; transform:scaleX(-1) scale(1); } }
@keyframes sxCornerInFlipY  { from { opacity:0; transform:scaleY(-1) scale(0.4); } to { opacity:1; transform:scaleY(-1) scale(1); } }
@keyframes sxCornerInFlipXY { from { opacity:0; transform:scale(-1,-1) scale(0.4); } to { opacity:1; transform:scale(-1,-1) scale(1); } }

/* Center layout */
.sx-center {
  position: relative; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
}

/* Logo wrapper */
.sx-logo-wrap {
  position: relative;
  width: 128px; height: 128px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  opacity: 0;
  animation: sxLogoIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s forwards;
}
@keyframes sxLogoIn {
  from { opacity: 0; transform: scale(0.5) translateY(-16px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);     }
}

.sx-ring-a {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1.5px solid rgba(10,132,255,0.35);
  animation: sxRingSpin 7s linear infinite;
}
.sx-ring-a::before {
  content: '';
  position: absolute; top: -4px; left: 50%;
  transform: translateX(-50%);
  width: 7px; height: 7px; border-radius: 50%;
  background: #0a84ff;
  box-shadow: 0 0 12px 4px rgba(10,132,255,0.9);
}
.sx-ring-b {
  position: absolute; inset: 12px; border-radius: 50%;
  border: 1px solid rgba(10,132,255,0.15);
  animation: sxRingSpin 4.5s linear infinite reverse;
}
@keyframes sxRingSpin { to { transform: rotate(360deg); } }

.sx-logo-img {
  width: 84px; height: 84px; border-radius: 50%;
  object-fit: contain; background: #fff; padding: 6px;
  box-shadow:
    0 0 0 3px rgba(10,132,255,0.22),
    0 0 50px rgba(10,132,255,0.45),
    0 8px 30px rgba(0,0,0,0.55);
  animation: sxLogoGlow 2.5s ease-in-out 1s infinite;
}
@keyframes sxLogoGlow {
  0%,100% { box-shadow: 0 0 0 3px rgba(10,132,255,0.22), 0 0 50px rgba(10,132,255,0.45), 0 8px 30px rgba(0,0,0,0.55); }
  50%      { box-shadow: 0 0 0 5px rgba(10,132,255,0.38), 0 0 80px rgba(10,132,255,0.7),  0 8px 30px rgba(0,0,0,0.55); }
}

/* Progress Container setup */
.sx-progress-wrap {
  width: 180px; height: 2px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px; overflow: hidden;
  opacity: 0;
  animation: sxFadeUp 0.5s ease 0.6s forwards;
}
.sx-progress-bar {
  height: 100%; width: 0; border-radius: 2px;
  background: linear-gradient(90deg, #0a84ff, #60b0ff);
  animation: sxProgress 2.2s cubic-bezier(0.4,0,0.2,1) 0.8s forwards;
}
@keyframes sxProgress {
  from { width: 0;    opacity: 0.6; }
  to   { width: 100%; opacity: 1;   }
}

@keyframes sxFadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;