'use client';

import { useEffect, useState } from 'react';
import { profilesAPI, blocksAPI } from '@/lib/api';
import { Plus, Save, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
}

interface Block {
  id: string;
  profile_id: string;
  type: string;
  content: any;
  position: number;
}

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await profilesAPI.list();
      setProfiles(response.data);
      if (response.data.length > 0) {
        const defaultProfile = response.data.find((p: Profile) => p.is_default) || response.data[0];
        setSelectedProfile(defaultProfile);
        fetchBlocks(defaultProfile.id);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlocks = async (profileId: string) => {
    try {
      const response = await blocksAPI.list();
      const profileBlocks = response.data.filter(
        (b: Block) => b.profile_id === profileId
      );
      setBlocks(profileBlocks.sort((a: Block, b: Block) => a.position - b.position));
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    try {
      const response = await profilesAPI.create({
        name: newProfileName,
        description: newProfileDesc,
        is_default: profiles.length === 0,
      });
      setProfiles([...profiles, response.data]);
      setShowCreateModal(false);
      setNewProfileName('');
      setNewProfileDesc('');
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('정말 이 프로필을 삭제하시겠습니까?')) return;

    try {
      await profilesAPI.delete(id);
      const updated = profiles.filter((p) => p.id !== id);
      setProfiles(updated);
      if (selectedProfile?.id === id) {
        setSelectedProfile(updated[0] || null);
        if (updated[0]) {
          fetchBlocks(updated[0].id);
        } else {
          setBlocks([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleSyncToReadme = async () => {
    if (!selectedProfile) return;

    try {
      await profilesAPI.syncToReadme(selectedProfile.id);
      alert('README에 성공적으로 동기화되었습니다!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'README 동기화에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-github-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-github-gray-900">프로필</h1>
          <p className="mt-1 text-sm text-github-gray-600">
            GitHub 프로필을 관리하고 커스터마이징하세요
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          새 프로필
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-github-gray-600 mb-4">
            아직 프로필이 없습니다
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            첫 프로필 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-sm font-medium text-github-gray-900 mb-3">
                내 프로필
              </h2>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      setSelectedProfile(profile);
                      fetchBlocks(profile.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedProfile?.id === profile.id
                        ? 'bg-github-gray-100 text-github-gray-900 font-medium'
                        : 'text-github-gray-600 hover:bg-github-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{profile.name}</span>
                      {!profile.is_default && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedProfile && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-github-gray-900">
                      {selectedProfile.name}
                    </h2>
                    <p className="text-sm text-github-gray-600">
                      {selectedProfile.description}
                    </p>
                  </div>
                  <button
                    onClick={handleSyncToReadme}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    README 동기화
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-github-gray-900">
                    블록 ({blocks.length})
                  </h3>
                  {blocks.length === 0 ? (
                    <div className="text-center py-8 bg-github-gray-50 rounded-md">
                      <p className="text-sm text-github-gray-600">
                        블록이 없습니다
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blocks.map((block) => (
                        <div
                          key={block.id}
                          className="p-4 border border-github-gray-200 rounded-md"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-github-gray-900">
                              {block.type}
                            </span>
                            <span className="text-xs text-github-gray-500">
                              위치: {block.position}
                            </span>
                          </div>
                          <pre className="text-xs text-github-gray-600 bg-github-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(block.content, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-github-gray-900 mb-4">
              새 프로필 만들기
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-github-gray-900 mb-2">
                  프로필 이름
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="input w-full"
                  placeholder="예: 메인 프로필"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-github-gray-900 mb-2">
                  설명 (선택)
                </label>
                <textarea
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  className="textarea w-full"
                  rows={3}
                  placeholder="프로필에 대한 간단한 설명"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn"
                >
                  취소
                </button>
                <button onClick={handleCreateProfile} className="btn-primary">
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
