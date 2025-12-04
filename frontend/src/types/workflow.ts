// Workflow Builder Types
// GitHub Actions visual workflow builder type definitions

// =============================================================================
// Block Categories
// =============================================================================

export type BlockCategory =
  | 'trigger'      // Events that start workflows
  | 'job'          // Main job blocks
  | 'action'       // GitHub Actions
  | 'control'      // Control flow (conditions, matrix)
  | 'integration'  // External service integrations
  | 'utility';     // Utility blocks (cache, artifact, etc.)

// =============================================================================
// Port Types (Input/Output connections)
// =============================================================================

export type PortType =
  | 'trigger'      // Workflow trigger output
  | 'job'          // Job execution flow
  | 'data'         // Data/artifact passing
  | 'condition'    // Conditional branching
  | 'any';         // Universal connector

export interface Port {
  id: string;
  name: string;
  type: PortType;
  required?: boolean;
  multiple?: boolean;  // Can accept multiple connections
  description?: string;
}

// =============================================================================
// Block Definitions (Templates)
// =============================================================================

export interface BlockDefinition {
  type: string;
  category: BlockCategory;
  name: string;
  description: string;
  icon: string;           // Lucide icon name
  color: string;          // Block accent color
  inputs: Port[];
  outputs: Port[];
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'boolean' | 'code' | 'secret';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

// =============================================================================
// Block Instance (Node on Canvas)
// =============================================================================

export interface BlockInstance {
  id: string;
  type: string;           // References BlockDefinition.type
  position: { x: number; y: number };
  config: Record<string, unknown>;
  label?: string;         // Custom label override
}

// =============================================================================
// Connection (Edge between blocks)
// =============================================================================

export interface Connection {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
  animated?: boolean;
}

// =============================================================================
// Workflow
// =============================================================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  blocks: BlockInstance[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
  repositoryId?: string;  // Linked GitHub repo
  isDeployed?: boolean;
  yamlContent?: string;   // Generated YAML
}

// =============================================================================
// Execution State (for testing/preview)
// =============================================================================

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'failure' | 'cancelled';

export interface BlockExecutionState {
  blockId: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
  logs?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  blockStates: Record<string, BlockExecutionState>;
  currentBlockId?: string;
}

