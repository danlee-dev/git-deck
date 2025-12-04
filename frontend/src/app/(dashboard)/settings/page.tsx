'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Github, Trash2, User, Unlink, Loader2, RefreshCw } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, deleteAccount, fetchUser } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  const handleConnectGithub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/github/callback`;
    // GitHub Actions 기능에 필요한 전체 권한
    const scopes = [
      'user',           // 유저 정보
      'repo',           // 레포지토리 전체 접근
      'read:org',       // 조직 정보 읽기
      'workflow',       // 워크플로우 파일 수정 (.github/workflows)
      'write:packages', // GitHub Packages 푸시 (Docker 등)
      'read:packages',  // GitHub Packages 읽기
    ].join(',');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;
  };

  const handleReconnectGithub = () => {
    // Use same callback as connect - backend updates token for existing users
    handleConnectGithub();
  };

  const handleDisconnectGithub = async () => {
    if (!confirm('GitHub 연결을 해제하시겠습니까? 워크플로우 배포 등 GitHub 기능을 사용할 수 없게 됩니다.')) {
      return;
    }

    setIsDisconnecting(true);
    setDisconnectError(null);

    try {
      await authAPI.disconnectGithub();
      await fetchUser();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || 'GitHub 연결 해제에 실패했습니다.';
      setDisconnectError(message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      router.push('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('계정 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-github-gray-900 dark:text-github-gray-100">설정</h1>
        <p className="mt-1 text-sm text-github-gray-600 dark:text-github-gray-400">
          계정 정보를 관리하세요
        </p>
      </div>

      <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-github-gray-200 dark:border-github-gray-700">
          <div className="w-12 h-12 rounded-full bg-github-gray-100 dark:bg-github-gray-700 flex items-center justify-center">
            <User className="w-6 h-6 text-github-gray-600 dark:text-github-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100">
              {user?.username}
            </p>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-4">
              GitHub 연동
            </h2>
            {user?.is_github_connected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-github-green dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-github-gray-900 dark:text-github-gray-100">
                        GitHub 계정이 연결되었습니다
                      </p>
                      {user.github_username && (
                        <p className="text-xs text-github-gray-600 dark:text-github-gray-400 mt-1">
                          @{user.github_username}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm">
                    연결됨
                  </span>
                </div>

                {disconnectError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                    {disconnectError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleReconnectGithub}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-github-gray-700 dark:text-github-gray-300 bg-github-gray-100 dark:bg-github-gray-700 hover:bg-github-gray-200 dark:hover:bg-github-gray-600 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    권한 갱신 (재연결)
                  </button>
                  <button
                    onClick={handleDisconnectGithub}
                    disabled={isDisconnecting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    연결 해제
                  </button>
                </div>
                <p className="text-xs text-github-gray-500 dark:text-github-gray-400">
                  워크플로우 배포가 안 되면 "권한 갱신" 버튼을 눌러 GitHub 권한을 다시 받으세요.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-github-gray-50 dark:bg-github-gray-700/50 border border-github-gray-200 dark:border-github-gray-600 rounded-md">
                <div className="flex items-start gap-3 mb-4">
                  <Github className="w-5 h-5 text-github-gray-600 dark:text-github-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-github-gray-900 dark:text-github-gray-100 mb-1">
                      GitHub 계정 연결
                    </p>
                    <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-3">
                      GitHub 계정을 연결하여 저장소 관리와 README 동기화 기능을
                      사용하세요.
                    </p>
                    <button
                      onClick={handleConnectGithub}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Github className="w-4 h-4" />
                      GitHub 연결하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-github-gray-200 dark:border-github-gray-700">
            <h2 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-4">
              계정 삭제
            </h2>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-github-gray-900 dark:text-github-gray-100 mb-1">
                    계정을 영구적으로 삭제
                  </p>
                  <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-3">
                    계정을 삭제하면 7일간 보관되며, 이 기간 내에 복구할 수
                    있습니다. 7일이 지나면 모든 데이터가 영구적으로 삭제됩니다.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                  >
                    계정 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-github-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100 mb-4">
              계정 삭제 확인
            </h2>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-6">
              정말로 계정을 삭제하시겠습니까? 이 작업은 7일 이내에 복구할 수
              있습니다. 7일이 지나면 모든 데이터가 영구적으로 삭제됩니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
