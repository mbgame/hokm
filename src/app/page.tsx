"use client"
import React, { Suspense } from "react";
// import Image from "next/image";
import styles from "./page.module.css";
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Loading from "../components/loading/loading";
import Scene from "../components/scene/scene.component";

// const SceneWithNoSSR = dynamic(() => import('../components/scene/scene.component'), {
//   ssr: false,
// });


const Home: NextPage = () => {
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className={styles.main}>
      {loading ? 
      <Loading /> :
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping, // filmic contrast/highlight rolloff — ~free
          toneMappingExposure: 0.92,
        }}
        style={{ width: '100vw', height: '100dvh', backgroundColor: '#0c4a2a', touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene  />
        </Suspense>
      </Canvas>
      }
    </main>
  );

};

export default Home;
