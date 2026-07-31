"use client";

export default function AnimatedBackground() {
  return (
    <>
      {/* Top Left Golden Glow */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full blur-[120px] glow-gold"
        style={{
          background: "rgba(217,166,83,.18)",
        }}
      />

      {/* Bottom Right Blue Glow */}
      <div
        className="pointer-events-none absolute -bottom-44 -right-44 h-[420px] w-[420px] rounded-full blur-[120px] glow-blue"
        style={{
          background: "rgba(59,130,246,.18)",
        }}
      />


      {/* Floating Gold V Logo */}
      <div className="floating-square">
        <div className="floating-square-inner">
          <div className="logo-v">
            V
          </div>
        </div>
      </div>


      {/* Gold Particle */}
      <div className="particle particle-gold"></div>

      {/* Cyan Particle */}
      <div className="particle particle-cyan"></div>

      {/* White Particle */}
      <div className="particle particle-white"></div>

      {/* Diagonal Accent Line */}
      <div className="accent-line"></div>



      <style jsx>{`

        .glow-gold {
          animation: glowGold 8s ease-in-out infinite;
        }


        .glow-blue {
          animation: glowBlue 10s ease-in-out infinite;
        }



        @keyframes glowGold {
          0%,
          100% {
            transform: scale(1);
            opacity: .25;
          }

          50% {
            transform: scale(1.15);
            opacity: .45;
          }
        }



        @keyframes glowBlue {
          0%,
          100% {
            transform: scale(1);
            opacity: .18;
          }

          50% {
            transform: scale(1.12);
            opacity: .35;
          }
        }




        /* V Logo Position */
        .floating-square {
          position: absolute;

          top: 70px;
          left: 70px;

          animation: floatSquare 5s ease-in-out infinite;

          z-index: 20;
        }




        /* Gold Square */
        .floating-square-inner {

          width: 70px;
          height: 70px;

          border-radius: 16px;

          background: #d9a653;


          display: flex;
          align-items: center;
          justify-content: center;


          position: relative;


          box-shadow:
            0 0 25px rgba(217,166,83,.55),
            0 0 60px rgba(217,166,83,.25);

        }





        /* Capital V */
        .logo-v {

          width: 100%;
          height: 100%;


          display: flex;
          align-items: center;
          justify-content: center;


          font-size: 44px;

          font-weight: 900;

          line-height: 1;


          color: #14213d;


          font-family: Arial, Helvetica, sans-serif;


          position: relative;

          z-index: 50;


          text-shadow:
            0 2px 8px rgba(0,0,0,.35);


          animation: logoPulse 5s ease-in-out infinite;

        }





        @keyframes logoPulse {

          0%,
          100% {

            transform: scale(1);

            opacity: .95;

          }


          50% {

            transform: scale(1.08);

            opacity: 1;

          }

        }






        @keyframes floatSquare {

          0%,
          100% {

            transform: translateY(0px);

          }


          50% {

            transform: translateY(-8px);

          }

        }







        /* Particles */

        .particle {

          position: absolute;

          border-radius: 9999px;

          animation: floatParticle 8s ease-in-out infinite;

        }





        .particle-gold {

          top: 120px;

          right: 120px;


          width: 8px;

          height: 8px;


          background: #d9a653;


          box-shadow: 0 0 12px #d9a653;

        }





        .particle-cyan {

          bottom: 140px;

          left: 80px;


          width: 6px;

          height: 6px;


          background: #42c6d8;


          box-shadow: 0 0 10px #42c6d8;


          animation-delay: 2s;

        }






        .particle-white {

          bottom: 60px;

          right: 180px;


          width: 5px;

          height: 5px;


          background: rgba(255,255,255,.7);


          animation-delay: 4s;

        }






        @keyframes floatParticle {

          0%,
          100% {

            transform: translateY(0);

            opacity: .5;

          }


          50% {

            transform: translateY(-20px);

            opacity: 1;

          }

        }








        /* Accent Line */

        .accent-line {

          position: absolute;


          top: 120px;

          left: -100px;


          width: 420px;

          height: 1px;


          background: linear-gradient(

            90deg,

            transparent,

            rgba(217,166,83,.45),

            transparent

          );


          transform: rotate(-18deg);


          animation: moveLine 6s linear infinite;

        }







        @keyframes moveLine {


          0% {

            transform: translateX(-40px) rotate(-18deg);

          }


          50% {

            transform: translateX(40px) rotate(-18deg);

          }


          100% {

            transform: translateX(-40px) rotate(-18deg);

          }


        }



      `}</style>

    </>
  );
}