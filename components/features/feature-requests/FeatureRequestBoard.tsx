'use client';

import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FeatureRequestCard from './FeatureRequestCard';
import { toast } from 'sonner';

interface FeatureRequest {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  status: 'submitted' | 'planned' | 'in_development' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vote_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  feature_request_categories?: {
    name: string;
    color: string;
  };
  feature_request_tag_assignments?: Array<{
    feature_request_tags: {
      name: string;
    };
  }>;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  comments_count?: number;
  is_public?: boolean;
}

interface FeatureRequestBoardProps {
  featureRequests: FeatureRequest[];
  onStatusUpdate: (requestId: string, newStatus: string) => Promise<void>;
  onVote: (featureRequestId: string, voteType: 'upvote') => void;
  onClick: (request: FeatureRequest) => void;
}

const statusColumns = [
  {
    id: 'submitted',
    title: 'Submitted',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'planned',
    title: 'Planned',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'in_development',
    title: 'In Development',
    color: 'bg-orange-50 border-orange-200',
    headerColor: 'bg-orange-100 text-orange-800',
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-800',
  },
  {
    id: 'rejected',
    title: 'Rejected',
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-100 text-red-800',
  },
];

export default function FeatureRequestBoard({
  featureRequests,
  onStatusUpdate,
  onVote,
  onClick,
}: FeatureRequestBoardProps) {
  const [requestsByStatus, setRequestsByStatus] = useState<
    Record<string, FeatureRequest[]>
  >({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Organize requests by status
  useEffect(() => {
    const organized: Record<string, FeatureRequest[]> = {};
    statusColumns.forEach(column => {
      organized[column.id] = [];
    });

    featureRequests.forEach(request => {
      if (organized[request.status]) {
        organized[request.status].push(request);
      }
    });

    setRequestsByStatus(organized);
  }, [featureRequests]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    console.log('Drag ended:', { destination, source, draggableId });

    // If dropped outside a droppable area, do nothing
    if (!destination) {
      console.log('No destination, cancelling');
      return;
    }

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;

    // If dropped in the same column, we could reorder (not implemented for now)
    if (sourceStatus === destinationStatus) {
      return;
    }

    // Find the request being moved
    const request = requestsByStatus[sourceStatus]?.find(
      r => r.id === draggableId
    );

    if (!request) {
      console.error('Request not found:', draggableId);
      return;
    }

    console.log(
      'Moving request:',
      request.title,
      'from',
      sourceStatus,
      'to',
      destinationStatus
    );

    // Wait a bit for the drag animation to complete before updating state
    // This prevents the "Draggable being added/removed during drag" warning
    setIsUpdating(draggableId);

    // Use setTimeout to delay state update until after drag completes
    setTimeout(async () => {
      // Optimistically update the UI
      const newRequestsByStatus = { ...requestsByStatus };
      newRequestsByStatus[sourceStatus] = newRequestsByStatus[
        sourceStatus
      ].filter(r => r.id !== draggableId);
      newRequestsByStatus[destinationStatus] = [
        ...(newRequestsByStatus[destinationStatus] || []),
        { ...request, status: destinationStatus as any },
      ];
      setRequestsByStatus(newRequestsByStatus);

      try {
        // Update the status via API
        await onStatusUpdate(draggableId, destinationStatus);
        toast.success('Status updated successfully');
      } catch (error) {
        // Revert on error - put the request back where it was
        setRequestsByStatus(requestsByStatus);
        toast.error('Failed to update status');
        console.error('Error updating status:', error);
      } finally {
        setIsUpdating(null);
      }
    }, 100);
  };

  const getStatusCount = (statusId: string) => {
    return requestsByStatus[statusId]?.length || 0;
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ minHeight: '600px' }}
      >
        {statusColumns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
            <Card
              className={`${column.color} border-2 h-full flex flex-col overflow-hidden`}
            >
              <CardHeader
                className={`${column.headerColor} rounded-t-lg flex-shrink-0`}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/50">
                    {getStatusCount(column.id)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-hidden flex flex-col">
                <Droppable droppableId={column.id} type="CARD">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[100px] space-y-3 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-100/50 rounded-lg p-2'
                          : ''
                      }`}
                      style={{
                        minHeight: snapshot.isDraggingOver ? '150px' : '100px',
                        maxHeight: 'calc(100vh - 300px)',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                      }}
                    >
                      {requestsByStatus[column.id]?.map((request, index) => (
                        <Draggable
                          key={request.id}
                          draggableId={request.id}
                          index={index}
                          isDragDisabled={isUpdating === request.id}
                          type="CARD"
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.5 : 1,
                                transform: snapshot.isDragging
                                  ? 'rotate(2deg)'
                                  : 'none',
                                cursor: snapshot.isDragging
                                  ? 'grabbing'
                                  : 'grab',
                              }}
                              className={`${
                                isUpdating === request.id ? 'opacity-50' : ''
                              }`}
                              onMouseDown={e => {
                                // Prevent card click when starting to drag
                                if (e.button === 0) {
                                  e.stopPropagation();
                                }
                              }}
                              onClick={e => {
                                // Only trigger onClick if not dragging and not just started dragging
                                if (!snapshot.isDragging && !isDragging) {
                                  e.stopPropagation();
                                  onClick(request);
                                }
                              }}
                            >
                              <div
                                style={{
                                  pointerEvents: snapshot.isDragging
                                    ? 'none'
                                    : 'auto',
                                }}
                              >
                                <FeatureRequestCard
                                  id={request.id}
                                  title={request.title}
                                  description={request.description}
                                  status={request.status}
                                  priority={request.priority}
                                  vote_count={request.vote_count}
                                  view_count={request.view_count}
                                  created_at={request.created_at}
                                  updated_at={request.updated_at}
                                  category={request.feature_request_categories}
                                  tags={request.feature_request_tag_assignments?.map(
                                    assignment => ({
                                      name: assignment.feature_request_tags
                                        .name,
                                    })
                                  )}
                                  author={request.profiles}
                                  is_featured={request.is_featured}
                                  is_public={request.is_public}
                                  comments_count={request.comments_count || 0}
                                  onVote={(id, type) => {
                                    onVote(id, type);
                                  }}
                                  onClick={undefined}
                                  className="mb-0"
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {requestsByStatus[column.id]?.length === 0 && (
                        <div className="text-center text-gray-400 py-8 text-sm">
                          No requests
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
