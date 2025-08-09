'use client';

import {
  Children,
  cloneElement,
  ElementType,
  isValidElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Dictionary, DictionaryEntry } from '../dictionary';

interface InteractiveMarkdownReaderProps {
  dictionary: Dictionary | null;
  isLoading: boolean;
  error: string | null;
  markdownText: string;
}

export default function InteractiveMarkdownReader({
  markdownText,
  dictionary,
  isLoading,
  error,
}: InteractiveMarkdownReaderProps) {
  const [selectedWordEntry, setSelectedWordEntry] =
    useState<DictionaryEntry | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    word: string;
    startIndex: number;
    pIndex: number;
  } | null>(null);

  // Set up the event listener ONCE when the component mounts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'd' && hoveredInfo && dictionary) {
        const result = dictionary.get(hoveredInfo.word);
        setSelectedWordEntry(result || null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoveredInfo, dictionary]);

  const handleMouseEnter = (
    word: string,
    startIndex: number,
    pIndex: number
  ) => {
    console.log("handleMouseEnter: word=%s", word);
    setHoveredInfo({ word, startIndex, pIndex });
  };

  const handleMouseLeave = () => {
    setHoveredInfo(null);
  };


  const InteractiveText = ({ text, localPIndex }: { text: string, localPIndex: number }) => {
    if (!dictionary) {
      return <>{text}</>;
    }

    const segments: { content: string; isMatch: boolean; startIndex: number }[] = [];
    let i = 0;
    while (i < text.length) {
      const match = dictionary.findLongestMatch(text, i);
      if (match) {
        segments.push({ content: match, isMatch: true, startIndex: i });
        i += match.length;
      } else {
        segments.push({ content: text[i], isMatch: false, startIndex: i });
        i++;
      }
    }

    return (
      <>
        {segments.map((segment, index) => {
          if (!segment.isMatch) {
            return <span key={index}>{segment.content}</span>;
          }

          const isHighlighted =
            hoveredInfo &&
            hoveredInfo.pIndex === localPIndex &&
            hoveredInfo.startIndex === segment.startIndex &&
            hoveredInfo.word === segment.content;

          return (
            <span
              key={index}
              onMouseEnter={() =>
                handleMouseEnter(segment.content, segment.startIndex, localPIndex)
              }
              className={
                isHighlighted ? 'bg-yellow-300 dark:bg-yellow-700 rounded' : ''
              }
            >
              {segment.content}
            </span>
          );
        })}
      </>
    );
  };

  let pIndex = -1;

  const processChildren = (children: ReactNode, localPIndex: number): ReactNode => {
    return Children.map(children, (child) => {
      if (typeof child === 'string') {
        return <InteractiveText text={child} localPIndex={localPIndex} />;
      }
      if (isValidElement(child) && (child.props as { children?: ReactNode }).children) {
        return cloneElement(
          child,
          { ...(child.props as object) },
          processChildren((child.props as { children?: ReactNode }).children, localPIndex)
        );
      }
      return child;
    });
  };

  const CustomRenderer = ({ as: Element, children, ...props }: { as: ElementType, children?: ReactNode, [key: string]: unknown }) => {
    pIndex++;
    const localPIndex = pIndex;
    return (
      <Element {...props} onMouseLeave={handleMouseLeave}>
        {processChildren(children, localPIndex)}
      </Element>
    );
  };


  return (
    <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-8 mt-10">
      <main className="w-full flex-1">
        <article
          className="prose dark:prose-invert w-full max-w-none h-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 overflow-y-auto shadow-md"
        >
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: (props) => <CustomRenderer as="p" {...props} />,
              h1: (props) => <CustomRenderer as="h1" {...props} />,
              h2: (props) => <CustomRenderer as="h2" {...props} />,
              h3: (props) => <CustomRenderer as="h3" {...props} />,
              h4: (props) => <CustomRenderer as="h4" {...props} />,
              h5: (props) => <CustomRenderer as="h5" {...props} />,
              h6: (props) => <CustomRenderer as="h6" {...props} />,
              li: (props) => <CustomRenderer as="li" {...props} />,
            }}
          >
            {markdownText}
          </ReactMarkdown>
        </article>
      </main>
      {/* Side Panel */}
      <aside className="w-full sm:w-64 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md min-h-[180px]">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Dictionary Lookup
          </h2>
          {isLoading && (
            <p className="text-gray-500 dark:text-gray-400">Loading dictionary...</p>
          )}
          {error && <p className="text-red-500">{error}</p>}
          {selectedWordEntry && (
            <div>
              <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
                {selectedWordEntry.traditional} / {selectedWordEntry.simplified}
              </p>
              <p className="text-gray-600 dark:text-gray-300">[{selectedWordEntry.pinyin}]</p>
              <ul className="list-disc list-inside mt-2 text-gray-700 dark:text-gray-300">
                {selectedWordEntry.definitions.map((def, i) => <li key={i}>{def}</li>)}
              </ul>
            </div>
          )}
          {!isLoading && !selectedWordEntry && !error && (
            <p className="text-gray-500 dark:text-gray-400">Hover over text and press &apos;d&apos; to look up a word.</p>
          )}
        </div>
      </aside>
    </div>
  );
}