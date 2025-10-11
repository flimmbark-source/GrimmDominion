import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import Terrain from "./Terrain";
import Player3D from "./Player3D";
import { AnimatedFog, DayNightCycle, BiomeParticles, AmbientSound } from "./Effects";

const CAMERA_POSITION: [number, number, number] = [60, 80, 60];
const BIOME_PARTICLE_INSTANCES = 3;

const World3D = (): JSX.Element => {
  const [target, setTarget] = useState<Vector3 | null>(null);

  const handleSurfaceClick = useCallback((point: Vector3) => {
    setTarget(point);
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
