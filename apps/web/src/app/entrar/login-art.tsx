import { messages } from "../../shared/messages/pt-BR";

const cx = 400;
const cy = 400;

const isotherms = [
  "M-40 150 C 140 90, 260 210, 400 230 S 620 150, 860 120",
  "M-40 230 C 150 150, 270 270, 410 290 S 640 220, 860 200",
  "M-40 320 C 160 230, 280 340, 400 360 S 650 300, 860 290",
  "M-40 430 C 170 340, 300 450, 420 450 S 660 400, 860 400",
  "M-40 530 C 180 470, 310 560, 430 540 S 670 500, 860 510",
  "M-40 630 C 190 590, 330 680, 450 640 S 690 610, 860 640",
  "M120 -40 C 90 180, 180 320, 140 480 S 200 760, 100 860",
  "M250 -40 C 210 160, 300 340, 250 500 S 320 760, 230 860",
  "M560 -40 C 610 170, 500 360, 570 520 S 500 740, 620 860",
  "M700 -40 C 660 190, 760 380, 680 540 S 760 760, 700 880",
];

export function LoginArt() {
  return (
    <aside className="relative h-48 shrink-0 overflow-hidden bg-[#0B0C59] md:h-auto md:min-h-svh md:w-[52%]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 md:bottom-44">
        <div className="absolute -left-24 top-[-12%] size-[28rem] rounded-full bg-[#363BC4]/50 blur-3xl" />
        <div className="absolute -right-16 bottom-[-18%] size-[26rem] rounded-full bg-[#00B9CE]/25 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="login-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00B9CE" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#363BC4" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0B0C59" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="login-stem" x1="66" y1="132" x2="66" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00B9CE" />
              <stop offset="1" stopColor="#8E97FF" />
            </linearGradient>
            <linearGradient id="login-sweep" x1="0" y1="1" x2="1" y2="0">
              <stop stopColor="#00B9CE" />
              <stop offset="1" stopColor="#9AA6FF" />
            </linearGradient>
          </defs>

          {isotherms.map((d) => (
            <path key={d} d={d} fill="none" stroke="#D7E4FF" strokeOpacity="0.28" strokeWidth="1.25" />
          ))}

          <circle cx={cx} cy={cy} r="168" fill="url(#login-core)" />
          <circle cx={cx} cy={cy} r="214" fill="none" stroke="white" strokeOpacity="0.14" />
          <circle cx={cx} cy={cy} r="168" fill="none" stroke="white" strokeOpacity="0.22" />
          <circle cx={cx} cy={cy} r="124" fill="none" stroke="#9EB4FF" strokeOpacity="0.45" />
          <circle
            cx={cx}
            cy={cy}
            r="124"
            fill="none"
            stroke="url(#login-sweep)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="168 611"
            transform={`rotate(-36 ${cx} ${cy})`}
          />

          {Array.from({ length: 48 }, (_, index) => {
            const angle = (index / 48) * Math.PI * 2 - Math.PI / 2;
            const major = index % 4 === 0;
            const inner = major ? 178 : 186;
            const outer = 198;
            return (
              <line
                key={index}
                x1={cx + Math.cos(angle) * inner}
                y1={cy + Math.sin(angle) * inner}
                x2={cx + Math.cos(angle) * outer}
                y2={cy + Math.sin(angle) * outer}
                stroke="white"
                strokeOpacity={major ? 0.75 : 0.28}
                strokeWidth={major ? 1.6 : 1}
              />
            );
          })}

          <g transform={`translate(${cx} ${cy}) scale(1.05) translate(-66 -66)`}>
            <path
              d="M119.355 104.62L126.198 92.7681C127.724 90.1246 126.819 86.7445 124.175 85.2183L19.7859 24.9491C17.1424 23.4229 13.7622 24.3286 12.236 26.972L5.39322 38.8241C3.86702 41.4676 4.77273 44.8477 7.41619 46.3739L111.805 106.643C114.449 108.169 117.829 107.264 119.355 104.62Z"
              fill="#5A63F0"
            />
            <path
              d="M126.198 38.8241L119.356 26.9721C117.829 24.3286 114.449 23.4229 111.806 24.9491L7.41653 85.2183C4.77307 86.7445 3.86735 90.1247 5.39356 92.7681L12.2363 104.62C13.7625 107.264 17.1427 108.169 19.7862 106.643L124.175 46.374C126.819 44.8478 127.725 41.4676 126.198 38.8241Z"
              fill="#2C3494"
            />
            <path
              d="M72.6386 0H58.953C55.9006 0 53.4261 2.47446 53.4261 5.52687V126.065C53.4261 129.118 55.9006 131.592 58.953 131.592H72.6386C75.691 131.592 78.1655 129.118 78.1655 126.065V5.52687C78.1655 2.47446 75.691 0 72.6386 0Z"
              fill="url(#login-stem)"
            />
          </g>
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 hidden px-10 pb-12 md:block xl:px-16 xl:pb-16">
        <span className="mb-5 block h-1 w-12 rounded-full bg-[#00B9CE]" />
        <p className="text-xs font-semibold tracking-[0.22em] text-[#8CEAF4] uppercase">{messages.productName}</p>
        <p className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
          {messages.loginLead}
        </p>
      </div>
    </aside>
  );
}
