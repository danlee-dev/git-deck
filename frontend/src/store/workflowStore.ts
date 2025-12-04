import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  Workflow,
  BlockInstance,
  Connection,
  BlockDefinition,
  WorkflowExecution,
  BlockExecutionState,
  ExecutionStatus,
  getBlockDefinition,
  BLOCK_DEFINITIONS,
} from '@/types/workflow';
import { workflowAPI } from '@/lib/api';

// =============================================================================
// State Interface
// =============================================================================

interface WorkflowState {
  // Current workflow
  currentWorkflow: Workflow | null;
  workflows: Workflow[];

  // Selection state
  selectedBlockId: string | null;
  selectedConnectionId: string | null;

  // Execution state
  execution: WorkflowExecution | null;
  isExecuting: boolean;

  // UI state
  zoom: number;
  panOffset: { x: number; y: number };
  isDragging: boolean;
  isConnecting: boolean;
  connectingFrom: { blockId: string; portId: string } | null;

  // API state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchWorkflows: () => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<Workflow>;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  updateWorkflowMeta: (updates: Partial<Pick<Workflow, 'name' | 'description'>>) => void;

  // Block actions
  addBlock: (type: string, position: { x: number; y: number }) => BlockInstance;
  removeBlock: (blockId: string) => void;
  updateBlockPosition: (blockId: string, position: { x: number; y: number }) => void;
  updateBlockConfig: (blockId: string, config: Record<string, unknown>) => void;
  updateBlockLabel: (blockId: string, label: string) => void;
  duplicateBlock: (blockId: string) => BlockInstance | null;

  // Connection actions
  addConnection: (
    sourceBlockId: string,
    sourcePortId: string,
    targetBlockId: string,
    targetPortId: string
  ) => Connection | null;
  removeConnection: (connectionId: string) => void;

  // Selection actions
  selectBlock: (blockId: string | null) => void;
  selectConnection: (connectionId: string | null) => void;
  clearSelection: () => void;

  // Connection UI state
  startConnecting: (blockId: string, portId: string) => void;
  endConnecting: () => void;

  // Viewport actions
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetViewport: () => void;

  // Execution actions
  startExecution: () => void;
  updateBlockExecution: (blockId: string, state: Partial<BlockExecutionState>) => void;
  completeExecution: (status: ExecutionStatus) => void;
  resetExecution: () => void;

  // YAML generation
  generateYAML: () => string;

  // Validation
  validateWorkflow: () => { valid: boolean; errors: string[] };
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWorkflow: null,
      workflows: [],
      selectedBlockId: null,
      selectedConnectionId: null,
      execution: null,
      isExecuting: false,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      isDragging: false,
      isConnecting: false,
      connectingFrom: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // -----------------------------------------------------------------------
      // Workflow CRUD (API-backed)
      // -----------------------------------------------------------------------

      fetchWorkflows: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await workflowAPI.list();
          const workflowList = response.data;

          // Convert API response to local Workflow format
          const workflows: Workflow[] = workflowList.map(w => ({
            id: w.id,
            name: w.name,
            description: w.description,
            blocks: [],
            connections: [],
            createdAt: w.created_at,
            updatedAt: w.updated_at,
          }));

          set({ workflows, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to fetch workflows';
          set({ error: message, isLoading: false });
        }
      },

      createWorkflow: async (name, description) => {
        set({ isSaving: true, error: null });
        try {
          const response = await workflowAPI.create({ name, description, blocks: [], connections: [] });
          const data = response.data;

          const workflow: Workflow = {
            id: data.id,
            name: data.name,
            description: data.description,
            blocks: data.blocks as BlockInstance[],
            connections: data.connections as Connection[],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };

          set(state => ({
            workflows: [...state.workflows, workflow],
            currentWorkflow: workflow,
            selectedBlockId: null,
            selectedConnectionId: null,
            isSaving: false,
          }));

          return workflow;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to create workflow';
          set({ error: message, isSaving: false });
          throw error;
        }
      },

      loadWorkflow: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await workflowAPI.get(id);
          const data = response.data;

          const workflow: Workflow = {
            id: data.id,
            name: data.name,
            description: data.description,
            blocks: data.blocks as BlockInstance[],
            connections: data.connections as Connection[],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };

          set({
            currentWorkflow: workflow,
            selectedBlockId: null,
            selectedConnectionId: null,
            execution: null,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to load workflow';
          set({ error: message, isLoading: false });
        }
      },

