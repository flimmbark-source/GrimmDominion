import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";

type Player3DProps = {
  target: Vector3 | null;
};

const START_POSITION = new Vector3(0, 5, 0);
const MOVE_SPEED_UNITS_PER_SECOND = 6;
const STOP_DISTANCE = 0.1;

const Player3D = ({ target }: Player3DProps): JSX.Element => {
  const meshRef = useRef<Mesh>(null);
  const positionRef = useRef<Vector3>(START_POSITION.clone());
  const directionRef = useRef(new Vector3());

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(positionRef.current);
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    if (target) {
      const direction = directionRef.current;
      direction.subVectors(target, positionRef.current);
      const distance = direction.length();

      if (distance > STOP_DISTANCE) {
        direction.normalize();
        const moveDistance = Math.min(distance, MOVE_SPEED_UNITS_PER_SECOND * delta);
        positionRef.current.addScaledVector(direction, moveDistance);
      } else {
        positionRef.current.copy(target);
      }
    }

    meshRef.current.position.copy(positionRef.current);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial color={0xffff00} emissive={0xffff33} emissiveIntensity={1.5} />
    </mesh>
  );
};

export default Player3D;
