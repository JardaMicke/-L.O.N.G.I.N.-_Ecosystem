/**
 * Image Optimizer
 * 
 * Utility for optimizing and efficiently loading images.
 * Provides lazy loading, progressive loading, and caching.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Image, Skeleton, Box } from '@chakra-ui/react';

// In-memory image cache
const imageCache = new Map();

/**
 * Check if an element is in viewport
 * @param {HTMLElement} el - Element to check
 * @param {number} offset - Offset to trigger earlier
 * @returns {boolean} Is in viewport
 */
const isInViewport = (el, offset = 0) => {
  if (!el) return false;
  
  const rect = el.getBoundingClientRect();
  return (
    rect.top - offset <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Pre-load an image
 * @param {string} src - Image source URL
 * @returns {Promise} Promise that resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      // Store in cache
      imageCache.set(src, img);
      resolve(img);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Optimize image URL based on device and size
 * @param {string} url - Original image URL
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, width, height) => {
  // For local images that go through backend, add optimization params
  if (url && url.startsWith('/')) {
    // Append optimization query params for backend processing
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&h=${height}&q=80`;
  }
  
  // Return original URL for external images
  return url;
};

/**
 * Clear image cache
 */
export const clearImageCache = () => {
  imageCache.clear();
};

/**
 * Optimized image component with lazy loading
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fallbackSrc,
  lazyLoad = true,
  progressiveLoad = true,
  ...props
}) => {
  const [loading, setLoading] = useState(lazyLoad);
  const [imageSrc, setImageSrc] = useState(
    progressiveLoad ? fallbackSrc || '' : src
  );
  const imageRef = useRef(null);
  
  // Load image when in viewport
  useEffect(() => {
    if (!lazyLoad) {
      setImageSrc(src);
      setLoading(false);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Element is in viewport, load the image
            if (progressiveLoad) {
              // Load high-quality image
              preloadImage(src)
                .then(() => {
                  setImageSrc(src);
                  setLoading(false);
                })
                .catch(error => {
                  console.error('Failed to load image:', error);
                  // Use fallback if available
                  if (fallbackSrc) {
                    setImageSrc(fallbackSrc);
                  }
                  setLoading(false);
                });
            } else {
              // Simple mode - just set the source
              setImageSrc(src);
              setLoading(false);
            }
            
            // Disconnect observer after load
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '200px 0px', // Load images 200px before they enter viewport
        threshold: 0.01 
      }
    );
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, fallbackSrc, lazyLoad, progressiveLoad]);
  
  // Optimize image URL if dimensions are provided
  const optimizedSrc = width && height 
    ? getOptimizedImageUrl(imageSrc, width, height) 
    : imageSrc;
  
  return (
    <Box ref={imageRef} position="relative" {...props}>
      {loading && (
        <Skeleton 
          height={height || '100%'} 
          width={width || '100%'} 
          startColor="gray.100" 
          endColor="gray.300"
          opacity={imageSrc ? 0.7 : 1}
          position={imageSrc ? 'absolute' : 'static'}
          top={0}
          left={0}
        />
      )}
      
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        opacity={loading ? 0.3 : 1}
        transition="opacity 0.3s ease"
        onLoad={() => setLoading(false)}
        onError={() => {
          if (fallbackSrc && imageSrc !== fallbackSrc) {
            setImageSrc(fallbackSrc);
          }
          setLoading(false);
        }}
        {...props}
      />
    </Box>
  );
};

export default {
  preloadImage,
  getOptimizedImageUrl,
  clearImageCache,
  OptimizedImage
};