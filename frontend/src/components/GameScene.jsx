import AudioVisualizer from './AudioVisualizer';
import React from 'react';

const PLAYER_COLORS = ['#e94560', '#40c4ff', '#00e676', '#b04dff', '#ff9800', '#ff4ea3'];

const MOVE_POSES = {
  step_left:  { bodyRot: -5,  lArm: [-24,30], rArm: [18,20], lLeg: [-16,55], rLeg: [8,55]  },
  step_right: { bodyRot: 5,   lArm: [-18,20], rArm: [24,30], lLeg: [-8,55],  rLeg: [16,55] },
  clap:       { bodyRot: 0,   lArm: [-14,30], rArm: [14,30], lLeg: [-8,55],  rLeg: [8,55]  },
  bounce:     { bodyRot: 0,   lArm: [-22,8],  rArm: [22,8],  lLeg: [-8,48],  rLeg: [8,48], yOff: -8 },
  arm_cross:  { bodyRot: 0,   lArm: [14,22],  rArm: [-14,22],lLeg: [-8,55],  rLeg: [8,55]  },
  arm_swing:  { bodyRot: 0,   lArm: [-28,4],  rArm: [28,4],  lLeg: [-8,55],  rLeg: [8,55]  },
  spin:       { bodyRot: 25,  lArm: [-22,14], rArm: [22,14], lLeg: [-12,50], rLeg: [12,50] },
  pivot:      { bodyRot: -18, lArm: [-20,10], rArm: [22,32], lLeg: [-14,55], rLeg: [12,50] },
  point:      { bodyRot: 5,   lArm: [-16,26], rArm: [28,-6], lLeg: [-8,55],  rLeg: [8,55]  },
  footwork:   { bodyRot: 0,   lArm: [-22,8],  rArm: [22,8],  lLeg: [-20,52], rLeg: [14,58] },
  default:    { bodyRot: 0,   lArm: [-20,22], rArm: [20,22], lLeg: [-8,55],  rLeg: [8,55]  },
};

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function Dancer({ x, y, color, move, motion, label, connected, isLeader = false }) {
  const pose = MOVE_POSES[move] || MOVE_POSES.default;
  const yOff = pose.yOff || 0;
  const opacity = connected ? 1 : 0.35;
  const m = motion || { ax:0, ay:0, az:0, gamma:0 };
  const lArmX = pose.lArm[0] + clamp(-m.gamma*0.18, -10, 10);
  const lArmY = pose.lArm[1] + clamp(-m.ay*0.4, -8, 8);
  const rArmX = pose.rArm[0] + clamp(m.gamma*0.18, -10, 10);
  const rArmY = pose.rArm[1] + clamp(-m.ay*0.4, -8, 8);
  const lLegX = pose.lLeg[0] + clamp(-m.ax*0.35, -8, 8);
  const rLegX = pose.rLeg[0] + clamp(m.ax*0.35, -8, 8);
  const tilt = pose.bodyRot + clamp((m.gamma||0)*0.12, -8, 8);
  const bob = clamp(-(m.az||0)*0.25, -4, 4);

  return (
    <g transform={`translate(${x},${y+yOff+bob})`} opacity={opacity}>
      <ellipse cx="0" cy="58" rx="16" ry="5" fill="#000" opacity="0.3"/>
      <g transform={`rotate(${tilt})`}>
        <path d="M-13,30 Q0,54 13,30 Q17,6 0,-5 Q-17,6 -13,30Z" fill={color}/>
        <circle cx="0" cy="-16" r="14" fill={color}/>
        <line x1="-13" y1="14" x2={lArmX} y2={lArmY} stroke={color} strokeWidth="7" strokeLinecap="round"/>
        <line x1="13" y1="14" x2={rArmX} y2={rArmY} stroke={color} strokeWidth="8" strokeLinecap="round"/>
        <circle cx={rArmX} cy={rArmY} r="5" fill={color} stroke="#fff" strokeWidth="2" opacity="0.9"/>
        <line x1="-5" y1="30" x2={lLegX} y2={pose.lLeg[1]} stroke={color} strokeWidth="7" strokeLinecap="round"/>
        <line x1="5" y1="30" x2={rLegX} y2={pose.rLeg[1]} stroke={color} strokeWidth="7" strokeLinecap="round"/>
      </g>
      <text x="0" y="74" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill={color} fontWeight="bold">{label}</text>
      {!connected && <text x="0" y="-30" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fill="#555">waiting...</text>}
      {isLeader && (
        <g transform="translate(0, -36)">
          <text x="0" y="0" textAnchor="middle" fontSize="18">👑</text>
        </g>
      )}
    </g>
  );
}

