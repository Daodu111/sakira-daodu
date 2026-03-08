
import React from 'react';
import { useTheme } from './ThemeContext';

interface CircularSkillProps {
  label: string;
  percentage: number;
  color: string;
  size?: number;
}

const CircularSkill: React.FC<CircularSkillProps> = ({ label, percentage, color, size = 80 }) => {
  const { theme } = useTheme();
  const radius = (size / 2) - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme === 'dark' ? '#1a1a1a' : '#e5e7eb'}
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
          {label}
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{label} Expert</span>
    </div>
  );
};

export default CircularSkill;
