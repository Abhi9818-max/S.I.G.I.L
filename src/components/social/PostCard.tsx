
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, Send, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { simpleHash, cn } from '@/lib/utils';
import type { Post } from '@/types';
import Link from 'next/link';
import CommentCard from './CommentCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
}

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

const EditPostDialog = ({ post, isOpen, onOpenChange, onSave }: { post: Post, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (newContent: string) => void }) => {
    const [content, setContent] = useState(post.content);

    const handleSave = () => {
        onSave(content);
        onOpenChange(false);
    }
    
    useEffect(() => {
        if(isOpen) {
            setContent(post.content)
        }
    }, [isOpen, post.content])

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { getPublicUserData, addComment, toggleLike, editPost, deletePost } = useFriends();
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [authorInfo, setAuthorInfo] = useState<{ username: string; photoURL: string | null }>({ username: 'Loading...', photoURL: null });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const isAuthor = user?.uid === post.authorId;
  
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
  
  const handleEditPost = async (newContent: string) => {
    try {
      await editPost(post.id, newContent);
      toast({ title: 'Post Updated', description: 'Your changes have been saved.' });
    } catch(e) {
      toast({ title: 'Error', description: 'Failed to update post.', variant: 'destructive'});
    }
  }

  const handleDeletePost = async () => {
      try {
        await deletePost(post.id);
        toast({ title: 'Post Deleted', description: 'Your post has been removed.' });
      } catch(e) {
        toast({ title: 'Error', description: 'Failed to delete post.', variant: 'destructive'});
      }
  }

  const topLevelComments = post.comments.filter(c => !c.parentId);

  return (
    <>
    <Card className="bg-card/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
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
              <p className="text-xs text-muted-foreground">
                {timeAgo}
                {post.editedAt && <span className="italic"> &middot; edited</span>}
              </p>
            </div>
          </div>
          {isAuthor && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your post.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
          )}
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
            {topLevelComments.length > 0 && (
              <div className="space-y-4">
                {topLevelComments.map(comment => (
                    <CommentCard 
                        key={comment.id} 
                        comment={comment} 
                        allComments={post.comments}
                        postId={post.id}
                        postAuthorId={post.authorId}
                    />
                ))}
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
    <EditPostDialog
        post={post}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onSave={handleEditPost}
    />
    </>
  );
};

export default PostCard;
