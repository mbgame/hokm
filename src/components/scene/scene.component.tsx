import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { shuffle } from '../../utils/shuffle';
import { sortCards } from '../../utils/sortPlayerCarts';
import { cardData } from '../../mockData/cards';
import { dealerAnim } from '../../mockData/animations';
import { randNumber } from '../../utils/randNumber';
import Card from '../card/card';
import SpotLightWithHelper from '../lights/spotLightHelper';
import Floor from '../floor';
import ModelLoader from '../modelLoader';
import GameHelpers from '../helper/gameHelpers';
import HokmSelector from '../hokmSelector/hokmSelector';
import PlayersName from '../playersName/playersName';
import GameScore from '../gameScore/gameScore';
import GameText from '../gameText/gameText';

interface Card {
    type: 'spades' | 'hearts' | 'clubs' | 'diamonds';
    number: 'ace' | 'king' | 'queen' | 'jack' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
    value:number;
  }

const Scene: React.FC = () => {
    const [animationIndex, setAnimationIndex] = React.useState<number>(-1);
    const [animation, setAnimation] = React.useState(dealerAnim);
    const [reserveAnimation, setReserveAnimation] = React.useState(dealerAnim);
    const [gameIndex,setGameIndex] = React.useState<number>(0);
    const [winnerCardIndex,setWinnerCardIndex] = React.useState<Array<number>>([]);
    const [currentSet,setCurrentSet] = React.useState<boolean>(false);
    const [playerCardSets,setPlayerCardSets] = React.useState<any>([]);
    const [playedCardSets,setPlayedCardSets] = React.useState<any>([]);
    const [hokm,selectHokm] = React.useState('');
    const [helperIndex,setHelperIndex] = React.useState(0);
    const [gameScore, setGameScore] = React.useState<{ [key: string]: number }>({
        player1: 0,
        player2: 0,
        player3: 0,
        player4: 0
      });
      const shuffleCards = React.useMemo(() => {
        return shuffle(cardData);
        }, []);
        const [cards, setCards] = React.useState(shuffleCards);


      React.useEffect(()=>{
        const playerCards: any = [];
        for (let i = 0; i < 4; i++) {
            playerCards.push(cards.slice(i * 13, (i + 1) * 13));
        }
        setPlayerCardSets(playerCards);
        setPlayedCardSets(playerCards);
      },[cards])



  const handleAnimationComplete = () => {
    if(gameIndex === 0){

        if(!hokm){
            if(animationIndex >=0 && animationIndex <4){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 4){
                setAnimationIndex(13);
            }
    
            if(animationIndex >=13 && animationIndex <17){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 17){
                setAnimationIndex(26);
            }
            if(animationIndex >=26 && animationIndex <30){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 30){
                setAnimationIndex(39)
            }
    
            if(animationIndex >=39 && animationIndex <43){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 43){
                setAnimationIndex(-1);
            }

        }
        else{
            setAnimationIndex(animationIndex + 1);
        }
       
        
        if(animationIndex === 51){
            setGameIndex(1);
            setAnimationIndex(-1);
        }
    }
   
  };

  const winnerCardCollector = (winner:string,playerCards:Array<Card>) => {
    type AnimationStep = {
        rotation: [number, number, number];
        position: [number, number, number];
      };
      
    type PlayAnimation = Array<AnimationStep>;
    let newAnimation: PlayAnimation = [...animation];
    
    let winnerCardsIndex:Array<number> = [];
    playerCards.map(card=>{
        winnerCardsIndex.push(cards.findIndex(item=>item.type === card.type && item.number === card.number));
    })

    winnerCardsIndex.map((cardIndex,index)=>{
        newAnimation[cardIndex] = {
            rotation : [(-Math.PI/ 2),Math.PI,  ( Math.PI/2)],
            position: [4,5 + index/300,3.5]
            }
    })

    setReserveAnimation(newAnimation);
    setWinnerCardIndex(winnerCardsIndex);
    setAnimationIndex(-1);

  }

  const collectCard = () => {
    setAnimation(reserveAnimation);
    setAnimationIndex(-1);
  
    setTimeout(() => {
      for (let i = 0; i < winnerCardIndex.length; i++) {
        // Use a closure to capture the current index for each timeout
        (function(index) {
          setTimeout(() => {
            setAnimationIndex(winnerCardIndex[index]);
            if (index === 0) {
              setHelperIndex(3); // Update helperIndex only once
            }
          }, i * 100); // Adjust delay based on index
        })(i);
      }
    }, 100); // Initial delay
  };

  const checkWinSet = (player1: Card, player2: Card, player3: Card, player4: Card) => {
    const players = [player1, player2, player3, player4];
  
    let hokmPlayers = players.filter(player => player.type === hokm);
    let nonHokmPlayers = players.filter(player => player.type !== hokm);
    let winner:string;
  
    if (hokmPlayers.length > 0) {
      // If there are Hokm players, the winner is the one with the highest value
      let maxHokmPlayer = hokmPlayers.reduce((max, current) => (max.value > current.value ? max : current), hokmPlayers[0]);
      winner = 'player' + Number(players.indexOf(maxHokmPlayer) + 1);
    } else {
      // If there are no Hokm players, the winner is the one with the highest value among non-Hokm players
      let maxNonHokmPlayer = nonHokmPlayers.reduce((max, current) => (max.value > current.value ? max : current), nonHokmPlayers[0]);
      winner = 'player' + Number(players.indexOf(maxNonHokmPlayer) + 1);
    }

    winnerCardCollector(winner,[player1,player2,player3,player4]);

    return winner;
  }

    // Helper function to find the appropriate card for a player
    const findPlayerCard = (playerCards: Card[], playerIndex: number, type: string) => {
    const sameTypeCards = playerCards.filter((item: Card) => item.type === type);
    if (sameTypeCards.length > 0) {
        return sameTypeCards.reduce((maxCard, currentCard) => (maxCard.value > currentCard.value ? maxCard : currentCard));
    } else {
        const hokmCards = playerCards.filter((item: Card) => item.type === hokm);
        if (hokmCards.length > 0) {
        return hokmCards.reduce((minCard, currentCard) => (minCard.value < currentCard.value ? minCard : currentCard));
        } else {
        return playerCards[0]; // Play the first card if no matching type or hokm
        }
    }
    };

    // Helper function to find the index and update animation
    const updateAnimationAndCards = (playerCard: Card, playerIndex: number, delay: number, newPlayedCardSets:any) => {
        const cardIndex = playerCardSets[playerIndex].findIndex(
          (item: Card) => item.type === playerCard.type && item.number === playerCard.number
        );
        if (cardIndex >= 0) {
          setTimeout(() => {
            setAnimationIndex(13 * playerIndex + cardIndex);
          }, delay);
          newPlayedCardSets[playerIndex] = newPlayedCardSets[playerIndex].filter((item: Card) => item !== playerCard);
        }
    };

  const setPlayerCard = (type: any, number: any) => {
    setCurrentSet(true);
    const newPlayedCardSets = [...playedCardSets];
    const player1Card = playedCardSets[0].find((item: Card) => item.type === type && item.number === number);
    const player2Card = findPlayerCard(playedCardSets[1], 1,type);
    const player3Card = findPlayerCard(playedCardSets[2], 2,type);
    const player4Card = findPlayerCard(playedCardSets[3], 3,type);
  
    updateAnimationAndCards(player2Card, 1, 1000,newPlayedCardSets);
    updateAnimationAndCards(player3Card, 2, 2000,newPlayedCardSets);
    updateAnimationAndCards(player4Card, 3, 3000,newPlayedCardSets);
  
    setTimeout(() => {
      setPlayedCardSets(newPlayedCardSets);
      setCurrentSet(false);
  
      const winner = checkWinSet(player1Card || 0, player2Card || 0, player3Card || 0, player4Card || 0);
      setGameScore((prevScore) => ({
        ...prevScore,
        [winner]: prevScore[winner] + 1,
      }));
      setHelperIndex(2);
    }, 4000);
  };

  const startDealing = () => {
    setHelperIndex(1);
    setAnimationIndex(0);
  }

  const startPlaying = () => {
    setAnimationIndex(-1);
  }

  const reorderCards = () => {
   const typeSortedCards =  sortCards(playerCardSets);
    setCards(typeSortedCards);
  }

  React.useEffect(() => {
    if (gameIndex === 1) {
      console.log("The game started!"); // Consistent message format
      startPlaying();

      type AnimationStep = {
        rotation: [number, number, number];
        position: [number, number, number];
        };
      type PlayAnimation = Array<AnimationStep>;

      // Create animation steps outside the loop for efficiency
      const animationSteps: PlayAnimation = Array.from({ length: 52 }, (_, i) => ({
        rotation: [(-Math.PI / 2), 0, (i + 1) * (Math.PI / 2)],
        position: [randNumber(-2, 2), 5 + i / 300, randNumber(-2, 2)],
      }));
  
      setAnimation(animationSteps);
    }
  }, [gameIndex]);

  const handleHokm = (hokm:string) => {
    selectHokm(hokm);
    setAnimationIndex(0);
    setHelperIndex(3);
  }

  // useFrame(({ camera }, delta) => {
  //   if (helperIndex === 0) {
  //       let target = new Vector3(-15,15,15)
  //     camera.position.lerp(target,0.03);
  //     camera.lookAt(0, 0, 0);
  //   }

  //   if (helperIndex === 1) {
  //       let target = new Vector3(-13,12,-5)
  //       camera.position.lerp(target,0.01);
  //       camera.lookAt(-8,8,-5)
  //     }

  //     if (helperIndex === 2) {
  //       let target = new Vector3(-10,12,-5)
  //       camera.position.lerp(target,0.08);
  //       camera.lookAt(-5,8,-5)
  //     }

  //     if (helperIndex === 3) {
  //       let target = new Vector3(-13,12,0)
  //       camera.position.lerp(target,0.08);
  //       camera.lookAt(0,2,-0)
  //     }



  // });

  useFrame(({ camera }, delta) => {
    const cameraPositions = [
      new Vector3(-15, 15, 15),
      new Vector3(-13, 12, -5),
      new Vector3(-10, 12, -5),
      new Vector3(-13, 12, 0)
    ];
  
    const cameraTargets = [
      new Vector3(0, 0, 0),
      new Vector3(-8, 8, -5),
      new Vector3(-5, 8, -5),
      new Vector3(0, 2, 0)
    ];
  
    const lerpFactor = 0.04; // Adjust this value to control the smoothness of the camera movement
  
    if (helperIndex >= 0 && helperIndex < cameraPositions.length) {
      camera.position.lerp(cameraPositions[helperIndex], lerpFactor);
      camera.lookAt(cameraTargets[helperIndex]);
    }
  });


  return (
    <>
        {/* default camera of scene ---------------------------------------------------------*/}
        <PerspectiveCamera makeDefault position={[ -50 , 30, -50]}  />

        {/* world light system --------------------------------------------------------------*/}
        <ambientLight color ="white" intensity={0.3} />
        <SpotLightWithHelper  position ={ [0, 15, 0]} intensity={150} distance={18} angle ={ 0.9} power={80}  />
        {/* <SpotLightWithHelper   position ={ [30, 15, 0]} intensity={300} distance={40} angle ={ 0.6} power={400}  /> */}
        <SpotLightWithHelper  position ={ [-30, 15, 0]} intensity={300} distance={40} angle ={ 0.6} power={400}  />

        {/* we could orbit our scene--------------------------------------------------------- */}
        <OrbitControls />

        {/* add Game Texts to scene ----------------------------------------------------------*/}
        <GameText helperIndex={helperIndex} startDealing={startDealing} collectCard={collectCard} reorderCards={reorderCards} />

        {/* add Game Helpers to scene ---------------------------------------------------------*/}
        <GameHelpers helperIndex={helperIndex} />

        {/* add Players Name to scene ---------------------------------------------------------*/}
        <PlayersName />

        {/* add Hokm selector to scene --------------------------------------------------------*/}
        {helperIndex === 1 && <HokmSelector handleHokm={handleHokm} />  }   

        {/* add Game Score to scene -----------------------------------------------------------*/}
        { helperIndex === 2 &&  <GameScore gameScore={gameScore} collectCard={collectCard} />  }      

        {/* add Floor to scene ----------------------------------------------------------------*/}
        <Floor width ={100} height={100} texturePath='floor2' textureRepeat={[1,2]} receivedShadow />

        {/* loading our static models to scene ------------------------------------------------*/}
        <ModelLoader path='/model/table/scene.gltf' scale={[28,9.3,20]} position={[0,-2,0]} shadow  />
        <ModelLoader path='/model/card_tray/scene.gltf' scale={[2,2,2]} position={[4,4.8,5]} />      

        {/* add cards to scene ----------------------------------------------------------------*/}
        {cards.length && 
                cards.map((card,cardIndex)=>{
                    return <Card key={cardIndex} type={card.type} number={card.number} width={7} height={10.5}
                    rotation={[-Math.PI/ 2,Math.PI, Math.PI/2]} position={[4, 5 + cardIndex/200, 3.5]}  
                    animate={animationIndex === cardIndex} onAnimationComplete={handleAnimationComplete}
                    animateRotation={animation[cardIndex].rotation} animatePos={animation[cardIndex].position}
                    gameIndex={gameIndex} animationIndex={animationIndex} cardIndex={cardIndex} setPlayerCard={setPlayerCard}
                    currentSet={currentSet} />
                })
        }
         
    </>
  );
};

export default Scene;