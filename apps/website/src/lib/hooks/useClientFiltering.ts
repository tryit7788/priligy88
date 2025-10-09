import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from 'payload_app';
import { sorting, defaultSort, type SortFilterItem } from '@/lib/constants';

interface SearchIndexItem {
  product: Product;
  searchText: string;
}

// Create a search index for faster text search
function createSearchIndex(product: Product): string {
  const searchableFields = [
    product.title,
    typeof product.description === 'string' ? product.description : '',
    product.brand && typeof product.brand === 'object' && 'name' in product.brand ? product.brand.name : '',
    product.category && typeof product.category === 'object' && 'name' in product.category ? product.category.name : '',
    ...(Array.isArray(product.tags) ? product.tags.map(t => 
      typeof t === 'object' && 'name' in t ? t.name : ''
    ) : [])
  ];
  return searchableFields.filter(Boolean).join(' ').toLowerCase();
}

interface UseClientFilteringResult {
  products: Product[];
  loading: boolean;
}

export function useClientFiltering(initialProducts: Product[]): UseClientFilteringResult {
  const [products] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  // Create a memoized search index
  const searchIndex = useMemo(() => 
    products.map(product => ({
      product,
      searchText: createSearchIndex(product)
    })), [products]);

  // Memoize the filter function to prevent unnecessary re-renders
  const applyFilters = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    
    // Get filter values
    const searchValue = params.get('q')?.toLowerCase() || '';
    const minPrice = parseFloat(params.get('minPrice') || '0');
    const maxPrice = parseFloat(params.get('maxPrice') || '999999');
    const brands = params.getAll('b');
    const category = params.get('c');
    const tag = params.get('t');
    const sort = params.get('sort') || '';

    try {
      // First apply text search using the index for better performance
      let filtered = searchValue 
        ? searchIndex.filter(({ searchText }) => searchText.includes(searchValue)).map(({ product }) => product)
        : products;

      // Then apply other filters
      filtered = filtered.filter(product => {
        const price = product.discountedPrice || product.originalPrice;
        const matchesPrice = price >= minPrice && price <= maxPrice;
        
        const matchesBrand = brands.length === 0 || 
          (product.brand && typeof product.brand === 'object' && 'slug' in product.brand && 
           brands.includes(product.brand.slug as string));
        
        const matchesCategory = !category || category === 'all' || 
          (product.category && typeof product.category === 'object' && 'slug' in product.category && 
           product.category.slug === category);
        
        const matchesTag = !tag || 
          (product.tags && Array.isArray(product.tags) && 
           product.tags.some(t => typeof t === 'object' && 'slug' in t && t.slug === tag));

        return matchesPrice && matchesBrand && matchesCategory && matchesTag;
      });

      // Apply sorting
      const sortOption = sorting.find(item => item.slug === sort) || defaultSort;
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortOption.sortKey) {
          case 'price':
            comparison = (a.discountedPrice || a.originalPrice) - (b.discountedPrice || b.originalPrice);
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          default:
            comparison = 0;
        }
        return sortOption.reverse ? -comparison : comparison;
      });

      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    const handleFilterChange = () => {
      applyFilters();
    };

    window.addEventListener('filterchange', handleFilterChange);
    window.addEventListener('popstate', handleFilterChange);
    
    // Apply initial filters
    applyFilters();
    
    return () => {
      window.removeEventListener('filterchange', handleFilterChange);
      window.removeEventListener('popstate', handleFilterChange);
    };
  }, [products, searchIndex]);

  return { products: filteredProducts, loading };
}
