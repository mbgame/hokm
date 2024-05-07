"use client"
import React from "react";
// import Image from "next/image";
import styles from "./page.module.css";
import { Canvas } from '@react-three/fiber';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Loading from "../components/loading/loading";

const SceneWithNoSSR = dynamic(() => import('../components/scene/scene.component'), {
  ssr: false,
});


const Home: NextPage = () => {
  const [loading, setLoading] = React.useState<boolean>(true)

  setTimeout(()=>{
    setLoading(false)
  },5000)

  return (
    <main className={styles.main}>
      {loading ? 
      <Loading /> :
      <Canvas shadows style={{ width: '100vw', height: '100vh',backgroundColor: 'black' }}>
        <SceneWithNoSSR  />
      </Canvas>
      }
    </main>
  );

};

export default Home;
