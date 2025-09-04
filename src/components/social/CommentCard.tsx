
"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { simpleHash } from '@/lib/utils';
import Link from 'next/link';

interface CommentCardProps {
  comment: {
    id: string;
    authorId: string;
    authorUsername: string;
    authorPhotoURL?: string | null;
    content: string;
    createdAt: string;
  };
}

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const timeAgo = formatDistanceToNowStrict(parseISO(comment.createdAt), { addSuffix: true });

  return (
    <div className="flex items-start gap-3">
      <Link href={`/friends/${comment.authorId}`}>
          <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={getAvatarForId(comment.authorId, comment.authorPhotoURL)} />
              <AvatarFallback>{comment.authorUsername.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
      </Link>
      <div className="flex-1 bg-muted rounded-lg p-2">
        <div className="flex items-center justify-between">
          <Link href={`/friends/${comment.authorId}`}>
            <span className="text-xs font-semibold cursor-pointer hover:underline">{comment.authorUsername}</span>
          </Link>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
};

export default CommentCard;
