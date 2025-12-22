import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FilterPanel } from '@/components/FilterPanel';
import { VideoGrid } from '@/components/VideoGrid';
import { SearchFilters, VideoResult } from '@/types/search';
import { searchVideos } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'disha-filters';

const initialFilters: SearchFilters = {
  language: '',
  source: '',
  durationBand: '',
  year: '',
};

const getStoredFilters = (): SearchFilters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialFilters;
  } catch {
    return initialFilters;
  }
};

const storeFilters = (filters: SearchFilters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const Index = () => {
  const [filters, setFilters] = useState<SearchFilters>(getStoredFilters());
  const [allVideos, setAllVideos] = useState<VideoResult[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); // Number of videos to show initially
  const { toast } = useToast();

  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setIsLoading(true);
    try {
      const results = await searchVideos(searchFilters);
      setAllVideos(results);
      setDisplayedVideos(results.slice(0, visibleCount));
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: 'Unable to fetch results. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleLoadMore = useCallback(() => {
    const newCount = visibleCount + 10; // Load 10 more videos
    setVisibleCount(newCount);
    setDisplayedVideos(allVideos.slice(0, newCount));
  }, [allVideos, visibleCount]);

  // Load initial results on mount and when filters change
  useEffect(() => {
    performSearch(filters);
  }, [filters, performSearch]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    storeFilters(newFilters);
    performSearch(newFilters);
  }, [filters, performSearch]);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    storeFilters(initialFilters);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Filters */}
        <div className="-mt-20 relative z-20">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {allVideos.length} {allVideos.length === 1 ? 'video' : 'videos'} found
          </h2>
        </div>

        {/* Video Grid */}
        <div className="space-y-8">
          <VideoGrid
            videos={displayedVideos}
            isLoading={isLoading}
            hasSearched={true}
          />

          {/* Load More Button */}
          {allVideos.length > displayedVideos.length && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-1 mt-auto">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Aman Mangal
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
