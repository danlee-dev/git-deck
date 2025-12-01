'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileEditorStore, loadLastSyncedSha, saveLastSyncedSha } from '@/store/profileEditorStore';
import { Github, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import ProfilePreview from '@/components/profile-editor/ProfilePreview';
import ConflictModal from '@/components/profile-editor/ConflictModal';
import { blocksAPI } from '@/lib/api';

export default function ProfileEditorPage() {
  const { user } = useAuthStore();
  const { markdownContent, setMarkdownContent, setRenderedHTML } = useProfileEditorStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    currentContent: string;
    currentSha: string;
  } | null>(null);

  useEffect(() => {
    if (user?.is_github_connected) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      if (user?.github_username && !markdownContent) {
        const response = await blocksAPI.loadFromGithub(user.github_username, user.github_username);
        const result = response.data;

        if (result.status === 'success') {
          if (result.raw_content) {
            setMarkdownContent(result.raw_content);
          }

          if (result.rendered_html) {
            setRenderedHTML(result.rendered_html);
          }

          if (result.sha) {
            saveLastSyncedSha(result.sha);
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      setIsLoading(false);
    }
  };

  const handleRefreshFromGithub = async () => {
    if (!user?.github_username) {
      setSaveError('GitHub username not found. Please reconnect your GitHub account.');
      return;
    }

    setIsRefreshing(true);
    setSaveError(null);

    try {
      const response = await blocksAPI.loadFromGithub(user.github_username, user.github_username);
      const result = response.data;

      if (result.status === 'success') {
        if (result.raw_content) {
          setMarkdownContent(result.raw_content);
        }

        if (result.rendered_html) {
          setRenderedHTML(result.rendered_html);
        }

        if (result.sha) {
          saveLastSyncedSha(result.sha);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to load from GitHub';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSaveError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveToGithub = async (forceOverwrite = false) => {
    if (!user?.github_username) {
      setSaveError('GitHub username not found. Please reconnect your GitHub account.');
      return;
    }

    if (!markdownContent.trim()) {
      setSaveError('No content to save. Write some markdown first.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const lastKnownSha = forceOverwrite ? null : loadLastSyncedSha();

      const response = await blocksAPI.saveToGithub({
        blocks: [],
        markdown_content: markdownContent,
        repo_owner: user.github_username,
        repo_name: user.github_username,
        last_known_sha: lastKnownSha,
      });

      const result = response.data;

      console.log('Save response:', result);
      console.log('Last known SHA:', lastKnownSha);

      if (result.status === 'conflict') {
        console.log('Conflict detected!');
        setConflictData({
          currentContent: result.current_content,
          currentSha: result.current_sha,
        });
        setShowConflictModal(true);
        setIsSaving(false);
        return;
      }

      if (result.sha) {
        console.log('Saving new SHA:', result.sha);
        saveLastSyncedSha(result.sha);
      } else {
        console.warn('No SHA in response');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      let errorMessage = 'Failed to save to GitHub';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConflictOverwrite = () => {
    setShowConflictModal(false);
    handleSaveToGithub(true);
  };

  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setConflictData(null);
  };

  if (!user?.is_github_connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 text-center py-12 max-w-md">
          <Github className="w-16 h-16 text-github-gray-400 dark:text-github-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
            GitHub Connection Required
          </h2>
          <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-6">
            Connect your GitHub account to edit your profile
          </p>
          <Link href="/settings" className="btn-primary">
            Connect GitHub
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-github-blue dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-github-gray-900 dark:text-github-gray-100">
            Profile Editor
          </h1>
          <p className="mt-1 text-sm text-github-gray-600 dark:text-github-gray-400">
            Customize your GitHub profile README
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshFromGithub}
            disabled={isRefreshing}
            className={`btn flex items-center gap-2 bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-900 dark:text-github-gray-100 ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Reload from GitHub"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Loading...' : 'Reload'}
          </button>
          <button
            onClick={() => handleSaveToGithub()}
            disabled={isSaving}
            className={`btn-primary flex items-center gap-2 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              'Saved!'
            ) : (
              'Save to GitHub'
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">{saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="flex-shrink-0 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Successfully saved to GitHub!
          </p>
        </div>
      )}

      <div className="flex-1 flex justify-center overflow-hidden">
        <ProfilePreview />
      </div>

      <ConflictModal
        isOpen={showConflictModal}
        onClose={handleConflictCancel}
        onOverwrite={handleConflictOverwrite}
        onCancel={handleConflictCancel}
        currentContent={conflictData?.currentContent || ''}
      />
    </div>
  );
}
