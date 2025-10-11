import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  MathUtils,
  PointsMaterial,
} from "three";

const FOG_DAY_COLOR = new Color(0x6f7e8c);
const FOG_NIGHT_COLOR = new Color(0x202733);
const SUN_COLOR = new Color(0xfff2c1);
const MOON_COLOR = new Color(0x6aa1ff);
const AMBIENT_DAY_COLOR = new Color(0xf0f6ff);
const AMBIENT_NIGHT_COLOR = new Color(0x1a1f26);

const FOG_DENSITY_RANGE: [number, number] = [0.003, 0.012];
const LIGHT_UPDATE_INTERVAL = 0.05;

const AnimatedFog = (): null => {
  const { scene } = useThree();
  const fogRef = useRef<FogExp2 | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const previousFog = scene.fog;
    const previousBackground = scene.background;
    const fog = new FogExp2(FOG_NIGHT_COLOR.clone(), FOG_DENSITY_RANGE[0] * 1.5);
    fogRef.current = fog;
    scene.fog = fog;
    scene.background = fog.color;

    return () => {
      fogRef.current = null;
      scene.fog = previousFog ?? null;
      scene.background = previousBackground ?? null;
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (!fogRef.current) {
      return;
    }

    timeRef.current += delta;
    const cycle = (Math.sin(timeRef.current * 0.1) + 1) / 2;
    fogRef.current.density = MathUtils.lerp(FOG_DENSITY_RANGE[0], FOG_DENSITY_RANGE[1], cycle);
    fogRef.current.color.lerpColors(FOG_NIGHT_COLOR, FOG_DAY_COLOR, cycle);
  });

  return null;
};

const DayNightCycle = (): JSX.Element => {
  const directionalLightRef = useRef<DirectionalLight>(null);
  const ambientLightRef = useRef<AmbientLight>(null);
  const timeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const sunColorBuffer = useMemo(() => new Color(), []);
  const ambientColorBuffer = useMemo(() => new Color(), []);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.1;
    accumulatorRef.current += delta;

    if (accumulatorRef.current < LIGHT_UPDATE_INTERVAL) {
      return;
    }

    accumulatorRef.current = 0;
    const angle = timeRef.current % (Math.PI * 2);
    const daylight = (Math.sin(angle) + 1) / 2;

    if (directionalLightRef.current) {
      const directional = directionalLightRef.current;
      const radius = 60;
      directional.position.set(
        Math.cos(angle) * radius,
        MathUtils.lerp(10, 40, daylight),
        Math.sin(angle) * radius,
      );
      directional.intensity = MathUtils.lerp(0.35, 1.1, daylight);
      directional.color.copy(
        sunColorBuffer.copy(MOON_COLOR).lerp(SUN_COLOR, daylight),
      );
    }

    if (ambientLightRef.current) {
      const ambient = ambientLightRef.current;
      ambient.intensity = MathUtils.lerp(0.2, 0.5, daylight);
      ambient.color.copy(
        ambientColorBuffer.copy(AMBIENT_NIGHT_COLOR).lerp(AMBIENT_DAY_COLOR, daylight),
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.3} />
      <directionalLight
        ref={directionalLightRef}
        intensity={0.8}
        position={[30, 30, 30]}
        castShadow={false}
      />
    </>
  );
};

type ParticleVariant = {
  key: string;
  count: number;
  spread: [number, number, number];
  position: [number, number, number];
  color: Color;
  size: number;
  baseOpacity: number;
  opacityVariance: number;
  speed: number;
};

const PARTICLE_VARIANTS: ParticleVariant[] = [
  {
    key: "forest-fireflies",
    count: 80,
    spread: [40, 12, 40],
    position: [0, 6, 0],
    color: new Color(0xfff7a1),
    size: 0.4,
    baseOpacity: 0.75,
    opacityVariance: 0.15,
    speed: 1.6,
  },
  {
    key: "swamp-mist",
    count: 110,
    spread: [50, 5, 50],
    position: [0, 2, 0],
    color: new Color(0xa2ffdd),
    size: 1.6,
    baseOpacity: 0.35,
    opacityVariance: 0.2,
    speed: 0.8,
  },
  {
    key: "hill-dust",
    count: 90,
    spread: [60, 8, 60],
    position: [0, 3, 0],
    color: new Color(0xf0d7a6),
    size: 1.1,
    baseOpacity: 0.45,
    opacityVariance: 0.1,
    speed: 1.2,
  },
];

const BiomeParticles = (): JSX.Element => {
  const groupRef = useRef<Group>(null);
  const materialRefs = useRef<Record<string, PointsMaterial | null>>({});
  const timeRef = useRef(0);
  const phases = useMemo(
    () => PARTICLE_VARIANTS.map(() => Math.random() * Math.PI * 2),
    [],
  );

  const positionArrays = useMemo(() => {
    return PARTICLE_VARIANTS.map((variant) => {
      const positions = new Float32Array(variant.count * 3);

      for (let i = 0; i < variant.count; i += 1) {
        const x = (Math.random() - 0.5) * variant.spread[0];
        const y = Math.random() * variant.spread[1];
        const z = (Math.random() - 0.5) * variant.spread[2];
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }

      return positions;
    });
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;

    PARTICLE_VARIANTS.forEach((variant, index) => {
      const material = materialRefs.current[variant.key];
      if (!material) {
        return;
      }

      const cycle = (Math.sin(timeRef.current * variant.speed + phases[index]) + 1) / 2;
      const minOpacity = Math.max(0, variant.baseOpacity - variant.opacityVariance);
      const maxOpacity = Math.min(1, variant.baseOpacity + variant.opacityVariance);
      material.opacity = MathUtils.lerp(minOpacity, maxOpacity, cycle);
    });

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {PARTICLE_VARIANTS.map((variant, index) => (
        <points key={variant.key} position={variant.position} frustumCulled>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={positionArrays[index]}
              count={positionArrays[index].length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={(material) => {
              materialRefs.current[variant.key] = material;
            }}
            color={variant.color}
            size={variant.size}
            transparent
            opacity={variant.baseOpacity}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
};

const AmbientSound = (): null => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = new Audio("/sounds/forest_ambience.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    let stopped = false;

    const play = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.warn("AmbientSound: playback prevented", error);
      }
    };

    void play();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        audio.pause();
      } else if (!stopped) {
        void play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      audio.pause();
      audio.src = "";
    };
  }, []);

  return null;
};

const Effects = (): JSX.Element => (
  <>
    <AnimatedFog />
    <DayNightCycle />
    <BiomeParticles />
    <AmbientSound />
  </>
);

export { AnimatedFog, DayNightCycle, BiomeParticles, AmbientSound };
export default Effects;
