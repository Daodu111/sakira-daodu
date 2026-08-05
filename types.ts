
export enum Niche {
  DESIGN = 'DESIGN',
  VIDEO = 'VIDEO'
}

export interface Project {
  id: string;
  title: string;
  category: string;
  /** Cover / primary media URL (always set; first of `images` when multi). */
  image: string;
  /** Optional gallery for design projects; falls back to `[image]` when absent. */
  images?: string[];
  niche: Niche;
  description: string;
}

export interface Skill {
  name: string;
  level: number;
  icon?: string;
}