// ── SCENE BACKGROUNDS ────────────────────────────────────────────────────────

function BackyardSunset() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#1a0a2e"/>
    <rect x="0" y="0" width="960" height="280" fill="#2d1b4e" opacity="0.9"/>
    <rect x="0" y="100" width="960" height="200" fill="#6b2d6b" opacity="0.55"/>
    <rect x="0" y="200" width="960" height="160" fill="#c45e2a" opacity="0.5"/>
    <rect x="0" y="300" width="960" height="100" fill="#e8832a" opacity="0.4"/>
    <circle cx="480" cy="255" r="52" fill="#f5a623" opacity="0.8"/>
    <circle cx="480" cy="255" r="38" fill="#ffd166" opacity="0.85"/>
    <ellipse cx="170" cy="140" rx="65" ry="25" fill="#c45e2a" opacity="0.3"/>
    <ellipse cx="760" cy="125" rx="75" ry="28" fill="#6b2d6b" opacity="0.35"/>
    <rect x="0" y="388" width="960" height="92" fill="#2d4a1e"/>
    <rect x="0" y="382" width="960" height="16" fill="#3d6128"/>
    <rect x="0" y="278" width="88" height="120" fill="none"/>
    {[0,18,36,54,72].map(i => <rect key={i} x={i} y="278" width="8" height="120" fill="#5a3a1a"/>)}
    <rect x="0" y="296" width="88" height="8" fill="#7a4e22"/>
    <rect x="0" y="334" width="88" height="8" fill="#7a4e22"/>
    {[872,890,908,926,944].map(i => <rect key={i} x={i} y="278" width="8" height="120" fill="#5a3a1a"/>)}
    <rect x="864" y="296" width="88" height="8" fill="#7a4e22"/>
    <rect x="864" y="334" width="88" height="8" fill="#7a4e22"/>
    <rect x="92" y="308" width="16" height="90" fill="#5a3a1a"/>
    <ellipse cx="100" cy="276" rx="44" ry="50" fill="#1a3d0e"/>
    <ellipse cx="100" cy="262" rx="32" ry="38" fill="#2d5a1a"/>
    <rect x="848" y="308" width="16" height="90" fill="#5a3a1a"/>
    <ellipse cx="856" cy="276" rx="44" ry="50" fill="#1a3d0e"/>
    <ellipse cx="856" cy="262" rx="32" ry="38" fill="#2d5a1a"/>
    <path d="M 155 268 Q 250 292 350 272 Q 450 252 540 270 Q 630 288 720 270 Q 780 258 805 258" stroke="#7a5a2a" strokeWidth="1.5" fill="none" opacity="0.7"/>
    {[[220,290],[295,274],[370,267],[445,268],[520,270],[595,280],[670,268],[740,263]].map(([cx,cy],i)=>
      <circle key={i} cx={cx} cy={cy} r="4" fill="#ffd166" opacity="0.95"/>)}
  </>;
}

