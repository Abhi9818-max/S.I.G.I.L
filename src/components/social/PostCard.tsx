
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { simpleHash, cn } from '@/lib/utils';
import type { Post } from '@/types';
import Link from 'next/link';
import CommentCard from './CommentCard';

interface PostCardProps {
  post: Post;
}

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user, userData } = useAuth();
  const { getPublicUserData } = useFriends();
  const { addComment, toggleLike } = useFriends();
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [authorInfo, setAuthorInfo] = useState<{ username: string; photoURL: string | null }>({ username: 'Loading...', photoURL: null });
  
  useEffect(() => {
    const fetchAuthorInfo = async () => {
        const fetchedUser = await getPublicUserData(post.authorId);
        if (fetchedUser) {
            setAuthorInfo({ username: fetchedUser.username, photoURL: fetchedUser.photoURL || null });
        } else {
             setAuthorInfo({ username: `User...${post.authorId.slice(-4)}`, photoURL: null });
        }
    };
    fetchAuthorInfo();
  }, [post.authorId, getPublicUserData]);

  const timeAgo = formatDistanceToNowStrict(parseISO(post.createdAt), { addSuffix: true });
  const isLiked = user ? post.likes.includes(user.uid) : false;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(post.id, post.authorId, newComment);
    setNewComment('');
  };

  const handleLike = () => {
    toggleLike(post.id, post.authorId);
  };
  
  const sortedComments = post.comments.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Link href={`/friends/${post.authorId}`}>
            <Avatar className="cursor-pointer">
              <AvatarImage src={getAvatarForId(post.authorId, authorInfo.photoURL)} />
              <AvatarFallback>{authorInfo.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/friends/${post.authorId}`}>
              <p className="font-semibold cursor-pointer hover:underline">{authorInfo.username}</p>
            </Link>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-1.5">
            <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
            {post.likes.length}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {post.comments.length}
          </Button>
        </div>
        {showComments && (
          <div className="w-full space-y-3 pt-3">
            {sortedComments.length > 0 && (
              <div className="space-y-2">
                {sortedComments.map(comment => <CommentCard key={comment.id} comment={comment} />)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={1}
                className="flex-grow bg-muted"
              />
              <Button onClick={handleAddComment} size="icon" disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
