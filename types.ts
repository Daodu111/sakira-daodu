
export enum Niche {
  DESIGN = 'DESIGN',
  VIDEO = 'VIDEO'
}

export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  niche: Niche;
  description: string;
}

export interface Skill {
  name: string;
  level: number;
  icon?: string;
}
