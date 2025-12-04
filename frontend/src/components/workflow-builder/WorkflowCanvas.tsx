'use client';

import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Save,
  Download,
  Play,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  X,
  Rocket,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { nodeTypes } from './WorkflowNode';
import { edgeTypes, ConnectionLine } from './AnimatedEdge';
import { NodePalette } from './NodePalette';
import { PropertiesPanel } from './PropertiesPanel';
import { useWorkflowStore } from '@/store/workflowStore';
import { getBlockDefinition } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';
import { githubAPI, workflowAPI } from '@/lib/api';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  url: string;
}

// =============================================================================
// Workflow Canvas Inner
// =============================================================================

function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const theme = useThemeStore(state => state.theme);

  const currentWorkflow = useWorkflowStore(state => state.currentWorkflow);
  const addBlock = useWorkflowStore(state => state.addBlock);
  const addConnection = useWorkflowStore(state => state.addConnection);
  const updateBlockPosition = useWorkflowStore(state => state.updateBlockPosition);
  const selectBlock = useWorkflowStore(state => state.selectBlock);
  const selectedBlockId = useWorkflowStore(state => state.selectedBlockId);
  const saveWorkflow = useWorkflowStore(state => state.saveWorkflow);
  const validateWorkflow = useWorkflowStore(state => state.validateWorkflow);
  const generateYAML = useWorkflowStore(state => state.generateYAML);
  const startExecution = useWorkflowStore(state => state.startExecution);
  const resetExecution = useWorkflowStore(state => state.resetExecution);
  const isExecuting = useWorkflowStore(state => state.isExecuting);
  const execution = useWorkflowStore(state => state.execution);

  const [showYAML, setShowYAML] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Deploy state
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [deployBranch, setDeployBranch] = useState('main');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    success: boolean;
    url?: string;
    actionsUrl?: string;
    error?: string;
  } | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Convert workflow blocks to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!currentWorkflow) return [];
    return currentWorkflow.blocks.map(block => ({
      id: block.id,
      type: 'workflowNode',
      position: block.position,
      data: {
        type: block.type,
        config: block.config,
        label: block.label,
      },
      selected: block.id === selectedBlockId,
    }));
  }, [currentWorkflow, selectedBlockId]);

  // Convert workflow connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!currentWorkflow) return [];
    return currentWorkflow.connections.map(conn => {
      const sourceBlock = currentWorkflow.blocks.find(b => b.id === conn.sourceBlockId);
      const sourceDef = sourceBlock ? getBlockDefinition(sourceBlock.type) : null;
      const sourcePort = sourceDef?.outputs.find(p => p.id === conn.sourcePortId);

      return {
        id: conn.id,
        source: conn.sourceBlockId,
        target: conn.targetBlockId,
        sourceHandle: conn.sourcePortId,
        targetHandle: conn.targetPortId,
        type: 'animated',
        data: { portType: sourcePort?.type || 'job' },
      };
    });
  }, [currentWorkflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectBlock(node.id);
  }, [selectBlock]);

  const onPaneClick = useCallback(() => {
    selectBlock(null);
  }, [selectBlock]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    updateBlockPosition(node.id, node.position);
  }, [updateBlockPosition]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Get port type for edge styling
    let portType = 'job';
    const sourceNode = nodes.find(n => n.id === connection.source);
    if (sourceNode) {
      const sourceDef = getBlockDefinition((sourceNode.data as { type: string }).type);
      if (sourceDef && connection.sourceHandle) {
        const sourcePort = sourceDef.outputs.find(p => p.id === connection.sourceHandle);
        if (sourcePort) {
          portType = sourcePort.type;
        }
      }
    }

    // Add connection to store
    const newConnection = addConnection(
      connection.source,
      connection.sourceHandle || 'output',
      connection.target,
      connection.targetHandle || 'input'
    );

    if (newConnection) {
      setEdges(eds => addEdge({
        id: newConnection.id,
        ...connection,
        type: 'animated',
        data: { portType },
      } as Edge, eds));
    }
  }, [nodes, addConnection, setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowWrapper.current) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newBlock = addBlock(type, position);

    setNodes(nds => [
      ...nds,
      {
        id: newBlock.id,
        type: 'workflowNode',
        position: newBlock.position,
        data: {
          type: newBlock.type,
          config: newBlock.config,
          label: newBlock.label,
        },
      },
    ]);
  }, [screenToFlowPosition, addBlock, setNodes]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await saveWorkflow();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleValidate = () => {
    const result = validateWorkflow();
    setValidationErrors(result.errors);
    if (result.valid) {
      setTimeout(() => setValidationErrors([]), 3000);
    }
  };

  const handleGenerateYAML = () => {
    const yaml = generateYAML();
    setYamlContent(yaml);
    setShowYAML(true);
  };

  const handleCopyYAML = async () => {
    await navigator.clipboard.writeText(yamlContent);
  };

  const handleRunTest = () => {
    if (isExecuting) {
      resetExecution();
    } else {
      handleValidate();
      if (validationErrors.length === 0) {
        startExecution();
        simulateExecution();
      }
    }
  };

  const simulateExecution = async () => {
    if (!currentWorkflow) return;

    const updateBlock = useWorkflowStore.getState().updateBlockExecution;
    const complete = useWorkflowStore.getState().completeExecution;

    const blocks = currentWorkflow.blocks;

    for (const block of blocks) {
      updateBlock(block.id, { status: 'running', startedAt: new Date().toISOString() });
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

      const success = Math.random() > 0.1;
      updateBlock(block.id, {
        status: success ? 'success' : 'failure',
        completedAt: new Date().toISOString(),
        logs: success ? ['Completed'] : ['Error occurred'],
      });

      if (!success) {
        complete('failure');
        return;
      }
    }

    complete('success');
  };

  const handleOpenDeployModal = async () => {
    // Validate first
    const result = validateWorkflow();
    if (!result.valid) {
      setValidationErrors(result.errors);
      return;
    }

    // Save workflow before deploying
    await saveWorkflow();

    setShowDeployModal(true);
    setDeployResult(null);
    setLoadingRepos(true);

    try {
      const response = await githubAPI.listRepositories();
      setRepositories(response.data);
      if (response.data.length > 0 && !selectedRepo) {
        setSelectedRepo(response.data[0].full_name);
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleDeploy = async () => {
    if (!currentWorkflow || !selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    if (!owner || !repo) return;

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const response = await workflowAPI.deploy(currentWorkflow.id, {
        repo_owner: owner,
        repo_name: repo,
        branch: deployBranch,
      });

      if (response.data.success) {
        setDeployResult({
          success: true,
          url: response.data.url,
          actionsUrl: response.data.actions_url,
        });
      } else {
        setDeployResult({
          success: false,
          error: response.data.error || 'Deploy failed',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Deploy failed';
      setDeployResult({ success: false, error: message });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Panel - Node Palette */}
      <NodePalette />

      {/* Main Canvas */}
      <div ref={reactFlowWrapper} className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={ConnectionLine as any}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            type: 'animated',
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
          className={theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={theme === 'dark' ? '#374151' : '#d1d5db'}
          />

          <Controls
            showZoom={false}
            showFitView={false}
            showInteractive={false}
            className="hidden"
          />

          <MiniMap
            nodeColor={node => {
              const def = getBlockDefinition((node.data as { type: string }).type);
              return def?.color || '#6b7280';
            }}
            maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
            className="!rounded-lg !border !border-gray-200 dark:!border-gray-700 !bg-white dark:!bg-gray-800 !bottom-12 !right-3"
          />

          {/* Toolbar */}
          <Panel position="top-center" className="mt-3">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 mr-1">
                {currentWorkflow?.name || 'Untitled'}
              </span>

              <ToolbarButton
                icon={saveStatus === 'saving' ? Loader2 : saveStatus === 'success' ? CheckCircle : saveStatus === 'error' ? AlertCircle : Save}
                label={saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={cn(
                  saveStatus === 'saving' && '[&_svg]:animate-spin',
                  saveStatus === 'success' && 'text-green-600 dark:text-green-400',
                  saveStatus === 'error' && 'text-red-600 dark:text-red-400'
                )}
              />
              <ToolbarButton icon={Download} label="Export" onClick={handleGenerateYAML} />
              <ToolbarButton icon={Rocket} label="Deploy" onClick={handleOpenDeployModal} />

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

              <ToolbarButton
                icon={isExecuting ? Square : Play}
                label={isExecuting ? 'Stop' : 'Test'}
                onClick={handleRunTest}
                active={isExecuting}
              />

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

              <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={() => zoomIn()} />
              <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={() => zoomOut()} />
              <ToolbarButton icon={Maximize} label="Fit" onClick={() => fitView()} />
            </div>
          </Panel>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Panel position="bottom-center" className="mb-3">
              <div className="max-w-sm p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Errors</p>
                    <ul className="mt-1 space-y-0.5">
                      {validationErrors.slice(0, 3).map((error, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Execution Status */}
          {execution && (
            <Panel position="bottom-left" className="mb-3 ml-3">
              <div className={cn(
                'px-3 py-1.5 rounded-lg border flex items-center gap-2',
                execution.status === 'running' && 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
                execution.status === 'success' && 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
                execution.status === 'failure' && 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
              )}>
                {execution.status === 'running' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Running...</span>
                  </>
                )}
                {execution.status === 'success' && (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Success</span>
                  </>
                )}
                {execution.status === 'failure' && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Failed</span>
                  </>
                )}
                <button onClick={resetExecution} className="ml-1 p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded">
                  <RotateCcw className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* YAML Modal */}
        {showYAML && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="w-full max-w-xl max-h-[80vh] rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Generated YAML</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyYAML}
                    className="px-3 py-1 text-xs font-medium rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    Copy
                  </button>
                  <button onClick={() => setShowYAML(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[60vh]">
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {yamlContent || 'Add blocks to generate YAML'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Deploy Modal */}
        {showDeployModal && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Deploy to GitHub</span>
                </div>
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Repository Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repository
                  </label>
                  {loadingRepos ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading repositories...
                    </div>
                  ) : (
                    <select
                      value={selectedRepo}
                      onChange={e => setSelectedRepo(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                    >
                      {repositories.map(repo => (
                        <option key={repo.id} value={repo.full_name}>
                          {repo.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Branch Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={deployBranch}
                    onChange={e => setDeployBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                  />
                </div>

                {/* Deploy Result */}
                {deployResult && (
                  <div className={cn(
                    'p-3 rounded-md text-sm',
                    deployResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  )}>
                    {deployResult.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Deployed successfully!</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {deployResult.url && (
                            <a
                              href={deployResult.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View workflow file
                            </a>
                          )}
                          {deployResult.actionsUrl && (
                            <a
                              href={deployResult.actionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Actions
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{deployResult.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This will create or update the workflow file at{' '}
                  <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                    .github/workflows/{currentWorkflow?.name?.toLowerCase().replace(/\s+/g, '-')}.yml
                  </code>
                </p>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !selectedRepo || loadingRepos}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Deploy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Properties */}
      <PropertiesPanel />
    </div>
  );
}

// =============================================================================
// Toolbar Button
// =============================================================================

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

function ToolbarButton({ icon: Icon, label, onClick, active, disabled, className }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded transition-colors',
        active
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// =============================================================================
// Main Export
// =============================================================================

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
