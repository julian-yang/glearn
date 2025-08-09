'use client';

import {
  useEffect,
  useState,
} from 'react';
import { Dictionary } from '../dictionary';
import InteractiveMarkdownReader from './InteractiveMarkdownReader';

const initialMarkdownText = `# 如何在家烘焙咖啡豆

我很高興能跟你談談在家烘焙咖啡豆。這是一個很有趣的愛好，而且你還可以喝到最新鮮的咖啡！

## 準備

首先，我們需要準備一些東西。

* **生的咖啡豆**: 你可以從網路上或咖啡店買到。
* **烘豆機**: 或可以用家裡的小烤箱。
* **秤**: 準確的重量對烘焙很重要。`;

export default function ReadTextPage() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdownText, setMarkdownText] = useState(initialMarkdownText);
  const [activeTab, setActiveTab] = useState<'read' | 'edit'>('read');

  // Use a separate useEffect for the dictionary initialization
  useEffect(() => {
    const initDictionary = async () => {
      try {
        const dict = await Dictionary.getInstance();
        setDictionary(dict);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dictionary'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initDictionary();
  }, []);

  return (
    <div className="flex-1 justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center sm:text-left">
        Read Text
      </h1>
      <div className="w-full max-w-6xl flex-1 flex-col sm:flex-row gap-8 mt-10">
        {/* Main Content Area */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('read')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'read'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Read
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'edit'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            Edit
          </button>
        </div>
        <div className="mt-4">
          {activeTab === 'read' ? (
            <InteractiveMarkdownReader markdownText={markdownText} dictionary={dictionary} isLoading={isLoading} error={error} />
          ) : (
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              className="w-full h-[600px] p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md font-mono text-sm"
              aria-label="Markdown Content"
            />
          )}
        </div>
      </div>
    </div>
  );
}
