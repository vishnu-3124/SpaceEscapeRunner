import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
// Import the native Expo gradient wrapper
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPACESHIP_WIDTH = 50;
const SPACESHIP_HEIGHT = 65;
const ASTEROID_SIZE = 44;

const MIN_X = 20;
const MAX_X = SCREEN_WIDTH - SPACESHIP_WIDTH - 20;
const START_X = SCREEN_WIDTH / 2 - SPACESHIP_WIDTH / 2;

const ASTEROID_MIN_X = 15;
const ASTEROID_MAX_X = SCREEN_WIDTH - ASTEROID_SIZE - 15;
const SPACESHIP_Y = 365;

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Use refs for positions to avoid state lag during rapid animation frames
  const shipXRef = useRef(START_X);
  const asteroidXRef = useRef(ASTEROID_MIN_X);
  const asteroidYRef = useRef(-100);

  // State handles to force UI updates in sync with the animation loop
  const [renderShipX, setRenderShipX] = useState(START_X);
  const [renderAsteroidX, setRenderAsteroidX] = useState(ASTEROID_MIN_X);
  const [renderAsteroidY, setRenderAsteroidY] = useState(-100);

  const animationFrameRef = useRef(null);

  const getRandomX = () => {
    return Math.floor(Math.random() * (ASTEROID_MAX_X - ASTEROID_MIN_X + 1)) + ASTEROID_MIN_X;
  };

  useEffect(() => {
    loadHighScore();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const loadHighScore = async () => {
    try {
      const savedValue = await AsyncStorage.getItem('@space_high_score');
      if (savedValue !== null) setHighScore(parseInt(savedValue, 10));
    } catch (e) {
      console.log(e);
    }
  };

  const saveHighScore = async (newHigh) => {
    try {
      setHighScore(newHigh);
      await AsyncStorage.setItem('@space_high_score', newHigh.toString());
    } catch (e) {
      console.log(e);
    }
  };

  // Smooth Animation Loop Logic
  const updateGame = () => {
    if (!gameStarted || gameOver) return;

    // Fall logic (6 pixels per animation frame)
    asteroidYRef.current += 6;

    // Collision math bounds
    const aLeft = asteroidXRef.current;
    const aRight = asteroidXRef.current + ASTEROID_SIZE;
    const aTop = asteroidYRef.current;
    const aBottom = asteroidYRef.current + ASTEROID_SIZE;

    const sLeft = shipXRef.current;
    const sRight = shipXRef.current + SPACESHIP_WIDTH;
    const sTop = SPACESHIP_Y;
    const sBottom = SPACESHIP_Y + SPACESHIP_HEIGHT;

    if (aRight > sLeft && aLeft < sRight && aBottom > sTop && aTop < sBottom) {
      setGameOver(true);
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    // Reset loop point
    if (asteroidYRef.current > 450) {
      asteroidXRef.current = getRandomX();
      asteroidYRef.current = -50;
      
      setScore((prev) => {
        const nextScore = prev + 1;
        if (nextScore > highScore) saveHighScore(nextScore);
        return nextScore;
      });
    }

    // Sync ref coordinates into states for rendering execution
    setRenderAsteroidX(asteroidXRef.current);
    setRenderAsteroidY(asteroidYRef.current);
    setRenderShipX(shipXRef.current);

    // Call next smooth frame recursion
    animationFrameRef.current = requestAnimationFrame(updateGame);
  };

  // Watch flow variations to cycle the requestAnimationFrame loops safely
  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameStarted, gameOver]);

  const handleStartGame = () => {
    shipXRef.current = START_X;
    asteroidXRef.current = getRandomX();
    asteroidYRef.current = -50;

    setRenderShipX(START_X);
    setRenderAsteroidX(asteroidXRef.current);
    setRenderAsteroidY(-50);
    
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const moveLeft = () => {
    if (gameOver || !gameStarted) return;
    const nextX = shipXRef.current - 35;
    shipXRef.current = nextX < MIN_X ? MIN_X : nextX;
    setRenderShipX(shipXRef.current);
  };

  const moveRight = () => {
    if (gameOver || !gameStarted) return;
    const nextX = shipXRef.current + 35;
    shipXRef.current = nextX > MAX_X ? MAX_X : nextX;
    setRenderShipX(shipXRef.current);
  };

  return (
    <LinearGradient colors={['#060814', '#0F1123', '#1B132E']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Modern Glassmorphic Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Space Escape</Text>
        <Text style={styles.subtitle}>Runner Edition</Text>
      </View>

      <View style={styles.scoreBoardRow}>
        <LinearGradient colors={['#161933', '#1C2042']} style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreNumber}>{score}</Text>
        </LinearGradient>
        <LinearGradient colors={['#1F1D2B', '#2D2219']} style={[styles.scoreContainer, styles.highScoreBorder]}>
          <Text style={[styles.scoreLabel, { color: '#FFD700' }]}>Best Track</Text>
          <Text style={[styles.scoreNumber, { color: '#FFD700' }]}>{highScore}</Text>
        </LinearGradient>
      </View>

      {/* Enhanced Stage Window */}
      <View style={styles.stageArea}>
        {gameStarted && !gameOver && (
          /* Detailed Layered Asteroid Shape */
          <View style={[styles.asteroid, { left: renderAsteroidX, top: renderAsteroidY }]}>
            <View style={styles.craterOne} />
            <View style={styles.craterTwo} />
          </View>
        )}

        {!gameOver && (
          /* Advanced Spaceship Styling */
          <View style={[styles.spaceship, { left: renderShipX }]}>
            <View style={[styles.wing, styles.leftWing]} />
            <View style={styles.rocketBody}>
              <View style={styles.cockpitShield} />
              <View style={styles.hullStripe} />
            </View>
            <View style={[styles.wing, styles.rightWing]} />
            <View style={styles.thrusterFlame} />
          </View>
        )}

        {gameOver && (
          <LinearGradient colors={['rgba(6,8,20,0.95)', 'rgba(27,19,46,0.95)']} style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>MISSION FAILED</Text>
            <Text style={styles.finalScoreText}>Final Score: {score}</Text>
            {score >= highScore && score > 0 && (
              <Text style={styles.newRecordText}>🏆 NEW RECORD REACHED 🏆</Text>
            )}
          </LinearGradient>
        )}
      </View>

      {/* Control Deck Interface Layout */}
      <View style={styles.bottomArea}>
        {gameStarted && !gameOver && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={moveLeft} activeOpacity={0.7}>
              <Text style={styles.controlButtonText}>◀ LEFT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={moveRight} activeOpacity={0.7}>
              <Text style={styles.controlButtonText}>RIGHT ▶</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleStartGame} activeOpacity={0.8}>
          <LinearGradient colors={['#9D4EDD', '#7B2CBF']} style={styles.gradientButton}>
            <Text style={styles.buttonText}>
              {gameOver ? 'Deploy New Mission' : gameStarted ? 'Restart Mission' : 'Launch Game'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#4DEEEA',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(77, 238, 234, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#8A92B2',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  scoreBoardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(58, 63, 104, 0.4)',
    width: '47%',
  },
  highScoreBorder: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#8A92B2',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stageArea: {
    width: '100%',
    height: 450,
    backgroundColor: 'rgba(7, 9, 20, 0.6)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(31, 36, 71, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  /* Upgraded Meteor Shape Layout */
  asteroid: {
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
    backgroundColor: '#705341',
    borderRadius: 16,
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4A3529',
    justifyContent: 'space-around',
    padding: 4,
  },
  craterOne: {
    width: 10,
    height: 10,
    backgroundColor: '#4A3529',
    borderRadius: 5,
    opacity: 0.6,
    alignSelf: 'flex-start',
  },
  craterTwo: {
    width: 12,
    height: 12,
    backgroundColor: '#4A3529',
    borderRadius: 6,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
  /* Advanced Layered Spaceship Architecture */
  spaceship: {
    width: SPACESHIP_WIDTH,
    height: SPACESHIP_HEIGHT,
    position: 'absolute',
    top: SPACESHIP_Y,
    alignItems: 'center',
  },
  rocketBody: {
    width: 20,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cockpitShield: {
    width: 10,
    height: 16,
    backgroundColor: '#00F5D4',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: 8,
  },
  hullStripe: {
    width: 4,
    height: 14,
    backgroundColor: '#FF0055',
    marginTop: 6,
    borderRadius: 2,
  },
  wing: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    position: 'absolute',
    bottom: 8,
    zIndex: 2,
  },
  leftWing: {
    left: 2,
    borderLeftWidth: 0,
    borderRightWidth: 15,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#38BDF8', // Cyan colored aerodynamic performance wings
  },
  rightWing: {
    right: 2,
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#38BDF8',
  },
  thrusterFlame: {
    width: 10,
    height: 16,
    backgroundColor: '#FFB703',
    position: 'absolute',
    bottom: -8,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#FB8500',
  },
  gameOverContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  gameOverText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FF0055',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 0, 85, 0.4)',
    textShadowRadius: 8,
  },
  finalScoreText: {
    fontSize: 18,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  newRecordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
  },
  bottomArea: {
    width: '100%',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(22, 25, 51, 0.7)',
    paddingVertical: 16,
    borderRadius: 16,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(58, 63, 104, 0.6)',
  },
  controlButtonText: {
    color: '#4DEEEA',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});