// =============================================================================
// Predefined Block Definitions
// =============================================================================

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // -------------------------------------------------------------------------
  // TRIGGER BLOCKS
  // -------------------------------------------------------------------------
  {
    type: 'trigger-push',
    category: 'trigger',
    name: 'Push',
    description: 'Triggered when code is pushed to repository',
    icon: 'GitCommit',
    color: '#10b981',
    inputs: [],
    outputs: [
      { id: 'out', name: 'Output', type: 'trigger' }
    ],
    configFields: [
      {
        key: 'branches',
        label: 'Branches',
        type: 'text',
        placeholder: 'main, develop, feature/*',
        description: 'Comma-separated branch patterns'
      },
      {
        key: 'paths',
        label: 'Paths',
        type: 'text',
        placeholder: 'src/**, *.ts',
        description: 'Only trigger on changes to these paths'
      }
    ],
    defaultConfig: {
      branches: 'main',
      paths: ''
    }
  },
  {
    type: 'trigger-pr',
    category: 'trigger',
    name: 'Pull Request',
    description: 'Triggered on pull request events',
    icon: 'GitPullRequest',
    color: '#8b5cf6',
    inputs: [],
    outputs: [
      { id: 'out', name: 'Output', type: 'trigger' }
    ],
    configFields: [
      {
        key: 'types',
        label: 'Event Types',
        type: 'multiselect',
        options: [
          { value: 'opened', label: 'Opened' },
          { value: 'closed', label: 'Closed' },
          { value: 'synchronize', label: 'Synchronized' },
          { value: 'reopened', label: 'Reopened' },
          { value: 'ready_for_review', label: 'Ready for Review' }
        ]
      },
      {
        key: 'branches',
        label: 'Target Branches',
        type: 'text',
        placeholder: 'main, develop'
      }
    ],
    defaultConfig: {
      types: ['opened', 'synchronize'],
      branches: 'main'
    }
  },
  {
    type: 'trigger-schedule',
    category: 'trigger',
    name: 'Schedule',
    description: 'Triggered on a schedule (cron)',
    icon: 'Clock',
    color: '#f59e0b',
    inputs: [],
    outputs: [
      { id: 'out', name: 'Output', type: 'trigger' }
    ],
    configFields: [
      {
        key: 'cron',
        label: 'Cron Expression',
        type: 'text',
        placeholder: '0 0 * * *',
        required: true,
        description: 'minute hour day month weekday'
      }
    ],
    defaultConfig: {
      cron: '0 0 * * *'
    }
  },
  {
    type: 'trigger-manual',
    category: 'trigger',
    name: 'Manual Trigger',
    description: 'Manually triggered workflow',
    icon: 'Play',
    color: '#3b82f6',
    inputs: [],
    outputs: [
      { id: 'out', name: 'Output', type: 'trigger' }
    ],
    configFields: [
      {
        key: 'inputs',
        label: 'Input Parameters',
        type: 'code',
        placeholder: 'environment:\n  description: "Deploy environment"\n  required: true\n  default: "staging"'
      }
    ],
    defaultConfig: {
      inputs: ''
    }
  },
  {
    type: 'trigger-release',
    category: 'trigger',
    name: 'Release',
    description: 'Triggered on release events',
    icon: 'Tag',
    color: '#ec4899',
    inputs: [],
    outputs: [
      { id: 'out', name: 'Output', type: 'trigger' }
    ],
    configFields: [
      {
        key: 'types',
        label: 'Event Types',
        type: 'multiselect',
        options: [
          { value: 'published', label: 'Published' },
          { value: 'created', label: 'Created' },
          { value: 'prereleased', label: 'Pre-released' }
        ]
      }
    ],
    defaultConfig: {
      types: ['published']
    }
  },

  // -------------------------------------------------------------------------
  // JOB BLOCKS
  // -------------------------------------------------------------------------
  {
    type: 'job-checkout',
    category: 'job',
    name: 'Checkout',
    description: 'Checkout repository code',
    icon: 'Download',
    color: '#64748b',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'fetchDepth',
        label: 'Fetch Depth',
        type: 'number',
        placeholder: '1',
        description: '0 for full history'
      },
      {
        key: 'submodules',
        label: 'Submodules',
        type: 'select',
        options: [
          { value: 'false', label: 'None' },
          { value: 'true', label: 'Yes' },
          { value: 'recursive', label: 'Recursive' }
        ]
      }
    ],
    defaultConfig: {
      fetchDepth: 1,
      submodules: 'false'
    }
  },
  {
    type: 'job-setup-node',
    category: 'job',
    name: 'Setup Node.js',
    description: 'Setup Node.js environment',
    icon: 'Hexagon',
    color: '#22c55e',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'nodeVersion',
        label: 'Node Version',
        type: 'select',
        options: [
          { value: '18', label: '18 LTS' },
          { value: '20', label: '20 LTS' },
          { value: '21', label: '21' },
          { value: '22', label: '22' }
        ],
        required: true
      },
      {
        key: 'cache',
        label: 'Package Manager Cache',
        type: 'select',
        options: [
          { value: '', label: 'None' },
          { value: 'npm', label: 'npm' },
          { value: 'yarn', label: 'yarn' },
          { value: 'pnpm', label: 'pnpm' }
        ]
      }
    ],
    defaultConfig: {
      nodeVersion: '20',
      cache: 'npm'
    }
  },
  {
    type: 'job-setup-python',
    category: 'job',
    name: 'Setup Python',
    description: 'Setup Python environment',
    icon: 'Code2',
    color: '#3776ab',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'pythonVersion',
        label: 'Python Version',
        type: 'select',
        options: [
          { value: '3.9', label: '3.9' },
          { value: '3.10', label: '3.10' },
          { value: '3.11', label: '3.11' },
          { value: '3.12', label: '3.12' }
        ],
        required: true
      },
      {
        key: 'cache',
        label: 'Cache',
        type: 'select',
        options: [
          { value: '', label: 'None' },
          { value: 'pip', label: 'pip' },
          { value: 'pipenv', label: 'pipenv' },
          { value: 'poetry', label: 'poetry' }
        ]
      }
    ],
    defaultConfig: {
      pythonVersion: '3.11',
      cache: 'pip'
    }
  },
  {
    type: 'job-run-script',
    category: 'job',
    name: 'Run Script',
    description: 'Run shell commands',
    icon: 'Terminal',
    color: '#1e293b',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'name',
        label: 'Step Name',
        type: 'text',
        placeholder: 'Run tests'
      },
      {
        key: 'run',
        label: 'Commands',
        type: 'code',
        required: true,
        placeholder: 'npm install\nnpm run build\nnpm test'
      },
      {
        key: 'workingDirectory',
        label: 'Working Directory',
        type: 'text',
        placeholder: './'
      }
    ],
    defaultConfig: {
      name: '',
      run: '',
      workingDirectory: ''
    }
  },
  {
    type: 'job-install-deps',
    category: 'job',
    name: 'Install Dependencies',
    description: 'Install project dependencies',
    icon: 'Package',
    color: '#0ea5e9',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'packageManager',
        label: 'Package Manager',
        type: 'select',
        options: [
          { value: 'npm', label: 'npm' },
          { value: 'yarn', label: 'yarn' },
          { value: 'pnpm', label: 'pnpm' },
          { value: 'pip', label: 'pip' }
        ],
        required: true
      },
      {
        key: 'frozen',
        label: 'Frozen Lockfile',
        type: 'boolean',
        description: 'Use ci/frozen-lockfile for reproducible builds'
      }
    ],
    defaultConfig: {
      packageManager: 'npm',
      frozen: true
    }
  },
  {
    type: 'job-build',
    category: 'job',
    name: 'Build',
    description: 'Build the project',
    icon: 'Hammer',
    color: '#f97316',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'command',
        label: 'Build Command',
        type: 'text',
        placeholder: 'npm run build',
        required: true
      },
      {
        key: 'outputDir',
        label: 'Output Directory',
        type: 'text',
        placeholder: 'dist'
      }
    ],
    defaultConfig: {
      command: 'npm run build',
      outputDir: 'dist'
    }
  },
  {
    type: 'job-test',
    category: 'job',
    name: 'Run Tests',
    description: 'Run test suite',
    icon: 'TestTube',
    color: '#a855f7',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'command',
        label: 'Test Command',
        type: 'text',
        placeholder: 'npm test',
        required: true
      },
      {
        key: 'coverage',
        label: 'Generate Coverage',
        type: 'boolean'
      }
    ],
    defaultConfig: {
      command: 'npm test',
      coverage: true
    }
  },
  {
    type: 'job-lint',
    category: 'job',
    name: 'Lint',
    description: 'Run linter checks',
    icon: 'Search',
    color: '#eab308',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'command',
        label: 'Lint Command',
        type: 'text',
        placeholder: 'npm run lint',
        required: true
      }
    ],
    defaultConfig: {
      command: 'npm run lint'
    }
  },

  // -------------------------------------------------------------------------
  // CONTROL BLOCKS
  // -------------------------------------------------------------------------
  {
    type: 'control-condition',
    category: 'control',
    name: 'Condition',
    description: 'Conditional branching',
    icon: 'GitBranch',
    color: '#f43f5e',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'condition',
        label: 'Condition',
        type: 'code',
        required: true,
        placeholder: "github.ref == 'refs/heads/main'"
      }
    ],
    defaultConfig: {
      condition: ''
    }
  },
  {
    type: 'control-matrix',
    category: 'control',
    name: 'Matrix',
    description: 'Run job with matrix strategy',
    icon: 'Grid3x3',
    color: '#06b6d4',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'matrix',
        label: 'Matrix Definition',
        type: 'code',
        required: true,
        placeholder: 'os: [ubuntu-latest, windows-latest]\nnode: [18, 20]'
      },
      {
        key: 'failFast',
        label: 'Fail Fast',
        type: 'boolean',
        description: 'Cancel all jobs if one fails'
      }
    ],
    defaultConfig: {
      matrix: 'os: [ubuntu-latest]\nnode: [20]',
      failFast: true
    }
  },
  {
    type: 'control-parallel',
    category: 'control',
    name: 'Parallel',
    description: 'Run jobs in parallel',
    icon: 'Rows3',
    color: '#14b8a6',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [],
    defaultConfig: {}
  },
  {
    type: 'control-wait',
    category: 'control',
    name: 'Wait All',
    description: 'Wait for all inputs to complete',
    icon: 'Merge',
    color: '#6366f1',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [],
    defaultConfig: {}
  },

  // -------------------------------------------------------------------------
  // ACTION BLOCKS
  // -------------------------------------------------------------------------
  {
    type: 'action-create-release',
    category: 'action',
    name: 'Create Release',
    description: 'Create GitHub release',
    icon: 'Rocket',
    color: '#22d3ee',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'tagName',
        label: 'Tag Name',
        type: 'text',
        placeholder: 'v${{ github.run_number }}',
        required: true
      },
      {
        key: 'releaseName',
        label: 'Release Name',
        type: 'text',
        placeholder: 'Release ${{ github.run_number }}'
      },
      {
        key: 'draft',
        label: 'Draft',
        type: 'boolean'
      },
      {
        key: 'prerelease',
        label: 'Pre-release',
        type: 'boolean'
      }
    ],
    defaultConfig: {
      tagName: '',
      releaseName: '',
      draft: false,
      prerelease: false
    }
  },
  {
    type: 'action-comment-pr',
    category: 'action',
    name: 'Comment on PR',
    description: 'Add comment to pull request',
    icon: 'MessageSquare',
    color: '#84cc16',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'message',
        label: 'Comment Message',
        type: 'textarea',
        required: true,
        placeholder: 'Build successful! Preview: ${{ steps.deploy.outputs.url }}'
      }
    ],
    defaultConfig: {
      message: ''
    }
  },
  {
    type: 'action-label',
    category: 'action',
    name: 'Manage Labels',
    description: 'Add or remove labels',
    icon: 'Tag',
    color: '#f472b6',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'action',
        label: 'Action',
        type: 'select',
        options: [
          { value: 'add', label: 'Add Labels' },
          { value: 'remove', label: 'Remove Labels' }
        ],
        required: true
      },
      {
        key: 'labels',
        label: 'Labels',
        type: 'text',
        placeholder: 'bug, priority-high',
        required: true
      }
    ],
    defaultConfig: {
      action: 'add',
      labels: ''
    }
  },

  // -------------------------------------------------------------------------
  // INTEGRATION BLOCKS
  // -------------------------------------------------------------------------
  {
    type: 'integration-deploy-vercel',
    category: 'integration',
    name: 'Deploy to Vercel',
    description: 'Deploy to Vercel platform',
    icon: 'Triangle',
    color: '#000000',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'projectId',
        label: 'Project ID',
        type: 'text',
        required: true
      },
      {
        key: 'orgId',
        label: 'Org ID',
        type: 'text',
        required: true
      },
      {
        key: 'production',
        label: 'Production Deploy',
        type: 'boolean'
      }
    ],
    defaultConfig: {
      projectId: '',
      orgId: '',
      production: false
    }
  },
  {
    type: 'integration-docker-build',
    category: 'integration',
    name: 'Docker Build & Push',
    description: 'Build and push Docker image',
    icon: 'Container',
    color: '#2496ed',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'registry',
        label: 'Registry',
        type: 'select',
        options: [
          { value: 'ghcr.io', label: 'GitHub Container Registry' },
          { value: 'docker.io', label: 'Docker Hub' },
          { value: 'custom', label: 'Custom Registry' }
        ],
        required: true
      },
      {
        key: 'imageName',
        label: 'Image Name',
        type: 'text',
        required: true,
        placeholder: '${{ github.repository }}'
      },
      {
        key: 'dockerfile',
        label: 'Dockerfile Path',
        type: 'text',
        placeholder: './Dockerfile'
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'text',
        placeholder: 'latest, ${{ github.sha }}'
      }
    ],
    defaultConfig: {
      registry: 'ghcr.io',
      imageName: '',
      dockerfile: './Dockerfile',
      tags: 'latest'
    }
  },
  {
    type: 'integration-notify-slack',
    category: 'integration',
    name: 'Slack Notification',
    description: 'Send Slack notification',
    icon: 'MessageCircle',
    color: '#4a154b',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL (Secret)',
        type: 'secret',
        required: true,
        placeholder: '${{ secrets.SLACK_WEBHOOK }}'
      },
      {
        key: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        placeholder: 'Deployment to ${{ github.ref }} completed!'
      },
      {
        key: 'channel',
        label: 'Channel',
        type: 'text',
        placeholder: '#deployments'
      }
    ],
    defaultConfig: {
      webhookUrl: '${{ secrets.SLACK_WEBHOOK }}',
      message: '',
      channel: ''
    }
  },
  {
    type: 'integration-npm-publish',
    category: 'integration',
    name: 'NPM Publish',
    description: 'Publish package to npm',
    icon: 'Package',
    color: '#cb3837',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'registry',
        label: 'Registry',
        type: 'select',
        options: [
          { value: 'https://registry.npmjs.org', label: 'npm Registry' },
          { value: 'https://npm.pkg.github.com', label: 'GitHub Packages' }
        ],
        required: true
      },
      {
        key: 'access',
        label: 'Access',
        type: 'select',
        options: [
          { value: 'public', label: 'Public' },
          { value: 'restricted', label: 'Restricted' }
        ]
      }
    ],
    defaultConfig: {
      registry: 'https://registry.npmjs.org',
      access: 'public'
    }
  },

  // -------------------------------------------------------------------------
  // UTILITY BLOCKS
  // -------------------------------------------------------------------------
  {
    type: 'utility-cache',
    category: 'utility',
    name: 'Cache',
    description: 'Cache dependencies or build outputs',
    icon: 'Database',
    color: '#8b5cf6',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'path',
        label: 'Cache Path',
        type: 'text',
        required: true,
        placeholder: 'node_modules'
      },
      {
        key: 'key',
        label: 'Cache Key',
        type: 'text',
        required: true,
        placeholder: "${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}"
      },
      {
        key: 'restoreKeys',
        label: 'Restore Keys',
        type: 'text',
        placeholder: '${{ runner.os }}-node-'
      }
    ],
    defaultConfig: {
      path: '',
      key: '',
      restoreKeys: ''
    }
  },
  {
    type: 'utility-upload-artifact',
    category: 'utility',
    name: 'Upload Artifact',
    description: 'Upload build artifact',
    icon: 'Upload',
    color: '#0891b2',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'name',
        label: 'Artifact Name',
        type: 'text',
        required: true,
        placeholder: 'build-output'
      },
      {
        key: 'path',
        label: 'Path',
        type: 'text',
        required: true,
        placeholder: 'dist/**'
      },
      {
        key: 'retention',
        label: 'Retention Days',
        type: 'number',
        placeholder: '30'
      }
    ],
    defaultConfig: {
      name: '',
      path: '',
      retention: 30
    }
  },
  {
    type: 'utility-download-artifact',
    category: 'utility',
    name: 'Download Artifact',
    description: 'Download artifact from previous job',
    icon: 'Download',
    color: '#0d9488',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'name',
        label: 'Artifact Name',
        type: 'text',
        required: true,
        placeholder: 'build-output'
      },
      {
        key: 'path',
        label: 'Download Path',
        type: 'text',
        placeholder: './artifacts'
      }
    ],
    defaultConfig: {
      name: '',
      path: ''
    }
  },
  {
    type: 'utility-env',
    category: 'utility',
    name: 'Environment',
    description: 'Set environment variables',
    icon: 'Settings',
    color: '#64748b',
    inputs: [
      { id: 'in', name: 'Input', type: 'job' }
    ],
    outputs: [
      { id: 'out', name: 'Output', type: 'job' }
    ],
    configFields: [
      {
        key: 'environment',
        label: 'Environment',
        type: 'select',
        options: [
          { value: 'development', label: 'Development' },
          { value: 'staging', label: 'Staging' },
          { value: 'production', label: 'Production' }
        ]
      },
      {
        key: 'variables',
        label: 'Variables',
        type: 'code',
        placeholder: 'NODE_ENV: production\nAPI_URL: https://api.example.com'
      }
    ],
    defaultConfig: {
      environment: 'production',
      variables: ''
    }
  }
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find(def => def.type === type);
}

