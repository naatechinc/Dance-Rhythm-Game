import React, { useEffect, useRef } from 'react';

/**
 * GameScene
 * Full SVG backyard party scene with:
 * - Sunset sky, string lights, fence, trees
 * - Stage with projector screen (YouTube video inside)
 * - Up to 6 Just Dance silhouette dancers, one per player
 * - Each dancer animates based on their current move
 * - Right hand is gold = their controller indicator
 *
 * Props:
 *   players: [{ id, color, move, connected }]  — up to 6
 *   videoId: string — YouTube video ID for projector screen
 *   ytPlayer: YT.Player ref — to embed in projector
 */

const PLAYER_COLORS = ['#e94560', '#40c4ff', '#00e676', '#b04dff', '#ff9800', '#ff4ea3'];

const MOVE_POSES = {
  step_left:  { bodyRot: -5,  lArm: [-22, 28],  rArm: [18, 20],  lLeg: [-14, 55], rLeg: [8, 55]  },
  step_right: { bodyRot: 5,   lArm: [-18, 20],  rArm: [22, 28],  lLeg: [-8, 55],  rLeg: [14, 55] },
  clap:       { bodyRot: 0,   lArm: [-14, 28],  rArm: [14, 28],  lLeg: [-8, 55],  rLeg: [8, 55]  },
  bounce:     { bodyRot: 0,   lArm: [-22, 10],  rArm: [22, 10],  lLeg: [-8, 50],  rLeg: [8, 50], yOff: -6 },
  arm_cross:  { bodyRot: 0,   lArm: [14, 20],   rArm: [-14, 20], lLeg: [-8, 55],  rLeg: [8, 55]  },
  arm_swing:  { bodyRot: 0,   lArm: [-26, 5],   rArm: [26, 5],   lLeg: [-8, 55],  rLeg: [8, 55]  },
  spin:       { bodyRot: 20,  lArm: [-22, 15],  rArm: [22, 15],  lLeg: [-10, 50], rLeg: [10, 50] },
  pivot:      { bodyRot: -15, lArm: [-20, 10],  rArm: [20, 30],  lLeg: [-12, 55], rLeg: [12, 50] },
  point:      { bodyRot: 5,   lArm: [-16, 25],  rArm: [26, -5],  lLeg: [-8, 55],  rLeg: [8, 55]  },
  footwork:   { bodyRot: 0,   lArm: [-22, 10],  rArm: [22, 10],  lLeg: [-18, 52], rLeg: [14, 56] },
  default:    { bodyRot: 0,   lArm: [-20, 20],  rArm: [20, 20],  lLeg: [-8, 55],  rLeg: [8, 55]  },
};

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function Dancer({ x, y, color, rightHandColor, move, motion, label, connected }) {
  const pose = MOVE_POSES[move] || MOVE_POSES.default;
  const yOff = pose.yOff || 0;
  const opacity = connected ? 1 : 0.35;
  const rhColor = rightHandColor || color;

  // If we have live motion data, blend it into arm/leg positions
  const m = motion || { ax: 0, ay: 0, az: 0, gamma: 0 };
  const lArmX = pose.lArm[0] + clamp(-m.gamma * 0.2, -10, 10);
  const lArmY = pose.lArm[1] + clamp(-m.ay * 0.5, -8, 8);
  const rArmX = pose.rArm[0] + clamp(m.gamma * 0.2, -10, 10);
  const rArmY = pose.rArm[1] + clamp(-m.ay * 0.5, -8, 8);
  const lLegX = pose.lLeg[0] + clamp(-m.ax * 0.4, -8, 8);
  const rLegX = pose.rLeg[0] + clamp(m.ax * 0.4, -8, 8);
  const bodyTilt = pose.bodyRot + clamp(m.gamma * 0.15, -8, 8);
  const bodyBob = clamp(-m.az * 0.3, -4, 4);

  return (
    <g transform={`translate(${x}, ${y + yOff + bodyBob})`} opacity={opacity}>
      <ellipse cx="0" cy="58" rx="16" ry="5" fill="#000" opacity="0.25"/>
      <g transform={`rotate(${bodyTilt})`}>
        <path d="M-12,30 Q0,52 12,30 Q16,8 0,-4 Q-16,8 -12,30Z" fill={color}/>
        <circle cx="0" cy="-14" r="13" fill={color}/>
        <line x1="-12" y1="14" x2={lArmX} y2={lArmY} stroke={color} strokeWidth="6" strokeLinecap="round"/>
        <line x1="12" y1="14" x2={rArmX} y2={rArmY} stroke={rhColor} strokeWidth="8" strokeLinecap="round"/>
        <line x1="-5" y1="30" x2={lLegX} y2={pose.lLeg[1]} stroke={color} strokeWidth="6" strokeLinecap="round"/>
        <line x1="5" y1="30" x2={rLegX} y2={pose.rLeg[1]} stroke={color} strokeWidth="6" strokeLinecap="round"/>
      </g>
      <text x="0" y="72" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill={color} fontWeight="bold">{label}</text>
      {!connected && (
        <text x="0" y="-28" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill="#666">waiting...</text>
      )}
    </g>
  );
}

