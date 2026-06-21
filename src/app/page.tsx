"use client"
import React from "react";
import styles from "./page.module.css";
import type { NextPage } from 'next';
import Loading from "../components/loading/loading";
import MainMenu, { type GameId } from "../components/mainMenu/mainMenu";
import BlackjackGame from "../components/blackjack/blackjackGame";
import PokerGame from "../components/poker/pokerGame";
import HokmGame from "../components/hokm/hokmGame";

const Home: NextPage = () => {
  const [loading, setLoading] = React.useState<boolean>(true)
  // null = main menu; otherwise the selected game
  const [game, setGame] = React.useState<GameId | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3500);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <main className={styles.main}><Loading /></main>;
  }

  if (game === null) {
    return (
      <main className={styles.main}>
        <MainMenu onSelect={setGame} />
      </main>
    );
  }

  if (game === 'blackjack') {
    return <main className={styles.main}><BlackjackGame onBack={() => setGame(null)} /></main>;
  }

  if (game === 'poker') {
    return <main className={styles.main}><PokerGame onBack={() => setGame(null)} /></main>;
  }

  // Hokm — same 3D scene, now wrapped with the shared wallet + per-game stake.
  return (
    <main className={styles.main}>
      <HokmGame onBack={() => setGame(null)} />
    </main>
  );
};

export default Home;
