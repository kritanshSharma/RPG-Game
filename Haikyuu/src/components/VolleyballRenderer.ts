/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ball, Character, Particle } from '../types';

export class VolleyballRenderer {
  // Draws the retro background for Level 1 (Volleyball Court)
  static drawLevel1Background(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    // 1. Gym floor wood tiles (Honey wood palette)
    ctx.fillStyle = '#fbc531'; // Beautiful vivid golden maple wood floor!
    ctx.fillRect(0, 0, width, height);

    // Draw horizontal wood planks lines with rich terracotta grain feeling
    ctx.strokeStyle = '#e1b12c';
    ctx.lineWidth = 1;
    for (let y = 80; y < height; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. High-contrast Top wall/bleachers (Midnight indigo-violet for professional sports depth!)
    ctx.fillStyle = '#2c2c54'; 
    ctx.fillRect(0, 0, width, 80);

    // Gym ceiling support beam accents
    ctx.fillStyle = '#1e1b4b';
    for (let x = 40; x < width; x += 80) {
      ctx.fillRect(x - 8, 0, 16, 80);
    }

    // Hang a cool "FLY" Karasuno retro banner in the middle top wall
    ctx.fillStyle = '#0f0c1b'; // obsidian black banner
    ctx.fillRect(width / 2 - 80, 15, 160, 45);
    ctx.strokeStyle = '#ff7f50'; // glowing orange border
    ctx.lineWidth = 2.5;
    ctx.strokeRect(width / 2 - 80, 15, 160, 45);

    // Banner Kanji: "飛べ" (Tobe!) or "FLY"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('飛 べ', width / 2, 33);
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff9f43';
    ctx.fillText('FLY HIGH', width / 2, 48);

    // 3. Volleyball Court Orange Boundaries lines
    const pad = 40;
    const courtYStart = 120;
    const courtYEnd = height - 20;
    const courtXStart = pad;
    const courtXEnd = width - pad;

    ctx.strokeStyle = '#ff4757'; // Gorgeous Coral / Tennis red fluorescent boundary
    ctx.lineWidth = 4;
    // Boundary box
    ctx.beginPath();
    ctx.moveTo(courtXStart, courtYStart);
    ctx.lineTo(courtXEnd, courtYStart);
    ctx.lineTo(courtXEnd, courtYEnd);
    ctx.lineTo(courtXStart, courtYEnd);
    ctx.closePath();
    ctx.stroke();

    // Center net horizontal dividing boundary line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(courtXStart, height / 2);
    ctx.lineTo(courtXEnd, height / 2);
    ctx.stroke();

    // Draw standard volleyball net posts on left and right borders of court
    // Net post Left
    ctx.fillStyle = '#7f8c8d'; // steel posts
    ctx.fillRect(courtXStart - 10, height / 2 - 30, 8, 55);
    // Net post Right
    ctx.fillRect(courtXEnd + 2, height / 2 - 30, 8, 55);

    // Net mesh grid styling
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = courtXStart; x <= courtXEnd; x += 8) {
      ctx.moveTo(x, height / 2 - 12);
      ctx.lineTo(x, height / 2 + 10);
    }
    for (let ny = height / 2 - 10; ny <= height / 2 + 8; ny += 6) {
      ctx.moveTo(courtXStart, ny);
      ctx.lineTo(courtXEnd, ny);
    }
    ctx.stroke();

    // Red/White striped top of volleyball net
    ctx.fillStyle = '#ff6b6b'; 
    ctx.fillRect(courtXStart - 5, height / 2 - 14, (courtXEnd - courtXStart) + 10, 4);

    // Draw little crowd specs or spectators in background standing
    ctx.fillStyle = '#485460';
    for (let sx = 20; sx < width; sx += 50) {
      ctx.beginPath();
      // head
      ctx.arc(sx + Math.sin(time * 0.05 + sx) * 2, 72, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draws the retro background for Level 2 (Brazil Copacabana Beach)
  static drawLevel2Background(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    // 1. Brazil golden sand background (Warm peach gold!)
    ctx.fillStyle = '#fed330'; // Glorious warm yellow Rio beach sands!
    ctx.fillRect(0, 0, width, height);

    // Sand noise textures (retro warm grains)
    ctx.fillStyle = '#f39c12';
    for (let i = 0; i < 40; i++) {
      const sx = ((Math.sin(i * 123.45) * 0.5 + 0.5) * width) | 0;
      const sy = (((Math.cos(i * 543.21) * 0.5 + 0.5) * (height - 90)) + 90) | 0;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // 2. Animated ocean at the top (Fascinating transparent tropical Turquoise gradient)
    ctx.fillStyle = '#00af80'; // Emerald tropical outer sea
    ctx.fillRect(0, 0, width, 90);

    // Draw waves crashing in blue/white foam
    const waveOffset = Math.sin(time * 0.04) * 8;
    ctx.fillStyle = '#10ac84'; // Luminous sea foam teal 
    ctx.beginPath();
    ctx.moveTo(0, 80 + waveOffset);
    for (let x = 0; x <= width + 20; x += 40) {
      ctx.quadraticCurveTo(
        x - 20,
        70 + Math.sin(time * 0.05 + x) * 4 + waveOffset,
        x,
        80 + waveOffset
      );
    }
    ctx.lineTo(width, 0);
    ctx.lineTo(0, 0);
    ctx.fill();

    // White foam lines at the shore
    ctx.fillStyle = '#ffffff'; // Pure white foam
    ctx.beginPath();
    ctx.moveTo(0, 86 + waveOffset * 0.5);
    for (let x = 0; x <= width + 20; x += 30) {
      ctx.quadraticCurveTo(
        x - 15,
        82 + Math.cos(time * 0.07 + x) * 3 + waveOffset * 0.5,
        x,
        86 + waveOffset * 0.5
      );
    }
    ctx.lineTo(width, 0);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Sand shore wet wood panel or line
    ctx.fillStyle = '#ffd32d';
    ctx.fillRect(0, 88 + waveOffset * 0.5, width, 6);

    // 3. Swaying Palm Tree in the corners!
    this.drawPalmTree(ctx, 25, 110, time);
    this.drawPalmTree(ctx, width - 25, 110, time + 2);

    // 4. Beach Volleyball Court boundary cords (flexible nylon lines!)
    const courtXStart = 60;
    const courtXEnd = width - 60;
    const courtYStart = 130;
    const courtYEnd = height - 20;

    ctx.strokeStyle = '#0984e3'; // cool blue rope court boundary lines
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(courtXStart, courtYStart);
    ctx.lineTo(courtXEnd, courtYStart);
    ctx.lineTo(courtXEnd, courtYEnd);
    ctx.lineTo(courtXStart, courtYEnd);
    ctx.closePath();
    ctx.stroke();

    // Beach center divider rope
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(courtXStart, height / 2 + 10);
    ctx.lineTo(courtXEnd, height / 2 + 10);
    ctx.stroke();

    // Beach Volleyball Net
    ctx.fillStyle = '#2d3436'; // dark post poles
    ctx.fillRect(courtXStart - 8, height / 2 - 20, 6, 50);
    ctx.fillRect(courtXEnd + 2, height / 2 - 20, 6, 50);

    // Net mesh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = courtXStart; x <= courtXEnd; x += 12) {
      ctx.moveTo(x, height / 2 - 8);
      ctx.lineTo(x, height / 2 + 12);
    }
    ctx.stroke();

    // Top fluorescent yellow ribbon tape typical for beach volleyball
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(courtXStart - 4, height / 2 - 10, (courtXEnd - courtXStart) + 8, 4);
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(courtXStart - 4, height / 2 - 6, (courtXEnd - courtXStart) + 8, 2);
  }

  // Draw tropical pixel-art styled palm tree
  private static drawPalmTree(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    time: number
  ) {
    const sway = Math.sin(time * 0.03) * 6;

    // Draw brown segmented trunk
    ctx.fillStyle = '#d35400'; // light brown segment
    ctx.strokeStyle = '#a04000';
    ctx.lineWidth = 2;

    let cx = bx;
    let cy = by;
    const segments = 6;
    const path: {x: number; y: number}[] = [{x: cx, y: cy + 40}];

    for (let i = 0; i < segments; i++) {
      const progress = i / segments;
      const nx = bx + (sway * 0.8) * progress * progress;
      const ny = by + 20 - i * 16;
      ctx.beginPath();
      ctx.arc(nx, ny, 7 - i * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      path.push({x: nx, y: ny});
    }

    // Draw palm green leaves
    const top = path[path.length - 1];
    ctx.fillStyle = '#27ae60';
    const numFronds = 5;

    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2 + (sway * 0.015);
      const fx = top.x + Math.cos(angle) * 35;
      const fy = top.y + Math.sin(angle) * 20 + Math.abs(Math.cos(angle)) * 8;

      ctx.beginPath();
      ctx.ellipse(
        (top.x + fx) / 2,
        (top.y + fy) / 2,
        18,
        6,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Leaf midrib
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }

    // Little brown beach coconuts!
    ctx.fillStyle = '#7e5233';
    ctx.beginPath();
    ctx.arc(top.x - 3, top.y + 4, 3, 0, Math.PI * 2);
    ctx.arc(top.x + 4, top.y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Character Pixel Sprites with amazing Retro Detail!
  static drawCharacter(
    ctx: CanvasRenderingContext2D,
    char: Character,
    time: number
  ) {
    const isJumping = char.state === 'JUMPING' || char.state === 'SPIKING';
    const bounceOffset = char.state === 'RUNNING' ? Math.abs(Math.sin(time * 0.2)) * 4 : 0;
    const additionalZ = (char as any).z || 0;
    
    let drawY = char.y - bounceOffset - additionalZ;

    // 1. Drop shadow immediately below character on ground (0 altitude)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    const shadowW = char.width * (isJumping ? 0.6 : 0.9);
    ctx.ellipse(char.x, char.y + char.height / 2 - 2, shadowW, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Recalculate sprite drawn rectangle centers
    const cx = char.x;
    const cy = drawY;

    // Let's draw high fidelity pixel components!
    // A. Feet/Shoes
    ctx.fillStyle = '#2c3e50'; // dark shoe base
    ctx.fillRect(cx - 8, cy + 18, 5, 4);
    ctx.fillRect(cx + 3, cy + 18, 5, 4);
    ctx.fillStyle = '#ff6b6b'; // red accents
    ctx.fillRect(cx - 7, cy + 17, 4, 2);
    ctx.fillRect(cx + 4, cy + 17, 4, 2);

    // B. Legs (short pants skin segment)
    ctx.fillStyle = '#f3a683'; // default tanned peach skin tone
    ctx.fillRect(cx - 6, cy + 10, 4, 8);
    ctx.fillRect(cx + 2, cy + 10, 4, 8);

    // C. Shorts (Karasuno Black & Orange!)
    ctx.fillStyle = char.jerseyColor; // Karasuno Black / Beach Blue
    ctx.fillRect(cx - 8, cy + 2, 16, 9);
    // Draw orange stripe on the side panel
    ctx.fillStyle = '#ff7f50'; // Bright orange
    ctx.fillRect(cx - 8, cy + 2, 2, 9);
    ctx.fillRect(cx + 6, cy + 2, 2, 9);

    // D. Shirt Body (Beefy sleeveless athletic cut with bicep delts!)
    ctx.fillStyle = char.jerseyColor;
    ctx.fillRect(cx - 8, cy - 10, 16, 12);

    // Draw defined peach-skin deltoids/shoulders and muscular biceps!
    ctx.fillStyle = '#f3a683'; // muscular skin tone
    // Left deltoid and bicep pop
    ctx.fillRect(cx - 11, cy - 10, 3, 11);
    ctx.fillRect(cx - 12, cy - 7, 2, 5); 
    // Right deltoid and bicep pop
    ctx.fillRect(cx + 8, cy - 10, 3, 11);
    ctx.fillRect(cx + 10, cy - 7, 2, 5);

    // Dynamic tank-top shoulder straps
    ctx.fillStyle = char.jerseyColor;
    ctx.fillRect(cx - 7, cy - 10, 2, 3);
    ctx.fillRect(cx + 5, cy - 10, 2, 3);

    // Super subtle outline shadow to make the muscles pop!
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // vertical abdominal line
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 3);
    // pec contours
    ctx.moveTo(cx - 5, cy - 6);
    ctx.lineTo(cx + 5, cy - 6);
    ctx.stroke();

    // JERSEY NUMBER & SLEEVES
    if (char.name.toLowerCase().includes('hinata')) {
      // Shoyo Jersey #10!
      // Number orange stripe
      ctx.fillStyle = '#ff7f50';
      ctx.fillRect(cx - 5, cy - 11, 10, 2); // collar line orange

      // Big "10" chest and back number sticker in retro white pixel grid
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 6, 4, 5);
      ctx.fillStyle = char.jerseyColor;
      ctx.fillRect(cx - 1, cy - 5, 1, 3); // clear gap inside #10 digit representation
    } else if (char.name.toLowerCase().includes('korai') || char.name.toLowerCase().includes('satoru')) {
      // Gojo high school Jujutsu slate navy-black uniform details
      ctx.fillStyle = '#0f172a'; // collar trim
      ctx.fillRect(cx - 6, cy - 11, 12, 2);
      ctx.fillStyle = '#ffd32a'; // Golden jujutsu custom button
      ctx.fillRect(cx - 1, cy - 8, 2, 2);
    } else if (char.name.toLowerCase().includes('bokuto')) {
      // Bokuto's Fukurōdani No. 4 jersey (White, black, and gold!)
      ctx.fillStyle = '#1e272e'; // dark grey base
      ctx.fillRect(cx - 6, cy - 11, 12, 1);
      ctx.fillStyle = '#ffffff'; // white diagonal stripe
      ctx.fillRect(cx - 4, cy - 10, 8, 3);
      ctx.fillStyle = '#f1c40f'; // golden-yellow side panels
      ctx.fillRect(cx - 1, cy - 7, 3, 4);
    } else {
      // Partner/Other (e.g., Beach #4 or #2)
      ctx.fillStyle = '#fffa65';
      ctx.fillRect(cx - 1, cy - 6, 2, 5);
    }

    // Arms behavior according to motion states
    ctx.fillStyle = '#f3a683'; // Skin tone
    if (char.state === 'RECEIVING') {
      // Clasping bump arms extended forward/down
      ctx.fillRect(cx - 14, cy - 2, 10, 4);
      ctx.fillRect(cx + 4, cy - 2, 10, 4);
      ctx.fillStyle = '#000000'; // dark line detail
      ctx.strokeRect(cx - 14, cy - 2, 10, 4);
      // Hand overlay clasp
      ctx.fillStyle = '#f3a683';
      ctx.fillRect(cx - 5, cy, 10, 4);
    } else if (char.state === 'SPIKING') {
      // Spiking arm high upward, background arm backward for balance!
      ctx.fillRect(cx - 11, cy - 5, 4, 10); // left balance arm down
      ctx.fillRect(cx + 3, cy - 19, 5, 10); // Spiky right hand high in heaven!
    } else if (char.state === 'SETTING') {
      // Two hands overhead holding/pushing ball
      ctx.fillRect(cx - 12, cy - 17, 4, 8);
      ctx.fillRect(cx + 8, cy - 17, 4, 8);
    } else if (char.state === 'STUNNED') {
      // Hands held on face / shaking head
      ctx.fillRect(cx - 10, cy - 8, 4, 4);
      ctx.fillRect(cx + 6, cy - 8, 4, 4);
    } else {
      // Standing idle arms down on sides
      ctx.fillRect(cx - 12, cy - 8, 3, 10);
      ctx.fillRect(cx + 9, cy - 8, 3, 10);
    }

    // E. Neck and Head Face Block
    ctx.fillStyle = '#f3a683'; // Neck segment
    ctx.fillRect(cx - 3, cy - 13, 6, 3);
    
    // Head base skin block
    ctx.fillRect(cx - 8, cy - 23, 16, 11);

    // F. Cute Spiky Hair & Eyes (The anime look is defined here!)
    ctx.fillStyle = char.hairColor; // Hinata: Bright Orange, Ushijima: Dark Purple-Brown/Olive, Partner: Black
    
    if (char.hairStyle === 'SPIKY') {
      // Draw 3 layers of spiky retro pixels!
      ctx.fillRect(cx - 9, cy - 26, 18, 4); // top flat crop
      ctx.fillRect(cx - 10, cy - 25, 2, 8); // left fringe
      ctx.fillRect(cx + 8, cy - 25, 2, 8);  // right fringe
      // Individual top spikes
      ctx.fillRect(cx - 6, cy - 29, 3, 3);
      ctx.fillRect(cx - 1, cy - 30, 3, 4);
      ctx.fillRect(cx + 4, cy - 28, 3, 2);
    } else if (char.hairStyle === 'WAVY') {
      // Oikawa's fluffy, wavy idol boy hair!
      ctx.fillRect(cx - 9, cy - 25, 18, 5);
      ctx.fillRect(cx - 8, cy - 27, 16, 3);
      // Soft wave fringes dropping over forehead
      ctx.fillRect(cx - 8, cy - 20, 2, 3);
      ctx.fillRect(cx - 2, cy - 21, 3, 4);
      ctx.fillRect(cx + 5, cy - 20, 2, 3);
    } else {
      // FLAT standard athletic short crop (e.g. Ushijima's strict crewcut)
      ctx.fillRect(cx - 9, cy - 25, 18, 4);
      ctx.fillRect(cx - 8, cy - 27, 16, 2);
    }

    // G. Eyes & Face Details
    const isGojo = char.name.toLowerCase().includes('gojo') || char.name.toLowerCase().includes('satoru');
    if (isGojo) {
      if (char.state === 'SPIKING') {
        // Celestial Six Eyes glowing electric blue!
        ctx.fillStyle = '#ffffff'; // white background glow
        ctx.fillRect(cx - 6, cy - 19, 3, 3);
        ctx.fillRect(cx + 3, cy - 19, 3, 3);
        ctx.fillStyle = '#0abde3'; // stunning bright sky blue iris
        ctx.fillRect(cx - 5, cy - 18, 2, 2);
        ctx.fillRect(cx + 4, cy - 18, 2, 2);

        // glowing halo borders
        ctx.fillStyle = 'rgba(0, 210, 211, 0.5)';
        ctx.fillRect(cx - 8, cy - 20, 2, 4);
        ctx.fillRect(cx + 6, cy - 20, 2, 4);
      } else {
        // High School round dark sunglasses
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 17);
        ctx.lineTo(cx + 7, cy - 17);
        ctx.stroke();

        ctx.fillStyle = '#1e272e'; // dark lenses
        ctx.fillRect(cx - 6, cy - 19, 3, 3);
        ctx.fillRect(cx + 3, cy - 19, 3, 3);
        // tiny glare on glasses
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(cx - 5, cy - 19, 1, 1);
        ctx.fillRect(cx + 4, cy - 19, 1, 1);
      }
    } else {
      ctx.fillStyle = '#ffffff'; // White of sclera
      ctx.fillRect(cx - 6, cy - 18, 3, 2);
      ctx.fillRect(cx + 3, cy - 18, 3, 2);

      // Pupil Iris colors: Hinata (bright energetic amber-brown), Others (strict black/dark-green)
      ctx.fillStyle = char.name.toLowerCase().includes('hinata') ? '#ff6b00' : '#1e272e';
      ctx.fillRect(cx - 5, cy - 18, 2, 2);
      ctx.fillRect(cx + 4, cy - 18, 2, 2);
    }

    // Determined eyebrows
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 19);
    ctx.lineTo(cx - 3, cy - 19);
    ctx.moveTo(cx + 2, cy - 19);
    ctx.lineTo(cx + 6, cy - 19);
    ctx.stroke();

    // Cute retro happy/nervous mouth
    if (char.state === 'STUNNED') {
      // Squiggly line mouth or wide round circle
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - 2, cy - 14, 4, 2);
    } else if (char.state === 'VICTORY') {
      // Big open laughing mouth!
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(cx, cy - 13, 3, 0, Math.PI);
      ctx.fill();
    } else {
      // Cute simple thin confident smile
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 14);
      ctx.lineTo(cx + 2, cy - 14);
      ctx.stroke();
    }

    // H. Little Sweat / Star / Emote bubble if high tension!
    if (char.state === 'STUNNED') {
      ctx.fillStyle = 'rgba(52, 152, 219, 0.9)'; // Blue sweat drops
      ctx.fillRect(cx - 14, cy - 26, 3, 3);
      ctx.fillRect(cx + 12, cy - 24, 2, 2);
    } else if (char.state === 'VICTORY') {
      ctx.fillStyle = '#f1c40f'; // Golden star sparkles
      ctx.fillRect(cx - 15, cy - 32, 3, 3);
      ctx.fillRect(cx + 14, cy - 30, 3, 3);
    }

    // I. Korai Custom Cursed Energy Spiking Animations - only keep the action speed/power traces
    if (isGojo && char.state === 'SPIKING') {
      // Action speed/power traces
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 7, cy - 25);
      ctx.lineTo(cx + 15, cy - 5);
      ctx.moveTo(cx + 12, cy - 18);
      ctx.lineTo(cx - 1, cy - 10);
      ctx.stroke();
    }
  }

