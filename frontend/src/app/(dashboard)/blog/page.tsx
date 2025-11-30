'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await blogAPI.posts.list();
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 포스트를 삭제하시겠습니까?')) return;

    try {
      await blogAPI.posts.delete(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <h1 className="text-2xl font-semibold text-github-gray-900">블로그</h1>
          <p className="mt-1 text-sm text-github-gray-600">
            블로그 포스트를 작성하고 관리하세요
          </p>
        </div>
        <Link href="/blog/create" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 포스트
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-github-gray-600 mb-4">
            아직 포스트가 없습니다
          </p>
          <Link href="/blog/create" className="btn-primary">
            첫 포스트 작성하기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link href={`/blog/${post.id}`}>
                    <h3 className="text-lg font-medium text-github-gray-900 hover:text-github-blue cursor-pointer">
                      {post.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-github-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.created_at)}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {post.status === 'published' ? '게시됨' : '임시저장'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-github-gray-600 line-clamp-2">
                    {post.content.substring(0, 150)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/blog/edit/${post.id}`}
                    className="p-2 text-github-gray-600 hover:bg-github-gray-100 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