function MoonScene() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#00001a"/>
    <rect x="0" y="0" width="960" height="480" fill="#030318" opacity="0.8"/>
    {[[80,40],[200,25],[350,55],[500,20],[650,45],[780,30],[900,60],[120,80],[420,70],[700,15]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r={Math.random()<0.3?2:1} fill="#fff" opacity={0.6+Math.random()*0.4}/>)}
    {[[50,120],[150,90],[300,130],[600,100],[800,110],[900,130]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r="1" fill="#fff" opacity="0.4"/>)}
    <circle cx="800" cy="80" r="55" fill="#c8c8a0" opacity="0.9"/>
    <circle cx="800" cy="80" r="52" fill="#d4d4aa"/>
    <ellipse cx="785" cy="65" rx="18" ry="12" fill="#aaa870" opacity="0.5"/>
    <ellipse cx="820" cy="90" rx="10" ry="7" fill="#aaa870" opacity="0.4"/>
    <ellipse cx="795" cy="95" rx="8" ry="5" fill="#aaa870" opacity="0.35"/>
    <rect x="0" y="350" width="960" height="130" fill="#1a1a2a"/>
    <rect x="0" y="345" width="960" height="14" fill="#22223a"/>
    {[100,250,400,600,750,900].map((x,i)=>
      <ellipse key={i} cx={x} cy={355} rx={20+i*3} ry="8" fill="#2a2a45" opacity="0.8"/>)}
    <ellipse cx="480" cy="358" rx="120" ry="12" fill="#3333ff" opacity="0.06"/>
  </>;
}

function NeonCityScene() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#050510"/>
    <rect x="0" y="180" width="960" height="200" fill="#0a0520" opacity="0.8"/>
    {[[0,60],[100,40],[180,80],[260,50],[340,70],[420,45],[500,65],[580,40],[660,75],[740,55],[820,70],[900,45]].map(([x,h],i)=>
      <rect key={i} x={x} y={180-h} width="80" height={h+200} fill={['#0a0a1a','#080818','#0c0c20'][i%3]}/>)}
    {[[20,160],[80,140],[160,170],[240,145],[320,155],[400,140],[480,160],[560,138],[640,165],[720,148],[800,158],[880,142]].map(([x,y],i)=>
      <rect key={i} x={x} y={y} width="40" height="8" fill={['#ff0066','#00ffcc','#ff9900','#0099ff'][i%4]} opacity="0.6"/>)}
    <rect x="0" y="360" width="960" height="120" fill="#0a0510"/>
    <rect x="0" y="355" width="960" height="14" fill="#111"/>
    <rect x="0" y="355" width="960" height="6" fill="#ff0066" opacity="0.3"/>
    {[0,60,120,180,240,300,360,420,480,540,600,660,720,780,840,900].map((x,i)=>
      <circle key={i} cx={x} cy={362} r="2" fill={['#ff0066','#00ffcc','#ff9900','#0099ff'][i%4]} opacity="0.8"/>)}
    <circle cx="480" cy="-20" r="80" fill="#ff0066" opacity="0.04"/>
  </>;
}

function BeachScene() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#87ceeb"/>
    <rect x="0" y="0" width="960" height="220" fill="#5ba3d0" opacity="0.8"/>
    <rect x="0" y="0" width="960" height="160" fill="#4a90c4" opacity="0.6"/>
    <circle cx="160" cy="90" r="65" fill="#fff5e0" opacity="0.95"/>
    <circle cx="160" cy="90" r="60" fill="#fffacd"/>
    <ellipse cx="200" cy="60" rx="80" ry="35" fill="#fff" opacity="0.6"/>
    <ellipse cx="700" cy="80" rx="60" ry="28" fill="#fff" opacity="0.5"/>
    <ellipse cx="800" cy="55" rx="40" ry="20" fill="#fff" opacity="0.55"/>
    <rect x="0" y="260" width="960" height="220" fill="#006994" opacity="0.7"/>
    <rect x="0" y="270" width="960" height="160" fill="#0077a8" opacity="0.6"/>
    <rect x="0" y="330" width="960" height="150" fill="#f4d03f" opacity="0.9"/>
    <rect x="0" y="325" width="960" height="15" fill="#e8c832"/>
    <ellipse cx="840" cy="340" rx="55" ry="12" fill="#c8a000" opacity="0.4"/>
    <ellipse cx="150" cy="345" rx="40" ry="8" fill="#c8a000" opacity="0.3"/>
    <rect x="880" y="240" width="8" height="120" fill="#4a2800"/>
    <ellipse cx="884" cy="220" rx="40" ry="55" fill="#228b22" opacity="0.9"/>
    <ellipse cx="900" cy="195" rx="30" ry="40" fill="#2da82d" opacity="0.8"/>
  </>;
}

