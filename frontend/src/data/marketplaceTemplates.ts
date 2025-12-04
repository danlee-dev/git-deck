// Marketplace Template Definitions
// Pre-built workflow templates for common use cases

import { BlockInstance, Connection } from '@/types/workflow';

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: 'automation' | 'ci-cd' | 'monitoring' | 'productivity' | 'security';
  author: string;
  downloads: number;
  stars: number;
  tags: string[];
  blocks: BlockInstance[];
  connections: Connection[];
  requiredSecrets?: string[];
  configGuide?: string;
}

export const TEMPLATE_CATEGORIES = {
  'automation': { name: '자동화', description: '반복 작업 자동화' },
  'ci-cd': { name: 'CI/CD', description: '빌드, 테스트, 배포' },
  'monitoring': { name: '모니터링', description: '추적 및 알림' },
  'productivity': { name: '생산성', description: '워크플로우 향상' },
  'security': { name: '보안', description: '보안 스캔 및 검사' },
} as const;

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  // 1. Daily Tech News Aggregator
  {
    id: 'tech-news-aggregator',
    name: '기술 뉴스 수집기',
    description: 'Hacker News, Dev.to 등에서 매일 기술 뉴스 수집',
    longDescription: '매일 아침 인기 개발자 커뮤니티에서 트렌딩 기사를 자동으로 가져와 저장소에 저장합니다. 여러 사이트를 직접 방문하지 않아도 최신 정보를 받아볼 수 있습니다.',
    category: 'automation',
    author: 'GitDeck',
    downloads: 1842,
    stars: 156,
    tags: ['뉴스', '수집기', '매일', 'hacker-news', 'dev.to'],
    requiredSecrets: [],
    configGuide: '별도 설정이 필요 없습니다. 워크플로우가 매일 오전 9시(UTC)에 실행되어 NEWS.md를 업데이트합니다.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-schedule',
        position: { x: 100, y: 200 },
        config: { cron: '0 9 * * *' },
        label: 'Daily 9 AM'
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'setup-python-1',
        type: 'job-setup-python',
        position: { x: 500, y: 200 },
        config: { pythonVersion: '3.11', cache: '' }
      },
      {
        id: 'run-script-1',
        type: 'job-run-script',
        position: { x: 700, y: 200 },
        config: {
          name: 'Fetch news',
          run: `pip install requests feedparser
python << 'EOF'
import requests
import feedparser
from datetime import datetime

sources = [
    ("https://hnrss.org/frontpage", "Hacker News"),
    ("https://dev.to/feed", "Dev.to"),
]

news = []
for url, name in sources:
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries[:5]:
            news.append(f"- [{entry.title}]({entry.link}) - {name}")
    except Exception as e:
        print(f"Error fetching {name}: {e}")

with open("NEWS.md", "w") as f:
    f.write(f"# Tech News - {datetime.now().strftime('%Y-%m-%d')}\\n\\n")
    f.write("\\n".join(news))
EOF`
        }
      },
      {
        id: 'run-script-2',
        type: 'job-run-script',
        position: { x: 900, y: 200 },
        config: {
          name: 'Commit changes',
          run: `git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add NEWS.md
git diff --staged --quiet || git commit -m "chore: update daily news"
git push`
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'setup-python-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'setup-python-1', sourcePortId: 'out', targetBlockId: 'run-script-1', targetPortId: 'in' },
      { id: 'c4', sourceBlockId: 'run-script-1', sourcePortId: 'out', targetBlockId: 'run-script-2', targetPortId: 'in' },
    ]
  },

  // 2. AI/ML Paper Tracker
  {
    id: 'arxiv-paper-tracker',
    name: 'AI 논문 추적기',
    description: 'arXiv에서 최신 AI/ML 논문을 매주 추적',
    longDescription: '매주 arXiv에서 가장 많이 인용되고 트렌딩인 AI/ML 논문을 가져옵니다. 주제별로 논문을 정리하여 저장소에 저장합니다.',
    category: 'automation',
    author: 'GitDeck',
    downloads: 923,
    stars: 89,
    tags: ['arxiv', 'ai', 'ml', '연구', '논문'],
    requiredSecrets: [],
    configGuide: '스크립트의 검색 쿼리를 수정하여 특정 주제를 추적하세요 (예: "LLM", "transformer", "diffusion").',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-schedule',
        position: { x: 100, y: 200 },
        config: { cron: '0 10 * * 1' },
        label: 'Every Monday'
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'setup-python-1',
        type: 'job-setup-python',
        position: { x: 500, y: 200 },
        config: { pythonVersion: '3.11', cache: '' }
      },
      {
        id: 'run-script-1',
        type: 'job-run-script',
        position: { x: 700, y: 200 },
        config: {
          name: 'Fetch papers',
          run: `pip install arxiv
python << 'EOF'
import arxiv
from datetime import datetime

search = arxiv.Search(
    query="cat:cs.AI OR cat:cs.LG OR cat:cs.CL",
    max_results=20,
    sort_by=arxiv.SortCriterion.SubmittedDate
)

papers = []
for result in arxiv.Client().results(search):
    title = result.title.replace("\\n", " ")
    papers.append(f"- [{title}]({result.pdf_url}) - {', '.join([a.name for a in result.authors[:3]])}")

with open("PAPERS.md", "w") as f:
    f.write(f"# AI/ML Papers - Week of {datetime.now().strftime('%Y-%m-%d')}\\n\\n")
    f.write("\\n".join(papers))
EOF`
        }
      },
      {
        id: 'run-script-2',
        type: 'job-run-script',
        position: { x: 900, y: 200 },
        config: {
          name: 'Commit changes',
          run: `git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add PAPERS.md
git diff --staged --quiet || git commit -m "chore: update weekly papers"
git push`
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'setup-python-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'setup-python-1', sourcePortId: 'out', targetBlockId: 'run-script-1', targetPortId: 'in' },
      { id: 'c4', sourceBlockId: 'run-script-1', sourcePortId: 'out', targetBlockId: 'run-script-2', targetPortId: 'in' },
    ]
  },

  // 3. Node.js CI Pipeline
  {
    id: 'nodejs-ci-pipeline',
    name: 'Node.js CI 파이프라인',
    description: 'Node.js 프로젝트를 위한 완전한 CI 파이프라인',
    longDescription: '모든 푸시와 PR에서 린트, 커버리지 테스트, 빌드를 실행하는 프로덕션 수준의 CI 파이프라인입니다. 빠른 빌드를 위한 캐싱이 포함되어 있습니다.',
    category: 'ci-cd',
    author: 'GitDeck',
    downloads: 4521,
    stars: 312,
    tags: ['nodejs', 'ci', '테스트', '린트', '빌드'],
    requiredSecrets: [],
    configGuide: '대부분의 Node.js 프로젝트에서 바로 작동합니다. package.json에 "lint", "test", "build" 스크립트가 있는지 확인하세요.',
    blocks: [
      {
        id: 'trigger-push',
        type: 'trigger-push',
        position: { x: 100, y: 150 },
        config: { branches: 'main, develop', paths: '' }
      },
      {
        id: 'trigger-pr',
        type: 'trigger-pr',
        position: { x: 100, y: 300 },
        config: { types: ['opened', 'synchronize'], branches: 'main' }
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'setup-node-1',
        type: 'job-setup-node',
        position: { x: 500, y: 200 },
        config: { nodeVersion: '20', cache: 'npm' }
      },
      {
        id: 'install-1',
        type: 'job-install-deps',
        position: { x: 700, y: 200 },
        config: { packageManager: 'npm', frozen: true }
      },
      {
        id: 'lint-1',
        type: 'job-lint',
        position: { x: 900, y: 100 },
        config: { command: 'npm run lint' }
      },
      {
        id: 'test-1',
        type: 'job-test',
        position: { x: 900, y: 200 },
        config: { command: 'npm test', coverage: true }
      },
      {
        id: 'build-1',
        type: 'job-build',
        position: { x: 900, y: 300 },
        config: { command: 'npm run build', outputDir: 'dist' }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-push', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'trigger-pr', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'setup-node-1', targetPortId: 'in' },
      { id: 'c4', sourceBlockId: 'setup-node-1', sourcePortId: 'out', targetBlockId: 'install-1', targetPortId: 'in' },
      { id: 'c5', sourceBlockId: 'install-1', sourcePortId: 'out', targetBlockId: 'lint-1', targetPortId: 'in' },
      { id: 'c6', sourceBlockId: 'install-1', sourcePortId: 'out', targetBlockId: 'test-1', targetPortId: 'in' },
      { id: 'c7', sourceBlockId: 'install-1', sourcePortId: 'out', targetBlockId: 'build-1', targetPortId: 'in' },
    ]
  },

  // 4. Auto Release with Changelog
  {
    id: 'auto-release-changelog',
    name: '자동 릴리즈 + 변경로그',
    description: '태그 푸시 시 변경로그와 함께 자동 릴리즈',
    longDescription: '버전 태그를 푸시하면 자동 생성된 변경로그와 함께 GitHub 릴리즈를 자동으로 생성합니다. Conventional Commits를 사용하여 변경 사항을 분류합니다.',
    category: 'ci-cd',
    author: 'GitDeck',
    downloads: 2156,
    stars: 178,
    tags: ['릴리즈', '변경로그', '시맨틱버전', '자동화'],
    requiredSecrets: [],
    configGuide: 'v1.0.0과 같은 태그를 푸시하면 릴리즈가 생성됩니다. 더 나은 변경로그를 위해 Conventional Commits(feat:, fix:, docs:)를 사용하세요.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-release',
        position: { x: 100, y: 200 },
        config: { types: ['published'] }
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 0, submodules: 'false' }
      },
      {
        id: 'setup-node-1',
        type: 'job-setup-node',
        position: { x: 500, y: 200 },
        config: { nodeVersion: '20', cache: 'npm' }
      },
      {
        id: 'run-script-1',
        type: 'job-run-script',
        position: { x: 700, y: 200 },
        config: {
          name: 'Generate changelog',
          run: `npm install -g conventional-changelog-cli
conventional-changelog -p angular -i CHANGELOG.md -s`
        }
      },
      {
        id: 'release-1',
        type: 'action-create-release',
        position: { x: 900, y: 200 },
        config: {
          tagName: '${{ github.ref_name }}',
          releaseName: 'Release ${{ github.ref_name }}',
          draft: false,
          prerelease: false
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'setup-node-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'setup-node-1', sourcePortId: 'out', targetBlockId: 'run-script-1', targetPortId: 'in' },
      { id: 'c4', sourceBlockId: 'run-script-1', sourcePortId: 'out', targetBlockId: 'release-1', targetPortId: 'in' },
    ]
  },

  // 5. Deploy to Vercel with Preview
  {
    id: 'vercel-preview-deploy',
    name: 'Vercel 프리뷰 배포',
    description: 'PR에서 프리뷰, 머지 시 프로덕션 배포',
    longDescription: '모든 PR에 대해 프리뷰 환경을 자동 배포하고, main에 머지되면 프로덕션을 배포합니다. 프리뷰 URL이 PR에 자동으로 댓글로 달립니다.',
    category: 'ci-cd',
    author: 'GitDeck',
    downloads: 3245,
    stars: 267,
    tags: ['vercel', '배포', '프리뷰', '프로덕션'],
    requiredSecrets: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'],
    configGuide: '저장소 시크릿에 VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID를 추가하세요. Vercel 대시보드에서 확인할 수 있습니다.',
    blocks: [
      {
        id: 'trigger-pr',
        type: 'trigger-pr',
        position: { x: 100, y: 200 },
        config: { types: ['opened', 'synchronize'], branches: 'main' }
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'deploy-1',
        type: 'integration-deploy-vercel',
        position: { x: 500, y: 200 },
        config: {
          projectId: '${{ secrets.VERCEL_PROJECT_ID }}',
          orgId: '${{ secrets.VERCEL_ORG_ID }}',
          production: false
        }
      },
      {
        id: 'comment-1',
        type: 'action-comment-pr',
        position: { x: 700, y: 200 },
        config: {
          message: 'Preview deployed: ${{ steps.deploy.outputs.url }}'
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-pr', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'deploy-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'deploy-1', sourcePortId: 'out', targetBlockId: 'comment-1', targetPortId: 'in' },
    ]
  },

  // 6. Docker Build & Push to GHCR
  {
    id: 'docker-ghcr-push',
    name: 'Docker 빌드 & 푸시',
    description: 'Docker 이미지 빌드 후 GitHub Container Registry에 푸시',
    longDescription: 'Dockerfile에서 Docker 이미지를 빌드하고 main 푸시 시 GitHub Container Registry에 푸시합니다. 빠른 빌드를 위한 레이어 캐싱을 사용합니다.',
    category: 'ci-cd',
    author: 'GitDeck',
    downloads: 2891,
    stars: 198,
    tags: ['docker', 'ghcr', '컨테이너', '레지스트리'],
    requiredSecrets: [],
    configGuide: '저장소 루트에 Dockerfile이 있는지 확인하세요. 이미지는 ghcr.io/사용자명/저장소명에서 사용 가능합니다.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-push',
        position: { x: 100, y: 200 },
        config: { branches: 'main', paths: '' }
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'docker-1',
        type: 'integration-docker-build',
        position: { x: 500, y: 200 },
        config: {
          registry: 'ghcr.io',
          imageName: '${{ github.repository }}',
          dockerfile: './Dockerfile',
          tags: 'latest, ${{ github.sha }}'
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'docker-1', targetPortId: 'in' },
    ]
  },

  // 7. Slack Notification on Deploy
  {
    id: 'slack-deploy-notify',
    name: 'Slack 배포 알림',
    description: '배포 성공 시 Slack 채널에 알림',
    longDescription: '배포 성공 또는 실패 시 풍부한 Slack 알림을 보냅니다. 커밋 정보, 작성자, 워크플로우 실행 링크가 포함됩니다.',
    category: 'monitoring',
    author: 'GitDeck',
    downloads: 1567,
    stars: 134,
    tags: ['slack', '알림', '배포', '경고'],
    requiredSecrets: ['SLACK_WEBHOOK'],
    configGuide: 'Slack 워크스페이스 설정에서 웹훅 URL을 생성하고 SLACK_WEBHOOK 시크릿으로 추가하세요.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-push',
        position: { x: 100, y: 200 },
        config: { branches: 'main', paths: '' }
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'build-1',
        type: 'job-build',
        position: { x: 500, y: 200 },
        config: { command: 'npm run build', outputDir: 'dist' }
      },
      {
        id: 'slack-1',
        type: 'integration-notify-slack',
        position: { x: 700, y: 200 },
        config: {
          webhookUrl: '${{ secrets.SLACK_WEBHOOK }}',
          message: 'Deployment successful!\nRepo: ${{ github.repository }}\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}',
          channel: '#deployments'
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'build-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'build-1', sourcePortId: 'out', targetBlockId: 'slack-1', targetPortId: 'in' },
    ]
  },

  // 8. Stale Issue Cleanup
  {
    id: 'stale-issue-cleanup',
    name: '오래된 이슈 정리',
    description: '오래된 이슈와 PR 자동 닫기',
    longDescription: '30일 동안 활동이 없는 이슈와 PR을 오래됨으로 표시하고, 7일 후 자동으로 닫습니다. 저장소를 깔끔하게 유지합니다.',
    category: 'automation',
    author: 'GitDeck',
    downloads: 1234,
    stars: 98,
    tags: ['이슈', '정리', '오래됨', '자동화'],
    requiredSecrets: [],
    configGuide: '워크플로우가 매일 실행되며 기본 설정을 사용합니다. 필요에 따라 워크플로우 블록에서 타이밍을 조정하세요.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-schedule',
        position: { x: 100, y: 200 },
        config: { cron: '0 0 * * *' },
        label: 'Daily midnight'
      },
      {
        id: 'run-script-1',
        type: 'job-run-script',
        position: { x: 350, y: 200 },
        config: {
          name: 'Mark stale issues',
          run: `gh issue list --state open --json number,updatedAt --jq '.[] | select(.updatedAt < (now - 30*24*60*60 | strftime("%Y-%m-%dT%H:%M:%SZ"))) | .number' | while read num; do
  gh issue edit $num --add-label "stale"
  gh issue comment $num --body "This issue has been marked as stale due to inactivity. It will be closed in 7 days if no further activity occurs."
done`
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'run-script-1', targetPortId: 'in' },
    ]
  },

  // 9. Dependency Update PR
  {
    id: 'dependency-update-pr',
    name: '주간 의존성 업데이트',
    description: '매주 의존성 업데이트 PR 생성',
    longDescription: '매주 npm update를 실행하고 모든 의존성 변경사항이 담긴 PR을 생성합니다. 업데이트 타이밍을 더 잘 제어할 수 있는 Dependabot 대안입니다.',
    category: 'automation',
    author: 'GitDeck',
    downloads: 2089,
    stars: 156,
    tags: ['의존성', '업데이트', 'npm', 'pr'],
    requiredSecrets: [],
    configGuide: '워크플로우가 매주 월요일에 업데이트된 의존성으로 PR을 생성합니다. 검토 후 머지하세요.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-schedule',
        position: { x: 100, y: 200 },
        config: { cron: '0 9 * * 1' },
        label: 'Monday 9 AM'
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'setup-node-1',
        type: 'job-setup-node',
        position: { x: 500, y: 200 },
        config: { nodeVersion: '20', cache: '' }
      },
      {
        id: 'run-script-1',
        type: 'job-run-script',
        position: { x: 700, y: 200 },
        config: {
          name: 'Update and create PR',
          run: `npm update
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git checkout -b deps/weekly-update-$(date +%Y%m%d)
git add package.json package-lock.json
git diff --staged --quiet || git commit -m "chore(deps): weekly dependency updates"
git push -u origin HEAD
gh pr create --title "chore(deps): Weekly dependency updates" --body "Automated dependency updates for this week."`
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'setup-node-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'setup-node-1', sourcePortId: 'out', targetBlockId: 'run-script-1', targetPortId: 'in' },
    ]
  },

  // 10. Profile README Auto Update
  {
    id: 'profile-readme-update',
    name: '프로필 README 자동 업데이트',
    description: 'GitHub 프로필 README를 항상 최신으로 유지',
    longDescription: '최신 블로그 포스트, 활동 통계 등으로 GitHub 프로필 README를 자동 업데이트합니다. 매일 실행되어 프로필을 최신 상태로 유지합니다.',
    category: 'productivity',
    author: 'GitDeck',
    downloads: 3456,
    stars: 289,
    tags: ['프로필', 'readme', '통계', '블로그'],
    requiredSecrets: [],
    configGuide: '이 워크플로우를 프로필 저장소(사용자명/사용자명)에 추가하세요. 원하는 소스에서 데이터를 가져오도록 스크립트를 커스터마이즈할 수 있습니다.',
    blocks: [
      {
        id: 'trigger-1',
        type: 'trigger-schedule',
        position: { x: 100, y: 200 },
        config: { cron: '0 0 * * *' },
        label: 'Daily'
      },
      {
        id: 'checkout-1',
        type: 'job-checkout',
        position: { x: 300, y: 200 },
        config: { fetchDepth: 1, submodules: 'false' }
      },
      {
        id: 'setup-python-1',
        type: 'job-setup-python',
        position: { x: 500, y: 200 },
        config: { pythonVersion: '3.11', cache: '' }
      },
      {
        id: 'run-script-1',
        type: 'job-run-script',
        position: { x: 700, y: 200 },
        config: {
          name: 'Update README',
          run: 'pip install requests\npython << \'EOF\'\nimport requests\nfrom datetime import datetime\n\nusername = "${{ github.repository_owner }}"\nresponse = requests.get(f"https://api.github.com/users/{username}/events/public")\nevents = response.json()[:5]\n\nactivity = []\nfor event in events:\n    if event["type"] == "PushEvent":\n        repo = event["repo"]["name"]\n        activity.append(f"Pushed to {repo}")\n    elif event["type"] == "PullRequestEvent":\n        activity.append(f"PR in {event[\'repo\'][\'name\']}")\n\nwith open("README.md", "r") as f:\n    content = f.read()\n\nstart = "<!-- ACTIVITY:START -->"\nend = "<!-- ACTIVITY:END -->"\nif start in content and end in content:\n    before = content.split(start)[0]\n    after = content.split(end)[1]\n    activity_section = "\\n".join([f"- {a}" for a in activity])\n    content = f"{before}{start}\\n{activity_section}\\n{end}{after}"\n\n    with open("README.md", "w") as f:\n        f.write(content)\nEOF'
        }
      },
      {
        id: 'run-script-2',
        type: 'job-run-script',
        position: { x: 900, y: 200 },
        config: {
          name: 'Commit',
          run: `git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add README.md
git diff --staged --quiet || git commit -m "chore: update profile readme"
git push`
        }
      }
    ],
    connections: [
      { id: 'c1', sourceBlockId: 'trigger-1', sourcePortId: 'out', targetBlockId: 'checkout-1', targetPortId: 'in' },
      { id: 'c2', sourceBlockId: 'checkout-1', sourcePortId: 'out', targetBlockId: 'setup-python-1', targetPortId: 'in' },
      { id: 'c3', sourceBlockId: 'setup-python-1', sourcePortId: 'out', targetBlockId: 'run-script-1', targetPortId: 'in' },
      { id: 'c4', sourceBlockId: 'run-script-1', sourcePortId: 'out', targetBlockId: 'run-script-2', targetPortId: 'in' },
    ]
  }
];

export function getTemplatesByCategory(category: string): MarketplaceTemplate[] {
  if (category === 'all') return MARKETPLACE_TEMPLATES;
  return MARKETPLACE_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): MarketplaceTemplate | undefined {
  return MARKETPLACE_TEMPLATES.find(t => t.id === id);
}
