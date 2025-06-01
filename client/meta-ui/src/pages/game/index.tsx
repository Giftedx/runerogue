import dynamic from 'next/dynamic';
import Head from 'next/head';

// Disable SSR for the game page since it uses browser APIs
const GamePage = dynamic(() => import('./GamePage'), {
  ssr: false,
});

const Game = () => {
  return (
    <>
      <Head>
        <title>RuneScape Rogue Prime</title>
        <meta name="description" content="A RuneScape-inspired roguelike game" />
      </Head>
      <GamePage />
    </>
  );
};

export default Game;
