/**
 * PoseIllustration — bundled, offline-safe SVG stick-figure illustrations for
 * each Tai Chi form. Avoids copyright issues of hotlinked photos and always
 * renders without a network connection.
 *
 * Each pose is a simplified schematic (head, torso, limbs) with optional motion
 * arrows. Keyed by the `illustration` / `thumbnail` string used in the dataset.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, G } from 'react-native-svg';

interface Props {
  name: string;
  size?: number;
  color?: string;
  accent?: string;
}

const VB = 100;

function Figure({
  color,
  accent,
  children,
}: {
  color: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <G stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none">
      {children}
    </G>
  );
}

/** Reusable head+torso. */
function Core({ color }: { color: string }) {
  return (
    <>
      <Circle cx={50} cy={20} r={7} stroke={color} strokeWidth={2.4} fill="none" />
      <Line x1={50} y1={27} x2={50} y2={58} stroke={color} strokeWidth={2.4} />
    </>
  );
}

type PoseFn = (color: string, accent: string) => React.ReactNode;

const POSES: Record<string, PoseFn> = {
  // 1. Commencing — stand, arms raising forward
  commencing: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={34} y2={40} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={34} x2={66} y2={40} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={42} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={58} y2={86} stroke={c} strokeWidth={2.4} />
      <Path d="M30 52 q6 -14 18 -18" stroke={a} strokeWidth={2} fill="none" />
      <Path d="M46 34 l2 -4 l3 3" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 2. Parting wild horse's mane — bow stance, arms diagonally split
  partingmane: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={32} x2={74} y2={22} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={32} y2={52} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={34} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
      <Path d="M58 30 q10 -6 16 -8" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 3. White crane — stand tall, one arm up one down, toe touch
  whitecrane: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={30} x2={66} y2={16} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={38} y2={54} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={54} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={40} y2={84} stroke={c} strokeWidth={2.4} />
      <Circle cx={38} cy={86} r={1.6} fill={a} stroke={a} />
    </>
  ),
  // 4. Brush knee — bow stance, one hand across knee, one push forward
  brushknee: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={72} y2={32} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={44} x2={38} y2={60} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={36} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
      <Path d="M58 33 l14 -1" stroke={a} strokeWidth={2} fill="none" />
      <Path d="M70 30 l4 2 l-3 3" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 5. Play pipa — empty stance heel touch, both hands front
  pipa: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={32} x2={64} y2={26} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={62} y2={40} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={56} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={42} y2={82} stroke={c} strokeWidth={2.4} />
      <Circle cx={42} cy={82} r={1.6} fill={a} stroke={a} />
    </>
  ),
  // 6. Repulse monkey — stepping back, one hand forward one at hip
  repulsemonkey: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={70} y2={34} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={40} y2={46} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={44} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={66} y2={82} stroke={c} strokeWidth={2.4} />
      <Path d="M40 70 l-10 6" stroke={a} strokeWidth={2} fill="none" />
      <Path d="M30 76 l0 -4 l4 1" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 7/8. Grasp sparrow's tail — bow stance, both hands press forward
  grasptail: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={70} y2={30} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={68} y2={42} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={36} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
      <Path d="M60 50 q10 -2 14 -12" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 9/11. Single whip — arms spread wide, hook hand
  singlewhip: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={78} y2={30} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={34} x2={24} y2={40} stroke={c} strokeWidth={2.4} />
      <Circle cx={78} cy={30} r={2} fill={a} stroke={a} />
      <Line x1={50} y1={58} x2={34} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={66} y2={84} stroke={c} strokeWidth={2.4} />
    </>
  ),
  // 10. Cloud hands — circling hands front, feet side step
  cloudhands: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={60} y2={24} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={42} x2={40} y2={52} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={40} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={62} y2={86} stroke={c} strokeWidth={2.4} />
      <Path d="M38 40 a14 14 0 1 1 24 6" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 12. High pat on horse — empty stance, one hand pushing at face level
  pathorse: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={32} x2={68} y2={26} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={40} y2={46} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={56} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={44} y2={82} stroke={c} strokeWidth={2.4} />
      <Path d="M58 28 l10 -2" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 13/15. Heel kick — stand one leg, other leg kicking out, arms open
  heelkick: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={74} y2={28} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={34} x2={28} y2={30} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={46} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={78} y2={64} stroke={a} strokeWidth={2.6} />
      <Path d="M74 64 l6 0 l-2 -4" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 14. Strike ears with both fists — bow stance, two fists converging front
  strikeears: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={66} y2={24} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={34} x2={34} y2={24} stroke={c} strokeWidth={2.4} />
      <Circle cx={66} cy={24} r={2} fill={a} stroke={a} />
      <Circle cx={34} cy={24} r={2} fill={a} stroke={a} />
      <Line x1={50} y1={58} x2={36} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
    </>
  ),
  // 16/17. Golden rooster — stand one leg, knee + hand raised high
  rooster: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={30} x2={58} y2={14} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={42} x2={40} y2={50} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={52} y2={86} stroke={c} strokeWidth={2.4} />
      <Path d="M50 58 l12 10 l-10 10" stroke={c} strokeWidth={2.4} fill="none" />
      <Path d="M56 16 l2 -4 l3 3" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 18. Shuttle — diagonal bow stance, one hand up at forehead, one push
  shuttle: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={30} x2={68} y2={18} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={42} x2={66} y2={46} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={36} y2={84} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={70} y2={82} stroke={c} strokeWidth={2.4} />
      <Path d="M60 44 l12 1" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 19. Needle at sea bottom — body bending forward, one hand down
  needle: (c, a) => (
    <>
      <Circle cx={44} cy={24} r={7} stroke={c} strokeWidth={2.4} fill="none" />
      <Line x1={48} y1={30} x2={58} y2={52} stroke={c} strokeWidth={2.4} />
      <Line x1={52} y1={38} x2={60} y2={66} stroke={c} strokeWidth={2.4} />
      <Line x1={58} y1={52} x2={50} y2={84} stroke={c} strokeWidth={2.4} />
      <Line x1={58} y1={52} x2={68} y2={82} stroke={c} strokeWidth={2.4} />
      <Path d="M60 66 l2 10" stroke={a} strokeWidth={2} fill="none" />
      <Path d="M58 74 l4 4 l4 -4" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 20. Fan through back — bow stance, arms spread like a fan
  fanback: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={30} x2={64} y2={18} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={40} x2={72} y2={44} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={36} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
      <Path d="M58 22 a16 16 0 0 1 12 20" stroke={a} strokeWidth={1.8} fill="none" />
    </>
  ),
  // 21. Deflect parry punch — bow stance, one fist punching forward
  punch: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={40} x2={76} y2={42} stroke={c} strokeWidth={2.4} />
      <Circle cx={76} cy={42} r={2.2} fill={a} stroke={a} />
      <Line x1={50} y1={36} x2={42} y2={44} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={36} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
      <Path d="M64 42 l10 0" stroke={a} strokeWidth={2} fill="none" />
    </>
  ),
  // 22. Apparent close up — hands pushing forward together
  closeup: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={36} x2={70} y2={38} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={42} x2={70} y2={46} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={36} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={72} y2={84} stroke={c} strokeWidth={2.4} />
      <Path d="M64 42 l10 0 l-3 -3 m3 3 l-3 3" stroke={a} strokeWidth={1.8} fill="none" />
    </>
  ),
  // 23. Cross hands — wrists crossed in front of chest
  crosshands: (c, a) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={60} y2={44} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={34} x2={40} y2={44} stroke={c} strokeWidth={2.4} />
      <Line x1={38} y1={40} x2={62} y2={40} stroke={a} strokeWidth={2} />
      <Line x1={50} y1={58} x2={40} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={60} y2={86} stroke={c} strokeWidth={2.4} />
    </>
  ),
  // 24. Closing — stand, arms down at sides
  closing: (c) => (
    <>
      <Core color={c} />
      <Line x1={50} y1={34} x2={42} y2={56} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={34} x2={58} y2={56} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={46} y2={86} stroke={c} strokeWidth={2.4} />
      <Line x1={50} y1={58} x2={54} y2={86} stroke={c} strokeWidth={2.4} />
    </>
  ),
};

export function PoseIllustration({ name, size = 120, color = '#1b5e20', accent = '#e67e22' }: Props) {
  const draw = POSES[name] ?? POSES.commencing;
  return (
    <View accessible accessibilityLabel={`Minh họa tư thế: ${name}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Figure color={color} accent={accent}>{null}</Figure>
        {draw(color, accent)}
      </Svg>
    </View>
  );
}
