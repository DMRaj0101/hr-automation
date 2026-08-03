"use client";

export default function AnimatedBackground() {
  const strands = Array.from({ length: 34 }).map((_, i) => {
    const offset = i * 6;

    return (
      <path
        key={i}
        d={`
          M -80 ${350 + offset}
          C 80 ${330 + offset},
            240 ${430 + offset},
            430 ${260 + offset}
          S 640 20,
            760 -40
        `}
        stroke="url(#goldWave)"
        strokeWidth={1.6 - i * 0.035}
        opacity={1 - i * 0.028}
        fill="none"
      />
    );
  });

  return (
    <>
      {/* Top Left Golden Glow */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full glow-gold"
        style={{
          background: "rgba(217,166,83,.18)",
          filter: "blur(120px)",
        }}
      />

      {/* Bottom Right Blue Glow */}
      <div
        className="pointer-events-none absolute -bottom-44 -right-44 h-[420px] w-[420px] rounded-full glow-blue"
        style={{
          background: "rgba(59,130,246,.18)",
          filter: "blur(120px)",
        }}
      />

      {/* Logo */}
      <div className="floating-square">
        <div className="floating-square-inner">
          <div className="shine"></div>
          <div className="logo-v">V</div>
        </div>
      </div>

      {/* Particles */}
      <div className="particle particle-gold"></div>
      <div className="particle particle-cyan"></div>
      <div className="particle particle-white"></div>

      {/* Sparkles */}
      <span className="spark s1"></span>
      <span className="spark s2"></span>
      <span className="spark s3"></span>
      <span className="spark s4"></span>

     

      {/* Bottom Right Mesh Wave */}
      <div className="wave-wrap pointer-events-none">
        <svg
          viewBox="0 0 760 520"
          className="wave-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="goldWave"
              x1="0%"
              y1="100%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#D9A653" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {strands}

          <circle cx="620" cy="20" r="2.6" fill="#D9A653">
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      <style jsx>{`.glow-gold {
  animation: glowGold 8s ease-in-out infinite;
}

.glow-blue {
  animation: glowBlue 10s ease-in-out infinite;
}

@keyframes glowGold {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.45;
  }
}

@keyframes glowBlue {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.18;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.35;
  }
}

/* ---------------- Logo ---------------- */

.floating-square {
  position: absolute;
  top: 70px;
  left: 70px;
  z-index: 20;
  animation: floatSquare 6s ease-in-out infinite;
}

.floating-square-inner {
  position: relative;

  width: 72px;
  height: 72px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 18px;

  background: #d9a653;

  overflow: hidden;

  box-shadow:
    0 0 25px rgba(217,166,83,.45),
    0 0 70px rgba(217,166,83,.18);

  animation: logoGlow 5s ease-in-out infinite;
}

.logo-v {
  position: relative;
  z-index: 2;

  color: #14213d;

  font-size: 46px;
  font-weight: 900;

  font-family: Arial, Helvetica, sans-serif;

  animation: logoPulse 5s ease-in-out infinite;
}

.shine{
  position:absolute;

  top:-30%;
  left:-160%;

  width:55%;
  height:180%;

  background:linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.65),
    transparent
  );

  transform:rotate(25deg);

  animation:shine 5s linear infinite;
}

@keyframes shine{
  from{
    left:-160%;
  }
  to{
    left:180%;
  }
}

@keyframes logoGlow{
  0%,100%{
    box-shadow:
      0 0 25px rgba(217,166,83,.45),
      0 0 60px rgba(217,166,83,.15);
  }

  50%{
    box-shadow:
      0 0 45px rgba(217,166,83,.8),
      0 0 90px rgba(217,166,83,.25);
  }
}

@keyframes logoPulse{
  0%,100%{
    transform:scale(1);
  }

  50%{
    transform:scale(1.06);
  }
}

@keyframes floatSquare{
  0%,100%{
    transform:translateY(0px);
  }

  50%{
    transform:translateY(-10px);
  }
}

/* ---------------- Particles ---------------- */

.particle{
  position:absolute;
  border-radius:999px;

  animation:floatParticle 8s ease-in-out infinite;
}

.particle-gold{
  top:120px;
  right:120px;

  width:8px;
  height:8px;

  background:#D9A653;

  box-shadow:0 0 14px #D9A653;
}

.particle-cyan{
  bottom:140px;
  left:80px;

  width:6px;
  height:6px;

  background:#42C6D8;

  box-shadow:0 0 12px #42C6D8;

  animation-delay:2s;
}

.particle-white{
  bottom:70px;
  right:190px;

  width:5px;
  height:5px;

  background:white;

  opacity:.7;

  animation-delay:4s;
}

@keyframes floatParticle{

  0%,100%{
    transform:translateY(0);
    opacity:.45;
  }

  50%{
    transform:translateY(-20px);
    opacity:1;
  }

}

/* ---------------- Sparkles ---------------- */

.spark{

  position:absolute;

  width:4px;
  height:4px;

  border-radius:999px;

  background:#D9A653;

  box-shadow:0 0 12px #D9A653;

  animation:twinkle 3s infinite;
}

.s1{
  top:110px;
  left:240px;
}

.s2{
  top:190px;
  left:330px;
  animation-delay:1s;
}

.s3{
  bottom:170px;
  right:220px;
  animation-delay:2s;
}

.s4{
  bottom:80px;
  right:110px;
  animation-delay:1.5s;
}

@keyframes twinkle{

  0%,100%{
    opacity:.2;
    transform:scale(.6);
  }

  50%{
    opacity:1;
    transform:scale(1.8);
  }

}



/* ---------------- Mesh Wave ---------------- */

.wave-wrap{

  position:absolute;

  right:-140px;
  bottom:-120px;

  width:760px;
  height:540px;

  pointer-events:none;
}

.wave-svg{

  width:100%;
  height:100%;

  opacity:.95;

  animation:waveFloat 9s ease-in-out infinite;
}

@keyframes waveFloat{

  0%,100%{
    transform:
      translate(0,0)
      scale(1);
  }

  50%{
    transform:
      translate(-8px,-6px)
      scale(1.02);
  }

}`}</style>
    </>
  );
}