import { useState, useEffect, useContext } from "react"
import { useRouter } from "next/router"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { gsap } from "gsap"
import MenuBar from "../components/MenuBar"
import Head from "next/head";
import { AuthContext } from "./_app";

function StadiumModel() {
  const { scene } = useGLTF("/models/stadium.glb")
  return <primitive object={scene} scale={1} />
}

function CameraAnimation({ onZoomEnd }) {
  const { camera } = useThree()

  useEffect(() => {
    gsap.to(camera.position, {
      x: 110,
      y: 20,
      z: -70,
      duration: 5,
      ease: "power2.out",
      onUpdate: () => {
        if (camera.position.z < -38) {
          onZoomEnd() // 카메라 이동 거의 끝나면 메뉴바 등장
        }
      },
    })
  }, [camera, onZoomEnd])

  return null
}

export default function Start() {
  const [menuVisible, setMenuVisible] = useState(false)
  const router = useRouter()
  const { setIsLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) setIsLoggedIn(true);
  }, [setIsLoggedIn]);

  return (
    <>
    <Head>
        <title>SeatIn</title>
      </Head>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "fixed",
          background: "#F1FFFFFF",
        }}
      >
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [-20, 150, 150], fov: 50 }}
        >
          <ambientLight intensity={3} />
          <directionalLight position={[100, 100, 120]} />
          <StadiumModel />
          <CameraAnimation onZoomEnd={() => setMenuVisible(true)} />
          <OrbitControls enableRotate={false} enablePan={false} enableZoom={false} />
        </Canvas>

        <MenuBar visible={menuVisible} />
      </div>
    </>

  )
}
