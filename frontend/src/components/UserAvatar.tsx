import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const colors = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'md' }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  const charCodeSum = (name || 'U')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = colors[charCodeSum % colors.length];

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-bold',
  }[size];

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colorClass} ${sizeClasses} flex items-center justify-center text-white font-semibold shadow-md shrink-0 border border-white/20`}
      title={name}
    >
      {initials}
    </div>
  );
};
