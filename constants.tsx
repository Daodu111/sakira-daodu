
import React from 'react';
import { Niche, Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Alankrita Boutique',
    category: 'Logo Design',
    image: 'https://picsum.photos/seed/logo1/800/800',
    niche: Niche.DESIGN,
    description: 'Elegant branding for a high-end fashion boutique.'
  },
  {
    id: '2',
    title: 'Sushi Fusion',
    category: 'Brand Identity',
    image: 'https://picsum.photos/seed/logo2/800/800',
    niche: Niche.DESIGN,
    description: 'Modern minimalist identity for a fusion restaurant.'
  },
  {
    id: '3',
    title: 'Halloween Campaign',
    category: 'Social Media',
    image: 'https://picsum.photos/seed/social1/800/800',
    niche: Niche.DESIGN,
    description: 'Themed carousel designs for a retail giant.'
  },
  {
    id: '4',
    title: 'Fintech Dashboard',
    category: 'UI/UX Design',
    image: 'https://picsum.photos/seed/ui1/800/800',
    niche: Niche.DESIGN,
    description: 'Clean and functional dashboard for personal finance.'
  },
  {
    id: '5',
    title: 'Motion Graphics Reel',
    category: 'Showreel',
    image: 'https://picsum.photos/seed/video1/1280/720',
    niche: Niche.VIDEO,
    description: 'A compilation of dynamic motion design works.'
  },
  {
    id: '6',
    title: 'Corporate Brand Film',
    category: 'Editing',
    image: 'https://picsum.photos/seed/video2/1280/720',
    niche: Niche.VIDEO,
    description: 'Story-driven cinematic edit for a tech firm.'
  },
  {
    id: '7',
    title: 'Product Launch Ad',
    category: 'Commercial',
    image: 'https://picsum.photos/seed/video3/1280/720',
    niche: Niche.VIDEO,
    description: 'Fast-paced rhythmic commercial editing.'
  }
];

export const TOOL_LOGOS = {
  Ps: { color: '#31A8FF', label: 'Photoshop' },
  Ai: { color: '#FF9A00', label: 'Illustrator' },
  Ae: { color: '#D291FF', label: 'After Effects' },
  Pr: { color: '#EA77FF', label: 'Premiere Pro' },
  Figma: { color: '#0ACF83', label: 'Figma' },
  Id: { color: '#FF3366', label: 'InDesign' }
};