function SpaceStationScene() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#000008"/>
    {Array.from({length:80},(_,i)=><circle key={i} cx={(i*137)%960} cy={(i*89)%480} r={i%5===0?2:1} fill="#fff" opacity={0.3+Math.random()*0.5}/>)}
    <ellipse cx="200" cy="180" rx="160" ry="100" fill="#2244aa" opacity="0.5"/>
    <ellipse cx="200" cy="180" rx="130" ry="80" fill="#3366cc" opacity="0.4"/>
    <ellipse cx="200" cy="180" rx="90" ry="55" fill="#4488ee" opacity="0.35"/>
    <rect x="320" y="120" width="320" height="80" fill="#333" rx="8"/>
    <rect x="200" y="148" width="560" height="24" fill="#555" rx="4"/>
    <rect x="440" y="60" width="80" height="200" fill="#444" rx="4"/>
    <rect x="400" y="80" width="160" height="30" fill="#555" rx="3"/>
    <rect x="400" y="170" width="160" height="30" fill="#555" rx="3"/>
    {[[325,125],[345,125],[365,125],[385,125],[325,145],[345,145],[365,145],[385,145]].map(([x,y],i)=>
      <rect key={i} x={x} y={y} width="12" height="12" fill={['#88aaff','#aaccff','#6688ff'][i%3]} opacity="0.7" rx="1"/>)}
    <rect x="0" y="370" width="960" height="110" fill="#1a1a2a"/>
    <rect x="0" y="364" width="960" height="14" fill="#2a2a3a"/>
    <rect x="200" y="340" width="4" height="40" fill="#666"/>
    <rect x="756" y="340" width="4" height="40" fill="#666"/>
  </>;
}

function JungleScene() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#0d2a0d"/>
    <rect x="0" y="0" width="960" height="300" fill="#0a1f0a" opacity="0.9"/>
    <rect x="0" y="80" width="960" height="200" fill="#1a3a1a" opacity="0.6"/>
    <ellipse cx="480" cy="120" rx="200" ry="80" fill="#2d6e2d" opacity="0.5"/>
    {[[0,200],[80,160],[160,180],[240,150],[320,170],[400,145],[480,160],[560,148],[640,165],[720,155],[800,170],[880,150],[960,180]].map(([x,y],i)=>
      <path key={i} d={`M${x},${y} Q${x+30},${y-60} ${x+60},${y}`} fill="#1e5c1e" opacity="0.8"/>)}
    {[[60,0],[200,30],[380,10],[520,0],[700,20],[880,5]].map(([x,y],i)=>
      <rect key={i} x={x} y={y} width="20" height="220" fill="#2a1200" opacity="0.8"/>)}
    {[[60,0],[200,30],[380,10],[520,0],[700,20],[880,5]].map(([x,y],i)=>
      <ellipse key={i} cx={x+10} cy={y+20} rx="55" ry="60" fill="#2d7a2d" opacity="0.75"/>)}
    <rect x="0" y="360" width="960" height="120" fill="#1a3a0a"/>
    <rect x="0" y="354" width="960" height="15" fill="#2a4a15"/>
    {[80,200,350,500,660,800].map((x,i)=>
      <ellipse key={i} cx={x} cy={365} rx="30" ry="8" fill="#3a5a1a" opacity="0.6"/>)}
  </>;
}

