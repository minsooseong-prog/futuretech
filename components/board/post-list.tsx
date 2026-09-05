import Link from 'next/link';
import { Eye, ImageIcon, MessageSquare, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatListDate } from '@/lib/utils/date';

export type PostRow = {
  id: string;
  number: number;
  category: string;
  title: string;
  authorName: string;
  authorId: string;
  createdAt: Date;
  views: number;
  likes: number;
  commentCount: number;
  imageCount: number;
};

/**
 * The DCInside table is efficient because everything sits on one scannable row.
 * That holds up on a desktop; on a phone the same data becomes a two-line card.
 */
export function PostList({ posts }: { posts: PostRow[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="hidden w-full table-fixed text-sm md:table">
        <thead>
          <tr className="hairline text-[12px] text-faint">
            <th scope="col" className="w-16 px-3 py-2.5 text-left font-medium">번호</th>
            <th scope="col" className="w-20 px-2 py-2.5 text-left font-medium">말머리</th>
            <th scope="col" className="px-2 py-2.5 text-left font-medium">제목</th>
            <th scope="col" className="w-28 px-2 py-2.5 text-left font-medium">작성자</th>
            <th scope="col" className="w-20 px-2 py-2.5 text-left font-medium">날짜</th>
            <th scope="col" className="w-16 px-2 py-2.5 text-right font-medium">조회</th>
            <th scope="col" className="w-16 px-3 py-2.5 text-right font-medium">추천</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-line last:border-0 hover:bg-canvas">
              <td className="px-3 py-3 text-[13px] tabular-nums text-faint">{post.number}</td>
              <td className="px-2 py-3">
                <Badge>{post.category}</Badge>
              </td>
              <td className="truncate px-2 py-3">
                <Link href={`/board/${post.id}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
                {post.commentCount > 0 && (
                  <span className="ml-1.5 text-[12px] tabular-nums text-subtle">[{post.commentCount}]</span>
                )}
                {post.imageCount > 0 && (
                  <ImageIcon className="ml-1.5 inline h-3 w-3 text-faint" aria-label="사진 있음" />
                )}
              </td>
              <td className="truncate px-2 py-3 text-[13px] text-subtle">
                <Link href={`/profile/${post.authorId}`} className="hover:underline">
                  {post.authorName}
                </Link>
              </td>
              <td className="px-2 py-3 text-[13px] tabular-nums text-faint">
                {formatListDate(post.createdAt)}
              </td>
              <td className="px-2 py-3 text-right text-[13px] tabular-nums text-faint">{post.views}</td>
              <td className="px-3 py-3 text-right text-[13px] tabular-nums text-faint">{post.likes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="md:hidden">
        {posts.map((post) => (
          <li key={post.id} className="border-b border-line last:border-0">
            <Link href={`/board/${post.id}`} className="block px-4 py-3.5 transition hover:bg-canvas">
              <div className="flex items-center gap-2">
                <Badge>{post.category}</Badge>
                <span className="truncate text-[15px] font-medium">{post.title}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[12px] text-faint">
                <span>{post.authorName}</span>
                <span>{formatListDate(post.createdAt)}</span>
                <span className="ml-auto flex items-center gap-2.5">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" aria-hidden />
                    {post.commentCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" aria-hidden />
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" aria-hidden />
                    {post.likes}
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
