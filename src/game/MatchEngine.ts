/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Player, Team, MatchStats, WeatherType, DifficultyType } from '../types/football';
import { soundManager } from './StadiumSoundManager';

export interface MechanicalPlayer {
  id: string;
  name: string;
  role: 'FW' | 'MF' | 'DF' | 'GK';
  teamId: 'user' | 'ai';
  stats: any;
  jerseyNumber: number;
  
  // Physical properties
  x: number;
  z: number;
  vx: number;
  vz: number;
  stamina: number;
  
  // Visual reference
  group: THREE.Group;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
  bodyMesh?: THREE.Mesh;
  
  // States
  isGoalkeeper: boolean;
  isKicking: number; // timer count downwards
  isTackled: number; // cooldown
  isRunning: boolean;
  targetX: number;
  targetZ: number;
  defaultHomeX: number;
  defaultHomeZ: number;
}

export class MatchEngine {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  
  // Weather & Lights
  private dirLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private rainSystem: THREE.Points | null = null;
  private weather: WeatherType = 'sunny';
  private difficulty: DifficultyType = 'professional';
  
  // Game Objects
  private pitch!: THREE.Mesh;
  private ball!: THREE.Mesh;
  private ballPhys = {
    x: 0, y: 0.3, z: 0,
    vx: 0, vy: 0, vz: 0,
    radius: 0.28,
    lastKicker: null as MechanicalPlayer | null,
    inGoalCooldown: 0
  };

  private netA!: THREE.Group;
  private netB!: THREE.Group;
  
  // Players
  private players: MechanicalPlayer[] = [];
  private userSelectedPlayer: MechanicalPlayer | null = null;
  private arrowGuide!: THREE.Mesh;
  
  // Input direction from keyboard or joystick
  private inputDir = { x: 0, z: 0 };
  private isUserSprinting: boolean = false;
  
  // Game Logic State
  private userScore = 0;
  private aiScore = 0;
  private isRunning = false;
  private possessionTime = { user: 50, ai: 50, userTicks: 100, aiTicks: 100 };
  private matchStats: MatchStats = {
    possession: 50, shots: 0, shotsOnTarget: 0, passes: 0, completedPasses: 0, tackles: 0, fouls: 0, goals: 0
  };
  private aiTactic = '4-3-3';
  private userTactic = '4-3-3';

  // Callbacks
  private onGoalScored?: (scorerTeamId: 'user' | 'ai', scoreA: number, scoreB: number) => void;
  private onCommentary?: (text: string) => void;
  private onStatsUpdated?: (stats: MatchStats) => void;
  private onSelectedPlayerChanged?: (name: string, stamina: number) => void;

  // Replay System
  private replayFrames: any[] = [];
  private isReplayActive = false;
  private replayTimer = 0;
  private goalReplayTriggered = false;

  // Arena Dimensions
  private FIELD_W = 74;
  private FIELD_H = 46;
  private GOAL_W = 7.3;
  private GOAL_H = 2.4;
  private GOAL_Z = 37.0; // Left/Right limits on target line

  constructor(
    container: HTMLDivElement,
    settings: {
      userTeam: Team;
      aiTeam: Team;
      weather: WeatherType;
      difficulty: DifficultyType;
    }
  ) {
    this.container = container;
    this.weather = settings.weather;
    this.difficulty = settings.difficulty;
    this.userTactic = settings.userTeam.tactic || '4-3-3';
    this.aiTactic = settings.aiTeam.tactic || '4-3-3';
    
    this.setupThree(settings.userTeam.primaryColor, settings.aiTeam.primaryColor);
    this.createField();
    this.createBall();
    this.spawnPlayers(settings.userTeam, settings.aiTeam);
    this.setupWeather();
    
    this.selectClosestUserPlayer();
    this.isRunning = true;
    soundManager.startCrowd();
    soundManager.playWhistle(true);
    this.triggerCommentary("Kick-off! The match is underway in high atmosphere!");
  }

  public registerCallbacks(opts: {
    onGoal: (team: 'user' | 'ai', a: number, b: number) => void;
    onCommentary: (text: string) => void;
    onStats: (stats: MatchStats) => void;
    onSelectPlayer: (name: string, stamina: number) => void;
  }) {
    this.onGoalScored = opts.onGoal;
    this.onCommentary = opts.onCommentary;
    this.onStatsUpdated = opts.onStats;
    this.onSelectedPlayerChanged = opts.onSelectPlayer;
  }

  private setupThree(userCol: string, aiCol: string) {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;
    
    this.scene = new THREE.Scene();
    
    // Ambient / Environment Coloring
    if (this.weather === 'night') {
      this.scene.background = new THREE.Color('#030712');
      this.scene.fog = new THREE.FogExp2('#030712', 0.015);
      this.ambientLight = new THREE.AmbientLight('#1e293b', 0.82);
    } else if (this.weather === 'rainy') {
      this.scene.background = new THREE.Color('#334155');
      this.scene.fog = new THREE.FogExp2('#334155', 0.02);
      this.ambientLight = new THREE.AmbientLight('#475569', 0.6);
    } else {
      // Sunny
      this.scene.background = new THREE.Color('#075e2f');
      this.scene.fog = new THREE.FogExp2('#054020', 0.01);
      this.ambientLight = new THREE.AmbientLight('#fef08a', 0.85); // Warm yellow sunshine
    }
    this.scene.add(this.ambientLight);

    // Directional (Stadium / Solar light)
    this.dirLight = new THREE.DirectionalLight('#ffffff', 1.2);
    this.dirLight.position.set(20, 40, 10);
    this.scene.add(this.dirLight);

    // Camera - Broadcast Angle
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    this.camera.position.set(0, 22, 28);
    this.camera.lookAt(0, 0, 0);

    // Renderer - optimized for high-performance with lower pixel ratio limit
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);