export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_DEFINITIONS.filter(def => def.category === category);
}

export function validateConnection(
  sourceBlock: BlockDefinition,
  sourcePort: Port,
  targetBlock: BlockDefinition,
  targetPort: Port
): { valid: boolean; message?: string } {
  // Allow all connections for now - more permissive workflow building
  // 'any' type can connect to anything
  if (sourcePort.type === 'any' || targetPort.type === 'any') {
    return { valid: true };
  }

  // Same type can always connect
  if (sourcePort.type === targetPort.type) {
    return { valid: true };
  }

  // Job and trigger types are compatible with each other
  if (['job', 'trigger', 'condition'].includes(sourcePort.type) &&
      ['job', 'trigger', 'condition'].includes(targetPort.type)) {
    return { valid: true };
  }

  // Data type needs matching data type
  if (sourcePort.type === 'data' && targetPort.type !== 'data') {
    return { valid: false, message: 'Data output must connect to data input' };
  }

  return { valid: true };
}

// Category metadata for UI
export const CATEGORY_INFO: Record<BlockCategory, { name: string; icon: string; color: string }> = {
  trigger: { name: 'Triggers', icon: 'Zap', color: '#10b981' },
  job: { name: 'Jobs', icon: 'Cog', color: '#3b82f6' },
  action: { name: 'Actions', icon: 'Wand2', color: '#8b5cf6' },
  control: { name: 'Control Flow', icon: 'GitBranch', color: '#f43f5e' },
  integration: { name: 'Integrations', icon: 'Plug', color: '#06b6d4' },
  utility: { name: 'Utilities', icon: 'Wrench', color: '#64748b' }
};
