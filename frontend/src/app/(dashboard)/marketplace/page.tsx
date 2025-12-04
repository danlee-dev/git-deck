'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  Star,
  ArrowRight,
  Package,
  Zap,
  Settings,
  Shield,
  Clock,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  MARKETPLACE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  MarketplaceTemplate,
  getTemplatesByCategory,
} from '@/data/marketplaceTemplates';
import { useWorkflowStore } from '@/store/workflowStore';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'automation': <Zap className="w-4 h-4" />,
  'ci-cd': <Package className="w-4 h-4" />,
  'monitoring': <Clock className="w-4 h-4" />,
  'productivity': <Settings className="w-4 h-4" />,
  'security': <Shield className="w-4 h-4" />,
};

export default function MarketplacePage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const filteredTemplates = getTemplatesByCategory(selectedCategory).filter(
    template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleImport = async (template: MarketplaceTemplate) => {
    setIsImporting(true);
    try {
      // Create workflow with template blocks and connections directly
      const { workflowAPI } = await import('@/lib/api');
      const response = await workflowAPI.create({
        name: template.name,
        description: template.description,
        blocks: template.blocks,
        connections: template.connections,
      });

      const workflow = response.data;

      // Refresh the workflow list
      await useWorkflowStore.getState().fetchWorkflows();

      setImportSuccess(true);
      setTimeout(() => {
        setSelectedTemplate(null);
        router.push(`/workflows/${workflow.id}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to import template:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            마켓플레이스
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            빠르게 시작할 수 있는 사전 구축된 워크플로우 템플릿
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="템플릿 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, { name }]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {CATEGORY_ICONS[key]}
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              템플릿을 찾을 수 없습니다
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => {
            setSelectedTemplate(null);
            setImportSuccess(false);
          }}
          onImport={() => handleImport(selectedTemplate)}
          isImporting={isImporting}
          importSuccess={importSuccess}
        />
      )}
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onClick,
}: {
  template: MarketplaceTemplate;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
            {TEMPLATE_CATEGORIES[template.category]?.name}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {template.name}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
        {template.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {template.downloads.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {template.stars}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {template.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded"
          >
            {tag}
          </span>
        ))}
        {template.tags.length > 3 && (
          <span className="px-1.5 py-0.5 text-xs text-gray-400">
            +{template.tags.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}

// Template Detail Modal
function TemplateDetailModal({
  template,
  onClose,
  onImport,
  isImporting,
  importSuccess,
}: {
  template: MarketplaceTemplate;
  onClose: () => void;
  onImport: () => void;
  isImporting: boolean;
  importSuccess: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {TEMPLATE_CATEGORIES[template.category]?.name}
              </span>
              <span className="text-xs text-gray-400">by {template.author}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {template.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Stats */}
          <div className="flex items-center gap-6 mb-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              {template.downloads.toLocaleString()} 다운로드
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              {template.stars} 스타
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              {template.blocks.length}개 블록
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              설명
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {template.longDescription}
            </p>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Required Secrets */}
          {template.requiredSecrets && template.requiredSecrets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                필수 시크릿
              </h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                <ul className="space-y-1">
                  {template.requiredSecrets.map(secret => (
                    <li
                      key={secret}
                      className="text-sm text-amber-800 dark:text-amber-200 font-mono"
                    >
                      {secret}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Config Guide */}
          {template.configGuide && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                설정 가이드
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
                {template.configGuide}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            취소
          </button>
          <button
            onClick={onImport}
            disabled={isImporting || importSuccess}
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            {importSuccess ? (
              <>
                <Check className="w-4 h-4" />
                가져오기 완료
              </>
            ) : isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                가져오는 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                템플릿 사용
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
