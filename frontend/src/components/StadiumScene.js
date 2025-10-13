import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";

function CameraController({ targetPosition, orbitRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!targetPosition || !orbitRef.current) return;

    const x = targetPosition.x;
    const y = targetPosition.z + 2;
    const z = -targetPosition.y;

    camera.position.set(x, y, z);

    orbitRef.current.target.set(40, 0, -40);
    orbitRef.current.update();

  }, [targetPosition, camera, orbitRef]);

  return null;
}

function StadiumModel() {
  const { scene } = useGLTF("/models/stadium.glb");
  return <primitive object={scene} scale={1} />;
}

export default function StadiumScene({ selectedSeat }) {
  const orbitRef = useRef();

  return (
    <Canvas camera={{ position: [0, 50, 80], fov: 50 }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 20, 10]} />
      <StadiumModel />
      <CameraController targetPosition={selectedSeat} orbitRef={orbitRef} />
      <OrbitControls ref={orbitRef} enableZoom={false} enableRotate={false} enablePan={false} />
    </Canvas>
  );
}
