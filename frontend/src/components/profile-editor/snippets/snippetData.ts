import {
  BarChart3,
  Flame,
  Code2,
  Eye,
  Settings,
  User,
  Mail,
  Tag,
  Moon,
  Image,
  Activity,
  Award,
  FolderGit2
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Snippet {
  id: string;
  category: 'stats' | 'badges' | 'sections' | 'social';
  name: string;
  description: string;
  markdown: string | ((username: string) => string);
  icon: LucideIcon;
}

export const snippets: Snippet[] = [
  // Stats category - ordered by typical profile layout
  {
    id: 'capsule-render',
    category: 'stats',
    name: 'Capsule Header',
    description: 'Dynamic header image',
    icon: Image,
    markdown: (username) => `<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=${username}&fontSize=80&fontAlignY=35&animation=twinkling&fontColor=ffffff)

</div>`,
  },
  {
    id: 'github-stats-dark',
    category: 'stats',
    name: 'GitHub Stats',
    description: 'Stats card with theme support',
    icon: Moon,
    markdown: (username) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-stats-nu-beryl.vercel.app/api?username=${username}&show_icons=true&theme=dark">
  <source media="(prefers-color-scheme: light)" srcset="https://readme-stats-nu-beryl.vercel.app/api?username=${username}&show_icons=true&theme=default">
  <img alt="GitHub Stats" src="https://readme-stats-nu-beryl.vercel.app/api?username=${username}&show_icons=true&theme=default">
</picture>`,
  },
  {
    id: 'streak-stats',
    category: 'stats',
    name: 'Streak Stats',
    description: 'Show your contribution streak',
    icon: Flame,
    markdown: (username) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-streak-stats-gules-three.vercel.app/?user=${username}&theme=dark&hide_border=true&background=0D1117&stroke=0000&ring=79C0FF&fire=79C0FF&currStreakLabel=79C0FF">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-streak-stats-gules-three.vercel.app/?user=${username}&theme=default&hide_border=true">
  <img alt="Streak Stats" src="https://github-readme-streak-stats-gules-three.vercel.app/?user=${username}&theme=default&hide_border=true">
</picture>`,
  },
  {
    id: 'activity-graph',
    category: 'stats',
    name: 'Activity Graph',
    description: 'Contribution activity graph',
    icon: Activity,
    markdown: (username) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=github-compact&hide_border=true&bg_color=0d1117&color=79c0ff&line=58a6ff&point=58a6ff">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=github-compact&hide_border=true">
  <img alt="Activity Graph" src="https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=github-compact&hide_border=true">
</picture>`,
  },
  {
    id: 'top-languages',
    category: 'stats',
    name: 'Top Languages',
    description: 'Most used programming languages',
    icon: Code2,
    markdown: (username) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-stats-nu-beryl.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=dark">
  <source media="(prefers-color-scheme: light)" srcset="https://readme-stats-nu-beryl.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=default">
  <img alt="Top Languages" src="https://readme-stats-nu-beryl.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=default">
</picture>`,
  },
  {
    id: 'profile-views',
    category: 'stats',
    name: 'Profile Views Counter',
    description: 'Track profile visits',
    icon: Eye,
    markdown: (username) => `![Profile Views](https://komarev.com/ghpvc/?username=${username}&color=blue&style=flat-square)`,
  },

  // Sections category - ordered by typical profile structure
  {
    id: 'about-section',
    category: 'sections',
    name: 'About Me Section',
    description: 'Template for introduction',
    icon: User,
    markdown: () => `## About Me

I'm a Full Stack Developer passionate about building web applications.

- Currently working on exciting projects
- Learning new technologies
- Ask me about web development
- How to reach me: your.email@example.com`,
  },
  {
    id: 'tech-stack-header',
    category: 'sections',
    name: 'Tech Stack Section',
    description: 'Template for tech stack section',
    icon: Settings,
    markdown: () => `## Tech Stack

### Languages
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white)`,
  },
  {
    id: 'projects-section',
    category: 'sections',
    name: 'Projects Section',
    description: 'Highlight your projects',
    icon: FolderGit2,
    markdown: (username) => `## Featured Projects

### Project Name
Brief description of your amazing project.

<sub><a href="https://github.com/${username}/your-repo"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/View_Repo-white?style=flat-square&logo=github&logoColor=black"><source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/View_Repo-181717?style=flat-square&logo=github&logoColor=white"><img src="https://img.shields.io/badge/View_Repo-181717?style=flat-square&logo=github&logoColor=white" height="18"/></picture></a></sub>`,
  },
  {
    id: 'awards-section',
    category: 'sections',
    name: 'Awards Section',
    description: 'Showcase your achievements',
    icon: Award,
    markdown: () => `## Awards & Achievements

- First Place - University Hackathon 2024
- Best Project Award - Tech Conference 2023
- Open Source Contributor of the Month`,
  },
  {
    id: 'contact-section',
    category: 'sections',
    name: 'Contact Section',
    description: 'Social links and contact info',
    icon: Mail,
    markdown: (username) => `## Contact

[![GitHub](https://img.shields.io/badge/-GitHub-181717?style=flat-square&logo=github)](https://github.com/${username})
[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/yourprofile)
[![Email](https://img.shields.io/badge/-Email-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:your.email@example.com)`,
  },

  // Badges category - used via BadgeSearch, order less important
  {
    id: 'badge-javascript',
    category: 'badges',
    name: 'JavaScript Badge',
    description: 'JavaScript language badge',
    icon: Tag,
    markdown: () => `![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)`,
  },
  {
    id: 'badge-typescript',
    category: 'badges',
    name: 'TypeScript Badge',
    description: 'TypeScript language badge',
    icon: Tag,
    markdown: () => `![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)`,
  },
  {
    id: 'badge-react',
    category: 'badges',
    name: 'React Badge',
    description: 'React framework badge',
    icon: Tag,
    markdown: () => `![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)`,
  },
  {
    id: 'badge-nodejs',
    category: 'badges',
    name: 'Node.js Badge',
    description: 'Node.js runtime badge',
    icon: Tag,
    markdown: () => `![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)`,
  },
  {
    id: 'badge-python',
    category: 'badges',
    name: 'Python Badge',
    description: 'Python language badge',
    icon: Tag,
    markdown: () => `![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white)`,
  },
];

export const categories = [
  { id: 'stats', name: 'Statistics', icon: BarChart3 },
  { id: 'badges', name: 'Badges', icon: Tag },
  { id: 'sections', name: 'Sections', icon: User },
] as const;