export default function GameScene({ players = [], videoElementId = 'yt-player' }) {
  const activePlayers = players.slice(0, 6);

  // Spread dancers evenly across the stage
  const stageLeft = 185;
  const stageRight = 775;
  const stageY = 330;
  const spacing = activePlayers.length > 1
    ? (stageRight - stageLeft) / (activePlayers.length - 1)
    : 0;

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      <svg
        width="100%"
        viewBox="0 0 960 480"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* SKY layers */}
        <rect x="0" y="0" width="960" height="480" fill="#1a0a2e"/>
        <rect x="0" y="0" width="960" height="300" fill="#2d1b4e" opacity="0.9"/>
        <rect x="0" y="100" width="960" height="200" fill="#6b2d6b" opacity="0.55"/>
        <rect x="0" y="180" width="960" height="180" fill="#c45e2a" opacity="0.5"/>
        <rect x="0" y="280" width="960" height="120" fill="#e8832a" opacity="0.4"/>
        <rect x="0" y="340" width="960" height="80" fill="#f5a623" opacity="0.25"/>

        {/* SUN */}
        <circle cx="480" cy="250" r="52" fill="#f5a623" opacity="0.8"/>
        <circle cx="480" cy="250" r="38" fill="#ffd166" opacity="0.85"/>

        {/* CLOUDS */}
        <ellipse cx="170" cy="140" rx="65" ry="25" fill="#c45e2a" opacity="0.3"/>
        <ellipse cx="225" cy="128" rx="45" ry="20" fill="#e8832a" opacity="0.25"/>
        <ellipse cx="760" cy="125" rx="75" ry="28" fill="#6b2d6b" opacity="0.35"/>
        <ellipse cx="815" cy="112" rx="50" ry="20" fill="#c45e2a" opacity="0.25"/>

        {/* GROUND */}
        <rect x="0" y="390" width="960" height="90" fill="#2d4a1e"/>
        <rect x="0" y="384" width="960" height="16" fill="#3d6128" opacity="0.9"/>

        {/* FENCE LEFT */}
        {[0,18,36,54,72].map(i => (
          <rect key={i} x={i} y="280" width="8" height="120" fill="#5a3a1a" key={`fl${i}`}/>
        ))}
        <rect x="0" y="298" width="88" height="8" fill="#7a4e22"/>
        <rect x="0" y="336" width="88" height="8" fill="#7a4e22"/>

        {/* FENCE RIGHT */}
        {[872,890,908,926,944].map(i => (
          <rect key={i} x={i} y="280" width="8" height="120" fill="#5a3a1a" key={`fr${i}`}/>
        ))}
        <rect x="864" y="298" width="88" height="8" fill="#7a4e22"/>
        <rect x="864" y="336" width="88" height="8" fill="#7a4e22"/>

        {/* TREES */}
        <rect x="92" y="310" width="16" height="90" fill="#5a3a1a"/>
        <ellipse cx="100" cy="278" rx="44" ry="50" fill="#1a3d0e"/>
        <ellipse cx="100" cy="264" rx="32" ry="38" fill="#2d5a1a"/>
        <rect x="848" y="310" width="16" height="90" fill="#5a3a1a"/>
        <ellipse cx="856" cy="278" rx="44" ry="50" fill="#1a3d0e"/>
        <ellipse cx="856" cy="264" rx="32" ry="38" fill="#2d5a1a"/>

        {/* STAGE PLATFORM */}
        <rect x="155" y="355" width="650" height="45" fill="#4a2e10" rx="4"/>
        <rect x="155" y="350" width="650" height="14" fill="#6b4420" rx="3"/>
        <rect x="155" y="350" width="650" height="5" fill="#8a5a2a" opacity="0.5"/>
        {/* Stage legs */}
        {[170,370,570,770].map(x => (
          <rect key={x} x={x} y="398" width="18" height="28" fill="#3a2208"/>
        ))}

        {/* PROJECTOR SCREEN STAND */}
        <rect x="418" y="62" width="3" height="293" fill="#555"/>
        <rect x="539" y="62" width="3" height="293" fill="#555"/>
        <rect x="305" y="62" width="350" height="9" fill="#666" rx="2"/>
        <rect x="305" y="198" width="350" height="9" fill="#666" rx="2"/>

        {/* SCREEN BORDER */}
        <rect x="310" y="70" width="340" height="138" fill="#111" rx="6"/>

        {/* SCREEN SURFACE - video goes here */}
        <rect x="318" y="77" width="324" height="124" fill="#050510" rx="3"/>

        {/* VIDEO LABEL (replaced by actual iframe in React) */}
        <rect x="318" y="77" width="324" height="124" fill="#0a0a20" opacity="0.9" rx="3"/>
        <text x="480" y="133" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#333">video plays in projector</text>

        {/* SCREEN GLOW on stage floor */}
        <ellipse cx="480" cy="358" rx="80" ry="8" fill="#40c4ff" opacity="0.06"/>

        {/* STRING LIGHTS rope */}
        <path d="M 155 270 Q 250 295 350 275 Q 450 255 540 272 Q 630 289 720 272 Q 780 260 805 260" stroke="#7a5a2a" strokeWidth="1.5" fill="none" opacity="0.7"/>
        {/* Bulbs */}
        {[
          [220,292],[295,276],[370,269],[445,270],[480,275],
          [520,272],[595,282],[670,270],[740,265]
        ].map(([cx,cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="#ffd166" opacity="0.95"/>
        ))}

        {/* SPOTLIGHT circles on stage */}
        <ellipse cx="270" cy="358" rx="35" ry="8" fill="#f5a623" opacity="0.1"/>
        <ellipse cx="480" cy="358" rx="35" ry="8" fill="#f5a623" opacity="0.1"/>
        <ellipse cx="690" cy="358" rx="35" ry="8" fill="#f5a623" opacity="0.1"/>

        {/* DANCERS */}
        {activePlayers.length === 0 ? (
          <text x="480" y="340" textAnchor="middle" fontFamily="sans-serif" fontSize="13" fill="#555">Waiting for players...</text>
        ) : (
          activePlayers.map((p, i) => {
            const x = activePlayers.length === 1
              ? 480
              : stageLeft + i * spacing;
            return (
              <Dancer
                key={p.id}
                x={x}
                y={stageY}
                color={p.color || PLAYER_COLORS[i]}
                rightHandColor={p.color || PLAYER_COLORS[i]}
                move={p.move || 'default'}
                motion={p.motion}
                label={`P${i + 1}`}
                connected={p.connected}
              />
            );
          })
        )}

        {/* LEGEND */}
        <rect x="14" y="14" width="152" height="28" fill="#000" opacity="0.55" rx="4"/>
        <line x1="22" y1="28" x2="36" y2="28" stroke="#ffd166" strokeWidth="4" strokeLinecap="round"/>
        <text x="42" y="33" fontFamily="sans-serif" fontSize="10" fill="#ffd166">= player color right hand</text>
      </svg>
    </div>
  );
}

export { PLAYER_COLORS };
