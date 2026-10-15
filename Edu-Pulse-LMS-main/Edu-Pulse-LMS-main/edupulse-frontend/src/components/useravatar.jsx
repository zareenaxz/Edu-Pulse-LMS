import React from 'react';
import { fileUrl } from '../api/client';

const initialsOf = (name) =>
  String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// Shows the user's profile image if they have one, otherwise their initials.
export default function UserAvatar({ user, className = 'w-9 h-9 rounded-xl text-xs' }) {
  if (user && user.profile_image) {
    return <img src={fileUrl(user.profile_image)} alt={user.name} className={`${className} object-cover border border-white shadow-xs shrink-0`} />;
  }
  return (
    <div className={`${className} bg-brand-600 text-white font-bold flex items-center justify-center shrink-0`}>
      {initialsOf(user && user.name)}
    </div>
  );
}