  // Draw the spinning volleyball and its perfect 3D landing shadows
  static drawVolleyball(
    ctx: CanvasRenderingContext2D,
    ball: Ball,
    time: number
  ) {
    if (ball.received && !ball.hasBounced) {
      // It was successfully passed or and in flight
    }

    if (!ball.hideShadow) {
      // 1. Shadow: We project an ellipsis directly on the court floor
      // Shadow coordinates is target landing surface height (usually ground Y level where shadow was set)
      const baseShadowRadius = 15;
      // Shrink and fade as the height (z) increases to give pristine depth feeling!
      const heightFactor = Math.max(0.2, 1 - ball.z / 250);
      const shadowW = baseShadowRadius * heightFactor;
      const shadowH = baseShadowRadius * 0.4 * heightFactor;
      const shadowAlpha = 0.35 * heightFactor;

      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Landing Zone target Indicator on floor (predictive shrinking circle)
      if (!ball.received && !ball.missed) {
        const tX = ball.targetX !== undefined ? ball.targetX : ball.x;
        const tY = ball.targetY !== undefined ? ball.targetY : ball.shadowY;

        // Calculate shrink ratio: 1.0 when high, 0.0 when on ground
        const maxExpectedHeight = 200;
        const ratio = Math.max(0, Math.min(1, ball.z / maxExpectedHeight));
        
        // Circular ring shrinks from radius 20 down to 4 as ratio goes to 0
        const currentRadius = 6 + ratio * 36;

        ctx.save();
        // Customize color based on type
        let ringColor = 'rgba(240, 147, 43, 0.85)'; // Orange/Yellow
        if (ball.type === 'FAST') ringColor = 'rgba(235, 77, 75, 0.9)'; // Red
        else if (ball.type === 'KNUCKLE' || ball.type === 'FLOAT') ringColor = 'rgba(155, 89, 182, 0.9)'; // Purple
        else if (ball.type === 'CURVE') ringColor = 'rgba(0, 168, 255, 0.9)'; // Blue
        
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 2]); // stylish radar-like dashed ring
        ctx.beginPath();
        ctx.arc(tX, tY, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw solid center spot
        ctx.fillStyle = ringColor;
        ctx.globalAlpha = 0.35 * (1 - ratio * 0.5); // slightly more opaque as it descends
        ctx.beginPath();
        ctx.arc(tX, tY, 8, 0, Math.PI * 2);
        ctx.fill();

        // White crosshair target dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tX - 1.5, tY - 1.5, 3, 3);
        ctx.restore();
      }
    }

