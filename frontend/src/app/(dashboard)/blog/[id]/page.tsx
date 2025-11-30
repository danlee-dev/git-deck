'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { blogAPI } from '@/lib/api';
import { ArrowLeft, Edit, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await blogAPI.posts.get(postId);
      setPost(response.data);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setIsLoading(false);
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

  if (!post) {
    return (
      <div className="card text-center py-12">
        <p className="text-github-gray-600">포스트를 찾을 수 없습니다.</p>
        <Link href="/blog" className="btn-primary mt-4">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="p-2 text-github-gray-600 hover:bg-github-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-github-gray-900">
              {post.title}
            </h1>
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
          </div>
        </div>
        <Link
          href={`/blog/edit/${post.id}`}
          className="btn flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          수정
        </Link>
      </div>

      <div className="card">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-github-gray-900 font-sans">
            {post.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
