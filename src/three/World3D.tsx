import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import Terrain, { TERRAIN_SIZE } from "./Terrain";
import Player3D from "./Player3D";
import { AnimatedFog, DayNightCycle, BiomeParticles, AmbientSound } from "./Effects";
import type { HeroMoveEventDetail } from "../types";

const CAMERA_POSITION: [number, number, number] = [60, 80, 60];
const BIOME_PARTICLE_INSTANCES = 2;

const World3D = (): JSX.Element => {
  const [target, setTarget] = useState<Vector3 | null>(null);

  const handleSurfaceClick = useCallback((point: Vector3) => {
    setTarget(point);

    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const terrainSpan = TERRAIN_SIZE;
    const normalizedX = clamp(0.5 + (point.x - point.z) / (2 * terrainSpan));
    const normalizedY = clamp(0.5 + (point.x + point.z) / (2 * terrainSpan));
    const detail: HeroMoveEventDetail = {
      normalized: { x: normalizedX, y: normalizedY },
      world: { x: point.x, z: point.z }
    };

    window.dispatchEvent(new CustomEvent<HeroMoveEventDetail>("hero-move", { detail }));
  }, []);

  return (
    <Canvas orthographic camera={{ position: CAMERA_POSITION, zoom: 40 }} shadows>
      <Terrain onSurfaceClick={handleSurfaceClick} />
      <Player3D target={target} />
      <AnimatedFog />
      <DayNightCycle />
      {Array.from({ length: BIOME_PARTICLE_INSTANCES }).map((_, index) => (
        <BiomeParticles key={index} />
      ))}
      <AmbientSound />
      <OrbitControls enableRotate={false} enableZoom />
    </Canvas>
  );
};

export default World3D;
