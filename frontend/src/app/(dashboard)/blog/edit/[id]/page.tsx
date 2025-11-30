'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await blogAPI.posts.get(postId);
      const post = response.data;
      setTitle(post.title);
      setContent(post.content);
      setStatus(post.status);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      setError('포스트를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await blogAPI.posts.update(postId, {
        title,
        content,
        status,
      });
      router.push('/blog');
    } catch (err: any) {
      setError(err.response?.data?.detail || '포스트 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
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
      <div className="flex items-center gap-4">
        <Link
          href="/blog"
          className="p-2 text-github-gray-600 hover:bg-github-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-github-gray-900">
            포스트 수정
          </h1>
          <p className="mt-1 text-sm text-github-gray-600">
            마크다운 형식으로 작성하세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="card">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-github-gray-900 mb-2"
              >
                제목
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="포스트 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-github-gray-900 mb-2"
              >
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea w-full"
                rows={20}
                placeholder="마크다운 형식으로 작성하세요..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-github-gray-900 mb-2">
                상태
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={(e) => setStatus(e.target.value as 'draft')}
                    className="w-4 h-4 text-github-blue"
                  />
                  <span className="text-sm text-github-gray-700">임시저장</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="published"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.value as 'published')}
                    className="w-4 h-4 text-github-blue"
                  />
                  <span className="text-sm text-github-gray-700">게시</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/blog" className="btn">
            취소
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
