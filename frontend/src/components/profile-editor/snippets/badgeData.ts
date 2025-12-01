export interface BadgeInfo {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'tool' | 'platform' | 'database' | 'cloud' | 'os' | 'other';
  logo: string;
  color: string;
  logoColor?: string;
}

export const badges: BadgeInfo[] = [
  // Languages
  { id: 'javascript', name: 'JavaScript', category: 'language', logo: 'javascript', color: 'F7DF1E', logoColor: 'black' },
  { id: 'typescript', name: 'TypeScript', category: 'language', logo: 'typescript', color: '3178C6' },
  { id: 'python', name: 'Python', category: 'language', logo: 'python', color: '3776AB' },
  { id: 'java', name: 'Java', category: 'language', logo: 'openjdk', color: '007396' },
  { id: 'csharp', name: 'C#', category: 'language', logo: 'csharp', color: '239120' },
  { id: 'cpp', name: 'C++', category: 'language', logo: 'cplusplus', color: '00599C' },
  { id: 'c', name: 'C', category: 'language', logo: 'c', color: 'A8B9CC', logoColor: 'black' },
  { id: 'go', name: 'Go', category: 'language', logo: 'go', color: '00ADD8' },
  { id: 'rust', name: 'Rust', category: 'language', logo: 'rust', color: '000000' },
  { id: 'php', name: 'PHP', category: 'language', logo: 'php', color: '777BB4' },
  { id: 'ruby', name: 'Ruby', category: 'language', logo: 'ruby', color: 'CC342D' },
  { id: 'swift', name: 'Swift', category: 'language', logo: 'swift', color: 'FA7343' },
  { id: 'kotlin', name: 'Kotlin', category: 'language', logo: 'kotlin', color: '7F52FF' },
  { id: 'dart', name: 'Dart', category: 'language', logo: 'dart', color: '0175C2' },
  { id: 'r', name: 'R', category: 'language', logo: 'r', color: '276DC3' },
  { id: 'scala', name: 'Scala', category: 'language', logo: 'scala', color: 'DC322F' },
  { id: 'shell', name: 'Shell', category: 'language', logo: 'gnubash', color: '4EAA25' },

  // Frontend Frameworks
  { id: 'react', name: 'React', category: 'framework', logo: 'react', color: '61DAFB', logoColor: 'black' },
  { id: 'nextjs', name: 'Next.js', category: 'framework', logo: 'nextdotjs', color: '000000' },
  { id: 'vue', name: 'Vue.js', category: 'framework', logo: 'vuedotjs', color: '4FC08D' },
  { id: 'nuxt', name: 'Nuxt.js', category: 'framework', logo: 'nuxtdotjs', color: '00DC82' },
  { id: 'angular', name: 'Angular', category: 'framework', logo: 'angular', color: 'DD0031' },
  { id: 'svelte', name: 'Svelte', category: 'framework', logo: 'svelte', color: 'FF3E00' },
  { id: 'solid', name: 'Solid', category: 'framework', logo: 'solid', color: '2C4F7C' },
  { id: 'astro', name: 'Astro', category: 'framework', logo: 'astro', color: 'BC52EE' },
  { id: 'gatsby', name: 'Gatsby', category: 'framework', logo: 'gatsby', color: '663399' },

  // Backend Frameworks
  { id: 'nodejs', name: 'Node.js', category: 'framework', logo: 'nodedotjs', color: '339933' },
  { id: 'express', name: 'Express', category: 'framework', logo: 'express', color: '000000' },
  { id: 'nestjs', name: 'NestJS', category: 'framework', logo: 'nestjs', color: 'E0234E' },
  { id: 'fastify', name: 'Fastify', category: 'framework', logo: 'fastify', color: '000000' },
  { id: 'django', name: 'Django', category: 'framework', logo: 'django', color: '092E20' },
  { id: 'flask', name: 'Flask', category: 'framework', logo: 'flask', color: '000000' },
  { id: 'fastapi', name: 'FastAPI', category: 'framework', logo: 'fastapi', color: '009688' },
  { id: 'spring', name: 'Spring', category: 'framework', logo: 'spring', color: '6DB33F' },
  { id: 'laravel', name: 'Laravel', category: 'framework', logo: 'laravel', color: 'FF2D20' },
  { id: 'rails', name: 'Rails', category: 'framework', logo: 'rubyonrails', color: 'CC0000' },

  // Databases
  { id: 'mongodb', name: 'MongoDB', category: 'database', logo: 'mongodb', color: '47A248' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', logo: 'postgresql', color: '4169E1' },
  { id: 'mysql', name: 'MySQL', category: 'database', logo: 'mysql', color: '4479A1' },
  { id: 'redis', name: 'Redis', category: 'database', logo: 'redis', color: 'DC382D' },
  { id: 'sqlite', name: 'SQLite', category: 'database', logo: 'sqlite', color: '003B57' },
  { id: 'mariadb', name: 'MariaDB', category: 'database', logo: 'mariadb', color: '003545' },
  { id: 'elasticsearch', name: 'Elasticsearch', category: 'database', logo: 'elasticsearch', color: '005571' },
  { id: 'supabase', name: 'Supabase', category: 'database', logo: 'supabase', color: '3FCF8E' },
  { id: 'firebase', name: 'Firebase', category: 'database', logo: 'firebase', color: 'FFCA28', logoColor: 'black' },

  // Cloud & DevOps
  { id: 'aws', name: 'AWS', category: 'cloud', logo: 'amazonaws', color: '232F3E' },
  { id: 'gcp', name: 'Google Cloud', category: 'cloud', logo: 'googlecloud', color: '4285F4' },
  { id: 'azure', name: 'Azure', category: 'cloud', logo: 'microsoftazure', color: '0078D4' },
  { id: 'vercel', name: 'Vercel', category: 'cloud', logo: 'vercel', color: '000000' },
  { id: 'netlify', name: 'Netlify', category: 'cloud', logo: 'netlify', color: '00C7B7' },
  { id: 'heroku', name: 'Heroku', category: 'cloud', logo: 'heroku', color: '430098' },
  { id: 'docker', name: 'Docker', category: 'tool', logo: 'docker', color: '2496ED' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'tool', logo: 'kubernetes', color: '326CE5' },

  // Tools & Platforms
  { id: 'git', name: 'Git', category: 'tool', logo: 'git', color: 'F05032' },
  { id: 'github', name: 'GitHub', category: 'platform', logo: 'github', color: '181717' },
  { id: 'gitlab', name: 'GitLab', category: 'platform', logo: 'gitlab', color: 'FC6D26' },
  { id: 'bitbucket', name: 'Bitbucket', category: 'platform', logo: 'bitbucket', color: '0052CC' },
  { id: 'vscode', name: 'VS Code', category: 'tool', logo: 'visualstudiocode', color: '007ACC' },
  { id: 'intellij', name: 'IntelliJ IDEA', category: 'tool', logo: 'intellijidea', color: '000000' },
  { id: 'vim', name: 'Vim', category: 'tool', logo: 'vim', color: '019733' },
  { id: 'postman', name: 'Postman', category: 'tool', logo: 'postman', color: 'FF6C37' },
  { id: 'figma', name: 'Figma', category: 'tool', logo: 'figma', color: 'F24E1E' },

  // CSS & Styling
  { id: 'tailwind', name: 'Tailwind CSS', category: 'framework', logo: 'tailwindcss', color: '06B6D4' },
  { id: 'sass', name: 'Sass', category: 'tool', logo: 'sass', color: 'CC6699' },
  { id: 'styled-components', name: 'styled-components', category: 'tool', logo: 'styledcomponents', color: 'DB7093' },
  { id: 'bootstrap', name: 'Bootstrap', category: 'framework', logo: 'bootstrap', color: '7952B3' },
  { id: 'mui', name: 'Material-UI', category: 'framework', logo: 'mui', color: '007FFF' },

  // Testing
  { id: 'jest', name: 'Jest', category: 'tool', logo: 'jest', color: 'C21325' },
  { id: 'vitest', name: 'Vitest', category: 'tool', logo: 'vitest', color: '6E9F18' },
  { id: 'cypress', name: 'Cypress', category: 'tool', logo: 'cypress', color: '17202C' },
  { id: 'playwright', name: 'Playwright', category: 'tool', logo: 'playwright', color: '2EAD33' },
  { id: 'pytest', name: 'Pytest', category: 'tool', logo: 'pytest', color: '0A9EDC' },

  // Mobile
  { id: 'react-native', name: 'React Native', category: 'framework', logo: 'react', color: '61DAFB', logoColor: 'black' },
  { id: 'flutter', name: 'Flutter', category: 'framework', logo: 'flutter', color: '02569B' },
  { id: 'android', name: 'Android', category: 'platform', logo: 'android', color: '3DDC84', logoColor: 'black' },
  { id: 'ios', name: 'iOS', category: 'platform', logo: 'ios', color: '000000' },

  // OS
  { id: 'linux', name: 'Linux', category: 'os', logo: 'linux', color: 'FCC624', logoColor: 'black' },
  { id: 'ubuntu', name: 'Ubuntu', category: 'os', logo: 'ubuntu', color: 'E95420' },
  { id: 'macos', name: 'macOS', category: 'os', logo: 'macos', color: '000000' },
  { id: 'windows', name: 'Windows', category: 'os', logo: 'windows', color: '0078D4' },

  // State Management
  { id: 'redux', name: 'Redux', category: 'tool', logo: 'redux', color: '764ABC' },
  { id: 'zustand', name: 'Zustand', category: 'tool', logo: 'react', color: '000000' },
  { id: 'mobx', name: 'MobX', category: 'tool', logo: 'mobx', color: 'FF9955' },
  { id: 'recoil', name: 'Recoil', category: 'tool', logo: 'recoil', color: '3578E5' },

  // Build Tools
  { id: 'webpack', name: 'Webpack', category: 'tool', logo: 'webpack', color: '8DD6F9', logoColor: 'black' },
  { id: 'vite', name: 'Vite', category: 'tool', logo: 'vite', color: '646CFF' },
  { id: 'rollup', name: 'Rollup', category: 'tool', logo: 'rollupdotjs', color: 'EC4A3F' },
  { id: 'turbopack', name: 'Turbopack', category: 'tool', logo: 'turbo', color: '0088CC' },
  { id: 'esbuild', name: 'esbuild', category: 'tool', logo: 'esbuild', color: 'FFCF00', logoColor: 'black' },

  // Package Managers
  { id: 'npm', name: 'npm', category: 'tool', logo: 'npm', color: 'CB3837' },
  { id: 'yarn', name: 'Yarn', category: 'tool', logo: 'yarn', color: '2C8EBB' },
  { id: 'pnpm', name: 'pnpm', category: 'tool', logo: 'pnpm', color: 'F69220' },

  // GraphQL & API
  { id: 'graphql', name: 'GraphQL', category: 'tool', logo: 'graphql', color: 'E10098' },
  { id: 'apollo', name: 'Apollo GraphQL', category: 'tool', logo: 'apollographql', color: '311C87' },
  { id: 'prisma', name: 'Prisma', category: 'tool', logo: 'prisma', color: '2D3748' },
  { id: 'trpc', name: 'tRPC', category: 'tool', logo: 'trpc', color: '2596BE' },

  // Other Popular
  { id: 'tensorflow', name: 'TensorFlow', category: 'tool', logo: 'tensorflow', color: 'FF6F00' },
  { id: 'pytorch', name: 'PyTorch', category: 'tool', logo: 'pytorch', color: 'EE4C2C' },
  { id: 'opencv', name: 'OpenCV', category: 'tool', logo: 'opencv', color: '5C3EE8' },
  { id: 'nginx', name: 'Nginx', category: 'tool', logo: 'nginx', color: '009639' },
  { id: 'rabbitmq', name: 'RabbitMQ', category: 'tool', logo: 'rabbitmq', color: 'FF6600' },
  { id: 'kafka', name: 'Apache Kafka', category: 'tool', logo: 'apachekafka', color: '231F20' },
];

export const badgeCategories = [
  { id: 'all', name: 'All' },
  { id: 'language', name: 'Languages' },
  { id: 'framework', name: 'Frameworks' },
  { id: 'database', name: 'Databases' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'tool', name: 'Tools' },
  { id: 'platform', name: 'Platforms' },
  { id: 'os', name: 'OS' },
] as const;

export function generateBadgeMarkdown(badge: BadgeInfo): string {
  const logoColor = badge.logoColor || 'white';
  return `![${badge.name}](https://img.shields.io/badge/-${badge.name.replace(/ /g, '_')}-${badge.color}?style=flat-square&logo=${badge.logo}&logoColor=${logoColor})`;
}
