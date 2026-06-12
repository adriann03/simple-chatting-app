let rainAudioCtx: AudioContext | null = null;
let rainNoiseNode: AudioBufferSourceNode | null = null;
let rainGainNode: GainNode | null = null;

export const playTing = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playWoosh = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const bufferSize = ctx.sampleRate * 1; // 1 second
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const startRainAmbient = () => {
  try {
    if (rainAudioCtx) return; // Already playing
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    rainAudioCtx = new AudioContext();
    const bufferSize = rainAudioCtx.sampleRate * 2; // 2 seconds loop
    const buffer = rainAudioCtx.createBuffer(1, bufferSize, rainAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    rainNoiseNode = rainAudioCtx.createBufferSource();
    rainNoiseNode.buffer = buffer;
    rainNoiseNode.loop = true;
    
    const filter = rainAudioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Muffled rain sound
    
    rainGainNode = rainAudioCtx.createGain();
    rainGainNode.gain.value = 0.2; // Soft volume
    
    rainNoiseNode.connect(filter);
    filter.connect(rainGainNode);
    rainGainNode.connect(rainAudioCtx.destination);
    
    rainNoiseNode.start();
  } catch (e) {
    console.error("Rain audio failed", e);
  }
};

export const stopRainAmbient = () => {
  if (rainNoiseNode) {
    try {
      rainNoiseNode.stop();
      rainNoiseNode.disconnect();
    } catch (e) {}
    rainNoiseNode = null;
  }
  if (rainAudioCtx) {
    rainAudioCtx.close();
    rainAudioCtx = null;
  }
};