function ArcadeScene() {
  return <>
    <rect x="0" y="0" width="960" height="480" fill="#0a0010"/>
    {[[0,0,960,480,0.15],[50,50,860,380,0.1]].map(([x,y,w,h,o],i)=>
      <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke="#ff00ff" strokeWidth="1" opacity={o}/>)}
    {[0,80,160,240,320,400,480,560,640,720,800,880,960].map((x,i)=>
      <line key={i} x1={x} y1="0" x2={x} y2="480" stroke="#330033" strokeWidth="0.5"/>)}
    {[0,80,160,240,320,400,480].map((y,i)=>
      <line key={i} x1="0" y1={y} x2="960" y2={y} stroke="#330033" strokeWidth="0.5"/>)}
    {[[100,80,80,120],[250,60,100,100],[400,90,70,110],[600,70,90,115],[750,80,85,105],[880,60,75,100]].map(([x,y,w,h],i)=>
      <rect key={i} x={x} y={y} width={w} height={h} fill={['#1a001a','#001a1a','#1a1a00'][i%3]} stroke={['#ff00ff','#00ffff','#ffff00'][i%3]} strokeWidth="1.5" rx="4" opacity="0.8"/>)}
    <rect x="0" y="350" width="960" height="130" fill="#0d0020"/>
    <rect x="0" y="344" width="960" height="14" fill="#1a0030"/>
    <rect x="0" y="344" width="960" height="4" fill="#ff00ff" opacity="0.5"/>
    {[0,40,80,120,160,200,240,280,320,360,400,440,480,520,560,600,640,680,720,760,800,840,880,920].map((x,i)=>
      <rect key={i} x={x} y={346} width="30" height="3" fill={['#ff00ff','#00ffff','#ffff00'][i%3]} opacity="0.6"/>)}
  </>;
}

const SCENES = {
  backyard: { label: 'Backyard Sunset', component: BackyardSunset },
  moon:     { label: 'On the Moon',     component: MoonScene },
  neon:     { label: 'Neon City',       component: NeonCityScene },
  beach:    { label: 'Tropical Beach',  component: BeachScene },
  space:    { label: 'Space Station',   component: SpaceStationScene },
  jungle:   { label: 'Jungle Temple',   component: JungleScene },
  arcade:   { label: 'Retro Arcade',    component: ArcadeScene },
  video:    { label: 'Full Screen Video', component: null },
  visualizer: { label: 'Audio Visualizer', component: null },
};

export { PLAYER_COLORS, SCENES };

