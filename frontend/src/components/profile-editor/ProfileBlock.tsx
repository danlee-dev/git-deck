'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import { ProfileBlock as ProfileBlockType } from '@/types/profile-blocks';
import { useProfileEditorStore } from '@/store/profileEditorStore';
import { GripVertical, Trash2 } from 'lucide-react';

interface ProfileBlockProps {
  block: ProfileBlockType;
}

export default function ProfileBlock({ block }: ProfileBlockProps) {
  const { updateBlock, removeBlock, selectedBlockId, selectBlock, addBlock, blocks } = useProfileEditorStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedBlockId === block.id;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Type / for commands, # for heading, * for list',
      }),
    ],
    content: block.content,
    immediatelyRender: false,
    autofocus: 'end',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateBlock(block.id, { content: html });
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[24px] [&_h1]:text-[2em] [&_h1]:font-semibold [&_h1]:border-b [&_h1]:border-github-gray-200 dark:[&_h1]:border-github-gray-700 [&_h1]:pb-2 [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-[1.5em] [&_h2]:font-semibold [&_h2]:border-b [&_h2]:border-github-gray-200 dark:[&_h2]:border-github-gray-700 [&_h2]:pb-2 [&_h2]:mt-6 [&_h2]:mb-4 [&_h3]:text-[1.25em] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-4 [&_p]:text-base [&_p]:leading-[1.6] [&_p]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-github-gray-300 dark:[&_blockquote]:border-github-gray-600 [&_blockquote]:pl-4 [&_blockquote]:text-github-gray-600 dark:[&_blockquote]:text-github-gray-400 [&_blockquote]:my-4 [&_ul]:my-4 [&_ul]:pl-8 [&_ol]:my-4 [&_ol]:pl-8 [&_li]:my-1 [&_pre]:bg-github-gray-100 dark:[&_pre]:bg-github-gray-900 [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_code]:text-[85%] [&_code]:font-mono',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();

          setTimeout(() => {
            addBlock('paragraph', {});

            setTimeout(() => {
              const blockElements = document.querySelectorAll('[data-block-id]');
              const currentIndex = blocks.findIndex(b => b.id === block.id);
              if (blockElements[currentIndex + 1]) {
                const nextBlockEditor = blockElements[currentIndex + 1].querySelector('.ProseMirror');
                if (nextBlockEditor) {
                  (nextBlockEditor as HTMLElement).focus();
                }
              }
            }, 50);
          }, 0);

          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content) {
      editor.commands.setContent(block.content);
    }
  }, [block.content, editor]);

  const handleClick = useCallback(() => {
    selectBlock(block.id);
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [block.id, selectBlock, editor]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    removeBlock(block.id);
  }, [block.id, removeBlock]);

  const getBlockStyles = () => {
    return 'relative group';
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'image':
        return (
          <div className={`text-${block.properties.align || 'center'}`}>
            {block.properties.imageUrl ? (
              <img
                src={block.properties.imageUrl}
                alt={block.properties.imageAlt || 'Image'}
                style={{ width: block.properties.imageWidth || 500 }}
                className="inline-block"
              />
            ) : (
              <div className="bg-github-gray-100 dark:bg-github-gray-900 rounded-md p-8 text-center">
                <p className="text-github-gray-500 dark:text-github-gray-500">
                  Click to add image URL
                </p>
              </div>
            )}
          </div>
        );

      case 'badge':
        return (
          <div className={`text-${block.properties.align || 'center'}`}>
            {block.properties.badgeUrl ? (
              block.properties.badgeLink ? (
                <a href={block.properties.badgeLink} target="_blank" rel="noopener noreferrer">
                  <img src={block.properties.badgeUrl} alt="Badge" className="inline-block" />
                </a>
              ) : (
                <img src={block.properties.badgeUrl} alt="Badge" className="inline-block" />
              )
            ) : (
              <div className="bg-github-gray-100 dark:bg-github-gray-900 rounded-md p-4 text-center">
                <p className="text-github-gray-500 dark:text-github-gray-500 text-sm">
                  Click to add badge URL
                </p>
              </div>
            )}
          </div>
        );

      case 'github-stats':
        return (
          <div className="bg-github-gray-100 dark:bg-github-gray-900 rounded-md p-8 text-center">
            <p className="text-github-gray-500 dark:text-github-gray-500">
              GitHub Stats Card: {block.properties.statsType || 'overview'}
            </p>
            <p className="text-xs text-github-gray-400 dark:text-github-gray-600 mt-2">
              Configure in properties panel
            </p>
          </div>
        );

      case 'divider':
        return <hr className="border-t-2 border-github-gray-200 dark:border-github-gray-700 my-4" />;

      case 'list':
        return <EditorContent editor={editor} />;

      default:
        return <EditorContent editor={editor} />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      className={`${getBlockStyles()} -mx-2 px-2 rounded transition-colors ${
        isSelected
          ? 'ring-1 ring-github-blue dark:ring-blue-400'
          : 'hover:bg-github-gray-50 dark:hover:bg-github-gray-700/30'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-github-gray-400 dark:text-github-gray-600 hover:text-github-gray-600 dark:hover:text-github-gray-400 flex-shrink-0 mt-2"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          {renderBlockContent()}
        </div>

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 mt-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
