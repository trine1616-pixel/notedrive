"use client";

import React from 'react';
import { Hash, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TagListProps {
    tags: string[];
    tagCounts: Record<string, number>;
    selectedTag: string | null;
    isTrashSelected: boolean;
    trashCount: number;
    onTagSelect: (tag: string | null) => void;
    onTrashSelect: () => void;
}

export function TagList({ tags, tagCounts, selectedTag, isTrashSelected, trashCount, onTagSelect, onTrashSelect }: TagListProps) {
    return (
        <div className="mt-4 px-2">
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
            </h3>
            <div className="space-y-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTagSelect(null)}
                    className={cn(
                        "w-full justify-start h-8 px-2 text-sm font-normal",
                        selectedTag === null && "bg-accent text-accent-foreground"
                    )}
                >
                    <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>All Notes</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTrashSelect}
                    className={cn(
                        "w-full justify-start h-8 px-2 text-sm font-normal",
                        isTrashSelected && "bg-accent text-accent-foreground"
                    )}
                >
                    <Trash2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Trash</span>
                    <span className="ml-auto text-xs text-muted-foreground">{trashCount}</span>
                </Button>
                {tags.length > 0 && (
                  <>
                {tags.map(tag => (
                    <Button
                        key={tag}
                        variant="ghost"
                        size="sm"
                        onClick={() => onTagSelect(tag)}
                        className={cn(
                            "w-full justify-start h-8 px-2 text-sm font-normal",
                            selectedTag === tag && "bg-accent text-accent-foreground"
                        )}
                    >
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="truncate">{tag}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{tagCounts[tag] || 0}</span>
                    </Button>
                ))}
                  </>
                )}
            </div>
        </div>
    );
}
