
"use client";

import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { simpleHash } from '@/lib/utils';
import Link from 'next/link';
import type { Comment } from '@/types';
import { Button } from '../ui/button';
import { Heart, Send } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { Textarea } from '../ui/textarea';
import { useFriends } from '../providers/FriendProvider';

interface CommentCardProps {
  comment: Comment;
  allComments: Comment[];
  postId: string;
  postAuthorId: string;
}

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

const CommentCard: React.FC<CommentCardProps> = ({ comment, allComments, postId, postAuthorId }) => {
  const { user } = useAuth();
  const { addComment, toggleCommentLike } = useFriends();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const replies = useMemo(() => {
    return allComments
        .filter(c => c.parentId === comment.id)
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [allComments, comment.id]);

  const timeAgo = formatDistanceToNowStrict(parseISO(comment.createdAt), { addSuffix: true });
  const likes = comment.likes || [];
  const isLiked = user ? likes.includes(user.uid) : false;

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !user) return;
    await addComment(postId, postAuthorId, replyContent, comment.id);
    setReplyContent('');
    setIsReplying(false);
  }

  const handleToggleLike = () => {
    if (!user) return;
    toggleCommentLike(postId, postAuthorId, comment.id);
  }

  return (
    <div className="flex items-start gap-3">
        <Link href={`/friends/${comment.authorId}`}>
          <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage src={getAvatarForId(comment.authorId, comment.authorPhotoURL)} />
              <AvatarFallback>{comment.authorUsername.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/friends/${comment.authorId}`}>
                <span className="text-sm font-semibold cursor-pointer hover:underline">{comment.authorUsername}</span>
              </Link>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
            <div className="mt-2 flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="text-xs text-muted-foreground p-0 h-auto">Reply</Button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Button variant="ghost" size="icon" onClick={handleToggleLike} className="h-8 w-8">
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}/>
            </Button>
            {likes.length > 0 && (
                <span className="text-xs text-muted-foreground">{likes.length}</span>
            )}
          </div>
        </div>

        {isReplying && (
            <div className="mt-2 flex items-center gap-2">
                <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Replying to ${comment.authorUsername}...`}
                    rows={1}
                    className="flex-grow bg-muted text-sm"
                />
                <Button onClick={handleReplySubmit} size="icon" disabled={!replyContent.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        )}

        {replies.length > 0 && (
            <div className="mt-3 space-y-3">
                {replies.map(reply => (
                    <CommentCard 
                      key={reply.id} 
                      comment={reply}
                      allComments={allComments}
                      postId={postId}
                      postAuthorId={postAuthorId}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default CommentCard;
