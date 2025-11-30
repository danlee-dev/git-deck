'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Github, Trash2, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, deleteAccount } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConnectGithub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user,repo`;
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
        <h1 className="text-2xl font-semibold text-github-gray-900">설정</h1>
        <p className="mt-1 text-sm text-github-gray-600">
          계정 정보를 관리하세요
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-github-gray-200">
          <div className="w-12 h-12 rounded-full bg-github-gray-100 flex items-center justify-center">
            <User className="w-6 h-6 text-github-gray-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-github-gray-900">
              {user?.username}
            </p>
            <p className="text-sm text-github-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-github-gray-900 mb-4">
              GitHub 연동
            </h2>
            {user?.is_github_connected ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-github-green" />
                  <div>
                    <p className="text-sm font-medium text-github-gray-900">
                      GitHub 계정이 연결되었습니다
                    </p>
                    {user.github_username && (
                      <p className="text-xs text-github-gray-600 mt-1">
                        @{user.github_username}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                  연결됨
                </span>
              </div>
            ) : (
              <div className="p-4 bg-github-gray-50 border border-github-gray-200 rounded-md">
                <div className="flex items-start gap-3 mb-4">
                  <Github className="w-5 h-5 text-github-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-github-gray-900 mb-1">
                      GitHub 계정 연결
                    </p>
                    <p className="text-sm text-github-gray-600 mb-3">
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

          <div className="pt-6 border-t border-github-gray-200">
            <h2 className="text-lg font-medium text-github-gray-900 mb-4">
              계정 삭제
            </h2>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-github-gray-900 mb-1">
                    계정을 영구적으로 삭제
                  </p>
                  <p className="text-sm text-github-gray-600 mb-3">
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-github-gray-900 mb-4">
              계정 삭제 확인
            </h2>
            <p className="text-sm text-github-gray-600 mb-6">
              정말로 계정을 삭제하시겠습니까? 이 작업은 7일 이내에 복구할 수
              있습니다. 7일이 지나면 모든 데이터가 영구적으로 삭제됩니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn"
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
