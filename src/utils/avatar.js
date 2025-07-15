import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

export const generateAvatarSvg = (seed = 'Anon') => {
  const avatar = createAvatar(adventurer, { seed });
  return avatar.toString(); // Returns SVG string
};