    // 3. Draw actual rotating Volleyball ball structure in flight (High-contrast yellow & blue curved panels)
    // Coordinate y is calculated: flat y position index subtracted by height z altitude!
    const ballY = ball.y - ball.z;
    const size = 12; // ball radius (perfect sleek retro ratio)

    // Core midnight-blue background fill
    ctx.fillStyle = '#0c2461'; 
    ctx.beginPath();
    ctx.arc(ball.x, ballY, size, 0, Math.PI * 2);
    ctx.fill();

    // Fill with base royal blue
    ctx.fillStyle = '#0984e3'; // Royal Blue
    ctx.beginPath();
    ctx.arc(ball.x, ballY, size - 1, 0, Math.PI * 2);
    ctx.fill();

    // Draw yellow curved panels (Mikasa curved swirl style!)
    ctx.fillStyle = '#f1c40f'; // Golden Yellow Mikasa panel
    const spin = time * 0.08;
    for (let i = 0; i < 3; i++) {
      const angle = spin + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(ball.x, ballY);
      
      // Beautiful math-drawn curved fan panel
      const cp1x = ball.x + Math.cos(angle + 0.4) * size * 1.25;
      const cp1y = ballY + Math.sin(angle + 0.4) * size * 1.25;
      const endX = ball.x + Math.cos(angle + 1.1) * size;
      const endY = ballY + Math.sin(angle + 1.1) * size;
      
      ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
      ctx.arc(ball.x, ballY, size - 0.5, angle + 1.1, angle + 1.7);
      ctx.lineTo(ball.x, ballY);
      ctx.fill();
    }

