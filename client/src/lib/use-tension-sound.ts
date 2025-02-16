import { useEffect, useRef } from 'react';

export function useTensionSound(isActive: boolean, timeLeft: number, totalDuration: number) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const hasPlayedChimeRef = useRef(false);
  const gongPlayingRef = useRef(false);

  useEffect(() => {
    // Initialize audio context on first activation
    if (isActive && !audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContext();
        
        // Create oscillator for main tone
        oscillatorRef.current = audioContextRef.current.createOscillator();
        oscillatorRef.current.type = 'triangle';
        
        // Create gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 0;
        
        // Create filter for tone shaping
        filterRef.current = audioContextRef.current.createBiquadFilter();
        filterRef.current.type = 'lowpass';
        filterRef.current.frequency.value = 200;
        
        // Create LFO for tension
        lfoRef.current = audioContextRef.current.createOscillator();
        lfoRef.current.frequency.value = 2;
        
        // Connect nodes
        oscillatorRef.current.connect(filterRef.current);
        filterRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        // Start audio
        oscillatorRef.current.start();
        lfoRef.current.start();

        console.log('Audio context initialized');
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    }

    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        hasPlayedChimeRef.current = false;
        gongPlayingRef.current = false;
      }
    };
  }, [isActive]);

  // Function to play chime sound
  const playChime = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 880; // A5 note
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  };

  // Function to play gong sound
  const playGong = (ctx: AudioContext) => {
    if (gongPlayingRef.current) return;
    gongPlayingRef.current = true;

    const currentTime = ctx.currentTime;
    
    // Main resonator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 60; // Low fundamental
    
    gain.gain.setValueAtTime(0, currentTime);
    gain.gain.linearRampToValueAtTime(0.5, currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Noise component
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0, currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.2, currentTime + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 1);
    
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    // Slightly detuned harmonics
    const harmonics = [2, 3, 4.1, 5.2];
    harmonics.forEach((harmonic) => {
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.value = 60 * harmonic;
      
      harmonicGain.gain.setValueAtTime(0, currentTime);
      harmonicGain.gain.linearRampToValueAtTime(0.3 / harmonic, currentTime + 0.02);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 2);
      
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);
      
      harmonicOsc.start(currentTime);
      harmonicOsc.stop(currentTime + 4);
    });
    
    // Shimmering high frequencies
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    
    shimmer.type = 'sine';
    shimmer.frequency.value = 1200;
    
    shimmerGain.gain.setValueAtTime(0, currentTime);
    shimmerGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 2);
    
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    
    // Start all components
    osc.start(currentTime);
    noise.start(currentTime);
    shimmer.start(currentTime);
    
    // Stop components
    const stopTime = currentTime + 4; // Longer duration
    osc.stop(stopTime);
    noise.stop(stopTime);
    shimmer.stop(stopTime);
    
    // Reset flag after sound completes
    setTimeout(() => {
      gongPlayingRef.current = false;
      if (!isActive && audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }, 4000);
  };

  useEffect(() => {
    if (!audioContextRef.current || !gainNodeRef.current || !filterRef.current || !oscillatorRef.current) {
      return;
    }

    const progress = 1 - (timeLeft / totalDuration);
    const currentTime = audioContextRef.current.currentTime;

    // Play chime at 6 seconds
    if (timeLeft === 6 && !hasPlayedChimeRef.current) {
      playChime(audioContextRef.current);
      hasPlayedChimeRef.current = true;
    }

    // Play gong at 1 second
    if (timeLeft === 1) {
      playGong(audioContextRef.current);
    }

    // Reset chime flag when timer resets
    if (timeLeft === totalDuration) {
      hasPlayedChimeRef.current = false;
    }

    if (isActive && !audioContextRef.current.closed) {
      // Gradually increase volume
      gainNodeRef.current.gain.setTargetAtTime(
        Math.min(0.15 * progress, 0.15), 
        currentTime, 
        0.1
      );

      // Increase frequency for tension
      oscillatorRef.current.frequency.setTargetAtTime(
        200 + (300 * progress), 
        currentTime, 
        0.1
      );

      // Increase filter frequency
      filterRef.current.frequency.setTargetAtTime(
        200 + (2000 * progress), 
        currentTime, 
        0.1
      );

      // Speed up LFO rate
      if (lfoRef.current) {
        lfoRef.current.frequency.setTargetAtTime(
          2 + (4 * progress), 
          currentTime, 
          0.1
        );
      }
    }
  }, [isActive, timeLeft, totalDuration]);
} 