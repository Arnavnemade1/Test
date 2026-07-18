import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const IntroComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = spring({ frame, fps, from: 40, to: 0, config: { damping: 18, mass: 0.6 } });
  const subOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: 'clamp' });
  const barHeight = interpolate(frame, [0, 20], [height * 0.5, height * 0.12], {
    extrapolateRight: 'clamp',
  });
  const glow = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  const grainOpacity = 0.05;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05050a' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(160,110,255,0.35), rgba(5,5,10,0) 60%)',
          opacity: glow,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: width * 0.07,
            letterSpacing: 12,
            color: '#f5f0ff',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textShadow: '0 0 40px rgba(160,110,255,0.6)',
            textTransform: 'uppercase',
          }}
        >
          VaultLens
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: width * 0.016,
            letterSpacing: 6,
            color: '#b9aee0',
            opacity: subOpacity,
            textTransform: 'uppercase',
          }}
        >
          Your Images. Guarded. Cinematic.
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, #000 0%, transparent 0%), linear-gradient(to top, #000 0%, transparent 0%)',
        }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barHeight, background: '#000' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barHeight, background: '#000' }} />
      <AbsoluteFill
        style={{
          opacity: grainOpacity,
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};
