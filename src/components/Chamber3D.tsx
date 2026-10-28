import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MolecularSymbolItem, SimulationViewMode } from '../types';
import { MOLECULAR_STATES } from '../utils/encoder';
import { RotateCcw, ZoomIn, ZoomOut, Sparkles, Dna, Box, Atom } from 'lucide-react';

interface Chamber3DProps {
  symbols: MolecularSymbolItem[];
  mode: 'idle' | 'encoding' | 'stored' | 'retrieving' | 'verified';
  activeProgressIndex: number;
  onSelectSymbol?: (symbol: MolecularSymbolItem | null) => void;
  selectedSymbol: MolecularSymbolItem | null;
  speed: 'slow' | 'normal' | 'fast' | 'instant';
  setSpeed: (speed: 'slow' | 'normal' | 'fast' | 'instant') => void;
}

export const Chamber3D: React.FC<Chamber3DProps> = ({
  symbols,
  mode,
  activeProgressIndex,
  onSelectSymbol,
  selectedSymbol,
  speed,
  setSpeed,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const chamberGroupRef = useRef<THREE.Group | null>(null);
  const chainGroupRef = useRef<THREE.Group>(new THREE.Group());
  const scannerLightRef = useRef<THREE.PointLight | null>(null);
  const scannerMeshRef = useRef<THREE.Mesh | null>(null);
  const injectorBeamRef = useRef<THREE.Mesh | null>(null);
  const monomerMeshesRef = useRef<THREE.Mesh[]>([]);

  // Simulation View Mode: 'chamber' vs 'amino_chain'
  const [viewMode, setViewMode] = useState<SimulationViewMode>('chamber');
  const [hoveredMonomer, setHoveredMonomer] = useState<MolecularSymbolItem | null>(null);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      if (viewMode === 'amino_chain') {
        cameraRef.current.position.set(0, 0, 7.5);
      } else {
        cameraRef.current.position.set(0, 0, 9);
      }
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const zoomCamera = (delta: number) => {
    if (cameraRef.current && controlsRef.current) {
      const dir = new THREE.Vector3();
      cameraRef.current.getWorldDirection(dir);
      cameraRef.current.position.addScaledVector(dir, delta);
      controlsRef.current.update();
    }
  };

  // Toggle chamber visibility based on viewMode
  useEffect(() => {
    if (chamberGroupRef.current) {
      chamberGroupRef.current.visible = viewMode === 'chamber';
    }
    if (cameraRef.current && controlsRef.current) {
      if (viewMode === 'amino_chain') {
        cameraRef.current.position.set(0, 0.2, 7.5);
      } else {
        cameraRef.current.position.set(0, 0.5, 9);
      }
      controlsRef.current.update();
    }
  }, [viewMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x060913, 0.045);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    rimLight.position.set(-6, -4, -5);
    scene.add(rimLight);

    const chamberInternalLight = new THREE.PointLight(0x06b6d4, 1.5, 8);
    chamberInternalLight.position.set(0, 0, 0);
    scene.add(chamberInternalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.minPolarAngle = Math.PI * 0.12;
    controlsRef.current = controls;

    // Chamber Procedural Mesh Group
    const chamberGroup = new THREE.Group();
    chamberGroupRef.current = chamberGroup;

    const baseGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.5, 32);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.y = -3.25;
    chamberGroup.add(baseMesh);

    const baseRingGeo = new THREE.TorusGeometry(2.22, 0.04, 16, 48);
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const baseRingMesh = new THREE.Mesh(baseRingGeo, neonCyanMat);
    baseRingMesh.rotation.x = Math.PI / 2;
    baseRingMesh.position.y = -3.05;
    chamberGroup.add(baseRingMesh);

    const topCapGeo = new THREE.CylinderGeometry(2.1, 2.2, 0.5, 32);
    const topCapMesh = new THREE.Mesh(topCapGeo, metalMat);
    topCapMesh.position.y = 3.25;
    chamberGroup.add(topCapMesh);

    const nozzleGeo = new THREE.ConeGeometry(0.7, 0.8, 24);
    const darkNozzleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const nozzleMesh = new THREE.Mesh(nozzleGeo, darkNozzleMat);
    nozzleMesh.rotation.x = Math.PI;
    nozzleMesh.position.y = 2.85;
    chamberGroup.add(nozzleMesh);

    const glassGeo = new THREE.CylinderGeometry(2.0, 2.0, 5.8, 32, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: isSoftwareGl ? 0.25 : 0.18,
      roughness: 0.1,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.7,
      ior: 1.45,
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    chamberGroup.add(glassMesh);

    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.2, 16);
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.3,
    });
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.x = Math.cos(angle) * 2.15;
      strut.position.z = Math.sin(angle) * 2.15;
      chamberGroup.add(strut);
    }

    const beamGeo = new THREE.CylinderGeometry(0.05, 0.15, 5.6, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
    });
    const injectorBeam = new THREE.Mesh(beamGeo, beamMat);
    injectorBeam.visible = false;
    injectorBeamRef.current = injectorBeam;
    chamberGroup.add(injectorBeam);

    const scannerRingGeo = new THREE.TorusGeometry(1.85, 0.05, 16, 48);
    const scannerRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.8,
    });
    const scannerMesh = new THREE.Mesh(scannerRingGeo, scannerRingMat);
    scannerMesh.rotation.x = Math.PI / 2;
    scannerMesh.position.y = 2.6;
    scannerMesh.visible = false;
    scannerMeshRef.current = scannerMesh;
    chamberGroup.add(scannerMesh);

    const scannerLight = new THREE.PointLight(0x10b981, 2, 4);
    scannerLight.position.set(0, 2.6, 0);
    scannerLight.visible = false;
    scannerLightRef.current = scannerLight;
    chamberGroup.add(scannerLight);

    const gridHelixGeo = new THREE.BufferGeometry();
    const helixPoints: THREE.Vector3[] = [];
    for (let t = 0; t < 18 * Math.PI; t += 0.25) {
      const r = 1.35;
      const y = -2.6 + (t / (18 * Math.PI)) * 5.2;
      helixPoints.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
    }
    gridHelixGeo.setFromPoints(helixPoints);
    const helixLineMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.35,
    });
    const helixLine = new THREE.Line(gridHelixGeo, helixLineMat);
    chamberGroup.add(helixLine);

    scene.add(chamberGroup);
    scene.add(chainGroupRef.current);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(monomerMeshesRef.current);
      if (intersects.length > 0) {
        const item = intersects[0].object.userData.symbolItem as MolecularSymbolItem;
        if (item) setHoveredMonomer(item);
      } else {
        setHoveredMonomer(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(monomerMeshesRef.current);
      if (intersects.length > 0) {
        const item = intersects[0].object.userData.symbolItem as MolecularSymbolItem;
        if (item && onSelectSymbol) {
          onSelectSymbol(item);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (chainGroupRef.current) {
        if (mode === 'stored' || mode === 'verified' || mode === 'idle') {
          chainGroupRef.current.rotation.y += delta * 0.22;
        }
      }

      if (scannerMeshRef.current && scannerLightRef.current) {
        if (mode === 'retrieving') {
          scannerMeshRef.current.visible = true;
          scannerLightRef.current.visible = true;
          const scanY = 2.4 - ((elapsed * 1.5) % 4.8);
          scannerMeshRef.current.position.y = scanY;
          scannerLightRef.current.position.y = scanY;
        } else {
          scannerMeshRef.current.visible = false;
          scannerLightRef.current.visible = false;
        }
      }

      if (injectorBeamRef.current) {
        if (mode === 'encoding') {
          injectorBeamRef.current.visible = true;
          const beamMat = injectorBeamRef.current.material as THREE.MeshBasicMaterial;
          beamMat.opacity = 0.3 + Math.sin(elapsed * 12) * 0.2;
        } else {
          injectorBeamRef.current.visible = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Re-build 3D Chain when symbols, mode, activeProgressIndex, selectedSymbol, OR viewMode changes!
  useEffect(() => {
    const chainGroup = chainGroupRef.current;
    if (!chainGroup) return;

    while (chainGroup.children.length > 0) {
      const child = chainGroup.children[0];
      chainGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    monomerMeshesRef.current = [];

    if (symbols.length === 0) return;

    const displayCount = Math.min(symbols.length, 96);
    const heightSpan = 4.8;
    const startY = 2.4;
    const stepY = heightSpan / Math.max(displayCount, 1);
    const radius = viewMode === 'amino_chain' ? 1.05 : 1.15;
    const turns = 3.5;

    const newMeshes: THREE.Mesh[] = [];
    const prevPos = new THREE.Vector3();
    const caPoints: THREE.Vector3[] = [];

    const mats: Record<string, THREE.MeshStandardMaterial> = {
      A: new THREE.MeshStandardMaterial({
        color: MOLECULAR_STATES.A.hexColor,
        roughness: 0.25,
        metalness: 0.3,
        emissive: MOLECULAR_STATES.A.hexColor,
        emissiveIntensity: 0.35,
      }),
      B: new THREE.MeshStandardMaterial({
        color: MOLECULAR_STATES.B.hexColor,
        roughness: 0.25,
        metalness: 0.3,
        emissive: MOLECULAR_STATES.B.hexColor,
        emissiveIntensity: 0.35,
      }),
      C: new THREE.MeshStandardMaterial({
        color: MOLECULAR_STATES.C.hexColor,
        roughness: 0.25,
        metalness: 0.3,
        emissive: MOLECULAR_STATES.C.hexColor,
        emissiveIntensity: 0.35,
      }),
      D: new THREE.MeshStandardMaterial({
        color: MOLECULAR_STATES.D.hexColor,
        roughness: 0.25,
        metalness: 0.3,
        emissive: MOLECULAR_STATES.D.hexColor,
        emissiveIntensity: 0.35,
      }),
    };

    const nitrogenMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const oxygenMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const caMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35 });

    const geoA = new THREE.SphereGeometry(0.18, 16, 16);
    const geoB = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const geoC = new THREE.OctahedronGeometry(0.22);
    const geoD = new THREE.TetrahedronGeometry(0.24);

    for (let i = 0; i < displayCount; i++) {
      const sym = symbols[i];
      const t = (i / displayCount) * (turns * 2 * Math.PI);
      const x = Math.cos(t) * radius;
      const y = startY - i * stepY;
      const z = Math.sin(t) * radius;

      const currentPos = new THREE.Vector3(x, y, z);
      caPoints.push(currentPos);

      const isCurrentlyActive = i === activeProgressIndex;
      const isSelected = selectedSymbol?.id === sym.id;

      if (viewMode === 'chamber') {
        let geo: THREE.BufferGeometry = geoA;
        if (sym.symbol === 'B') geo = geoB;
        else if (sym.symbol === 'C') geo = geoC;
        else if (sym.symbol === 'D') geo = geoD;

        const mesh = new THREE.Mesh(geo, mats[sym.symbol].clone());
        mesh.position.copy(currentPos);
        mesh.userData = { symbolItem: sym, index: i };

        if (isSelected || isCurrentlyActive) {
          mesh.scale.set(1.5, 1.5, 1.5);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9;
        }

        if (mode === 'encoding') {
          if (i > activeProgressIndex) {
            mesh.visible = false;
          } else if (i === activeProgressIndex) {
            mesh.position.y = Math.min(mesh.position.y + 0.3, 2.7);
          }
        }

        chainGroup.add(mesh);
        newMeshes.push(mesh);

        if (i > 0 && mesh.visible) {
          const bondGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
          const bondMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.5,
            metalness: 0.2,
          });
          const bondMesh = new THREE.Mesh(bondGeo, bondMat);
          const midPoint = new THREE.Vector3().addVectors(prevPos, currentPos).multiplyScalar(0.5);
          const dist = prevPos.distanceTo(currentPos);

          bondMesh.position.copy(midPoint);
          bondMesh.scale.set(1, dist, 1);
          bondMesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3().subVectors(currentPos, prevPos).normalize()
          );

          chainGroup.add(bondMesh);
        }
      } else {
        const residueGroup = new THREE.Group();
        residueGroup.position.copy(currentPos);

        const caSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const caSphere = new THREE.Mesh(caSphereGeo, caMat);
        residueGroup.add(caSphere);

        const nSphereGeo = new THREE.SphereGeometry(0.09, 14, 14);
        const nSphere = new THREE.Mesh(nSphereGeo, nitrogenMat);
        nSphere.position.set(-0.16, 0.1, 0);
        residueGroup.add(nSphere);

        const cSphereGeo = new THREE.SphereGeometry(0.09, 14, 14);
        const cSphere = new THREE.Mesh(cSphereGeo, caMat);
        cSphere.position.set(0.16, -0.1, 0);
        residueGroup.add(cSphere);

        const oSphereGeo = new THREE.SphereGeometry(0.08, 14, 14);
        const oSphere = new THREE.Mesh(oSphereGeo, oxygenMat);
        oSphere.position.set(0.24, -0.22, 0);
        residueGroup.add(oSphere);

        const sideDir = new THREE.Vector3(x, 0, z).normalize().multiplyScalar(0.35);

        let sideGeo: THREE.BufferGeometry = new THREE.SphereGeometry(0.16, 16, 16);
        if (sym.symbol === 'A') {
          sideGeo = new THREE.SphereGeometry(0.16, 16, 16);
        } else if (sym.symbol === 'B') {
          sideGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.28, 12);
        } else if (sym.symbol === 'C') {
          sideGeo = new THREE.OctahedronGeometry(0.18);
        } else if (sym.symbol === 'D') {
          sideGeo = new THREE.CapsuleGeometry(0.1, 0.2, 4, 10);
        }

        const sideMesh = new THREE.Mesh(sideGeo, mats[sym.symbol].clone());
        sideMesh.position.copy(sideDir);
        sideMesh.userData = { symbolItem: sym, index: i };

        const scBondGeo = new THREE.CylinderGeometry(0.03, 0.03, sideDir.length(), 8);
        const scBondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        const scBond = new THREE.Mesh(scBondGeo, scBondMat);
        scBond.position.copy(sideDir).multiplyScalar(0.5);
        scBond.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          sideDir.clone().normalize()
        );
        residueGroup.add(scBond);
        residueGroup.add(sideMesh);

        if (isSelected || isCurrentlyActive) {
          sideMesh.scale.set(1.4, 1.4, 1.4);
          (sideMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.95;
        }

        if (mode === 'encoding') {
          if (i > activeProgressIndex) {
            residueGroup.visible = false;
          }
        }

        chainGroup.add(residueGroup);
        newMeshes.push(sideMesh);

        if (i > 0 && residueGroup.visible) {
          const peptBondGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
          const peptBondMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.3,
            metalness: 0.1,
          });
          const peptMesh = new THREE.Mesh(peptBondGeo, peptBondMat);
          const midPoint = new THREE.Vector3().addVectors(prevPos, currentPos).multiplyScalar(0.5);
          const dist = prevPos.distanceTo(currentPos);

          peptMesh.position.copy(midPoint);
          peptMesh.scale.set(1, dist, 1);
          peptMesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3().subVectors(currentPos, prevPos).normalize()
          );
          chainGroup.add(peptMesh);
        }
      }

      prevPos.copy(currentPos);
    }

    if (viewMode === 'amino_chain' && caPoints.length > 2) {
      const curve = new THREE.CatmullRomCurve3(caPoints);
      const tubeGeo = new THREE.TubeGeometry(curve, caPoints.length * 4, 0.045, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.2,
        roughness: 0.2,
        transparent: true,
        opacity: 0.75,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      chainGroup.add(tubeMesh);

      const nTermGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const nTermMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.5 });
      const nTermMesh = new THREE.Mesh(nTermGeo, nTermMat);
      nTermMesh.position.copy(caPoints[0]).add(new THREE.Vector3(0, 0.3, 0));
      chainGroup.add(nTermMesh);

      const cTermGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const cTermMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5 });
      const cTermMesh = new THREE.Mesh(cTermGeo, cTermMat);
      cTermMesh.position.copy(caPoints[caPoints.length - 1]).add(new THREE.Vector3(0, -0.3, 0));
      chainGroup.add(cTermMesh);
    }

    monomerMeshesRef.current = newMeshes;
  }, [symbols, mode, activeProgressIndex, selectedSymbol, viewMode]);

  return (
    <div className="relative w-full h-[400px] lg:h-[480px] bg-slate-950/90 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Top Header Overlay with View Switcher */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Dual View Mode Switcher */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 flex items-center shadow-lg text-xs font-mono">
            <button
              onClick={() => setViewMode('chamber')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'chamber'
                  ? 'bg-cyan-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Storage Chamber View (Containment vessel with synthesis injectors and cryo-matrix)"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Chamber View</span>
            </button>

            <button
              onClick={() => setViewMode('amino_chain')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'amino_chain'
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Amino Acid Chain View (Biochemical backbone ribbon, peptide bonds, and side chains Ala/Ser/Glu/Lys)"
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Amino Acid Chain</span>
            </button>
          </div>

          <div
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${
              mode === 'encoding'
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : mode === 'retrieving'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : mode === 'verified'
                ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200'
                : mode === 'stored'
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}
          >
            {mode}
          </div>
        </div>

        {/* Camera Tools */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => zoomCamera(1.2)}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomCamera(-1.2)}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset Camera View"
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hovered / Inspected Monomer HUD */}
      {hoveredMonomer && (
        <div className="absolute top-14 left-3 z-10 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl flex items-center gap-3">
          <div
            className="w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] text-slate-950"
            style={{ backgroundColor: hoveredMonomer.color }}
          >
            {hoveredMonomer.symbol}
          </div>
          <div>
            <div className="text-slate-200 font-medium text-[11px] flex items-center gap-1.5">
              <span>Residue #{hoveredMonomer.id + 1}: {MOLECULAR_STATES[hoveredMonomer.symbol].name}</span>
              <span className="text-cyan-400 font-bold">({hoveredMonomer.bitPair})</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              Sidechain: {MOLECULAR_STATES[hoveredMonomer.symbol].sideChainFormula} • {MOLECULAR_STATES[hoveredMonomer.symbol].property}
            </div>
          </div>
        </div>
      )}

      {/* View Information Pill */}
      {viewMode === 'amino_chain' && (
        <div className="absolute top-14 right-3 z-10 pointer-events-none bg-emerald-950/80 border border-emerald-800/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow">
          <Atom className="w-3.5 h-3.5 text-emerald-400" />
          <span>Polypeptide Backbone Ribbon (N→C Terminus)</span>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Speed Selector */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-xs font-mono shadow-lg">
          <span className="text-slate-400 text-[10px]">Speed:</span>
          {(['slow', 'normal', 'fast', 'instant'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                speed === s
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {s === 'slow' ? '0.5x' : s === 'normal' ? '1x' : s === 'fast' ? '3x' : 'Max'}
            </button>
          ))}
        </div>

        <div className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
          Rotate: Drag • Zoom: Scroll
        </div>
      </div>
    </div>
  );
};