      saveWorkflow: async () => {
        const { currentWorkflow, workflows } = get();
        if (!currentWorkflow) return;

        set({ isSaving: true, error: null });
        try {
          await workflowAPI.update(currentWorkflow.id, {
            name: currentWorkflow.name,
            description: currentWorkflow.description,
            blocks: currentWorkflow.blocks,
            connections: currentWorkflow.connections,
          });

          const updated = {
            ...currentWorkflow,
            updatedAt: new Date().toISOString(),
          };

          set({
            currentWorkflow: updated,
            workflows: workflows.map(w => w.id === updated.id ? updated : w),
            isSaving: false,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to save workflow';
          set({ error: message, isSaving: false });
        }
      },

      deleteWorkflow: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await workflowAPI.delete(id);
          set(state => ({
            workflows: state.workflows.filter(w => w.id !== id),
            currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to delete workflow';
          set({ error: message, isLoading: false });
        }
      },

      updateWorkflowMeta: (updates) => {
        set(state => {
          if (!state.currentWorkflow) return state;
          const updated = { ...state.currentWorkflow, ...updates, updatedAt: new Date().toISOString() };
          return {
            currentWorkflow: updated,
            workflows: state.workflows.map(w => w.id === updated.id ? updated : w),
          };
        });
      },

      // -----------------------------------------------------------------------
      // Block Actions
      // -----------------------------------------------------------------------

      addBlock: (type, position) => {
        const definition = getBlockDefinition(type);
        if (!definition) {
          throw new Error(`Unknown block type: ${type}`);
        }

        const block: BlockInstance = {
          id: nanoid(),
          type,
          position,
          config: { ...definition.defaultConfig },
        };

        set(state => {
          if (!state.currentWorkflow) return state;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              blocks: [...state.currentWorkflow.blocks, block],
              updatedAt: new Date().toISOString(),
            },
          };
        });

        return block;
      },

      removeBlock: (blockId) => {
        set(state => {
          if (!state.currentWorkflow) return state;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              blocks: state.currentWorkflow.blocks.filter(b => b.id !== blockId),
              connections: state.currentWorkflow.connections.filter(
                c => c.sourceBlockId !== blockId && c.targetBlockId !== blockId
              ),
              updatedAt: new Date().toISOString(),
            },
            selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
          };
        });
      },

      updateBlockPosition: (blockId, position) => {
        set(state => {
          if (!state.currentWorkflow) return state;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              blocks: state.currentWorkflow.blocks.map(b =>
                b.id === blockId ? { ...b, position } : b
              ),
            },
          };
        });
      },

      updateBlockConfig: (blockId, config) => {
        set(state => {
          if (!state.currentWorkflow) return state;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              blocks: state.currentWorkflow.blocks.map(b =>
                b.id === blockId ? { ...b, config: { ...b.config, ...config } } : b
              ),
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      updateBlockLabel: (blockId, label) => {
        set(state => {
          if (!state.currentWorkflow) return state;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              blocks: state.currentWorkflow.blocks.map(b =>
                b.id === blockId ? { ...b, label } : b
              ),
            },
          };
        });
      },

      duplicateBlock: (blockId) => {
        const { currentWorkflow } = get();
        if (!currentWorkflow) return null;

        const original = currentWorkflow.blocks.find(b => b.id === blockId);
        if (!original) return null;

        const duplicate: BlockInstance = {
          id: nanoid(),
          type: original.type,
          position: {
            x: original.position.x + 50,
            y: original.position.y + 50,
          },
          config: { ...original.config },
          label: original.label ? `${original.label} (copy)` : undefined,
        };

        set(state => ({
          currentWorkflow: state.currentWorkflow ? {
            ...state.currentWorkflow,
            blocks: [...state.currentWorkflow.blocks, duplicate],
            updatedAt: new Date().toISOString(),
          } : null,
        }));

        return duplicate;
      },

      // -----------------------------------------------------------------------
      // Connection Actions
      // -----------------------------------------------------------------------

      addConnection: (sourceBlockId, sourcePortId, targetBlockId, targetPortId) => {
        const { currentWorkflow } = get();
        if (!currentWorkflow) return null;

        // Prevent self-connections
        if (sourceBlockId === targetBlockId) return null;

        // Check if connection already exists
        const exists = currentWorkflow.connections.some(
          c => c.sourceBlockId === sourceBlockId &&
               c.sourcePortId === sourcePortId &&
               c.targetBlockId === targetBlockId &&
               c.targetPortId === targetPortId
        );
        if (exists) return null;

        const connection: Connection = {
          id: nanoid(),
          sourceBlockId,
          sourcePortId,
          targetBlockId,
          targetPortId,
          animated: true,
        };

        set(state => ({
          currentWorkflow: state.currentWorkflow ? {
            ...state.currentWorkflow,
            connections: [...state.currentWorkflow.connections, connection],
            updatedAt: new Date().toISOString(),
          } : null,
        }));

        return connection;
      },

      removeConnection: (connectionId) => {
        set(state => {
          if (!state.currentWorkflow) return state;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              connections: state.currentWorkflow.connections.filter(c => c.id !== connectionId),
              updatedAt: new Date().toISOString(),
            },
            selectedConnectionId: state.selectedConnectionId === connectionId ? null : state.selectedConnectionId,
          };
        });
      },

      // -----------------------------------------------------------------------
      // Selection Actions
      // -----------------------------------------------------------------------

      selectBlock: (blockId) => {
        set({ selectedBlockId: blockId, selectedConnectionId: null });
      },

      selectConnection: (connectionId) => {
        set({ selectedConnectionId: connectionId, selectedBlockId: null });
      },

      clearSelection: () => {
        set({ selectedBlockId: null, selectedConnectionId: null });
      },

      // -----------------------------------------------------------------------
      // Connection UI State
      // -----------------------------------------------------------------------

      startConnecting: (blockId, portId) => {
        set({ isConnecting: true, connectingFrom: { blockId, portId } });
      },

      endConnecting: () => {
        set({ isConnecting: false, connectingFrom: null });
      },

      // -----------------------------------------------------------------------
      // Viewport Actions
      // -----------------------------------------------------------------------

      setZoom: (zoom) => {
        set({ zoom: Math.max(0.25, Math.min(2, zoom)) });
      },

      setPanOffset: (offset) => {
        set({ panOffset: offset });
      },

      resetViewport: () => {
        set({ zoom: 1, panOffset: { x: 0, y: 0 } });
      },

      // -----------------------------------------------------------------------
      // Execution Actions
      // -----------------------------------------------------------------------

      startExecution: () => {
        const { currentWorkflow } = get();
        if (!currentWorkflow) return;

        const execution: WorkflowExecution = {
          id: nanoid(),
          workflowId: currentWorkflow.id,
          status: 'running',
          startedAt: new Date().toISOString(),
          blockStates: {},
        };

        // Initialize all blocks as idle
        currentWorkflow.blocks.forEach(block => {
          execution.blockStates[block.id] = {
            blockId: block.id,
            status: 'idle',
          };
        });

        set({ execution, isExecuting: true });
      },

      updateBlockExecution: (blockId, state) => {
        set(s => {
          if (!s.execution) return s;
          return {
            execution: {
              ...s.execution,
              blockStates: {
                ...s.execution.blockStates,
                [blockId]: {
                  ...s.execution.blockStates[blockId],
                  ...state,
                },
              },
              currentBlockId: state.status === 'running' ? blockId : s.execution.currentBlockId,
            },
          };
        });
      },

      completeExecution: (status) => {
        set(s => ({
          execution: s.execution ? {
            ...s.execution,
            status,
            completedAt: new Date().toISOString(),
          } : null,
          isExecuting: false,
        }));
      },

      resetExecution: () => {
        set({ execution: null, isExecuting: false });
      },

      // -----------------------------------------------------------------------
      // YAML Generation
      // -----------------------------------------------------------------------

      generateYAML: () => {
        const { currentWorkflow } = get();
        if (!currentWorkflow) return '';

        const { blocks, connections } = currentWorkflow;

        // Find trigger blocks
        const triggers = blocks.filter(b => b.type.startsWith('trigger-'));

        // Build workflow YAML
        let yaml = `name: ${currentWorkflow.name}\n\n`;

        // Generate on: section from triggers
        if (triggers.length > 0) {
          yaml += 'on:\n';
          triggers.forEach(trigger => {
            const def = getBlockDefinition(trigger.type);
            if (!def) return;

            switch (trigger.type) {
              case 'trigger-push':
                yaml += '  push:\n';
                if (trigger.config.branches) {
                  yaml += `    branches:\n`;
                  String(trigger.config.branches).split(',').forEach(branch => {
                    yaml += `      - ${branch.trim()}\n`;
                  });
                }
                if (trigger.config.paths) {
                  yaml += `    paths:\n`;
                  String(trigger.config.paths).split(',').forEach(path => {
                    yaml += `      - ${path.trim()}\n`;
                  });
                }
                break;
              case 'trigger-pr':
                yaml += '  pull_request:\n';
                if (trigger.config.types && Array.isArray(trigger.config.types)) {
                  yaml += `    types: [${trigger.config.types.join(', ')}]\n`;
                }
                if (trigger.config.branches) {
                  yaml += `    branches:\n`;
                  String(trigger.config.branches).split(',').forEach(branch => {
                    yaml += `      - ${branch.trim()}\n`;
                  });
                }
                break;
              case 'trigger-schedule':
                yaml += '  schedule:\n';
                yaml += `    - cron: '${trigger.config.cron}'\n`;
                break;
              case 'trigger-manual':
                yaml += '  workflow_dispatch:\n';
                if (trigger.config.inputs) {
                  yaml += '    inputs:\n';
                  yaml += `      ${String(trigger.config.inputs).split('\n').join('\n      ')}\n`;
                }
                break;
              case 'trigger-release':
                yaml += '  release:\n';
                if (trigger.config.types && Array.isArray(trigger.config.types)) {
                  yaml += `    types: [${trigger.config.types.join(', ')}]\n`;
                }
                break;
            }
          });
          yaml += '\n';
        }

        // Find job blocks (non-triggers)
        const jobBlocks = blocks.filter(b => !b.type.startsWith('trigger-'));

        if (jobBlocks.length > 0) {
          yaml += 'jobs:\n';
          yaml += '  build:\n';
          yaml += '    runs-on: ubuntu-latest\n';
          yaml += '    steps:\n';

          // Sort blocks by connection order
          const orderedBlocks = topologicalSort(jobBlocks, connections);

          orderedBlocks.forEach(block => {
            const def = getBlockDefinition(block.type);
            if (!def) return;

            switch (block.type) {
              case 'job-checkout':
                yaml += '      - name: Checkout\n';
                yaml += '        uses: actions/checkout@v4\n';
                if (block.config.fetchDepth) {
                  yaml += `        with:\n`;
                  yaml += `          fetch-depth: ${block.config.fetchDepth}\n`;
                }
                break;
              case 'job-setup-node':
                yaml += '      - name: Setup Node.js\n';
                yaml += '        uses: actions/setup-node@v4\n';
                yaml += '        with:\n';
                yaml += `          node-version: '${block.config.nodeVersion}'\n`;
                if (block.config.cache) {
                  yaml += `          cache: '${block.config.cache}'\n`;
                }
                break;
              case 'job-setup-python':
                yaml += '      - name: Setup Python\n';
                yaml += '        uses: actions/setup-python@v5\n';
                yaml += '        with:\n';
                yaml += `          python-version: '${block.config.pythonVersion}'\n`;
                break;
              case 'job-run-script':
                if (block.config.name) {
                  yaml += `      - name: ${block.config.name}\n`;
                } else {
                  yaml += '      - name: Run script\n';
                }
                yaml += '        run: |\n';
                String(block.config.run || '').split('\n').forEach(line => {
                  yaml += `          ${line}\n`;
                });
                break;
              case 'job-install-deps':
                yaml += '      - name: Install dependencies\n';
                yaml += '        run: ';
                switch (block.config.packageManager) {
                  case 'npm':
                    yaml += block.config.frozen ? 'npm ci\n' : 'npm install\n';
                    break;
                  case 'yarn':
                    yaml += block.config.frozen ? 'yarn --frozen-lockfile\n' : 'yarn\n';
                    break;
                  case 'pnpm':
                    yaml += block.config.frozen ? 'pnpm install --frozen-lockfile\n' : 'pnpm install\n';
                    break;
                  case 'pip':
                    yaml += 'pip install -r requirements.txt\n';
                    break;
                }
                break;
              case 'job-build':
                yaml += '      - name: Build\n';
                yaml += `        run: ${block.config.command}\n`;
                break;
              case 'job-test':
                yaml += '      - name: Run tests\n';
                yaml += `        run: ${block.config.command}\n`;
                break;
              case 'job-lint':
                yaml += '      - name: Lint\n';
                yaml += `        run: ${block.config.command}\n`;
                break;
              case 'utility-cache':
                yaml += '      - name: Cache\n';
                yaml += '        uses: actions/cache@v4\n';
                yaml += '        with:\n';
                yaml += `          path: ${block.config.path}\n`;
                yaml += `          key: ${block.config.key}\n`;
                if (block.config.restoreKeys) {
                  yaml += `          restore-keys: ${block.config.restoreKeys}\n`;
                }
                break;
              case 'utility-upload-artifact':
                yaml += '      - name: Upload artifact\n';
                yaml += '        uses: actions/upload-artifact@v4\n';
                yaml += '        with:\n';
                yaml += `          name: ${block.config.name}\n`;
                yaml += `          path: ${block.config.path}\n`;
                break;
              case 'integration-deploy-vercel':
                yaml += '      - name: Deploy to Vercel\n';
                yaml += '        uses: amondnet/vercel-action@v25\n';
                yaml += '        with:\n';
                yaml += `          vercel-token: \${{ secrets.VERCEL_TOKEN }}\n`;
                yaml += `          vercel-org-id: ${block.config.orgId}\n`;
                yaml += `          vercel-project-id: ${block.config.projectId}\n`;
                if (block.config.production) {
                  yaml += '          vercel-args: --prod\n';
                }
                break;
              case 'integration-docker-build':
                yaml += '      - name: Login to Container Registry\n';
                yaml += '        uses: docker/login-action@v3\n';
                yaml += '        with:\n';
                yaml += `          registry: ${block.config.registry}\n`;
                yaml += '          username: ${{ github.actor }}\n';
                yaml += '          password: ${{ secrets.GITHUB_TOKEN }}\n';
                yaml += '      - name: Build and push Docker image\n';
                yaml += '        uses: docker/build-push-action@v5\n';
                yaml += '        with:\n';
                yaml += '          push: true\n';
                yaml += `          tags: ${block.config.registry}/${block.config.imageName}:${block.config.tags}\n`;
                break;
              case 'integration-notify-slack':
                yaml += '      - name: Slack Notification\n';
                yaml += '        uses: 8398a7/action-slack@v3\n';
                yaml += '        with:\n';
                yaml += `          status: \${{ job.status }}\n`;
                yaml += `          text: ${block.config.message}\n`;
                yaml += '        env:\n';
                yaml += `          SLACK_WEBHOOK_URL: ${block.config.webhookUrl}\n`;
                break;
            }
          });
        }

        return yaml;
      },

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      validateWorkflow: () => {
        const { currentWorkflow } = get();
        const errors: string[] = [];

        if (!currentWorkflow) {
          return { valid: false, errors: ['No workflow loaded'] };
        }

        if (currentWorkflow.blocks.length === 0) {
          errors.push('Workflow has no blocks');
        }

        // Check for at least one trigger
        const hasTrigger = currentWorkflow.blocks.some(b => b.type.startsWith('trigger-'));
        if (!hasTrigger) {
          errors.push('Workflow needs at least one trigger');
        }

        // Check for orphan blocks (no connections except triggers)
        const connectedBlockIds = new Set<string>();
        currentWorkflow.connections.forEach(c => {
          connectedBlockIds.add(c.sourceBlockId);
          connectedBlockIds.add(c.targetBlockId);
        });

        currentWorkflow.blocks.forEach(block => {
          if (!block.type.startsWith('trigger-') && !connectedBlockIds.has(block.id)) {
            const def = getBlockDefinition(block.type);
            errors.push(`Block "${def?.name || block.type}" is not connected`);
          }
        });

        // Check required config fields
        currentWorkflow.blocks.forEach(block => {
          const def = getBlockDefinition(block.type);
          if (!def) return;

          def.configFields.forEach(field => {
            if (field.required && !block.config[field.key]) {
              errors.push(`${def.name}: "${field.label}" is required`);
            }
          });
        });

        return { valid: errors.length === 0, errors };
      },
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        workflows: state.workflows,
      }),
    }
  )
);

// =============================================================================
// Helper: Topological Sort
// =============================================================================

function topologicalSort(blocks: BlockInstance[], connections: Connection[]): BlockInstance[] {
  const blockMap = new Map(blocks.map(b => [b.id, b]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  blocks.forEach(b => {
    inDegree.set(b.id, 0);
    adjacency.set(b.id, []);
  });

  // Build graph
  connections.forEach(c => {
    if (blockMap.has(c.sourceBlockId) && blockMap.has(c.targetBlockId)) {
      adjacency.get(c.sourceBlockId)?.push(c.targetBlockId);
      inDegree.set(c.targetBlockId, (inDegree.get(c.targetBlockId) || 0) + 1);
    }
  });

  // Kahn's algorithm
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const result: BlockInstance[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const block = blockMap.get(id);
    if (block) result.push(block);

    adjacency.get(id)?.forEach(neighbor => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}
