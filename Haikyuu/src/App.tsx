/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { GBAFrame } from './components/GBAFrame';
import { VolleyballRenderer } from './components/VolleyballRenderer';
import { audio } from './components/AudioEngine';
import { GameState, Ball, Character, Particle } from './types';
import { Trophy, RefreshCw, Star, Info, Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';

const RESOLUTION = { width: 512, height: 384 };

function calculateLandingSteps(z: number, vz: number, gravity: number = 0.075): number {
  let tempZ = z;
  let tempVz = vz;
  let steps = 0;
  while (tempZ > 0 && steps < 500) {
    tempZ += tempVz;
    tempVz -= gravity;
    steps++;
  }
  return steps || 1;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game-state managed fully
  const [gameState, setGameState] = useState<GameState>('TITLE_SCREEN');
  const [savesCount, setSavesCount] = useState<number>(0);
  const [pointPlayer, setPointPlayer] = useState<number>(0);
  const [pointEnemy, setPointEnemy] = useState<number>(0);
  const [windX, setWindX] = useState<number>(0);
  const [hudPulse, setHudPulse] = useState<boolean>(false);
  const [stamina, setStamina] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [dialogText, setDialogText] = useState<string>(
    'Press START or [M] Key / [Z] Key to begin your legendary volleyball RPG quest!'
  );
  const [activeDialogIndex, setActiveDialogIndex] = useState<number>(0);
  const [powerOn, setPowerOn] = useState<boolean>(true);
  const [infoBanner, setInfoBanner] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // Internal states using Ref for high-performance zero-delay loop updating
  const playerRef = useRef<Character>({
    id: 'shoyo',
    name: 'Shoya Hinata',
    role: 'PLAYER',
    x: 256,
    y: 320,
    width: 24,
    height: 38,
    state: 'IDLE',
    animFrame: 0,
    animTimer: 0,
    facing: 'UP',
    jerseyColor: '#1e272e', // Karasuno Black
    hairColor: '#ff7f50',  // Orange hair
    hairStyle: 'SPIKY',
    stats: { speed: 3.2, reception: 85, jump: 95, spike: 90 }
  });

  const partnerRef = useRef<Character>({
    id: 'partner',
    name: 'Tobio Kageyama',
    role: 'PARTNER',
    x: 150,
    y: 280,
    width: 24,
    height: 38,
    state: 'IDLE',
    animFrame: 0,
    animTimer: 0,
    facing: 'UP',
    jerseyColor: '#000', // Adlers Black
    hairColor: '#1e272e',  // black hair
    hairStyle: 'FLAT',
    stats: { speed: 2.4, reception: 70, jump: 80, spike: 75 }
  });

  const enemyChefRef = useRef<Character>({
    id: 'kōrai',
    name: 'Kōrai Hoshiumi',
    role: 'BOSS',
    x: 256,
    y: 100,
    width: 26,
    height: 40,
    state: 'INTRO',
    animFrame: 0,
    animTimer: 0,
    facing: 'DOWN',
    jerseyColor: '#40e0d0', // Aoba johsai high school uniform
    hairColor: '#ffffff',  // stellar white hair!
    hairStyle: 'SPIKY',
    stats: { speed: 2.8, reception: 96, jump: 99, spike: 100 }
  });

  const enemyPartnerRef = useRef<Character>({
    id: 'oikawa',
    name: 'Oikawa Tooru',
    role: 'OPPONENT_2',
    x: 350,
    y: 110,
    width: 24,
    height: 38,
    state: 'IDLE',
    animFrame: 0,
    animTimer: 0,
    facing: 'DOWN',
    jerseyColor: '#40e0d0', // Aoba johsai high school uniform
    hairColor: '#352620',  // dark chocolate brown
    hairStyle: 'WAVY',
    stats: { speed: 2.8, reception: 92, jump: 88, spike: 95 }
  });

  // Ball & lists
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Game control references
  const inputRef = useRef<'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null>(null);
  const timeRef = useRef<number>(0);
  const neededSaves = 10;
  
  // Volleyball play track states (L2 2v2 sequence state)
  // Phases: 'READY_SERVE' | 'BALL_IN_AIR' | 'PLAYER_RECEIVE' | 'PARTNER_SET' | 'SPIKE_OPPORTUNITY' | 'OPPONENT_RECOVERY'
  const volleyballPhaseRef = useRef<string>('READY_SERVE');
  const staminaRef = useRef<number>(100);
  const servedByOpponentRef = useRef<boolean>(true);
  const shakeIntensityRef = useRef<number>(0);

  // Launch a ball in Level 1
  const spawnLevel1Ball = () => {
    ballsRef.current = []; // clean existing
    const isSpecial = Math.random() > 0.4;
    const types: Ball['type'][] = ['FAST', 'CURVE', 'KNUCKLE', 'DECELERATING', 'FLOAT', 'NORMAL'];
    const chosenType = isSpecial ? types[Math.floor(Math.random() * 5)] : 'NORMAL';

    // Set target zone in our bottom half
    const targetX = 64 + Math.random() * (RESOLUTION.width - 128);
    const targetY = 210 + Math.random() * 75; // Comfortable within the player's 180-290 playable court!

    // Boss jump serve animation
    const boss = enemyChefRef.current;
    boss.state = 'SPIKING';
    let altitude = 0;
    let up = true;
    (boss as any).z = 0;
    const jumpTimer = setInterval(() => {
      if (up) {
        altitude += 4;
        (boss as any).z = altitude;
        if (altitude >= 40) {
          up = false;
        }
      } else {
        altitude -= 4;
        (boss as any).z = altitude;
        if (altitude <= 0) {
          (boss as any).z = 0;
          boss.state = 'IDLE';
          clearInterval(jumpTimer);
        }
      }
    }, 16);


    let infoText = 'Kōrai Hoshiumi serves a high sky ball... get ready!';
    if (chosenType === 'FAST') infoText = '⚠️ WARNING: Hoshiumi launches an insane high-speed Jump serve!';
    if (chosenType === 'CURVE') infoText = '⚠️ WARNING: Hoshiumi strikes a Jump float serve!';
    if (chosenType === 'KNUCKLE') infoText = '⚠️ WARNING: Hoshiumi feeds a Topspin serve!';
    if (chosenType === 'DECELERATING') infoText = '⚠️ WARNING: Hoshiumi issues a deceptive slow Underhand serve!';

    setInfoBanner('');
    setDialogText(infoText);
    audio.playHit();

    // 1. Spawn a cosmetic volleyball rising straight up into the air and off the top edge of the screen!
    const launchBall: Ball = {
      id: 'launch_' + Math.random().toString(),
      x: enemyChefRef.current.x,
      y: enemyChefRef.current.y,
      z: 40,
      vx: (Math.random() - 0.5) * 1.0,
      vy: -2.8, // moves slower up the screen (was -5.0)
      vz: 8.0, // gentle 3D trajectory (was 15.0)
      type: 'NORMAL',
      targetX: enemyChefRef.current.x,
      targetY: -100,
      shadowY: -100,
      isCosmeticRise: true,
      received: false,
      missed: false,
      hasBounced: false
    };
    ballsRef.current = [launchBall];

    // 2. Playable ball descends from the heavens after a random millisecond delay!
    const delayMs = 450 + Math.random() * 600; // random millisecond delay
    setTimeout(() => {
      // Clear the cosmetic ball and load the real playable descending sky ball
      const steps = calculateLandingSteps(240, -0.4, 0.045);
      const velocityX = (targetX - enemyChefRef.current.x) / steps;
      const velocityY = (targetY - enemyChefRef.current.y) / steps;

      const playableBall: Ball = {
        id: Math.random().toString(),
        x: enemyChefRef.current.x,
        y: enemyChefRef.current.y,
        z: 240, // high starting altitude
        vx: velocityX,
        vy: velocityY,
        vz: -0.4, // descending slower (was -1.0)
        type: chosenType,
        targetX,
        targetY,
        shadowY: targetY,
        received: false,
        missed: false,
        hasBounced: false,
        hideShadow: true,
        curvePhase: chosenType === 'CURVE' ? Math.random() * 10 : undefined,
        curveSpeed: chosenType === 'CURVE' ? 0.05 + Math.random() * 0.03 : undefined
      };

      ballsRef.current = [playableBall];
    }, delayMs);
  };

  // Launch serve in Level 2
  const spawnLevel2Ball = (servedByOpponent: boolean) => {
    ballsRef.current = [];
    setInfoBanner('');
    servedByOpponentRef.current = servedByOpponent;

    staminaRef.current = 100;
    setStamina(100);

    // Randomize the Level 2 wind vector at each serve
    const newWind = (Math.random() - 0.5) * 0.2; // Value between -0.10 and +0.10
    setWindX(newWind);

    // Dynamic reset of positions for standard clean rally start
    playerRef.current.x = 220;
    playerRef.current.y = 240; // Mid/front court positioning (perfect cover for 215-280 range)
    playerRef.current.state = 'IDLE';
    (playerRef.current as any).z = 0;
    (playerRef.current as any).vz = 0;

    partnerRef.current.x = 120;
    partnerRef.current.y = 235; // Mid/front court positioning
    partnerRef.current.state = 'IDLE';
    (partnerRef.current as any).z = 0;

    enemyChefRef.current.x = 220;
    enemyChefRef.current.y = 130;
    enemyChefRef.current.state = 'IDLE';
    (enemyChefRef.current as any).z = 0;

    enemyPartnerRef.current.x = 330;
    enemyPartnerRef.current.y = 135;
    enemyPartnerRef.current.state = 'IDLE';
    (enemyPartnerRef.current as any).z = 0;

    const targetX = servedByOpponent ? 70 + Math.random() * 125 : 280 + Math.random() * 135;
    const targetY = servedByOpponent ? 215 + Math.random() * 65 : 120 + Math.random() * 35; // Constrained within player beach court range!

    const server = servedByOpponent ? enemyChefRef.current : playerRef.current;
    if (servedByOpponent) {
      const boss = enemyChefRef.current;
      boss.state = 'SPIKING';
      let altitude = 0;
      let up = true;
      (boss as any).z = 0;
      const jumpTimer = setInterval(() => {
        if (up) {
          altitude += 4;
          (boss as any).z = altitude;
          if (altitude >= 40) {
            up = false;
          }
        } else {
          altitude -= 4;
          (boss as any).z = altitude;
          if (altitude <= 0) {
            (boss as any).z = 0;
            boss.state = 'IDLE';
            clearInterval(jumpTimer);
          }
        }
      }, 16);
      setDialogText('Oikawa Tooru serves over the beach net!');

    } else {
      playerRef.current.state = 'SPIKING';
      setTimeout(() => {
        playerRef.current.state = 'IDLE';
      }, 500);
      setDialogText('Shoyo serves gracefully toward Argentina team!');
    }

    audio.playHit();

    // Randomised float/curve/knuckle serves when served by Korai
    const serves: Ball['type'][] = ['NORMAL', 'KNUCKLE', 'FLOAT', 'CURVE'];
    const chosenType = servedByOpponent ? serves[Math.floor(Math.random() * serves.length)] : 'NORMAL';

    const steps = calculateLandingSteps(120, 4.2); // Slower starting flight (was 6.5)
    const vx = (targetX - server.x) / steps;
    const vy = (targetY - server.y) / steps;

    const newBall: Ball = {
      id: Math.random().toString(),
      x: server.x,
      y: server.y,
      z: 120,
      vx,
      vy,
      vz: 4.2, // Slower flight (was 6.5)
      type: chosenType,
      targetX,
      targetY,
      shadowY: targetY,
      received: false,
      missed: false,
      hasBounced: false,
      isServedBall: true,
      isSpikedByOpponent: false
    };

    ballsRef.current.push(newBall);
    volleyballPhaseRef.current = 'BALL_IN_AIR';
  };

  // Sound switch
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMute(nextMuted);
  };

  // Standard dialog navigation for intros
  const handleNextDialog = () => {
    audio.playSelect();
    if (gameState === 'INTRO') {
      if (activeDialogIndex === 0) {
        setDialogText(
          'Hinata Shoyo, known as the "Ninja Shoyo", took his talents to the sand courts of Brazil to harden his movements and timing. (Press [M] or [Z] to read next)'
        );
        setActiveDialogIndex(1);
      } else if (activeDialogIndex === 1) {
        setDialogText(
          'Before the sunny beaches of Rio, he must pass  Kōrai Hoshiumi heavy server drills! CONTROLS: Move in all directions with WASD or ARROWS. Receive/Read with [M] or [Z]! (Press [M] / [Z] to start Level 1)'
        );
        setActiveDialogIndex(2);
      } else {
        startTransition(() => {
          setGameState('LEVEL_1_START');
        });
      }
    } else if (gameState === 'LEVEL_1_START') {
      startTransition(() => {
        setGameState('LEVEL_1_PLAY');
        setSavesCount(0);
        setDialogText('Round 1: VOLLEYBALL COURT DRILLS! Move forward/backward/left/right with WASD / Arrows. Press [M] or [Z] when the ball enters your target shadow to receive!');
        audio.playBGM('LEVEL_1');
        setTimeout(() => spawnLevel1Ball(), 1500);
      });
    } else if (gameState === 'LEVEL_1_SUCCESS') {
      startTransition(() => {
        setGameState('LEVEL_2_START');
        setDialogText(
          'ROUND 2: Ipanema Beach! Move with WASD / Arrows. JUMP with Spacebar / B, then SPIKE / RECEIVE with [M] or [Z]! (Press [M] / [Z] to enter Beach!)'
        );
      });
    } else if (gameState === 'LEVEL_2_START') {
      startTransition(() => {
        setGameState('LEVEL_2_PLAY');
        setPointPlayer(0);
        setPointEnemy(0);
        staminaRef.current = 100;
        setStamina(100);
        const initialWind = (Math.random() - 0.5) * 0.7;
        setWindX(initialWind);
        volleyballPhaseRef.current = 'READY_SERVE';
        setDialogText('Rio de Janeiro Sands! Move with WASD / Arrows. Jump with Spacebar / B. Bump or Spike with [M] or [Z] key when close to the ball!');
        audio.playBGM('LEVEL_2');
        setTimeout(() => spawnLevel2Ball(true), 1200);
      });
    } else if (gameState === 'LEVEL_2_SUCCESS' || gameState === 'GAME_OVER') {
      startTransition(() => {
        setGameState('TITLE_SCREEN');
        setDialogText('Press START or [M] / [Z] Key to begin your legendary volleyball RPG quest!');
        audio.playBGM('TITLE');
      });
    }
  };

  // Hardware controls callback mapper
  const handleButtonPress = (btn: 'A' | 'B' | 'START' | 'SELECT') => {
    if (!powerOn) return;

    if (btn === 'START' || btn === 'SELECT') {
      if (gameState === 'TITLE_SCREEN') {
        audio.playSelect();
        startTransition(() => {
          setGameState('INTRO');
          setDialogText(
            'Welcome, young challenger! Shoyo Hinata is ready to step on the grand court of volleyball destiny!'
          );
          setActiveDialogIndex(0);
        });
        audio.playBGM('TITLE');
        return;
      }
    }

    if (btn === 'A') {
      if (
        gameState === 'INTRO' ||
        gameState === 'LEVEL_1_START' ||
        gameState === 'LEVEL_1_SUCCESS' ||
        gameState === 'LEVEL_2_START' ||
        gameState === 'LEVEL_2_SUCCESS' ||
        gameState === 'GAME_OVER'
      ) {
        handleNextDialog();
        return;
      }

      if (gameState === 'TITLE_SCREEN') {
        audio.playSelect();
        startTransition(() => {
          setGameState('INTRO');
          setDialogText(
            'Welcome, young challenger! Shoyo Hinata is ready to step on the grand court of volleyball destiny!'
          );
          setActiveDialogIndex(0);
        });
        audio.playBGM('TITLE');
        return;
      }

      // Timing receive triggers during play
      if (gameState === 'LEVEL_1_PLAY') {
        const p = playerRef.current;
        if (p.state === 'IDLE' || p.state === 'RUNNING') {
          p.state = 'RECEIVING';
          p.animTimer = 0;
          setTimeout(() => {
            if (p.state === 'RECEIVING') p.state = 'IDLE';
          }, 360);
        }
      }

      // Beach play primary receive or spike A-button press
      if (gameState === 'LEVEL_2_PLAY') {
        const p = playerRef.current;
        const currentZ = (p as any).z || 0;
        
        // Spike when player jumped and is high in the air!
        if (currentZ > 10) {
          p.state = 'SPIKING';
          setTimeout(() => {
            if (p.state === 'SPIKING') p.state = 'IDLE';
          }, 450);
        } else if (p.state === 'IDLE' || p.state === 'RUNNING') {
          p.state = 'RECEIVING';
          p.animTimer = 0;
          setTimeout(() => {
            if (p.state === 'RECEIVING') p.state = 'IDLE';
          }, 420);
        }
      }
    }

    if (btn === 'B') {
      // Trigger Jump action on beach using B button
      if (gameState === 'LEVEL_2_PLAY') {
        const p = playerRef.current;
        const currentZ = (p as any).z || 0;
        if (currentZ === 0) {
          if (staminaRef.current < 20) {
            setDialogText('Too exhausted to jump! Stand still for a moment to catch your breath!');
            return;
          }
          audio.playJump();
          p.state = 'JUMPING';
          (p as any).z = 1.0; // immediately set small elevation to track jumping state
          (p as any).vz = 3.6; // initial vertical upward velocity
          staminaRef.current = Math.max(0, staminaRef.current - 25);
          setStamina(Math.round(staminaRef.current));
        }
      }
    }
  };

  // Process D-pad callbacks to trigger keyboard emulator changes
  const handleDpadPress = (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null) => {
    inputRef.current = direction;
    if (direction && powerOn) {
      if (Math.random() > 0.7) audio.playMoveTick();
    }
  };

  // Central 2D Game Frame update runner
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      timeRef.current += 1;
      const time = timeRef.current;

      // 1. Draw relative level backgrounds
      ctx.clearRect(0, 0, RESOLUTION.width, RESOLUTION.height);

      ctx.save();
      if (shakeIntensityRef.current > 0.1) {
        const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
        const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
        ctx.translate(dx, dy);
        shakeIntensityRef.current *= 0.88; // decay
      }

      if (
        gameState === 'TITLE_SCREEN' ||
        gameState === 'INTRO' ||
        gameState === 'LEVEL_1_START'
      ) {
        // Red render title card elements
        VolleyballRenderer.drawLevel1Background(
          ctx,
          RESOLUTION.width,
          RESOLUTION.height,
          time
        );

        // Dark banner screens
        ctx.fillStyle = 'rgba(15, 18, 26, 0.85)';
        ctx.fillRect(0, 0, RESOLUTION.width, RESOLUTION.height);

        // Majestic pixel grid logos
        ctx.fillStyle = '#ff7f50';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡️ VOLLEYBALL RETRO RPG ⚡', RESOLUTION.width / 2, 100);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(RESOLUTION.width / 2 - 160, 115, 320, 1);

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fffa65';
        ctx.fillText('NINJA SHOYO\'S BEACH ROAD QUEST', RESOLUTION.width / 2, 130);

        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = '#f1f2f6';
        ctx.fillText('Venture through timing drills and sandy matches!', RESOLUTION.width / 2, 160);

        // draw an animated cute sprite inside title
        const miniShoyo: Character = {
          id: 'mini',
          name: 'Shoyo',
          role: 'PLAYER',
          x: RESOLUTION.width / 2,
          y: 220,
          width: 24,
          height: 38,
          state: 'VICTORY',
          animFrame: 0,
          animTimer: 0,
          facing: 'DOWN',
          jerseyColor: '#1e272e',
          hairColor: '#ff7f50',
          hairStyle: 'SPIKY',
          stats: { speed: 5, reception: 90, jump: 90, spike: 90 }
        };
        VolleyballRenderer.drawCharacter(ctx, miniShoyo, time);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "JetBrains Mono", monospace';
        if ((time / 30) % 2 | 0) {
          ctx.fillText('▶ PRESS START OR CLICK BUTTONS TO START ◀', RESOLUTION.width / 2, 280);
        }
      } else if (gameState === 'LEVEL_1_PLAY') {
        VolleyballRenderer.drawLevel1Background(
          ctx,
          RESOLUTION.width,
          RESOLUTION.height,
          time
        );

        // Update player coordinates
        const player = playerRef.current;
        const speedMultiplier = 1.0; 
        
        let moved = false;
        if (inputRef.current === 'LEFT') {
          player.x = Math.max(50, player.x - player.stats.speed * speedMultiplier);
          moved = true;
        } else if (inputRef.current === 'RIGHT') {
          player.x = Math.min(RESOLUTION.width - 50, player.x + player.stats.speed * speedMultiplier);
          moved = true;
        } else if (inputRef.current === 'UP') {
          player.y = Math.max(180, player.y - player.stats.speed * speedMultiplier);
          moved = true;
        } else if (inputRef.current === 'DOWN') {
          player.y = Math.min(RESOLUTION.height - 30, player.y + player.stats.speed * speedMultiplier);
          moved = true;
        }

        if (moved) {
          if (player.state === 'IDLE' || player.state === 'RUNNING') {
            player.state = 'RUNNING';
          }
        } else {
          if (player.state === 'RUNNING') player.state = 'IDLE';
        }

    
        // Make the boss dynamically walk side-to-side before serving so he's not a static standing tower!
        const boss = enemyChefRef.current;
        const isJumping = (boss as any).z > 0 || boss.state === 'SPIKING';
        if (isJumping) {
          // Do not interrupt his jump serve animation!
        } else if (ballsRef.current.length === 0) {
          boss.state = 'RUNNING';
          boss.x = 256 + Math.sin(time * 0.045) * 60; // dynamic walking back and forth waiting to serve!
        } else {
          // Watch the ball and follow it slightly
          const activeBall = ballsRef.current[0];
          if (activeBall && !activeBall.received) {
            const dx = activeBall.x - boss.x;
            if (Math.abs(dx) > 10) {
              boss.state = 'RUNNING';
              boss.x += Math.sign(dx) * 0.30;
            } else {
              boss.state = 'IDLE';
            }
          } else {
            boss.state = 'IDLE';
          }
        }

        // Draw Kōrai Hoshiumi Boss at top
        VolleyballRenderer.drawCharacter(ctx, boss, time);

        // Draw Player at bottom
        VolleyballRenderer.drawCharacter(ctx, player, time);

        // Update levels ball coordinates
        ballsRef.current.forEach((ball) => {
          if (ball.isCosmeticRise) {
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.z += ball.vz;
            ball.vz -= 0.08; // slower gravity deceleration

            VolleyballRenderer.drawVolleyball(ctx, ball, time);
            return;
          }

          if (!ball.received && !ball.missed) {
            // Continuous frame receive check
            if (player.state === 'RECEIVING') {
              const dist = Math.hypot(player.x - ball.x, player.y - ball.y);
              const heightValid = ball.z <= 40 && ball.z >= 0;
              const distValid = dist < 45;

              if (heightValid && distValid) {
                ball.received = true;
                audio.playSave();
                
                // Spurt high perfect ball in air
                ball.vx = 0;
                ball.vy = 0;
                ball.vz = 5.0;

                // Spark particles
                for (let i = 0; i < 15; i++) {
                  particlesRef.current.push({
                    id: Math.random().toString(),
                    x: ball.x,
                    y: ball.y - ball.z,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 4 - 2,
                    color: '#ffc048',
                    size: 3,
                    life: 30,
                    maxLife: 30,
                    type: 'SPARK'
                  });
                }

                // Text score feedback
                let scoreLabel = 'GREAT!';
                let emoteColor = '#fffa65';
                if (ball.z <= 15 && dist < 15) {
                  scoreLabel = '✨ PERFECT SAVE! ✨';
                  emoteColor = '#1dd1a1';
                }

                const receivePhrases = ['One touch', 'Rolling thunder', 'I got your back'];
                const randomReceive = receivePhrases[Math.floor(Math.random() * receivePhrases.length)];

                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: player.x,
                  y: player.y - 40,
                  vx: 0,
                  vy: -0.5,
                  color: '#ffffff',
                  size: 10,
                  life: 45,
                  maxLife: 45,
                  type: 'EMOTE',
                  label: randomReceive
                });

                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: ball.x,
                  y: ball.y - ball.z - 20,
                  vx: 0,
                  vy: -0.6,
                  color: emoteColor,
                  size: 10,
                  life: 45,
                  maxLife: 45,
                  type: 'EMOTE',
                  label: scoreLabel
                });

                setSavesCount((prev) => {
                  const next = prev + 1;
                  if (next >= neededSaves) {
                    setTimeout(() => {
                      audio.playChime();
                      startTransition(() => {
                        setGameState('LEVEL_1_SUCCESS');
                        setDialogText('Incredible! You saved 10 heavy serves with majestic precision! You are ready for the real Beach volleyball!');
                      });
                    }, 1200);
                  } else {
                    setTimeout(() => spawnLevel1Ball(), 1500);
                  }
                  return next;
                });
              }
            }

            // Apply physics
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.z += ball.vz;
            ball.vz -= 0.045; // significantly slower, gentle gravity for beautiful timing challenge!

            // Special curving traits and sudden direction shift (float / wobble)
            if (ball.type === 'CURVE' && ball.curvePhase !== undefined && ball.curveSpeed !== undefined) {
              ball.curvePhase += ball.curveSpeed;
              ball.x += Math.sin(ball.curvePhase) * 1.2;
            } else if ((ball.type === 'KNUCKLE' || ball.type === 'FLOAT') && !ball.received && !ball.missed) {
              // Sudden direction shift / Float effect
              if (time % 20 === 0) {
                const shiftX = (Math.random() - 0.5) * 1.8;
                ball.vx += shiftX;
                ball.targetX = (ball.targetX || ball.x) + shiftX * 22; // update predictive landing circle spot!
                
                // Spawn wind traces to represent the float wobble
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: ball.x,
                  y: ball.y - ball.z,
                  vx: -shiftX * 0.4,
                  vy: 0.2,
                  color: 'rgba(255, 255, 255, 0.5)',
                  size: 2,
                  life: 15,
                  maxLife: 15,
                  type: 'SPARK'
                });
              }
            }

            // check missed floor limit
            if (ball.z <= -10) {
              ball.missed = true;
              audio.playMiss();
              
              // camera earthquake shake style particles
              for (let i = 0; i < 12; i++) {
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: ball.x + (Math.random() - 0.5) * 10,
                  y: ball.shadowY,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -Math.random() * 2,
                  color: '#eb4d4b',
                  size: 2,
                  life: 20,
                  maxLife: 20,
                  type: 'SPARK'
                });
              }

              const missEmojis = ['😭', '🤦‍♂️', '🙀', '💔', '❌', '😓', '🙄', '😱', '💥', '🌧️', '💨'];
              const randomEmoji1 = missEmojis[Math.floor(Math.random() * missEmojis.length)];

              particlesRef.current.push({
                id: Math.random().toString(),
                x: player.x,
                y: player.y - 40,
                vx: 0, vy: -0.5,
                color: '#eb4d4b',
                size: 14,
                life: 50,
                maxLife: 50,
                type: 'EMOTE',
                label: ` ${randomEmoji1} `
              });

              setDialogText('Kōrai Hoshiumi: The little giant is serving crazzzy. Move faster, Shoyo!');
              player.state = 'STUNNED';
              setTimeout(() => {
                player.state = 'IDLE';
                // relaunch next feed
                spawnLevel1Ball();
              }, 1600);
            }
          } else if (ball.received) {
            // physics after saves
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.z += ball.vz;
            ball.vz -= 0.25;

            if (ball.z <= 0) {
              // ball finished arch
              ball.received = false;
              ball.missed = true;
            }
          }

          VolleyballRenderer.drawVolleyball(ctx, ball, time);
        });

      } else if (gameState === 'LEVEL_1_SUCCESS') {
        VolleyballRenderer.drawLevel1Background(
          ctx,
          RESOLUTION.width,
          RESOLUTION.height,
          time
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, RESOLUTION.width, RESOLUTION.height);

        // Success dialog panel
        ctx.fillStyle = '#ffeaa7';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 LEVEL 1 PRACTICE COMPLETED! 🏆', RESOLUTION.width / 2, 100);

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText('10 BALLS SUCCESSFULLY RECEIVED!', RESOLUTION.width / 2, 130);

        // Draw celebrating players
        playerRef.current.state = 'VICTORY';
        playerRef.current.x = RESOLUTION.width / 2;
        VolleyballRenderer.drawCharacter(ctx, playerRef.current, time);

        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press [M Key] / [Z Key] to fly to Brazil Beach Round 2!', RESOLUTION.width / 2, 280);

      } else if (gameState === 'LEVEL_2_PLAY') {
        // Beach sand 2v2 environment background
        VolleyballRenderer.drawLevel2Background(
          ctx,
          RESOLUTION.width,
          RESOLUTION.height,
          time
        );

        const player = playerRef.current;
        const partner = partnerRef.current;
        const boss = enemyChefRef.current;
        const opp2 = enemyPartnerRef.current;

        // Sand hard movement friction (Slow down by 35% compared to practice)
        // Beach Sand modifier creates sand dust behind feet coordinates
        // If stamina is under 25, apply fatigue slowdown!
        const isFatigued = staminaRef.current < 25;
        const sandSpeedMultiplier = isFatigued ? 0.38 : 0.65;

        // Player inputs
        let movedL2 = false;
        if (inputRef.current === 'LEFT') {
          player.x = Math.max(65, player.x - player.stats.speed * sandSpeedMultiplier);
          movedL2 = true;
          // sand puffs
          particlesRef.current.push({
            id: Math.random().toString(),
            x: player.x,
            y: player.y + 16,
            vx: 1 + Math.random() * 2,
            vy: -Math.random(),
            color: '#ffeaa7',
            size: 3,
            life: 15,
            maxLife: 15,
            type: 'SAND'
          });
        } else if (inputRef.current === 'RIGHT') {
          player.x = Math.min(RESOLUTION.width - 65, player.x + player.stats.speed * sandSpeedMultiplier);
          movedL2 = true;
          particlesRef.current.push({
            id: Math.random().toString(),
            x: player.x,
            y: player.y + 16,
            vx: -1 - Math.random() * 2,
            vy: -Math.random(),
            color: '#ffeaa7',
            size: 3,
            life: 15,
            maxLife: 15,
            type: 'SAND'
          });
        } else if (inputRef.current === 'UP') {
          player.y = Math.max(200, player.y - player.stats.speed * sandSpeedMultiplier);
          movedL2 = true;
        } else if (inputRef.current === 'DOWN') {
          player.y = Math.min(RESOLUTION.height - 30, player.y + player.stats.speed * sandSpeedMultiplier);
          movedL2 = true;
        }

        // Deplete or recover stamina based on movement states
        if (movedL2) {
          staminaRef.current = Math.max(0, staminaRef.current - 0.10);
        } else {
          staminaRef.current = Math.min(100, staminaRef.current + 0.25);
        }

        // High-performance throttled state synchronization
        if (time % 4 === 0) {
          setStamina(Math.round(staminaRef.current));
        }

        // Spawn emoji if exhausted
        if (isFatigued && time % 30 === 0) {
          particlesRef.current.push({
            id: Math.random().toString(),
            x: player.x + (Math.random() - 0.5) * 8,
            y: player.y - 30,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.6,
            color: '#74b9ff',
            size: 2,
            life: 25,
            maxLife: 25,
            type: 'EMOTE',
            label: '😫'
          });
        }

        if (movedL2) {
          if (player.state === 'IDLE' || player.state === 'RUNNING') {
            player.state = 'RUNNING';
          }
        } else {
          if (player.state === 'RUNNING') player.state = 'IDLE';
        }

        // Dynamic player vertical jump physics loop coordinator
        if ((player as any).z === undefined) (player as any).z = 0;
        if ((player as any).vz === undefined) (player as any).vz = 0;

        if ((player as any).z > 0 || (player as any).vz > 0) {
          (player as any).z += (player as any).vz;
          (player as any).vz -= 0.16; // sports gravity weight

          if ((player as any).z <= 0) {
            (player as any).z = 0;
            (player as any).vz = 0;
            if (player.state === 'JUMPING' || player.state === 'SPIKING') {
              player.state = 'IDLE';
            }
          } else {
            // Spawn sand particles while Shoyo floating in air!
            if (time % 3 === 0) {
              particlesRef.current.push({
                id: Math.random().toString(),
                x: player.x + (Math.random() - 0.5) * 8,
                y: player.y + player.height / 2,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 0.5,
                color: '#ffeaa7',
                size: 2,
                life: 15,
                maxLife: 15,
                type: 'SAND'
              });
            }
          }
        }

        // Dynamic idle pacing block for beach players when there is no active ball
        if (ballsRef.current.length === 0) {
          // Kageyama (partner) jogs in place
          partner.state = 'RUNNING';
          partner.y = 235 + Math.sin(time * 0.08) * 3;
          partner.x = 130 + Math.cos(time * 0.05) * 5;

          // Kōrai Hoshiumi (boss) paces side to side preparing
          boss.state = 'RUNNING';
          boss.x = 220 + Math.sin(time * 0.04) * 45;
          boss.y = 130 + Math.cos(time * 0.07) * 2;

          // Oikawa (opponent 2) shifts weight
          opp2.state = 'RUNNING';
          opp2.x = 330 + Math.cos(time * 0.05) * 25;
          opp2.y = 135 + Math.sin(time * 0.06) * 3;
        } else {
          // If the ball has landed/missed, return actors to idle watch
          const activeBall = ballsRef.current[0];
          if (activeBall && activeBall.missed) {
            if (partner.state === 'RUNNING') partner.state = 'IDLE';
            if (boss.state === 'RUNNING') boss.state = 'IDLE';
            if (opp2.state === 'RUNNING') opp2.state = 'IDLE';
          }
        }

        // Draw players
        VolleyballRenderer.drawCharacter(ctx, player, time);
        VolleyballRenderer.drawCharacter(ctx, partner, time);
        VolleyballRenderer.drawCharacter(ctx, boss, time);
        VolleyballRenderer.drawCharacter(ctx, opp2, time);

        // Simple Beach match AI for Kageyama and Opponents
        ballsRef.current.forEach((ball) => {
          if (ball.missed) {
            // Drop visual down to sand level
            ball.z = 0;
            VolleyballRenderer.drawVolleyball(ctx, ball, time);
            return;
          }

          // A. General physical updates (Constant gravity and velocity updates)
          // Introduce wind drift force in Level 2!
          if (!ball.received && !ball.missed) {
            ball.x += windX;
          }
          ball.x += ball.vx;
          ball.y += ball.vy;
          ball.z += ball.vz;
          ball.vz -= 0.075; // gravity (slower ball speed)

          // Continuous high-energy trail emitter
          if (ball.hasHighEnergyTrail && !ball.missed) {
            for (let i = 0; i < 3; i++) {
              particlesRef.current.push({
                id: Math.random().toString(),
                x: ball.x + (Math.random() - 0.5) * 6,
                y: ball.y - ball.z + (Math.random() - 0.5) * 6,
                vx: -ball.vx * 0.15 + (Math.random() - 0.5) * 0.6,
                vy: -ball.vy * 0.15 + (Math.random() - 0.5) * 0.6,
                color: i % 2 === 0 ? '#ED2939' : '#ffbf00', // Fiery red and orange hit!
                size: 7 + Math.random() * 5,
                life: 16,
                maxLife: 16,
                type: 'ENERGY_TRAIL'
              });
            }
          }



          // Constrain within court borders
          ball.x = Math.max(10, Math.min(RESOLUTION.width - 10, ball.x));

          // Ambient wind breeze particle visualizer
          if (windX !== 0 && Math.random() < 0.12) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: windX > 0 ? 0 : RESOLUTION.width,
              y: 50 + Math.random() * 220,
              vx: windX > 0 ? 1.5 + Math.random() * 2 : -1.5 - Math.random() * 2,
              vy: (Math.random() - 0.5) * 0.2,
              color: 'rgba(255, 255, 255, 0.16)',
              size: 2,
              life: 50,
              maxLife: 50,
              type: 'SAND'
            });
          }

          // Continuous player hand action check under Level 2 sandbox
          const isPlayerActionActive = player.state === 'RECEIVING' || player.state === 'SPIKING';
          if (isPlayerActionActive && !ball.received && !ball.missed) {
            const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
            if (dist < 85) {
              const currentZ = (player as any).z || 0;
              const isAirHit = currentZ > 5 || ball.z > 25;
              if (isAirHit) {
                // Spike the ball!
                const spikeTargetX = 280 + Math.random() * 120;
                const spikeTargetY = 110 + Math.random() * 50;
                const steps = calculateLandingSteps(ball.z, -1.8);
                ball.vx = (spikeTargetX - ball.x) / steps;
                ball.vy = (spikeTargetY - ball.y) / steps;
                ball.vz = -1.8; // heavy drop direction
                ball.received = true;
                ball.targetX = spikeTargetX;
                ball.targetY = spikeTargetY;
                ball.opponentDecision = undefined;
                ball.opponentMissTriggered = undefined;

                // CHECK FOR COUNTER SPIKE!
                const isCounterSpike = ball.isSpikedByOpponent === true;
                ball.isSpikedByOpponent = false; // reset spiked status
                if (isCounterSpike) {
                  shakeIntensityRef.current = 14.0; // TRIGGER INTENSE SCREEN SHAKE!
                  ball.hasHighEnergyTrail = true; // Activate electric neon gold trail during flight!
                }

                // beautiful shockwave effect
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: ball.x,
                  y: ball.y - ball.z,
                  vx: 0, vy: 0,
                  color: isCounterSpike ? '#fffa65' : '#ff7675', // golden shockwave for counter-spikes!
                  size: isCounterSpike ? 28 : 20,
                  life: 15,
                  maxLife: 15,
                  type: 'HIT_SHOCK'
                });

                const emoteText = isCounterSpike ? '⚡️ LEGENDARY COUNTER JUMP-SPIKE! ⚡' : '⚡️ DANGEROUS SPIKE!';
                const emoteColor = isCounterSpike ? '#1dd1a1' : '#fffa65';

                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: ball.x,
                  y: ball.y - ball.z - 20,
                  vx: 0, vy: -0.5,
                  color: emoteColor,
                  size: 10,
                  life: 40,
                  maxLife: 40,
                  type: 'EMOTE',
                  label: emoteText
                });

                if (isCounterSpike) {
                  setDialogText('UNBELIEVABLE! Shoyo intercepts Oikawa\'s attack in mid-air and strikes a vicious counter jump-spike!');
                  // Shoyo shouts!
                  particlesRef.current.push({
                    id: Math.random().toString(),
                    x: player.x,
                    y: player.y - 40,
                    vx: 0, vy: -0.4,
                    color: '#ffffff',
                    size: 10,
                    life: 50,
                    maxLife: 50,
                    type: 'EMOTE',
                    label: 'Nice kill!'
                  });
                } else {
                  setDialogText('Shoyo unleashes a legendary beach smash over Oikawa\'s head!');
                }
              } else {
                // Standard defensive receive/retrieve towards partner Kageyama!
                ball.received = true;
                audio.playSave();
                
                // push ball towards teammate Kageyama position (with exact landing steps calculation!)
                const steps = calculateLandingSteps(ball.z, 8.5);
                ball.vx = (partner.x - ball.x) / steps;
                ball.vy = (partner.y - ball.y) / steps;
                ball.vz = 8.5; // push high
                ball.targetX = partner.x;
                ball.targetY = partner.y;

                const receivePhrases = ['One touch', 'Rolling thunder', 'I got your back'];
                const randomReceive = receivePhrases[Math.floor(Math.random() * receivePhrases.length)];

                // set emote pass
                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: player.x,
                  y: player.y - 40,
                  vx: 0, vy: -0.4,
                  color: '#dff9fb',
                  size: 10,
                  life: 45,
                  maxLife: 45,
                  type: 'EMOTE',
                  label: randomReceive
                });
                setDialogText('Shoyo passes to Kageyama for the setup!');
              }
            }
          }

          // B. Target partner/opponent defensive reactions
          // 1. Partner Assistant AI (Tobio)
          // Heitor moves and acts if the ball is heading down to our side
          if (ball.y >= 160 && ball.vy > 0 && ball.targetX < RESOLUTION.width / 2) {
            // Run to target predictive coordinates to ensure perfect alignment in deep sand!
            const targetXVal = (ball.targetX !== undefined) ? ball.targetX : ball.x;
            const targetYVal = (ball.targetY !== undefined) ? ball.targetY : ball.y;
            const dx = targetXVal - partner.x;
            const dy = targetYVal - partner.y;
            partner.state = 'RUNNING';

            if (Math.abs(dx) > 4) {
              partner.x += Math.sign(dx) * partner.stats.speed * sandSpeedMultiplier;
            }
            if (Math.abs(dy) > 4) {
              partner.y += Math.sign(dy) * partner.stats.speed * sandSpeedMultiplier;
            }

            // partner receives & sets it high for Shoyo!
            const distToBallX = ball.x - partner.x;
            const distToBallY = ball.y - partner.y;
            const canTouchBall = Math.abs(distToBallX) < 15 && Math.abs(distToBallY) < 15 && ball.z < 18 && ball.z > 0 && ball.vz <= 0;

            if (canTouchBall) {
              if (ball.teammateDecision === undefined) {
                const isSpike = ball.isSpikedByOpponent;
                const isOurTeammateServe = (servedByOpponentRef.current === false);
                const isFirstServe = ball.isServedBall;

                // Receives 100% of served balls (including first ball served from our teammate), and 90% of opponent spikes!
                if (isFirstServe || isOurTeammateServe) {
                  ball.teammateDecision = true;
                } else if (isSpike) {
                  ball.teammateDecision = Math.random() < 0.90; // 90% success rate on spikes!
                } else {
                  ball.teammateDecision = Math.random() < 0.95; // 95% on regular covers!
                }
              }

              if (ball.teammateDecision === true) {
                audio.playSave();
                
                // Set velocity towards Shoyo player with exact landing timing!
                const steps = calculateLandingSteps(ball.z, 9.0);
                ball.vx = (player.x - ball.x) / steps;
                ball.vy = (player.y - ball.y) / steps;
                ball.vz = 9.0; // high trajectory for spiking
                ball.targetX = player.x;
                ball.targetY = player.y;
                ball.received = false; // Reset to allow player action!
                ball.isServedBall = false;
                ball.isSpikedByOpponent = false;

                partner.state = 'SETTING';
                setTimeout(() => { partner.state = 'IDLE'; }, 500);

                const partnerReceivePhrases = ['One touch', 'Rolling thunder', 'I got your back'];
                const randomPartnerReceive = partnerReceivePhrases[Math.floor(Math.random() * partnerReceivePhrases.length)];

                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: partner.x,
                  y: partner.y - 40,
                  vx: 0, vy: -0.4,
                  color: '#2e86de',
                  size: 10,
                  life: 45,
                  maxLife: 45,
                  type: 'EMOTE',
                  label: randomPartnerReceive
                });
                setDialogText('Kageyama bumps a glorious high set! Get ready to JUMP with [B] and spike with [Z]!');
              } else {
                // Fumbled spike! Keep the game authentic and high-stakes
                if (!ball.teammateMissTriggered) {
                  ball.teammateMissTriggered = true;
                  particlesRef.current.push({
                    id: Math.random().toString(),
                    x: partner.x,
                    y: partner.y - 30,
                    vx: 0.1, vy: -1.0,
                    color: '#ff7675',
                    size: 8,
                    life: 25,
                    maxLife: 25,
                    type: 'EMOTE',
                    label: '💨 FUMBLED!'
                  });
                  setDialogText('Heitor fumbled the powerful opponent spike!');
                }
              }
            }
          }

          // 2. Opponent AI defense reaction (Oikawa or Ushijima)
          // Opponents move and defend if the ball heads to their side
          if (ball.y < 160 && ball.vy < 0) {
            const targetXVal = ball.targetX !== undefined ? ball.targetX : ball.x;
            const targetYVal = ball.targetY !== undefined ? ball.targetY : ball.y;
            const defender = (targetXVal < RESOLUTION.width / 2) ? boss : opp2;
            const support = defender === boss ? opp2 : boss;

            // Defender moves with top speed to the predictive target zone
            const dx = targetXVal - defender.x;
            const dy = targetYVal - defender.y;

            defender.state = 'RUNNING';
            if (Math.abs(dx) > 3) defender.x += Math.sign(dx) * defender.stats.speed;
            if (Math.abs(dy) > 3) defender.y += Math.sign(dy) * defender.stats.speed;

            // Support defender covers their central positions
            const supportTargetX = defender === boss ? 340 : 172;
            const supportTargetY = 110;
            const sdx = supportTargetX - support.x;
            const sdy = supportTargetY - support.y;
            if (Math.abs(sdx) > 5) {
              support.state = 'RUNNING';
              support.x += Math.sign(sdx) * support.stats.speed * 0.55;
            }
            if (Math.abs(sdy) > 5) {
              support.y += Math.sign(sdy) * support.stats.speed * 0.55;
            }

            // Opponent checks range & rolls 65% success probability for a solid receive/spike!
            const distToBall = Math.hypot(ball.x - defender.x, ball.y - defender.y);
            const isInRange = distToBall < 30 && ball.z < 35 && ball.z > 0 && ball.vz <= 0;

            if (isInRange) {
              if (ball.opponentDecision === undefined) {
                // Roll 65% success chance to save/counter-spike
                ball.opponentDecision = Math.random() < 0.65;
              }

              if (ball.opponentDecision === true) {
                audio.playHit();

                // Spikes right back onto our team side! Target is safely playable coordinates!
                const oppTargetX = 70 + Math.random() * 125;
                const oppTargetY = 215 + Math.random() * 65;
                const steps = calculateLandingSteps(ball.z, 5.5);
                ball.vx = (oppTargetX - ball.x) / steps;
                ball.vy = (oppTargetY - ball.y) / steps;
                ball.vz = 5.5;
                ball.received = false; // Reset to allow player action!
                ball.targetX = oppTargetX;
                ball.targetY = oppTargetY;
                ball.isSpikedByOpponent = true;
                ball.isServedBall = false;
                ball.teammateDecision = undefined; // reset teammate decision
                ball.teammateMissTriggered = undefined;

                ball.opponentDecision = undefined; // Reset state for future touches

                defender.state = 'SPIKING';
                setTimeout(() => { defender.state = 'IDLE'; }, 400);

                const oppReceivePhrases = ['One touch', 'Rolling thunder', 'I got your back'];
                const randomOppReceive = oppReceivePhrases[Math.floor(Math.random() * oppReceivePhrases.length)];

                particlesRef.current.push({
                  id: Math.random().toString(),
                  x: defender.x,
                  y: defender.y - 40,
                  vx: 0, vy: -0.5,
                  color: '#e74c3c',
                  size: 10,
                  life: 45,
                  maxLife: 45,
                  type: 'EMOTE',
                  label: randomOppReceive
                });
                setDialogText(`Argentina team gets it up and ${defender.name} spikes it back!`);
              } else {
                // Decision failed (35% miss/fumble rate) - they fumbled! Spawn custom bubble triggers
                if (!ball.opponentMissTriggered) {
                  ball.opponentMissTriggered = true;
                  particlesRef.current.push({
                    id: Math.random().toString(),
                    x: defender.x,
                    y: defender.y - 35,
                    vx: 0, vy: -0.3,
                    color: '#ff7675',
                    size: 8,
                    life: 25,
                    maxLife: 25,
                    type: 'EMOTE',
                    label: '💨 MISSED!'
                  });
                  setDialogText(`${defender.name} misjudges the ball landing and fumbles!`);
                }
              }
            }
          }

          // C. Floor collision & scoring system (Any ball touching ground counts!)
          if (ball.z <= 0) {
            ball.missed = true;
            ball.z = 0; // Lock on sand
            ball.vx = 0;
            ball.vy = 0;
            ball.vz = 0;

            audio.playWhistle();

            if (ball.y < 160) {
              // Landed on Opponent side! Player team gets the point!
              setPointPlayer((prev) => {
                const next = prev + 1;
                if (next >= 5) {
                  setTimeout(() => {
                    audio.playChime();
                    startTransition(() => {
                      setGameState('LEVEL_2_SUCCESS');
                      setDialogText('CONGRATULATIONS! You dominated Copacabana Brazil Beach! Shoyo & Kageyama wins!');
                    });
                  }, 1200);
                } else {
                  // Player scored, therefore player team serves next round
                  setTimeout(() => spawnLevel2Ball(false), 1600);
                }
                return next;
              });
              setHudPulse(true);
              setTimeout(() => setHudPulse(false), 600);

              // Shoyo shouts "Nice kill"
              particlesRef.current.push({
                id: Math.random().toString(),
                x: playerRef.current.x,
                y: playerRef.current.y - 40,
                vx: 0, vy: -0.4,
                color: '#ffeaa7',
                size: 10,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: 'Nice kill'
              });

              // Kageyama shouts scorer phrase
              const scorerPhrases = ['Gotcha', 'You are still weak', 'Ace spike'];
              const randomScorer = scorerPhrases[Math.floor(Math.random() * scorerPhrases.length)];
              particlesRef.current.push({
                id: Math.random().toString(),
                x: partnerRef.current.x,
                y: partnerRef.current.y - 40,
                vx: 0, vy: -0.4,
                color: '#2e86de',
                size: 10,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: randomScorer
              });

              // Opponents shout loser phrase
              const opponentsLosePhrases = ['They are monster', 'Kinda scary', 'King of the court'];
              const randomOppsLose = opponentsLosePhrases[Math.floor(Math.random() * opponentsLosePhrases.length)];
              particlesRef.current.push({
                id: Math.random().toString(),
                x: enemyChefRef.current.x,
                y: enemyChefRef.current.y - 40,
                vx: 0, vy: -0.4,
                color: '#ff7675',
                size: 10,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: randomOppsLose
              });

              particlesRef.current.push({
                id: Math.random().toString(),
                x: RESOLUTION.width / 2,
                y: RESOLUTION.height / 2,
                vx: 0, vy: -0.6,
                color: '#2ecc71',
                size: 12,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: '💥 POINT FOR TEAM SHOYO! 💥'
              });
              setDialogText('Spectacular spike! Point for Karasuno Beach Duo!');
            } else {
              // Landed on Player side! Opponent team gets the point!
              setPointEnemy((prev) => {
                const next = prev + 1;
                if (next >= 5) {
                  setTimeout(() => {
                    audio.playMiss();
                    startTransition(() => {
                      setGameState('GAME_OVER');
                      setDialogText('Oikawa Tooru serves were too strong. Don\'t lose hope, train more and retry!');
                    });
                  }, 1200);
                } else {
                  // Opponent scored, therefore opponent team serves next round
                  setTimeout(() => spawnLevel2Ball(true), 1600);
                }
                return next;
              });
              setHudPulse(true);
              setTimeout(() => setHudPulse(false), 600);

              // Shoyo team (who lost point) shouts loser phrase with emojis
              const shoyoTeamLosePhrases = ['Monster serve! 😭', 'So fast! 🙀', 'Missed it! 🤦‍♂️', 'Darn! 😓', 'Too strong! 💔'];
              const randomShoyoLose = shoyoTeamLosePhrases[Math.floor(Math.random() * shoyoTeamLosePhrases.length)];
              particlesRef.current.push({
                id: Math.random().toString(),
                x: playerRef.current.x,
                y: playerRef.current.y - 40,
                vx: 0, vy: -0.4,
                color: '#ff7675', // bright coral pink for maximum contrast over yellow sand!
                size: 12,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: randomShoyoLose
              });

              // Tobio (partner) shouts loser phrase
              const partnerLose = shoyoTeamLosePhrases[(Math.floor(Math.random() * shoyoTeamLosePhrases.length) + 1) % shoyoTeamLosePhrases.length];
              particlesRef.current.push({
                id: Math.random().toString(),
                x: partnerRef.current.x,
                y: partnerRef.current.y - 40,
                vx: 0, vy: -0.4,
                color: '#2e86de',
                size: 10,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: partnerLose
              });

              // Opponent (who scored) shouts scorer phrase
              const oppScorers = ['Gotcha', 'You still weak', 'Ace spike'];
              const randomOppScorer = oppScorers[Math.floor(Math.random() * oppScorers.length)];
              
              particlesRef.current.push({
                id: Math.random().toString(),
                x: enemyChefRef.current.x,
                y: enemyChefRef.current.y - 40,
                vx: 0, vy: -0.4,
                color: '#ff7675',
                size: 10,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: randomOppScorer
              });

              particlesRef.current.push({
                id: Math.random().toString(),
                x: RESOLUTION.width / 2,
                y: RESOLUTION.height / 2,
                vx: 0, vy: -0.6,
                color: '#eb4d4b',
                size: 12,
                life: 60,
                maxLife: 60,
                type: 'EMOTE',
                label: 'POINT FOR ARGENTINA!'
              });
              setDialogText('Beach physics made movement hard. Opponents get the point!');
            }
          }

          VolleyballRenderer.drawVolleyball(ctx, ball, time);
        });

      } else if (gameState === 'LEVEL_2_SUCCESS') {
        VolleyballRenderer.drawLevel2Background(
          ctx,
          RESOLUTION.width,
          RESOLUTION.height,
          time
        );
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, RESOLUTION.width, RESOLUTION.height);

        ctx.fillStyle = '#fffa65';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ BRAZIL VOLLEYBALL CHAMPIONS! ⭐', RESOLUTION.width / 2, 80);

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#1dd1a1';
        ctx.fillText('YOU DEFEATED KORAI HOSHIUMI & OIKAWA ON THE SANDS OF RIO!', RESOLUTION.width / 2, 110);

        // Celebrating
        playerRef.current.state = 'VICTORY';
        playerRef.current.x = RESOLUTION.width / 2 - 40;
        partnerRef.current.state = 'VICTORY';
        partnerRef.current.x = RESOLUTION.width / 2 + 40;

        VolleyballRenderer.drawCharacter(ctx, playerRef.current, time);
        VolleyballRenderer.drawCharacter(ctx, partnerRef.current, time);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('Press [M Key] / [Z Key] or START to go back to Title screen!', RESOLUTION.width / 2, 280);

      } else if (gameState === 'GAME_OVER') {
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(0, 0, RESOLUTION.width, RESOLUTION.height);

        ctx.fillStyle = '#ff7675';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', RESOLUTION.width / 2, 120);

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Kōrai Hoshiumi\'s incredible spikes completely overwhelmed Ninja Shoyo.', RESOLUTION.width / 2, 165);

        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Press [M Key] / [Z Key] to restart and try again!', RESOLUTION.width / 2, 240);
      }

      // Draw active particles list
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        return p.life > 0;
      });
      VolleyballRenderer.drawParticles(ctx, particlesRef.current);

      // Render HUD panels (e.g. saves or beach points cards)
      VolleyballRenderer.drawHUD(
        ctx,
        gameState,
        RESOLUTION.width,
        RESOLUTION.height,
        savesCount,
        neededSaves,
        pointPlayer,
        pointEnemy,
        infoBanner
      );

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, savesCount, pointPlayer, pointEnemy, infoBanner, windX]);

  // Initial title chiptune trigger
  useEffect(() => {
    audio.playBGM('TITLE');
    return () => audio.stopBGM();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 justify-center items-center min-h-screen bg-stone-950 p-6">
      
      {/* 1. GBA Console with Game screen inside! */}
      <div className="flex-1 flex justify-center">
        <GBAFrame
          onDpadPress={handleDpadPress}
          onButtonPress={handleButtonPress}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          powerOn={powerOn}
        >
          {/* Real Canvas layout container */}
          <div className="relative w-full h-full select-none overflow-hidden">
            <canvas
              ref={canvasRef}
              width={RESOLUTION.width}
              height={RESOLUTION.height}
              className="w-full h-full bg-neutral-900 block"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* PROGRESS BAR HUD IN LEVEL 2 */}
            {gameState === 'LEVEL_2_PLAY' && (
              <div id="beach-hud-overlay" className={`absolute top-2 left-1/2 -translate-x-1/2 w-[92%] h-[58px] bg-black/90 border border-cyan-500/40 rounded-md px-2 py-1 flex flex-col justify-between font-mono text-[9px] text-white pointer-events-none transition-all duration-300 z-10 ${hudPulse ? 'animate-score-pulse shadow-[0_0_15px_rgba(34,211,238,0.5)] border-cyan-400' : 'shadow-lg shadow-black/80'}`}>
                {/* Score and Wind Line */}
                <div className="flex justify-between items-center w-full">
                  <span className="text-orange-400 font-bold tracking-wider text-[8px]">YOU: {pointPlayer}</span>
                  {/* Wind indicator box */}
                  <div className="bg-neutral-950 px-1 py-0.2 rounded border border-neutral-800 flex items-center gap-1">
                    <span className="text-neutral-400 text-[7px]">WIND:</span>
                    <span className="font-bold text-teal-400 text-[7px] tracking-tight">
                      {windX === 0 ? 'CALM' : windX > 0 ? `R+${(windX * 10).toFixed(0)}` : `L-${(Math.abs(windX) * 10).toFixed(0)}`}
                    </span>
                  </div>
                  <span className="text-red-400 font-bold tracking-wider text-[8px]">ARG: {pointEnemy}</span>
                </div>
                {/* Pulse Score Progress Bar */}
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800 relative">
                  {/* Left Player Fill */}
                  <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-500" style={{ width: `${(pointPlayer / 5) * 100}%` }} />
                  {/* Central Net Divider line */}
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-neutral-800 pointer-events-none" />
                  {/* Right Enemy Fill */}
                  <div className="h-full bg-gradient-to-l from-[#eb4d4b] to-[#04cbe6] transition-all duration-500 ml-auto" style={{ width: `${(pointEnemy / 5) * 100}%` }} />
                </div>
                {/* Strategic Stamina Bar */}
                <div className="flex justify-between items-center w-full">
                  <span className="text-[7.5px] text-zinc-400 font-bold flex items-center gap-1">
                    🔋 STAMINA: <span className={stamina < 25 ? 'text-red-400 animate-pulse font-extrabold' : 'text-emerald-400 font-bold'}>{stamina}% {stamina < 25 ? '(TIRED!)' : ''}</span>
                  </span>
                  <div className="w-[50%] h-1 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div className={`h-full transition-all duration-150 ${stamina < 25 ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-green-400'}`} style={{ width: `${stamina}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* CELEBRATION DANCE OVERLAY WHEN 5 POINTS REACHED */}
            {gameState === 'LEVEL_2_SUCCESS' && (
              <div id="victory-dance-screen" className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-3 text-center pointer-events-none z-10 select-none overflow-hidden animate-fade-in">
                {/* Confetti generator */}
                {[...Array(14)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm animate-confetti"
                    style={{
                      left: `${10 + i * 7.5}%`,
                      top: `-${Math.random() * 20}px`,
                      backgroundColor: ['#ff7675', '#fdcb6e', '#0984e3', '#00b894', '#6c5ce7', '#ff7f50'][i % 6],
                      animationDelay: `${Math.random() * 2.5}s`,
                    }}
                  />
                ))}

                <h1 className="text-[14px] font-extrabold text-amber-400 tracking-wider mb-0.5 drop-shadow-md">🏆 COPACOBANA CHAMPIONS! 🏆</h1>
                <p className="text-[9px] font-mono text-emerald-400 mb-2 leading-tight">YOU DEFEATED AOBA JOHSAI ON THE BRAZIL SANDS!</p>

                {/* Legendary Haikyuu Quote */}
                <div className="my-[3px] p-[5px] bg-slate-900 border border-amber-500/20 rounded-md max-w-[92%] select-text">
                  <p className="text-[8.5px] italic font-serif text-amber-200 leading-normal">
                    "Talent is something you make bloom. Instinct is something you polish!"
                  </p>
                  <p className="text-[6.5px] font-mono text-amber-400/70 text-right mt-0.5">
                    — Oikawa Tooru
                  </p>
                </div>

                {/* Pure CSS Character Celebration Dance! */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-1">
                  {/* Glowing neon shadow below feet */}
                  <div className="absolute bottom-4 w-12 h-2 bg-black/50 rounded-full blur-[1px]" />
                  
                  {/* Shouyou Dancing character body container */}
                  <div className="relative w-16 h-24 flex flex-col items-center animate-victory-dance select-none mt-2">
                    {/* Hair spiky orange */}
                    <div className="absolute top-1 w-10 h-6 bg-orange-500 rounded-lg flex flex-wrap gap-1 p-0.5">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                      <div className="w-2 h-1 bg-orange-600" />
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    </div>

                    {/* Head */}
                    <div className="absolute top-5 w-8 h-8 bg-[#f3a683] rounded-md flex flex-col justify-between py-1 px-1 border border-amber-900/30">
                      {/* Eyes smiling */}
                      <div className="flex justify-between w-full mt-1 px-0.5">
                        <span className="text-[7px] text-amber-955 font-bold">^</span>
                        <span className="text-[7px] text-amber-955 font-bold">^</span>
                      </div>
                      {/* Open mouth */}
                      <div className="w-3.5 h-2 bg-red-600 rounded-b-full mx-auto" />
                    </div>

                    {/* Jersey torso #10 */}
                    <div className="absolute top-12 w-8 h-8 bg-[#1e272e] rounded-sm flex flex-col justify-between p-1">
                      <span className="text-[8px] text-white font-bold text-center mt-[-2px]">10</span>
                    </div>

                    {/* Left Dancing Arm swinging */}
                    <div className="absolute top-[52px] left-[-9px] w-3 h-7 bg-[#f3a683] rounded-full origin-top-right animate-arm-left border-r border-[#1e272e]" />

                    {/* Right Dancing Arm swinging */}
                    <div className="absolute top-[52px] right-[-9px] w-3 h-7 bg-[#f3a683] rounded-full origin-top-left animate-arm-right border-l border-[#1e272e]" />

                    {/* Legs / Shoes tapping and pattering */}
                    <div className="absolute top-20 w-8 h-4 flex justify-between px-1 animate-legs">
                      <div className="w-2.5 h-3 bg-[#f3a683] rounded-b-md flex flex-col justify-end">
                        <div className="w-3 h-1.5 bg-[#ff6b6b] rounded-sm ml-[-0.5px]" />
                      </div>
                      <div className="w-2.5 h-3 bg-[#f3a683] rounded-b-md flex flex-col justify-end">
                        <div className="w-3 h-1.5 bg-[#ff6b6b] rounded-sm ml-[-0.5px]" />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[8px] font-mono text-zinc-300 animate-pulse mt-1">
                  Press [M/Z] or [START] to return to the title screen!
                </p>
              </div>
            )}

            {/* SMOOTH ARCADE GAME OVER FADE-TO-BLACK SCREEN OVERLAY */}
            {gameState === 'GAME_OVER' && (
              <div id="game-over-fade-overlay" className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center pointer-events-none select-none overflow-hidden animate-fade-to-black-screen">
                <h1 className="text-[20px] font-extrabold text-red-500 tracking-widest font-sans animate-glitch drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] filter brightness-125">
                  GAME OVER
                </h1>
                
                <p className="text-[9px] font-mono text-zinc-400 mt-2 max-w-[85%] leading-tight">
                  Korai Hoshiumi's limit-breaking sky serves were too formidable.
                </p>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 max-w-[80%]">
                  Don't give up! Your timing and position will improve.
                </p>

                {/* Legendary Haikyuu Defeat Quote */}
                <div className="mt-2.5 p-1.5 bg-red-950/40 border border-red-500/10 rounded-md max-w-[88%] select-text animate-pulse">
                  <p className="text-[8.5px] italic font-serif text-red-300 leading-normal">
                    "If you’re gonna hit it, hit it until it breaks!"
                  </p>
                  <p className="text-[7.5px] font-mono text-red-400/70 text-right mt-0.5">
                    — Oikawa Tooru
                  </p>
                </div>

                <p className="text-[8px] font-mono text-amber-500/80 animate-pulse mt-4">
                  Press [M Key] / [Z Key] to retry!
                </p>
              </div>
            )}
          </div>
        </GBAFrame>
      </div>

      {/* 2. Side Panel holding story, game stats, controls info guide */}
      <div className="w-full lg:w-80 bg-neutral-900/90 border-2 border-indigo-950 rounded-3xl p-5 flex flex-col gap-4 text-sm shadow-xl">
        
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Award className="text-orange-500" size={20} />
          <h2 className="text-base font-bold text-neutral-100 tracking-wide">SHOYO\'S RPG STATS</h2>
        </div>

        {/* Character stats bar design */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-orange-500/10 border border-orange-500 flex items-center justify-center">
              <span className="text-lg font-bold text-orange-400">#10</span>
            </div>
            <div>
              <p className="font-bold text-neutral-200">Hinata Shouyou</p>
              <p className="text-[10px] text-neutral-400 font-mono">ROLE: DECOY & SPIKER</p>
            </div>
          </div>

          {/* Stats slider values */}
          <div className="space-y-2.5 mt-2">
            <div>
              <div className="flex justify-between text-xs text-neutral-300 font-mono">
                <span>SPEED</span>
                <span className="text-orange-400">95/100</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full w-[95%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 font-mono">
                <span>RECEPTION TIMING</span>
                <span className="text-orange-400">85/100</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-300 font-mono">
                <span>JUMP ALTITUDE</span>
                <span className="text-orange-400">98/100</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full w-[98%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Classic RPG text printing box info */}
        <div className="bg-indigo-950/40 border border-indigo-900 rounded-xl p-3.5 space-y-2">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Info size={14} />
            RPG Dialogue Log
          </h3>
          <div className="bg-black/40 text-neutral-300 p-2.5 rounded-lg text-xs font-mono min-h-20 leading-relaxed relative flex flex-col justify-between">
            <p id="dialogue-log-text">{dialogText}</p>
            
            {/* Blinking chevron cursor */}
            <span className="self-end text-[10px] text-indigo-400 animate-bounce mt-1">▼</span>
          </div>

          <button
            id="next-dialogue-btn"
            onClick={handleNextDialog}
            className="w-full py-1.5 bg-indigo-800 hover:bg-indigo-700 active:bg-indigo-600 text-white font-mono text-xs font-bold rounded-lg cursor-pointer transition shadow-sm flex items-center justify-center gap-1"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            ADVANCE DIALOGUE / RETRY
          </button>
        </div>

        {/* Instructions list help card */}
        <div className="border border-neutral-800 rounded-xl p-3 text-xs space-y-2 text-neutral-400">
          <p className="font-bold text-neutral-300">How to Play:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-neutral-200">Round 1</span>: Move left/right to position Shoyo's shadow near ball shadow, press <kbd className="bg-neutral-800 px-1 border border-neutral-700 rounded select-none">Z</kbd> to Receive when it hits sweet lower spot!</li>
            <li><span className="text-neutral-200">Round 2</span>: Move on beach sands. Jump with <kbd className="bg-neutral-800 px-1 border border-neutral-700 rounded select-none">X</kbd> then strike ball at peak with <kbd className="bg-neutral-800 px-1 border border-neutral-700 rounded select-none">Z</kbd> to Spike! Complete 3 points.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
