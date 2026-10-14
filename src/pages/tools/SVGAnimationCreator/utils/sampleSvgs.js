export const sampleSvgs = [
  {
    id: 'rocket',
    name: 'Rocket Launch',
    category: 'Objects',
    description: 'Space rocket launching with flames, stars, and exhaust smoke.',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <!-- Background Stars -->
  <g id="stars" stroke="#facc15" stroke-width="2" fill="none">
    <path id="star-1" d="M30 40 L35 45 L30 50 L25 45 Z" fill="#facc15" />
    <path id="star-2" d="M170 30 L173 34 L170 38 L167 34 Z" fill="#facc15" />
    <path id="star-3" d="M160 120 L163 124 L160 128 L157 124 Z" fill="#facc15" />
    <path id="star-4" d="M40 140 L43 144 L40 148 L37 144 Z" fill="#facc15" />
  </g>
  <!-- Smoke Clouds -->
  <g id="exhaust-smoke" fill="#94a3b8" opacity="0.6">
    <circle id="smoke-1" cx="85" cy="170" r="14" />
    <circle id="smoke-2" cx="115" cy="170" r="14" />
    <circle id="smoke-3" cx="100" cy="178" r="16" fill="#cbd5e1" opacity="0.8" />
  </g>
  <!-- Flame Thrust -->
  <g id="rocket-flames">
    <polygon id="flame-outer" points="88,145 112,145 100,185" fill="#f97316" />
    <polygon id="flame-inner" points="93,145 107,145 100,170" fill="#facc15" />
  </g>
  <!-- Rocket Body Group -->
  <g id="rocket-ship">
    <!-- Left Fin -->
    <path id="fin-left" d="M78 120 C70 125 60 145 62 150 C70 148 80 142 84 135 Z" fill="#ef4444" />
    <!-- Right Fin -->
    <path id="fin-right" d="M122 120 C130 125 140 145 138 150 C130 148 120 142 116 135 Z" fill="#ef4444" />
    <!-- Fuselage Body -->
    <path id="rocket-fuselage" d="M100 25 C82 60 78 115 80 145 L120 145 C122 115 118 60 100 25 Z" fill="#f8fafc" stroke="#334155" stroke-width="2" />
    <!-- Nosecone Tip -->
    <path id="nosecone" d="M100 25 C92 42 88 65 86 80 L114 80 C112 65 108 42 100 25 Z" fill="#ef4444" />
    <!-- Porthole Window -->
    <circle id="window-outer" cx="100" cy="95" r="14" fill="#0284c7" stroke="#334155" stroke-width="2" />
    <circle id="window-glare" cx="96" cy="91" r="5" fill="#38bdf8" />
  </g>
</svg>`
  },
  {
    id: 'checkmark',
    name: 'Success Checkmark Badge',
    category: 'Badges',
    description: 'Celebratory success badge with stroke draw checkmark and sparkles.',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <!-- Sparkles -->
  <g id="sparkles" stroke="#10b981" stroke-width="3" stroke-linecap="round">
    <line id="spark-top" x1="100" y1="15" x2="100" y2="28" />
    <line id="spark-right" x1="175" y1="100" x2="162" y2="100" />
    <line id="spark-bottom" x1="100" y1="185" x2="100" y2="172" />
    <line id="spark-left" x1="25" y1="100" x2="38" y2="100" />
    <circle id="spark-dot-1" cx="45" cy="45" r="3" fill="#10b981" stroke="none" />
    <circle id="spark-dot-2" cx="155" cy="45" r="3" fill="#10b981" stroke="none" />
    <circle id="spark-dot-3" cx="155" cy="155" r="3" fill="#10b981" stroke="none" />
    <circle id="spark-dot-4" cx="45" cy="155" r="3" fill="#10b981" stroke="none" />
  </g>
  <!-- Outer Glow Circle -->
  <circle id="badge-glow" cx="100" cy="100" r="65" fill="#d1fae5" opacity="0.5" />
  <!-- Main Badge Circle -->
  <circle id="badge-circle" cx="100" cy="100" r="54" fill="#10b981" stroke="#059669" stroke-width="3" />
  <!-- Inner Ring Line -->
  <circle id="inner-ring" cx="100" cy="100" r="46" fill="none" stroke="#6ee7b7" stroke-width="2" stroke-dasharray="6 4" />
  <!-- Checkmark Path -->
  <path id="check-icon" d="M72 102 L90 120 L132 78" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`
  },
  {
    id: 'bell',
    name: 'Notification Bell',
    category: 'UI & Icons',
    description: 'Ringing notification bell with swing clapper and alert dot.',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <!-- Sound Waves -->
  <g id="sound-waves" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round">
    <path id="wave-left" d="M45 80 C38 92 38 108 45 120" />
    <path id="wave-right" d="M155 80 C162 92 162 108 155 120" />
  </g>
  <!-- Bell Body & Components -->
  <g id="bell-group">
    <!-- Top Loop -->
    <path id="bell-loop" d="M93 42 C93 35 107 35 107 42" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" />
    <!-- Clapper / Striker -->
    <circle id="bell-clapper" cx="100" cy="155" r="12" fill="#4f46e5" />
    <!-- Bell Shell -->
    <path id="bell-shell" d="M60 140 C65 140 70 135 72 120 C76 88 84 50 100 50 C116 50 124 88 128 120 C130 135 135 140 140 140 L60 140 Z" fill="#818cf8" stroke="#4f46e5" stroke-width="3" stroke-linejoin="round" />
    <!-- Lip Rim -->
    <path id="bell-lip" d="M52 140 C52 138 54 136 56 136 L144 136 C146 136 148 138 148 140 C148 145 144 148 140 148 L60 148 C56 148 52 145 52 140 Z" fill="#6366f1" />
  </g>
  <!-- Notification Alert Badge -->
  <circle id="alert-dot" cx="140" cy="55" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="3" />
</svg>`
  },
  {
    id: 'heart-pulse',
    name: 'Heart & Pulse Wave',
    category: 'Health & Life',
    description: 'Anatomical pulse heart with cardiac ECG monitor line.',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <!-- Backdrop Glow -->
  <circle id="heart-glow" cx="100" cy="100" r="70" fill="#fecdd3" opacity="0.6" />
  <!-- Main Heart Shape -->
  <path id="heart-shape" d="M100 155 C70 135 40 105 40 75 C40 50 60 38 80 44 C90 48 97 56 100 64 C103 56 110 48 120 44 C140 38 160 50 160 75 C160 105 130 135 100 155 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="3" />
  <!-- Pulse Line (ECG) -->
  <polyline id="ecg-line" points="45,100 70,100 80,85 88,125 96,65 106,120 114,92 122,100 155,100" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Vital Point -->
  <circle id="vital-node" cx="96" cy="65" r="4" fill="#ffffff" />
</svg>`
  },
  {
    id: 'gear-system',
    name: 'Cogwheel & Engine',
    category: 'Tech & Settings',
    description: 'Smooth spinning mechanical cogwheel with center core.',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <!-- Outer Cogwheel Group -->
  <g id="cog-assembly">
    <!-- Outer Gear Wheel -->
    <path id="gear-outer" d="M92 20 L108 20 L111 36 C117 38 123 41 129 45 L143 35 L155 47 L145 61 C149 67 152 73 154 79 L170 82 L170 98 L154 101 C152 107 149 113 145 119 L155 133 L143 145 L129 135 C123 139 117 142 111 144 L108 160 L92 160 L89 144 C83 142 77 139 71 135 L57 145 L45 133 L55 119 C51 113 48 107 46 101 L30 98 L30 82 L46 79 C48 73 51 67 55 61 L45 47 L57 35 L71 45 C77 41 83 38 89 36 Z" fill="#64748b" stroke="#334155" stroke-width="3" />
    <!-- Core Ring -->
    <circle id="gear-ring" cx="100" cy="90" r="32" fill="#0f172a" stroke="#38bdf8" stroke-width="3" />
    <!-- Center Axle Hole -->
    <circle id="axle-center" cx="100" cy="90" r="14" fill="#38bdf8" />
  </g>
  <!-- Status Indicator Dot -->
  <circle id="power-indicator" cx="100" cy="182" r="6" fill="#10b981" />
</svg>`
  },
  {
    id: 'trophy',
    name: 'Winner Trophy & Star',
    category: 'Badges',
    description: 'Golden championship trophy with shiny star and victory ribbon.',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <!-- Podium Base -->
  <g id="trophy-base">
    <rect id="base-slab" x="65" y="155" width="70" height="15" rx="3" fill="#334155" />
    <polygon id="base-pedestal" points="75,155 125,155 115,135 85,135" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
  </g>
  <!-- Trophy Cup -->
  <g id="trophy-cup">
    <!-- Left Handle -->
    <path id="cup-handle-left" d="M68 60 C40 60 40 100 70 100" fill="none" stroke="#ca8a04" stroke-width="6" stroke-linecap="round" />
    <!-- Right Handle -->
    <path id="cup-handle-right" d="M132 60 C160 60 160 100 130 100" fill="none" stroke="#ca8a04" stroke-width="6" stroke-linecap="round" />
    <!-- Cup Body -->
    <path id="cup-chalice" d="M68 45 L132 45 C132 90 120 120 100 125 C80 120 68 90 68 45 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3" />
    <!-- Gold Rim -->
    <ellipse id="cup-rim" cx="100" cy="45" rx="32" ry="7" fill="#fef08a" stroke="#ca8a04" stroke-width="2" />
    <!-- Shining Star Badge -->
    <path id="trophy-star" d="M100 65 L104 74 L114 74 L106 80 L109 89 L100 84 L91 89 L94 80 L86 74 L96 74 Z" fill="#ffffff" />
  </g>
</svg>`
  }
];