    // Active Arrow indicator for selected user player
    const arrowGeom = new THREE.ConeGeometry(0.18, 0.45, 4);
    const arrowMat = new THREE.MeshBasicMaterial({ color: '#16a34a' });
    this.arrowGuide = new THREE.Mesh(arrowGeom, arrowMat);
    this.arrowGuide.rotation.x = Math.PI;
    this.scene.add(this.arrowGuide);
  }

  private createField() {
    // Beautiful Turf Grass with striping texture
    const pitchGeom = new THREE.PlaneGeometry(this.FIELD_W + 12, this.FIELD_H + 12);
    
    // Procedural striped canvas grass texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#155e27';
    ctx.fillRect(0,0,512,512);
    // Draw 8 light green stripes
    ctx.fillStyle = '#166534';
    for (let i = 0; i < 8; i += 2) {
      ctx.fillRect((i/8)*512, 0, (1/8)*512, 512);
    }
    // High-contrast pitch boundary marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 512-80, 512-80);
    // Center circle
    ctx.beginPath();
    ctx.arc(256, 256, 60, 0, Math.PI*2);
    ctx.stroke();
    // Center line
    ctx.beginPath();
    ctx.moveTo(256, 40);
    ctx.lineTo(256, 512-40);
    ctx.stroke();

    const text = new THREE.CanvasTexture(canvas);
    const pitchMat = new THREE.MeshLambertMaterial({ map: text, side: THREE.DoubleSide });
    
    this.pitch = new THREE.Mesh(pitchGeom, pitchMat);
    this.pitch.rotation.x = -Math.PI / 2;
    this.pitch.position.y = 0;
    this.scene.add(this.pitch);

    // White goalposts
    this.createGoalpost(-this.GOAL_Z, '#dc2626'); // Goal A (left side, defended by User usually)
    this.createGoalpost(this.GOAL_Z, '#2563eb');  // Goal B (right side, defended by AI)

    // Beautiful glowing stadium surroundings billboards / crowd lines
    this.buildStadiumMesh();
  }

  private createGoalpost(zPos: number, teamCol: string) {
    const postMat = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
    const barRadius = 0.08;

    const goalGroup = new THREE.Group();

    // Verticals
    const lPost = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, this.GOAL_H), postMat);
    lPost.position.set(-this.GOAL_W/2, this.GOAL_H/2, 0);
    
    const rPost = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, this.GOAL_H), postMat);
    rPost.position.set(this.GOAL_W/2, this.GOAL_H/2, 0);

    // Crossbar
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(barRadius, barRadius, this.GOAL_W), postMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, this.GOAL_H, 0);

    goalGroup.add(lPost, rPost, cross);

    // Net mesh (wireframe box behind goal line)
    const netGeom = new THREE.BoxGeometry(this.GOAL_W, this.GOAL_H, 1.8);
    const netMat = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.15 });
    const netMesh = new THREE.Mesh(netGeom, netMat);
    netMesh.position.set(0, this.GOAL_H/2, zPos < 0 ? -0.9 : 0.9);
    goalGroup.add(netMesh);

    goalGroup.position.set(0, 0, zPos);
    this.scene.add(goalGroup);

    if (zPos < 0) this.netA = goalGroup;
    else this.netB = goalGroup;
  }

  private buildStadiumMesh() {
    // Elegant concrete stand background ring
    const standGeom = new THREE.RingGeometry(this.FIELD_W * 0.7, this.FIELD_W * 0.85, 32);
    const standMat = new THREE.MeshLambertMaterial({ color: '#0f172a', side: THREE.DoubleSide, wireframe: false });
    const stands = new THREE.Mesh(standGeom, standMat);
    stands.rotation.x = -Math.PI / 2;
    stands.position.y = 1.8;
    this.scene.add(stands);

    // Glowing LED Ad boards at field bounds
    const adGeom = new THREE.BoxGeometry(this.FIELD_W + 4, 0.5, 0.15);
    const adMat = new THREE.MeshLambertMaterial({ color: '#1e293b' });
    const adBack = new THREE.Mesh(adGeom, adMat);
    adBack.position.set(0, 0.25, -this.FIELD_H/2 - 0.5);
    this.scene.add(adBack);

    const adFront = new THREE.Mesh(adGeom, adMat);
    adFront.position.set(0, 0.25, this.FIELD_H/2 + 0.5);
    this.scene.add(adFront);
  }

  private createBall() {
    const ballGeom = new THREE.SphereGeometry(this.ballPhys.radius, 12, 12);
    
    // Black and White high-fidelity soccer panel effect using custom procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,64,64);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(32, 32, 12, 0, Math.PI*2);
    ctx.fill();
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillRect(54, 0, 10, 10);
    ctx.fillRect(0, 54, 10, 10);
    ctx.fillRect(54, 54, 10, 10);

    const ballTex = new THREE.CanvasTexture(canvas);
    const ballMat = new THREE.MeshPhongMaterial({ map: ballTex, shininess: 32 });

    this.ball = new THREE.Mesh(ballGeom, ballMat);
    this.ball.position.set(0, this.ballPhys.radius, 0);
    this.scene.add(this.ball);
  }

  private setupWeather() {
    if (this.weather === 'rainy') {
      // Dynamic rain particle system
      const count = 1200;
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 110;
        pos[i+1] = Math.random() * 25;
        pos[i+2] = (Math.random() - 0.5) * 80;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const rainMat = new THREE.PointsMaterial({
        color: '#94a3b8',
        size: 0.12,
        transparent: true,
        opacity: 0.55
      });
      this.rainSystem = new THREE.Points(geom, rainMat);
      this.scene.add(this.rainSystem);
    }
  }

  private spawnPlayers(userTeam: Team, aiTeam: Team) {
    this.players = [];

    // Formations layout calculations
    const getFormationOffsets = (tactic: string, side: 'left' | 'right') => {
      const zDirection = side === 'left' ? -1 : 1;
      const positions: { role: 'FW' | 'MF' | 'DF' | 'GK'; rx: number; rz: number }[] = [];

      // 1 Goalkeeper
      positions.push({ role: 'GK', rx: 0, rz: 0.94 }); // near goalmouth

      if (tactic === '4-3-3') {
        // 4 Defenders
        positions.push({ role: 'DF', rx: -0.73, rz: 0.65 });
        positions.push({ role: 'DF', rx: -0.28, rz: 0.72 });
        positions.push({ role: 'DF', rx: 0.28, rz: 0.72 });
        positions.push({ role: 'DF', rx: 0.73, rz: 0.65 });
        // 3 Midfielders
        positions.push({ role: 'MF', rx: -0.45, rz: 0.38 });
        positions.push({ role: 'MF', rx: 0, rz: 0.42 });
        positions.push({ role: 'MF', rx: 0.45, rz: 0.38 });
        // 3 Forwards
        positions.push({ role: 'FW', rx: -0.65, rz: 0.15 });
        positions.push({ role: 'FW', rx: 0, rz: 0.08 });
        positions.push({ role: 'FW', rx: 0.65, rz: 0.15 });
      } else if (tactic === '3-5-2') {
        // 3 Defenders
        positions.push({ role: 'DF', rx: -0.5, rz: 0.72 });
        positions.push({ role: 'DF', rx: 0, rz: 0.76 });
        positions.push({ role: 'DF', rx: 0.5, rz: 0.72 });
        // 5 Midfielders
        positions.push({ role: 'MF', rx: -0.8, rz: 0.4 });
        positions.push({ role: 'MF', rx: -0.3, rz: 0.38 });
        positions.push({ role: 'MF', rx: 0, rz: 0.45 });
        positions.push({ role: 'MF', rx: 0.3, rz: 0.38 });
        positions.push({ role: 'MF', rx: 0.8, rz: 0.4 });
        // 2 Forwards
        positions.push({ role: 'FW', rx: -0.3, rz: 0.12 });
        positions.push({ role: 'FW', rx: 0.3, rz: 0.12 });
      } else {
        // default 4-4-2
        // 4 Defenders
        positions.push({ role: 'DF', rx: -0.73, rz: 0.65 });
        positions.push({ role: 'DF', rx: -0.25, rz: 0.72 });
        positions.push({ role: 'DF', rx: 0.25, rz: 0.72 });
        positions.push({ role: 'DF', rx: 0.73, rz: 0.65 });
        // 4 Midfielders
        positions.push({ role: 'MF', rx: -0.75, rz: 0.38 });
        positions.push({ role: 'MF', rx: -0.25, rz: 0.42 });
        positions.push({ role: 'MF', rx: 0.25, rz: 0.42 });
        positions.push({ role: 'MF', rx: 0.75, rz: 0.38 });
        // 2 Forwards
        positions.push({ role: 'FW', rx: -0.3, rz: 0.12 });
        positions.push({ role: 'FW', rx: 0.3, rz: 0.12 });
      }

      return positions.map(pos => ({
        role: pos.role,
        x: pos.rx * (this.FIELD_H * 0.9), // scaled
        z: pos.rz * zDirection * (this.GOAL_Z * 0.95) // scaled with field layout side
      }));
    };

    const userOffsets = getFormationOffsets(this.userTactic, 'left');
    const aiOffsets = getFormationOffsets(this.aiTactic, 'right');

    const createProceduralPlayerMesh = (teamColor: string, role: string, index: number) => {
      // Create beautifully clean cylinder body + ball head + moving limbs
      const mainGroup = new THREE.Group();

      const baseMaterial = new THREE.MeshLambertMaterial({ color: teamColor });
      const skinMaterial = new THREE.MeshLambertMaterial({ color: '#fbcfe8' }); // Soft pale coral skin
      const darkMaterial = new THREE.MeshLambertMaterial({ color: '#1e293b' }); // shorts / boots

      // Body (Shirt)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 1.1), baseMaterial);
      body.position.y = 1.1;
      mainGroup.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), skinMaterial);
      head.position.y = 1.85;
      mainGroup.add(head);

      // Hair or Cap accent (distinct color depending on player role/index)
      const hairMat = new THREE.MeshLambertMaterial({ color: index % 3 === 0 ? '#b45309' : (index % 3 === 1 ? '#1e293b' : '#ca8a04') });
      const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hairCap.position.y = 1.95;
      mainGroup.add(hairCap);

      // Left leg
      const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.75), darkMaterial);
      lLeg.position.set(-0.16, 0.37, 0);
      mainGroup.add(lLeg);

      // Right leg
      const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.75), darkMaterial);
      rLeg.position.set(0.16, 0.37, 0);
      mainGroup.add(rLeg);

      return { group: mainGroup, leftLeg: lLeg, rightLeg: rLeg, bodyMesh: body };
    };

    // Spawn User Team (Positions on Left, z < 0)
    for (let i = 0; i < 11; i++) {
        const template = userTeam.players[i] || { name: `User ${i}`, number: i+1, role: 'MF', currentStamina: 100, stats: { speed: 75, shooting: 75, passing: 75, defending: 75, stamina: 80, goalkeeping: 10, overall: 75 } };
        const offset = userOffsets[i];
        
        // Goalkeepers get Neon Yellow jersey
        const col = offset.role === 'GK' ? '#fbbf24' : userTeam.primaryColor;
        const visual = createProceduralPlayerMesh(col, offset.role, i);
        
        const mp: MechanicalPlayer = {
          id: `u_${i}`,
          name: template.name,
          role: offset.role,
          teamId: 'user',
          jerseyNumber: template.number,
          stats: template.stats,
          stamina: (template as any).currentStamina || 100,
          x: offset.x,
          z: offset.z,
          vx: 0,
          vz: 0,
          group: visual.group,
          leftLeg: visual.leftLeg,
          rightLeg: visual.rightLeg,
          bodyMesh: visual.bodyMesh,
          isGoalkeeper: offset.role === 'GK',
          isKicking: 0,
          isTackled: 0,
          isRunning: false,
          targetX: offset.x,
          targetZ: offset.z,
          defaultHomeX: offset.x,
          defaultHomeZ: offset.z
        };
        
        mp.group.position.set(mp.x, 0, mp.z);
        this.scene.add(mp.group);
        this.players.push(mp);
    }

    // Spawn AI Team (Positions on Right, z > 0)
    for (let i = 0; i < 11; i++) {
        const template = aiTeam.players[i] || { name: `Opponent ${i}`, number: i+1, role: 'MF', currentStamina: 100, stats: { speed: 75, shooting: 75, passing: 75, defending: 75, stamina: 80, goalkeeping: 10, overall: 75 } };
        const offset = aiOffsets[i];
        
        const col = offset.role === 'GK' ? '#ec4899' : aiTeam.primaryColor; // GK distinct color
        const visual = createProceduralPlayerMesh(col, offset.role, i);
        
        const mp: MechanicalPlayer = {
          id: `ai_${i}`,
          name: template.name,
          role: offset.role,
          teamId: 'ai',
          jerseyNumber: template.number,
          stats: template.stats,
          stamina: (template as any).currentStamina || 100,
          x: offset.x,
          z: offset.z,
          vx: 0,
          vz: 0,
          group: visual.group,
          leftLeg: visual.leftLeg,
          rightLeg: visual.rightLeg,
          bodyMesh: visual.bodyMesh,
          isGoalkeeper: offset.role === 'GK',
          isKicking: 0,
          isTackled: 0,
          isRunning: false,
          targetX: offset.x,
          targetZ: offset.z,
          defaultHomeX: offset.x,
          defaultHomeZ: offset.z
        };
        
        mp.group.position.set(mp.x, 0, mp.z);
        this.scene.add(mp.group);
        this.players.push(mp);
    }
  }

  private selectClosestUserPlayer() {
    let closest: MechanicalPlayer | null = null;
    let minDist = 999999;
    
    // Switch to nearest teammate to the ball (excluding GK if ball is far)
    this.players.forEach(p => {
      if (p.teamId === 'user') {
        const d = this.distSq(p.x, p.z, this.ballPhys.x, this.ballPhys.z);
        if (p.isGoalkeeper && d > 120) return; // avoid locking onto GK if ball is on opponent field
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }
    });

    if (closest && closest !== this.userSelectedPlayer) {
      this.userSelectedPlayer = closest;
      if (this.onSelectedPlayerChanged) {
        this.onSelectedPlayerChanged(this.userSelectedPlayer.name, this.userSelectedPlayer.stamina);
      }
    }
  }

  public manualSwitch() {
    // Manually switch active selection to another teammate
    let nextCandidate: MechanicalPlayer | null = null;
    let minDist = 999999;
    
    this.players.forEach(p => {
      if (p.teamId === 'user' && p !== this.userSelectedPlayer && !p.isGoalkeeper) {
        const d = this.distSq(p.x, p.z, this.ballPhys.x, this.ballPhys.z);
        if (d < minDist) {
          minDist = d;
          nextCandidate = p;
        }
      }
    });

    if (nextCandidate) {
      this.userSelectedPlayer = nextCandidate;
      if (this.onSelectedPlayerChanged) {
        this.onSelectedPlayerChanged(this.userSelectedPlayer.name, this.userSelectedPlayer.stamina);
      }
      this.triggerCommentary(`Cursor switched to ${this.userSelectedPlayer.name}`);
    }
  }

  // Interactive controls triggers
  public handleMove(dx: number, dz: number) {
    this.inputDir.x = dx;
    this.inputDir.z = dz;
  }

  public handleSprint(active: boolean) {
    this.isUserSprinting = active;
  }

  public handlePass() {
    if (!this.userSelectedPlayer) return;
    const distBall = this.dist(this.userSelectedPlayer.x, this.userSelectedPlayer.z, this.ballPhys.x, this.ballPhys.z);
    
    // Can only pass if close to the ball
    if (distBall < 1.6) {
      // Look for the best receiving teammate in the forward/passing direction
      let bestReceiver: MechanicalPlayer | null = null;
      let scoreMax = -99999;
      
      this.players.forEach(p => {
        if (p.teamId === 'user' && p !== this.userSelectedPlayer) {
          const d = this.dist(this.userSelectedPlayer!.x, this.userSelectedPlayer!.z, p.x, p.z);
          // Don't pass to someone 50m away
          if (d < 35 && d > 2) {
            // Priority to players in direction of input or progress downfield (positive Z is attacking)
            const dirX = p.x - this.userSelectedPlayer!.x;
            const dirZ = p.z - this.userSelectedPlayer!.z;
            
            // Score recipient suitability
            let suit = 100 - d; // closer is safer
            if (this.inputDir.x !== 0 || this.inputDir.z !== 0) {
              const dot = (dirX * this.inputDir.x + dirZ * this.inputDir.z); // align with controls
              suit += dot * 8;
            } else {
              // progressive pass downfield
              suit += dirZ * 1.5; 
            }
            if (suit > scoreMax) {
              scoreMax = suit;
              bestReceiver = p;
            }
          }
        }
      });

      const receiver = bestReceiver || this.players.find(p => p.teamId === 'user' && p !== this.userSelectedPlayer);
      if (receiver) {
        // Kick ball towards receiver
        const rx = receiver.x - this.ballPhys.x;
        const rz = receiver.z - this.ballPhys.z;
        const d = Math.max(0.1, Math.sqrt(rx*rx + rz*rz));
        
        // Pass power scaling
        const pSpeed = 12.0 + (d * 0.28);
        this.ballPhys.vx = (rx / d) * pSpeed;
        this.ballPhys.vz = (rz / d) * pSpeed;
        this.ballPhys.vy = 0.5; // low skip passage
        this.ballPhys.lastKicker = this.userSelectedPlayer;
        
        this.userSelectedPlayer.isKicking = 8; // kicking animation count
        soundManager.playKick();
        
        // Update stats
        this.matchStats.passes++;
        if (this.onStatsUpdated) this.onStatsUpdated(this.matchStats);
        
        this.triggerCommentary(`${this.userSelectedPlayer.name} keys a crisp pass to ${receiver.name}!`);
        
        // Anticipate selection change to receiver after 300ms
        setTimeout(() => {
          if (this.isRunning && receiver) {
            this.userSelectedPlayer = receiver;
            if (this.onSelectedPlayerChanged) {
              this.onSelectedPlayerChanged(receiver.name, receiver.stamina);
            }
          }
        }, 220);
      }
    } else {
      // Defensive slide tackle when away from ball
      this.triggerSlideTackle('user');
    }
  }

  public handleThroughBall() {
    if (!this.userSelectedPlayer) return;
    const distBall = this.dist(this.userSelectedPlayer.x, this.userSelectedPlayer.z, this.ballPhys.x, this.ballPhys.z);
    
    if (distBall < 1.6) {
      // Find a runner progressive down the pitch
      let runner: MechanicalPlayer | null = null;
      let maxZ = -999;
      this.players.forEach(p => {
        if (p.teamId === 'user' && p.role !== 'GK' && p !== this.userSelectedPlayer) {
          // Attacking is positive Z
          if (p.z > maxZ && (p.z - this.userSelectedPlayer!.z) > 1.5) {
            maxZ = p.z;
            runner = p;
          }
        }
      });

      if (!runner) {
        runner = this.players.find(p => p.teamId === 'user' && p !== this.userSelectedPlayer && p.role !== 'GK') || null;
      }

      if (runner) {
        // Kick into empty space ahead of the runner
        const leadDist = 6.0;
        const targetX = runner.x + runner.vx * 3.0;
        const targetZ = runner.z + leadDist; // play forward
        
        const rx = targetX - this.ballPhys.x;
        const rz = targetZ - this.ballPhys.z;
        const d = Math.max(0.1, Math.sqrt(rx*rx + rz*rz));
        
        this.ballPhys.vx = (rx / d) * 16.0;
        this.ballPhys.vz = (rz / d) * 16.0;
        this.ballPhys.vy = 1.1; // lofted slightly
        this.ballPhys.lastKicker = this.userSelectedPlayer;
        
        this.userSelectedPlayer.isKicking = 8;
        soundManager.playKick();
        
        this.matchStats.passes++;
        if (this.onStatsUpdated) this.onStatsUpdated(this.matchStats);
        this.triggerCommentary("Splendid through ball slicing the central defense lines!");
      }
    }
  }

  public handleShoot() {
    if (!this.userSelectedPlayer) return;
    const distBall = this.dist(this.userSelectedPlayer.x, this.userSelectedPlayer.z, this.ballPhys.x, this.ballPhys.z);
    
    if (distBall < 1.7) {
      // Shoot at opponent's goal mouth (Z = GOAL_Z)
      const targetGoalX = (Math.random() - 0.5) * (this.GOAL_W * 0.8);
      const targetGoalY = Math.random() * (this.GOAL_H * 0.9) + 0.2;
      const targetGoalZ = this.GOAL_Z; // Attacking end is positive Z line

      const rx = targetGoalX - this.ballPhys.x;
      const ry = targetGoalY - this.ballPhys.y;
      const rz = targetGoalZ - this.ballPhys.z;
      
      const d = Math.max(0.1, Math.sqrt(rx*rx + rz*rz));
      
      const shotS = 22.0 + (this.userSelectedPlayer.stats.shooting * 0.06); // scale shot power with player shoot stats
      
      this.ballPhys.vx = (rx / d) * shotS;
      this.ballPhys.vz = (rz / d) * shotS;
      this.ballPhys.vy = targetGoalY * 2.8; // arch height
      this.ballPhys.lastKicker = this.userSelectedPlayer;
      
      this.userSelectedPlayer.isKicking = 10;
      soundManager.playKick();
      
      this.matchStats.shots++;
      if (this.onStatsUpdated) this.onStatsUpdated(this.matchStats);
      
      this.triggerCommentary(`STUNNING VOLLEY FROM ${this.userSelectedPlayer.name.toUpperCase()}!`);
    } else {
      // Tackle or pressure when off-ball
      this.triggerSlideTackle('user');
    }
  }

  private triggerSlideTackle(teamId: 'user' | 'ai') {
    soundManager.playTackleSound();
    
    // Find closest opponent within range and knock ball free or stumble
    let carrier: MechanicalPlayer | null = null;
    let minDist = 2.2;
    const tackler = teamId === 'user' ? this.userSelectedPlayer : this.findClosestAIPlayerToBall();
    if (!tackler) return;

    this.players.forEach(p => {
      if (p.teamId !== teamId && !p.isGoalkeeper) {
        const d = this.dist(tackler.x, tackler.z, p.x, p.z);
        if (d < minDist) {
          minDist = d;
          carrier = p;
        }
      }
    });

    if (carrier) {
      // Tackle collision succeeds!
      (carrier as MechanicalPlayer).isTackled = 25; // momentary stumble freeze
      this.ballPhys.vx = (Math.random() - 0.5) * 8.0;
      this.ballPhys.vz = (teamId === 'user' ? 4 : -4) * 1.5; // kick ball in tackle direction
      this.ballPhys.vy = 0.5;
      
      this.matchStats.tackles++;
      if (this.onStatsUpdated) this.onStatsUpdated(this.matchStats);
      this.triggerCommentary(`Crucial slide tackle cleans the boots! Great defending.`);
    }
  }

  private triggerCommentary(text: string) {
    if (this.onCommentary) {
      this.onCommentary(text);
    }
  }

  private dist(x1: number, z1: number, x2: number, z2: number): number {
    return Math.sqrt((x1-x2)*(x1-x2) + (z1-z2)*(z1-z2));
  }
  
  private distSq(x1: number, z1: number, x2: number, z2: number): number {
    return (x1-x2)*(x1-x2) + (z1-z2)*(z1-z2);
  }

  private findClosestAIPlayerToBall(): MechanicalPlayer | null {
    let closest: MechanicalPlayer | null = null;
    let minDist = 999999;
    this.players.forEach(p => {
      if (p.teamId === 'ai') {
        const d = this.distSq(p.x, p.z, this.ballPhys.x, this.ballPhys.z);
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }
    });
    return closest;
  }

  // CORE ENGINE TICK - updates ball, player runs, AI routines, checks goals
  public tick(dt: number) {
    if (!this.isRunning) return;

    this.updateReplayRecording();

    if (this.isReplayActive) {
      this.runReplayPlaybackIteration();
      return;
    }

    // Weather particles animation (rain falling)
    if (this.rainSystem) {
      const positions = this.rainSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 18.0 * dt; // fall speed
        if (positions[i] < 0) {
          positions[i] = 22 + Math.random() * 8; // reset high
        }
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 1. UPDATE PHYSICAL BALL
    this.ballPhys.x += this.ballPhys.vx * dt;
    this.ballPhys.y += this.ballPhys.vy * dt;
    this.ballPhys.z += this.ballPhys.vz * dt;

    // Ball gravity & ground bounds bounce
    if (this.ballPhys.y > this.ballPhys.radius) {
      this.ballPhys.vy -= 9.8 * dt; // gravity
    } else {
      this.ballPhys.y = this.ballPhys.radius;
      this.ballPhys.vy = -this.ballPhys.vy * 0.58; // elastic coefficient field bounce
      
      // friction on grass (higher dynamic rain friction slide)
      const frict = this.weather === 'rainy' ? 0.94 : 0.86;
      this.ballPhys.vx *= Math.pow(frict, dt * 60);
      this.ballPhys.vz *= Math.pow(frict, dt * 60);
    }

    // Rotate ball mesh procedures depending on velocity
    const speed = Math.sqrt(this.ballPhys.vx * this.ballPhys.vx + this.ballPhys.vz * this.ballPhys.vz);
    if (speed > 0.1) {
      this.ball.rotation.z -= (this.ballPhys.vx / this.ballPhys.radius) * dt;
      this.ball.rotation.x += (this.ballPhys.vz / this.ballPhys.radius) * dt;
    }
    this.ball.position.set(this.ballPhys.x, this.ballPhys.y, this.ballPhys.z);

    // 2. CHECK BALL BOUNDARIES / OUT OF LIMITS / GOALS
    if (this.ballPhys.inGoalCooldown > 0) {
      this.ballPhys.inGoalCooldown -= dt;
    } else {
      this.checkGoalscoringEvents();
    }

    // Wrap ball inside fencing boundaries so action never halts completely
    if (Math.abs(this.ballPhys.x) > this.FIELD_H / 2 + 5) {
      this.ballPhys.vx = -this.ballPhys.vx * 0.8;
      this.ballPhys.x = Math.sign(this.ballPhys.x) * (this.FIELD_H / 2 + 4.9);
    }
    if (Math.abs(this.ballPhys.z) > this.GOAL_Z + 1.5) {
      // Behind goal line but not in goalmouth
      if (Math.abs(this.ballPhys.x) > this.GOAL_W/2) {
        this.ballPhys.vz = -this.ballPhys.vz * 0.5;
        this.ballPhys.z = Math.sign(this.ballPhys.z) * (this.GOAL_Z + 1.2);
        this.triggerCommentary("Ball hits wide! Goal kick awarded.");
      }
    }

    // 3. UPDATE PLAYER STATES, RUNNINGS & PHYSICS
    // Track cursor selector highlights
    this.selectClosestUserPlayer();
    
    this.players.forEach(p => {
      // Stumble cooldown decrement
      if (p.isTackled > 0) p.isTackled--;

      // Kicking animation countdown decrement to rest
      if (p.isKicking > 0) p.isKicking--;

      // USER input movement logic
      if (p.teamId === 'user' && p === this.userSelectedPlayer && p.isTackled <= 0) {
        // Human interactive analog controller response
        if (this.inputDir.x !== 0 || this.inputDir.z !== 0) {
          const runSp = this.isUserSprinting ? (4.2 + p.stats.speed * 0.05) : 3.0; // Sprint speed scale
          p.vx = this.inputDir.x * runSp;
          p.vz = this.inputDir.z * runSp;
          p.isRunning = true;
          
          // Stamina deplete during sprint action
          if (this.isUserSprinting && p.stamina > 5) {
            p.stamina -= dt * 2.8;
          }
        } else {
          p.vx = 0;
          p.vz = 0;
          p.isRunning = false;
        }
      } else {
        // SYSTEM ENGINE PROCEDURALS (AI Opponents & automated offscreen teammates)
        this.runAIAndTeammatesAutomations(p, dt);
      }

      // Physics integrate positional constraints
      p.x += p.vx * dt;
      p.z += p.vz * dt;

      // Restrict players strictly inside boundary fences
      p.x = Math.max(-this.FIELD_H / 2 - 1, Math.min(this.FIELD_H / 2 + 1, p.x));
      p.z = Math.max(-this.GOAL_Z - 0.5, Math.min(this.GOAL_Z + 0.5, p.z));

      // Synchronize Three.js drawing coords
      p.group.position.set(p.x, 0, p.z);

      // Rotate player body towards moving heading velocity
      const heading = Math.atan2(p.vx, p.vz);
      if (p.vx !== 0 || p.vz !== 0) {
        p.group.rotation.y = heading;
      }

      // Procedural running legs swinging cycle
      if (p.isRunning && p.leftLeg && p.rightLeg) {
        const cycle = Math.sin(Date.now() * 0.015);
        p.leftLeg.rotation.x = cycle * 0.55;
        p.rightLeg.rotation.x = -cycle * 0.55;
      } else if (p.leftLeg && p.rightLeg) {
        p.leftLeg.rotation.x = 0;
        p.rightLeg.rotation.x = 0;
      }
      
      // Kick extension visual rotation modifier
      if (p.isKicking > 0 && p.rightLeg) {
        p.rightLeg.rotation.x = -1.2; // raise right foot leg kick
      }

      // Close graze ball collision detection (Dribble handling)
      const dBall = this.dist(p.x, p.z, this.ballPhys.x, this.ballPhys.z);
      if (dBall < 1.15 && this.ballPhys.y < 1.05 && p.isTackled <= 0) {
        this.handlePlayerDribblePossession(p, dt);
      }
    });

    // Mirror indicator arrow guide over current active humanoid
    if (this.userSelectedPlayer) {
      this.arrowGuide.position.set(this.userSelectedPlayer.x, 3.2 + Math.sin(Date.now() * 0.01) * 0.15, this.userSelectedPlayer.z);
    }

    // Dynamic possession time updating
    this.updateLivePossessionStats(dt);

    this.renderWithCameraTracking();
  }

  private handlePlayerDribblePossession(p: MechanicalPlayer, dt: number) {
    // Keep ball closely glued to player feet center
    const speed = Math.sqrt(p.vx * p.vx + p.vz * p.vz);
    
    // offset forward slightly depending on orientation rotation direction
    const ox = Math.sin(p.group.rotation.y) * 0.72;
    const oz = Math.cos(p.group.rotation.y) * 0.72;

    this.ballPhys.x = p.x + ox;
    this.ballPhys.z = p.z + oz;
    
    // Smooth the ball speed to matches running speed
    this.ballPhys.vx = p.vx * 1.05;
    this.ballPhys.vz = p.vz * 1.05;
    
    if (this.ballPhys.y < 0.4) {
      this.ballPhys.y = this.ballPhys.radius + 0.02;
    }

    this.ballPhys.lastKicker = p;
  }

  private runAIAndTeammatesAutomations(p: MechanicalPlayer, dt: number) {
    if (p.isTackled > 0) {
      p.vx = 0;
      p.vz = 0;
      p.isRunning = false;
      return;
    }

    const dBall = this.dist(p.x, p.z, this.ballPhys.x, this.ballPhys.z);

    // GOAL KEEPER AUTOMATED INTERCEPTS GOALMOUTH
    if (p.isGoalkeeper) {
      const gSide = p.teamId === 'user' ? -this.GOAL_Z : this.GOAL_Z;
      p.targetZ = gSide;
      
      // Mirror ball X displacement with soft speed clamp inside goalmouth limits
      const ballDiffX = this.ballPhys.x;
      p.targetX = Math.max(-this.GOAL_W / 1.8, Math.min(this.GOAL_W / 1.8, ballDiffX));

      // Dive intercept trigger if high danger ball is incoming!
      const distToGoalLineY = Math.abs(this.ballPhys.z - gSide);
      if (distToGoalLineY < 12.0 && Math.abs(this.ballPhys.x) < this.GOAL_W * 1.5) {
        // move quick
        const diveS = 6.2;
        p.vx = Math.sign(p.targetX - p.x) * diveS;
        p.vz = Math.sign(p.targetZ - p.z) * diveS;
        p.isRunning = true;
        
        // parry ball if extremely close
        if (dBall < 2.0 && this.ballPhys.inGoalCooldown <= 0) {
          this.ballPhys.vx = (Math.random() - 0.5) * 15.0; // punching clear
          this.ballPhys.vz = (p.teamId === 'user' ? 14.0 : -14.0); // reverse Z back upfield
          this.ballPhys.vy = 2.4; // elevated clear
          p.isKicking = 12;
          soundManager.playKick();
          this.triggerCommentary(`PHENOMENAL SAVE BY THE GOALKEEPER ${p.name.toUpperCase()}! Clear punch.`);
        }
      } else {
        // Return leisurely to goal center origin positioning
        const returnS = 2.8;
        p.vx = (p.targetX - p.x) * returnS;
        p.vz = (p.targetZ - p.z) * returnS;
        p.isRunning = (Math.abs(p.vx) + Math.abs(p.vz)) > 0.2;
      }
      return;
    }

    // ACTIVE TEAM AI OPPONENTS & AUTOMATED SQUAD teammates
    const ballInsideUserAttackingThird = this.ballPhys.z > 10;
    const isBallCarrier = (this.ballPhys.lastKicker === p && dBall < 1.4);

    let speedCap = 3.2;
    if (this.difficulty === 'superstar' && p.teamId === 'ai') speedCap = 4.4; // boost difficulty factor
    if (this.difficulty === 'amateur' && p.teamId === 'ai') speedCap = 2.4;

    if (p.teamId === 'ai') {
      // AI PLAY ROUTINE
      if (dBall < 13.0 && !isBallCarrier) {
        // Chaser routine - converge ball
        p.targetX = this.ballPhys.x;
        p.targetZ = this.ballPhys.z;
        p.vx = Math.sign(p.targetX - p.x) * speedCap;
        p.vz = Math.sign(p.targetZ - p.z) * speedCap;
        p.isRunning = true;

        // Perform clean defensive slides if close to user
        if (dBall < 1.5) {
          const uCarrier = this.userSelectedPlayer;
          if (uCarrier && this.dist(p.x, p.z, uCarrier.x, uCarrier.z) < 1.4) {
            if (Math.random() < 0.12) this.triggerSlideTackle('ai');
          }
        }
      } else if (isBallCarrier) {
        // Dribble attacking downfield (Negative Z is AI's goal, positive Z is User's goal! Let's say User defends Z < 0, attacks Z > 0; Opponent defends Z > 0, attacks Z < 0)
        // Adjust attacking direction coordinates: User shoots towards relative positive GOAL_Z. AI shoots towards relative negative GOAL_Z (-this.GOAL_Z).
        p.vx = (Math.random() - 0.5) * 1.5;
        p.vz = -speedCap * 1.1; // head to user goal mouth !
        p.isRunning = true;

        // Shoot trigger when inside box bounds
        const dGoal = this.dist(p.x, p.z, 0, -this.GOAL_Z);
        if (dGoal < 16.0) {
          // shoot!
          const targetGoalX = (Math.random() - 0.5) * (this.GOAL_W * 0.7);
          const rx = targetGoalX - this.ballPhys.x;
          const rz = -this.GOAL_Z - this.ballPhys.z;
          const d = Math.max(0.1, Math.sqrt(rx*rx + rz*rz));
          
          this.ballPhys.vx = (rx/d) * 19.0;
          this.ballPhys.vz = (rz/d) * 19.0;
          this.ballPhys.vy = 1.8;
          this.ballPhys.lastKicker = p;
          
          p.isKicking = 8;
          soundManager.playKick();
          
          this.matchStats.shots++;
          if (this.onStatsUpdated) this.onStatsUpdated(this.matchStats);
          this.triggerCommentary(`Opponent striker cracks a dangerous shot from distant bounds!`);
        } else {
          // Pass with random chance upfield
          if (Math.random() < 0.02) {
            // pass to a teammate closer to User's goal
            let passTarget: MechanicalPlayer | null = null;
            this.players.forEach(oth => {
              if (oth.teamId === 'ai' && oth !== p && oth.z < p.z && !oth.isGoalkeeper) {
                passTarget = oth;
              }
            });
            if (passTarget) {
              const rx = (passTarget as MechanicalPlayer).x - this.ballPhys.x;
              const rz = (passTarget as MechanicalPlayer).z - this.ballPhys.z;
              const d = Math.max(0.1, Math.sqrt(rx*rx + rz*rz));
              this.ballPhys.vx = (rx / d) * 13.0;
              this.ballPhys.vz = (rz / d) * 13.0;
              this.ballPhys.vy = 0.5;
              this.ballPhys.lastKicker = p;
              p.isKicking = 8;
              soundManager.playKick();
              this.triggerCommentary("Superb pass build up from the opposition!");
            }
          }
        }
      } else {
        // Return leisurely towards tactical home formations coordinate
        const rx = p.defaultHomeX - p.x;
        const rz = p.defaultHomeZ - p.z;
        const d = Math.sqrt(rx*rx + rz*rz);
        if (d > 2.0) {
          p.vx = (rx / d) * (speedCap * 0.75);
          p.vz = (rz / d) * (speedCap * 0.75);
          p.isRunning = true;
        } else {
          p.vx = 0;
          p.vz = 0;
          p.isRunning = false;
        }
      }
    } else {
      // USER AUTOMATED TEAMMATES (off-ball runs)
      if (dBall < 11.0 && p !== this.userSelectedPlayer) {
        // Automatic pressure/chase if close enough to help
        p.vx = Math.sign(this.ballPhys.x - p.x) * speedCap;
        p.vz = Math.sign(this.ballPhys.z - p.z) * speedCap;
        p.isRunning = true;
      } else {
        // Attacking or Defensive positioning
        let targetZ = p.defaultHomeZ;
        if (this.ballPhys.z > 0) {
          targetZ += 5.0; // push up support
        } else {
          targetZ -= 3.0; // drop deep backup
        }
        
        const rx = p.defaultHomeX - p.x;
        const rz = targetZ - p.z;
        const d = Math.sqrt(rx*rx + rz*rz);
        if (d > 2.5) {
          p.vx = (rx / d) * 2.5;
          p.vz = (rz / d) * 2.5;
          p.isRunning = true;
        } else {
          p.vx = 0;
          p.vz = 0;
          p.isRunning = false;
        }
      }
    }
  }

  private checkGoalscoringEvents() {
    // Left side goal defended by user, Goalmouth at Z = -this.GOAL_Z
    // Right side goal defended by AI, Goalmouth at Z = this.GOAL_Z
    const inGoalWidth = Math.abs(this.ballPhys.x) < this.GOAL_W / 2;
    const inGoalHeight = this.ballPhys.y < this.GOAL_H + 0.3;

    if (inGoalWidth && inGoalHeight) {
      if (this.ballPhys.z > this.GOAL_Z && this.ballPhys.z < this.GOAL_Z + 1.8) {
        // ball passes through AI's goal => GOAL !! User scores!
        this.triggerGoalEvent('user');
      } else if (this.ballPhys.z < -this.GOAL_Z && this.ballPhys.z > -this.GOAL_Z - 1.8) {
        // ball passes through User's goal => Opposition scores!
        this.triggerGoalEvent('ai');
      }
    }
  }

  private triggerGoalEvent(scoringTeam: 'user' | 'ai') {
    this.ballPhys.inGoalCooldown = 6.0; // Prevent repetitive scoring while visual animation executes
    soundManager.playGoalCelebration();
    soundManager.playWhistle(true);

    if (scoringTeam === 'user') {
      this.userScore++;
      this.triggerCommentary("GOOOOOOOOAL!!!!! UNBELIEVABLE FINISH INTO THE TOP NET!");
    } else {
      this.aiScore++;
      this.triggerCommentary("GOAL! The opposition exploits details in defensive blocks and slots it home.");
    }

    if (this.onGoalScored) {
      this.onGoalScored(scoringTeam, this.userScore, this.aiScore);
    }

    // Trigger instant replay!
    this.triggerCinematicGoalReplay();
  }

  private triggerCinematicGoalReplay() {
    this.isReplayActive = true;
    this.replayTimer = 0;
    this.goalReplayTriggered = true;
    this.triggerCommentary("[REPLAY] Beautiful slow motion goal capture replay starting.");
  }

  private updateReplayRecording() {
    if (this.isReplayActive) return;

    // Maintain circular buffer of recent frames (max 200 ticks = ~4 seconds)
    const frame = {
      ballPos: { x: this.ballPhys.x, y: this.ballPhys.y, z: this.ballPhys.z },
      playerPositions: {} as any
    };

    this.players.forEach(p => {
      frame.playerPositions[p.id] = { x: p.x, z: p.z, isRunning: p.isRunning, isKicking: p.isKicking > 0 };
    });

    this.replayFrames.push(frame);
    if (this.replayFrames.length > 200) {
      this.replayFrames.shift();
    }
  }

  private runReplayPlaybackIteration() {
    this.replayTimer += 1.8; // play slightly faster or custom scale frame pacing
    const frameIdx = Math.floor(this.replayTimer);

    if (frameIdx >= this.replayFrames.length) {
      // Replay completed! Exit and reset ball position to center field kickoff
      this.isReplayActive = false;
      this.goalReplayTriggered = false;
      this.replayFrames = [];
      this.resetMatchKickoff();
      return;
    }

    const frame = this.replayFrames[frameIdx];

    // Apply frame positioning to components
    this.ball.position.set(frame.ballPos.x, frame.ballPos.y, frame.ballPos.z);
    
    this.players.forEach(p => {
      const pos = frame.playerPositions[p.id];
      if (pos) {
        p.group.position.set(pos.x, 0, pos.z);
        
        // swing replay legs
        if (pos.isRunning && p.leftLeg && p.rightLeg) {
          const cycle = Math.sin(frameIdx * 0.35);
          p.leftLeg.rotation.x = cycle * 0.45;
          p.rightLeg.rotation.x = -cycle * 0.45;
        }
      }
    });

    // Make camera slowly circle the ball majestically
    const angle = frameIdx * 0.045;
    this.camera.position.set(
      frame.ballPos.x + Math.sin(angle) * 11.0,
      frame.ballPos.y + 4.5,
      frame.ballPos.z + Math.cos(angle) * 11.0
    );
    this.camera.lookAt(frame.ballPos.x, frame.ballPos.y, frame.ballPos.z);
    this.renderer.render(this.scene, this.camera);
  }

  private resetMatchKickoff() {
    // Put ball at center grass
    this.ballPhys.x = 0;
    this.ballPhys.y = 12; // spawn in air for cool bounce kickoff
    this.ballPhys.z = 0;
    this.ballPhys.vx = 0;
    this.ballPhys.vy = 0;
    this.ballPhys.vz = 0;
    this.ballPhys.lastKicker = null;
    this.ballPhys.inGoalCooldown = 0;

    // Reset player formations position
    this.players.forEach(p => {
      p.x = p.defaultHomeX;
      p.z = p.defaultHomeZ;
      p.vx = 0;
      p.vz = 0;
      p.isRunning = false;
      p.isTackled = 0;
      p.isKicking = 0;
      p.group.position.set(p.x, 0, p.z);
    });

    soundManager.playWhistle(false);
    this.triggerCommentary("We restart from the center circle!");
  }

  private updateLivePossessionStats(dt: number) {
    if (!this.ballPhys.lastKicker) return;
    const team = this.ballPhys.lastKicker.teamId;
    if (team === 'user') this.possessionTime.userTicks++;
    else this.possessionTime.aiTicks++;

    const total = this.possessionTime.userTicks + this.possessionTime.aiTicks;
    this.matchStats.possession = Math.round((this.possessionTime.userTicks / total) * 100);
    
    if (this.onStatsUpdated) this.onStatsUpdated(this.matchStats);
  }

  private renderWithCameraTracking() {
    if (this.isReplayActive) return; // handled in custom playback frame update

    // Broadcast standard camera tracking the ball
    // Gently interpolate camera position to ensure cinematic flow
    const targetCamX = this.ballPhys.x * 0.75;
    const targetCamY = 16.5 + Math.abs(this.ballPhys.vx) * 0.12; // subtle zoom dynamic with power kick speed
    const targetCamZ = this.ballPhys.z * 0.65 + 17.5; // keep offset downfield

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;

    this.camera.lookAt(this.ballPhys.x * 0.85, this.ballPhys.y * 0.3, this.ballPhys.z * 0.85);

    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public testForces() {
    // Add simple drift
    if (this.ballPhys.y < 0.5) {
      this.ballPhys.vx += (Math.random() - 0.5) * 4;
      this.ballPhys.vz += (Math.random() - 0.5) * 4;
    }
  }

  public getPlayersList() {
    return this.players;
  }

  public getBallPhys() {
    return this.ballPhys;
  }

  public getActivePlayer() {
    return this.userSelectedPlayer;
  }

  public cleanup() {
    this.isRunning = false;
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