export default function GameScene({ players = [], scene = 'backyard' }) {
  const activePlayers = players.slice(0, 6);
  const stageLeft = 185, stageRight = 775, stageY = 328;
  const spacing = activePlayers.length > 1 ? (stageRight - stageLeft) / (activePlayers.length - 1) : 0;

  // Find leader — player with highest score
  const maxScore = Math.max(...activePlayers.map(p => p.score || 0), 0);
  const leaderId = maxScore > 0 ? activePlayers.find(p => (p.score || 0) === maxScore)?.id : null;

  const SceneBackground = SCENES[scene]?.component || BackyardSunset;

  // Visualizer scene
  if (scene === 'visualizer') {
    return (
      <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <AudioVisualizer active={true} width={960} height={480} color="#00ff88" />
        </div>
        <svg width="100%" viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', position: 'relative', zIndex: 1 }}>
          <rect x="0" y="0" width="960" height="480" fill="transparent"/>
          <rect x="155" y="353" width="650" height="45" fill="#0a1a0a" rx="4" opacity="0.8"/>
          <rect x="155" y="348" width="650" height="14" fill="#0d240d" rx="3" opacity="0.8"/>
          {activePlayers.map((p, i) => {
            const x = activePlayers.length === 1 ? 480 : stageLeft + i * spacing;
            return <Dancer key={p.id} x={x} y={stageY} color={p.color || PLAYER_COLORS[i]}
              move={p.move || 'default'} motion={p.motion}
              label={`P${i+1}`} connected={p.connected}
              isLeader={leaderId && p.id === leaderId}/>;
          })}
        </svg>
        <div style={{ width: '100%', paddingBottom: '50%' }}/>
      </div>
    );
  }

  // Video scene: no background SVG — YouTube video fills the screen
  if (scene === 'video') {
    return (
      <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
        <svg width="100%" viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
          {/* Dancers only — no background, video shows through */}
          <rect x="0" y="0" width="960" height="480" fill="transparent"/>
          {activePlayers.map((p, i) => {
            const x = activePlayers.length === 1 ? 480 : stageLeft + i * spacing;
            return (
              <Dancer key={p.id} x={x} y={stageY} color={p.color || PLAYER_COLORS[i]}
                move={p.move || 'default'} motion={p.motion}
                label={`P${i + 1}`} connected={p.connected}
                isLeader={leaderId && p.id === leaderId}/>
            );
          })}
        </svg>
        <div style={{ width: '100%', paddingBottom: '50%' }}/>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      <svg width="100%" viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>

        <SceneBackground />

        {/* STAGE PLATFORM — consistent across all scenes */}
        <rect x="155" y="353" width="650" height="45" fill="#4a2e10" rx="4" opacity="0.95"/>
        <rect x="155" y="348" width="650" height="14" fill="#6b4420" rx="3" opacity="0.95"/>
        <rect x="155" y="348" width="650" height="5" fill="#8a5a2a" opacity="0.5"/>
        {[170,370,570,770].map(x => <rect key={x} x={x} y="396" width="18" height="28" fill="#3a2208"/>)}

        {/* PROJECTOR SCREEN */}
        <rect x="418" y="62" width="3" height="290" fill="#555"/>
        <rect x="539" y="62" width="3" height="290" fill="#555"/>
        <rect x="305" y="62" width="350" height="9" fill="#666" rx="2"/>
        <rect x="305" y="200" width="350" height="9" fill="#666" rx="2"/>
        <rect x="310" y="70" width="340" height="138" fill="#111" rx="6"/>
        <rect x="318" y="77" width="324" height="124" fill="#05050f" rx="3"/>

        {/* SPOTLIGHTS */}
        <ellipse cx="270" cy="356" rx="35" ry="8" fill="#f5a623" opacity="0.12"/>
        <ellipse cx="480" cy="356" rx="35" ry="8" fill="#f5a623" opacity="0.12"/>
        <ellipse cx="690" cy="356" rx="35" ry="8" fill="#f5a623" opacity="0.12"/>

        {/* DANCERS */}
        {activePlayers.length === 0 ? (
          <text x="480" y="338" textAnchor="middle" fontFamily="sans-serif" fontSize="13" fill="#555">Waiting for players...</text>
        ) : (
          activePlayers.map((p, i) => {
            const x = activePlayers.length === 1 ? 480 : stageLeft + i * spacing;
            return (
              <Dancer
                key={p.id}
                x={x}
                y={stageY}
                color={p.color || PLAYER_COLORS[i]}
                move={p.move || 'default'}
                motion={p.motion}
                label={`P${i + 1}`}
                connected={p.connected}
                isLeader={leaderId && p.id === leaderId}
              />
            );
          })
        )}

        {/* Scene label */}
        <rect x="14" y="14" width="140" height="22" fill="#000" opacity="0.5" rx="4"/>
        <text x="22" y="29" fontFamily="sans-serif" fontSize="10" fill="#888">{SCENES[scene]?.label || 'Backyard'}</text>
      </svg>
    </div>
  );
}