    // Draw the black/navy seam dividing lines
    ctx.strokeStyle = '#0c2461'; // midnight outline
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 3; i++) {
      const angle = spin + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(ball.x, ballY);
      
      const cp1x = ball.x + Math.cos(angle + 0.4) * size * 1.25;
      const cp1y = ballY + Math.sin(angle + 0.4) * size * 1.25;
      const endX = ball.x + Math.cos(angle + 1.1) * size;
      const endY = ballY + Math.sin(angle + 1.1) * size;
      
      ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
      ctx.stroke();
    }

    // Outer thick circle boundary stroke
    ctx.strokeStyle = '#0c2461';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(ball.x, ballY, size, 0, Math.PI * 2);
    ctx.stroke();

    // Glossy glass reflection/glare highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.arc(ball.x - size * 0.3, ballY - size * 0.3, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Render decorative game-state overlay lines (like HUD, Score, Power-meter)
  static drawHUD(
    ctx: CanvasRenderingContext2D,
    gameState: string,
    width: number,
    height: number,
    saves: number,
    neededSaves: number,
    stagePointsPlayer: number,
    stagePointsEnemy: number,
    infoBanner: string
  ) {
    if (gameState === 'LEVEL_1_PLAY') {
      // Clean, stylish retro level card overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(10, 10, 130, 26);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 130, 26);

      // Draw centered numeric score inside the box
      ctx.fillStyle = '#ff9f43';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${saves} / ${neededSaves}`, 75, 27);

      // Label for Gym Drills placed below the score box to prevent overlapping
      ctx.fillStyle = '#f1f2f6';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ GYM DRILLS PROGRESS', 12, 48);

      // Simple tutorial helper text at top-right
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(width - 130, 10, 120, 26);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(width - 130, 10, 120, 26);

      ctx.fillStyle = '#fffa65'; // gold color highlight
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[M / Z] to Receive', width - 70, 26);
    } else if (gameState === 'LEVEL_2_PLAY') {
      // Level 2 Play HUD is rendered using high-fidelity HTML/CSS overlay to support high-performance pulsing progress bars and real-time wind socks!
    }

    // Draw little floating instructional notification messages (e.g. "PERFECT!" "GOOD SPIN!")
    // Place this dialogue box form top of his head to just below the "[M / Z] to Receive" helper box
    if (infoBanner) {
      const boxWidth = 120;
      const boxHeight = 24;
      const boxX = width - 130;
      const boxY = 42; // placed elegantly just below the top-right tutorial box (which is at y=10, height=26)

      ctx.fillStyle = 'rgba(255, 107, 107, 0.95)'; // Energetic pastel red!
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(infoBanner, boxX + boxWidth / 2, boxY + 15);
    }
  }

  // Draw Particles (Sand trails, dusts, spark lines or floating letters like "GREAT!")
  static drawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[]
  ) {
    particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'SAND') {
        ctx.fillStyle = p.color;
        // sand granules shapes
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.type === 'ENERGY_TRAIL') {
        const rad = Math.max(1, p.size * alpha);
        const grad = ctx.createRadialGradient(p.x, p.y, rad * 0.1, p.x, p.y, rad * 1.5);
        grad.addColorStop(0, '#ffffff'); // pure white hot core
        grad.addColorStop(0.3, p.color); // glowing color
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'SPARK') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'HIT_SHOCK') {
        // Shockwave impact rings expanding
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - alpha) * 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'EMOTE' && p.label) {
        // Floating stylized text (like PERFECT / TOO LATE!)
        ctx.fillStyle = p.color;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        // simple background highlight for text legibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const tw = ctx.measureText(p.label).width;
        ctx.fillRect(p.x - tw/2 - 4, p.y - 10, tw + 8, 14);

        ctx.strokeStyle = p.color === '#fffa65' ? '#e67e22' : '#2c3e50';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - tw/2 - 4, p.y - 10, tw + 8, 14);

        ctx.fillStyle = p.color;
        ctx.fillText(p.label, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.restore();
    });
  }
}
