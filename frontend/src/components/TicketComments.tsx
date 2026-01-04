import { useState, useEffect, useRef } from 'react';
import type { TicketComment } from '../types';
import { commentsApi } from '../api/comments';
import { useAuth } from '../contexts/AuthContext';
import './TicketComments.css';

interface TicketCommentsProps {
  ticketId: number;
}

export const TicketComments = ({ ticketId }: TicketCommentsProps) => {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [ticketId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await commentsApi.getByTicketId(ticketId);
      setComments(data);
      setError('');
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Only JPEG, PNG, and GIF images are allowed');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError('Comment text is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await commentsApi.create({
        ticket_id: ticketId,
        comment_text: newComment,
        image: selectedImage || undefined,
      });

      setNewComment('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add comment');
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditClick = (comment: TicketComment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: number) => {
    try {
      setSubmitting(true);
      await commentsApi.update(commentId, editText);
      setEditingId(null);
      setEditText('');
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsApi.delete(commentId);
      await fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const canEditComment = (comment: TicketComment) => {
    return user?.id === comment.user_id;
  };

  const canDeleteComment = (comment: TicketComment) => {
    return user?.id === comment.user_id || user?.isAdmin;
  };

  if (loading) {
    return <div className="comments-loading">Loading comments...</div>;
  }

  return (
    <div className="ticket-comments">
      <h3>Comments</h3>

      {error && <div className="comments-error">{error}</div>}

      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          disabled={submitting}
          required
        />

        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button type="button" onClick={removeImage} className="remove-image-btn">
              ✕
            </button>
          </div>
        )}

        <div className="comment-form-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={submitting}
          >
            📎 Attach Image
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-user">
                  {comment.user_name}
                  {comment.user_department && (
                    <span className="comment-department"> ({comment.user_department})</span>
                  )}
                </span>
                <div className="comment-header-right">
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                  {editingId !== comment.id && (
                    <div className="comment-actions">
                      {canEditComment(comment) && (
                        <button
                          onClick={() => handleEditClick(comment)}
                          className="btn-edit"
                          title="Edit comment"
                        >
                          ✏️
                        </button>
                      )}
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="btn-delete"
                          title="Delete comment"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {editingId === comment.id ? (
                <div className="edit-comment-form">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    disabled={submitting}
                  />
                  <div className="edit-actions">
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="btn-primary"
                      disabled={submitting || !editText.trim()}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="comment-text">{comment.comment_text}</div>
                  {comment.image_url && (
                    <div className="comment-image">
                      <img
                        src={`http://localhost:5001${comment.image_url}`}
                        alt="Comment attachment"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
