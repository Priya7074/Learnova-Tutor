import * as THREE from 'three';
import * as xb from 'xrblocks';
import { store } from '../services/store.js';
import { formatSecondsToTime, performChronoScopedRag } from '../services/ragEngine.js';

export class SpatialClassroomScene extends xb.Script {
  private tutorOrb?: THREE.Mesh;
  private tutorGlow?: THREE.Mesh;
  private videoPlane?: THREE.Mesh;
  private canvasTexture?: THREE.CanvasTexture;
  private canvas?: HTMLCanvasElement;
  private canvasCtx?: CanvasRenderingContext2D | null;
  private timeText?: xb.UIText;
  private statusText?: xb.UIText;
  private responseText?: xb.UIText;
  private card?: xb.UICard;
  private clockTime: number = 0;

  init() {
    // 1. Scene Lighting
    this.add(new THREE.HemisphereLight(0xffffff, 0x1e1b4b, 3));
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight.position.set(2, 4, 1);
    this.add(dirLight);

    // 2. Animated AI Holographic Tutor Orb
    const orbGeometry = new THREE.IcosahedronGeometry(0.2, 4);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      metalness: 0.8,
      roughness: 0.1,
      wireframe: true,
    });
    this.tutorOrb = new THREE.Mesh(orbGeometry, orbMaterial);
    this.tutorOrb.position.set(0, 1.75, -1.3);
    this.add(this.tutorOrb);

    const glowGeometry = new THREE.SphereGeometry(0.14, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.75,
    });
    this.tutorGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.tutorOrb.add(this.tutorGlow);

    // 3. Floating 2D Canvas Display for Current Lecture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 576;
    this.canvasCtx = this.canvas.getContext('2d');
    this.canvasTexture = new THREE.CanvasTexture(this.canvas);
    this.updateVideoScreenCanvas();

    const videoGeo = new THREE.PlaneGeometry(1.2, 0.675);
    const videoMat = new THREE.MeshBasicMaterial({ map: this.canvasTexture });
    this.videoPlane = new THREE.Mesh(videoGeo, videoMat);
    this.videoPlane.position.set(-0.8, 1.45, -1.2);
    this.videoPlane.rotation.y = 0.25;
    this.add(this.videoPlane);

    // 4. Spatial UI Card with Chrono-Scoped AI Tutor
    this.timeText = new xb.UIText({
      text: `Timestamp Barrier: ${formatSecondsToTime(store.currentPlaybackTimestamp)}`,
      style: { fontSize: 16, fontWeight: 'bold', color: '#06b6d4' },
    });

    this.statusText = new xb.UIText({
      text: 'Chrono-Scoped RAG Active. Future lecture content (overfitting at 35:00) is locked.',
      style: { fontSize: 13, opacity: 0.85, lineHeight: 1.3 },
    });

    this.responseText = new xb.UIText({
      text: 'Ask the 3D AI Tutor about concepts covered up to this timestamp.',
      style: {
        fontSize: 14,
        lineHeight: 1.35,
        padding: 12,
        backgroundColor: '#0f172a',
        borderRadius: 12,
      },
    });

    const btnOverfitting = new xb.UIButton({
      label: 'Test 18:42 Overfitting Lock',
      icon: 'lock',
      style: { flexGrow: 1, height: 38 },
      onClick: () => {
        const rag = performChronoScopedRag('Explain overfitting', store.getActiveVideo(), store.currentPlaybackTimestamp, store.documents);
        this.responseText!.text = rag.answer;
        if (this.tutorGlow) {
          (this.tutorGlow.material as THREE.MeshBasicMaterial).color.set(0xf59e0b); // Amber for lock
        }
      },
    });

    const btnSupervised = new xb.UIButton({
      label: 'Ask Supervised (05:00)',
      icon: 'check',
      style: { flexGrow: 1, height: 38 },
      onClick: () => {
        const rag = performChronoScopedRag('What is supervised learning?', store.getActiveVideo(), store.currentPlaybackTimestamp, store.documents);
        this.responseText!.text = rag.answer;
        if (this.tutorGlow) {
          (this.tutorGlow.material as THREE.MeshBasicMaterial).color.set(0x10b981); // Emerald for unlocked
        }
      },
    });

    const btnUnlockFuture = new xb.UIButton({
      label: 'Jump to 35:00 & Unlock',
      icon: 'lock_open',
      style: { flexGrow: 1, height: 38 },
      onClick: () => {
        store.setPlaybackTimestamp(2100);
        this.timeText!.text = `Timestamp Barrier: 35:00`;
        const rag = performChronoScopedRag('Explain overfitting', store.getActiveVideo(), 2100, store.documents);
        this.responseText!.text = rag.answer;
        this.updateVideoScreenCanvas();
        if (this.tutorGlow) {
          (this.tutorGlow.material as THREE.MeshBasicMaterial).color.set(0x06b6d4);
        }
      },
    });

    this.card = new xb.UICard({
      size: { width: 0.72, height: 'auto' },
      manipulation: true,
      edge: true,
      style: { flexDirection: 'column', gap: 12, padding: 18, backgroundColor: '#020617' },
      children: [
        new xb.UIText({
          text: 'Learnova 3D AI Tutor',
          style: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
        }),
        this.timeText,
        this.statusText,
        this.responseText,
        new xb.UIPanel({
          style: { width: '100%', flexDirection: 'column', gap: 8 },
          children: [btnOverfitting, btnSupervised, btnUnlockFuture],
        }),
      ],
    });

    this.card.position.set(0.65, 1.45, -1.2);
    this.card.rotation.y = -0.25;
    this.add(this.card);
  }

  private updateVideoScreenCanvas() {
    if (!this.canvasCtx || !this.canvas) return;
    const ctx = this.canvasCtx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Header bar
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, w, 80);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('LEARNOVA SPATIAL LECTURE SCREEN', 40, 52);

    // Video Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Machine Learning Foundations', 40, 180);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px sans-serif';
    ctx.fillText('Supervised vs Unsupervised & Evaluation Checkpoints', 40, 230);

    // Current Timestamp Display
    const curTime = formatSecondsToTime(store.currentPlaybackTimestamp);
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(40, 280, 400, 100);

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 48px monospace';
    ctx.fillText(`PLAYBACK: ${curTime}`, 60, 348);

    // Rules
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '26px sans-serif';
    ctx.fillText('• Chrono-Scoped Video Barrier: Active', 40, 440);
    ctx.fillText('• Future content locked until playback advances', 40, 480);

    if (this.canvasTexture) {
      this.canvasTexture.needsUpdate = true;
    }
  }

  update() {
    this.clockTime += 0.02;
    if (this.tutorOrb) {
      this.tutorOrb.rotation.y += 0.015;
      this.tutorOrb.rotation.x += 0.008;
      this.tutorOrb.position.y = 1.75 + Math.sin(this.clockTime * 2) * 0.03;
    }
    if (this.tutorGlow) {
      const pulse = 0.12 + Math.sin(this.clockTime * 3) * 0.02;
      this.tutorGlow.scale.setScalar(pulse / 0.14);
    }
  }

  dispose() {
    this.canvasTexture?.dispose();
    this.tutorOrb?.geometry.dispose();
  }
}
