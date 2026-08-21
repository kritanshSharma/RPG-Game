/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 
  | 'TITLE_SCREEN'
  | 'INTRO'
  | 'LEVEL_1_START'
  | 'LEVEL_1_PLAY'
  | 'LEVEL_1_SUCCESS'
  | 'LEVEL_2_START'
  | 'LEVEL_2_PLAY'
  | 'LEVEL_2_SUCCESS'
  | 'GAME_OVER';

export interface Ball {
  id: string;
  x: number;
  y: number;
  z: number; // height from ground (0 is ground)
  vx: number;
  vy: number;
  vz: number; // vertical velocity (gravity affects this)
  type: 'FAST' | 'CURVE' | 'DECELERATING' | 'KNUCKLE' | 'NORMAL' | 'FLOAT';
  curvePhase?: number;
  curveSpeed?: number;
  targetX: number;
  targetY: number;
  shadowY: number;
  landingIndicatorRadius?: number;
  received: boolean;
  missed: boolean;
  hasBounced: boolean;
  isCosmeticRise?: boolean;
  hideShadow?: boolean;
  opponentDecision?: boolean;
  opponentMissTriggered?: boolean;
  isServedBall?: boolean;
  isSpikedByOpponent?: boolean;
  teammateDecision?: boolean;
  teammateMissTriggered?: boolean;
  hasHighEnergyTrail?: boolean;
}

export interface Character {
  id: string;
  name: string;
  role: 'PLAYER' | 'PARTNER' | 'BOSS' | 'OPPONENT_2';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  width: number;
  height: number;
  state: 'IDLE' | 'RUNNING' | 'RECEIVING' | 'SETTING' | 'SPIKING' | 'JUMPING' | 'STUNNED' | 'VICTORY' | 'INTRO';
  animFrame: number;
  animTimer: number;
  facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  jerseyColor: string;
  hairColor: string;
  hairStyle: 'SPIKY' | 'FLAT' | 'WAVY';
  stats: {
    speed: number;
    reception: number;
    jump: number;
    spike: number;
  };
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'SAND' | 'SPARK' | 'HIT_SHOCK' | 'SWEAT' | 'EMOTE' | 'ENERGY_TRAIL';
  label?: string; // e.g. "PERFECT!" "TOO LATE" "TOO EARLY"
}

export interface RetroSound {
  playSelect: () => void;
  playCancel: () => void;
  playJump: () => void;
  playHit: () => void;
  playSave: () => void;
  playMiss: () => void;
  playChime: () => void;
  playWhistle: () => void;
  playBGM: (type: 'TITLE' | 'LEVEL_1' | 'LEVEL_2', bpm?: number) => void;
  stopBGM: () => void;
}
