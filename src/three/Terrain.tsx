import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  Color,
  Float32BufferAttribute,
  Mesh,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

type TerrainProps = {
  onSurfaceClick?: (point: Vector3) => void;
};

const TERRAIN_SIZE = 199;
const TERRAIN_SEGMENTS = 198;
const NOISE_SCALE = 40;
const HEIGHT_AMPLITUDE = 8;

const Terrain = ({ onSurfaceClick }: TerrainProps): JSX.Element => {
  const meshRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  const noise = useMemo(() => new SimplexNoise(), []);

  const { geometry, minHeight, maxHeight } = useMemo(() => {
    const plane = new PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );

    const positions = plane.getAttribute("position") as BufferAttribute;
    const vertex = new Vector3();
    const heights = new Float32Array(positions.count);
    let localMin = Number.POSITIVE_INFINITY;
    let localMax = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index);
      const height = noise.noise(vertex.x / NOISE_SCALE, vertex.y / NOISE_SCALE) * HEIGHT_AMPLITUDE;
      heights[index] = height;
      positions.setXYZ(index, vertex.x, vertex.y, height);
      localMin = Math.min(localMin, height);
      localMax = Math.max(localMax, height);
    }

    plane.setAttribute("height", new Float32BufferAttribute(heights, 1));
    plane.computeVertexNormals();

    return { geometry: plane, minHeight: localMin, maxHeight: localMax };
  }, [noise]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        lowColor: { value: new Color(0x228b22) },
        highColor: { value: new Color(0xd2b48c) },
        minHeight: { value: minHeight },
        maxHeight: { value: maxHeight },
      },
      vertexShader: `
        attribute float height;
        varying float vHeight;

        void main() {
          vHeight = height;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lowColor;
        uniform vec3 highColor;
        uniform float minHeight;
        uniform float maxHeight;
        varying float vHeight;

        void main() {
          float range = maxHeight - minHeight;
          float ratio = range > 0.0 ? (vHeight - minHeight) / range : 0.0;
          ratio = clamp(ratio, 0.0, 1.0);
          vec3 color = mix(lowColor, highColor, ratio);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, [maxHeight, minHeight]);

  const raycaster = useMemo(() => new Raycaster(), []);
  const pointer = useMemo(() => new Vector2(), []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (event: PointerEvent): void => {
      if (!meshRef.current) {
        return;
      }

      const rect = domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const [intersection] = raycaster.intersectObject(meshRef.current, false);

      if (intersection && onSurfaceClick) {
        onSurfaceClick(intersection.point.clone());
      }
    };

    domElement.addEventListener("pointerdown", handlePointerDown);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [camera, gl, onSurfaceClick, pointer, raycaster]);

  return <mesh ref={meshRef} geometry={geometry} material={material} rotation-x={-Math.PI / 2} />;
};

export default Terrain;
