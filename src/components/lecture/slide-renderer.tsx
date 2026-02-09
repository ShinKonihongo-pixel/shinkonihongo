// Slide renderer component for displaying slide content

import { useEffect, useState, useRef } from 'react';
import { convertFuriganaToRuby, removeFurigana } from '../../lib/furigana-utils';
import type { Slide, SlideElement, SlideAnimation, SlideTransition } from '../../types/lecture';

interface SlideRendererProps {
  slide: Slide;
  isPresenting?: boolean;
  slideKey?: string | number; // Used to trigger transition animation on slide change
  showFurigana?: boolean; // Toggle furigana display (default: true)
}

interface ElementRendererProps {
  element: SlideElement;
  showFurigana?: boolean;
}

function ElementRenderer({ element, showFurigana = true }: ElementRendererProps) {
  // Base styles for all elements
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    width: `${element.position.width}%`,
    height: `${element.position.height}%`,
    opacity: element.style?.opacity ? parseFloat(element.style.opacity) : 1,
    borderWidth: element.style?.borderWidth,
    borderStyle: element.style?.borderStyle as React.CSSProperties['borderStyle'],
    borderColor: element.style?.borderColor,
    borderRadius: element.style?.borderRadius,
    boxSizing: 'border-box',
  };

  // Text-specific styles
  const textStyle: React.CSSProperties = {
    ...baseStyle,
    fontSize: element.style?.fontSize,
    fontWeight: element.style?.fontWeight,
    fontStyle: element.style?.fontStyle as React.CSSProperties['fontStyle'],
    textDecoration: element.style?.textDecoration as React.CSSProperties['textDecoration'],
    color: element.style?.color,
    textAlign: element.style?.textAlign as React.CSSProperties['textAlign'],
    lineHeight: element.style?.lineHeight,
    fontFamily: element.style?.fontFamily,
    // Box background for text boxes
    backgroundColor: element.style?.boxBackground && element.style.boxBackground !== 'transparent'
      ? element.style.boxBackground
      : element.style?.backgroundColor,
    padding: element.style?.padding,
  };

  switch (element.type) {
    case 'text': {
      // Convert content based on showFurigana setting
      const displayContent = showFurigana
        ? convertFuriganaToRuby(element.content)
        : removeFurigana(element.content);
      return (
        <div className="slide-element slide-element-text" style={textStyle}>
          <div dangerouslySetInnerHTML={{ __html: displayContent.replace(/\n/g, '<br/>') }} />
        </div>
      );
    }

    case 'shape': {
      const shapeType = element.content || 'rectangle';
      const shapeStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: element.style?.backgroundColor || '#3498db',
        borderRadius: element.style?.borderRadius || (shapeType === 'circle' ? '50%' : '0'),
      };

      // Arrow head for arrow shape
      if (shapeType === 'arrow') {
        return (
          <div className="slide-element slide-element-shape" style={{...shapeStyle, overflow: 'visible'}}>
            <div
              style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderLeft: `12px solid ${element.style?.backgroundColor || '#000'}`,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
              }}
            />
          </div>
        );
      }

      return <div className="slide-element slide-element-shape" style={shapeStyle} />;
    }

    case 'image':
      return (
        <div className="slide-element slide-element-image" style={baseStyle}>
          <img
            src={element.content}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      );

    case 'video':
      return (
        <div className="slide-element slide-element-video" style={baseStyle}>
          <video
            src={element.content}
            controls
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      );

    case 'audio':
      return (
        <div className="slide-element slide-element-audio" style={baseStyle}>
          <audio src={element.content} controls style={{ width: '100%' }} />
        </div>
      );

    case 'flashcard':
      return (
        <div className="slide-element slide-element-flashcard" style={baseStyle}>
          <div className="embedded-flashcard">
            Flashcard ID: {element.content}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Helper function to get animation class name
function getAnimationClass(animation: SlideAnimation | undefined): string {
  if (!animation || animation === 'none') return '';
  return `slide-animation-${animation}`;
}

// Helper function to get transition class name
function getTransitionClass(transition: SlideTransition | undefined): string {
  if (!transition || transition === 'none') return '';
  return `slide-transition-${transition}`;
}

export function SlideRenderer({ slide, isPresenting = false, slideKey, showFurigana = true }: SlideRendererProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevKeyRef = useRef(slideKey);

  // Trigger animation when slide changes
  useEffect(() => {
    if (slideKey !== prevKeyRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true);
      prevKeyRef.current = slideKey;

      // Reset animation state after animation completes
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, (slide.animationDuration || 500) + 100);

      return () => clearTimeout(timeout);
    }
  }, [slideKey, slide.animationDuration]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: slide.backgroundColor || '#ffffff',
    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    '--animation-duration': `${slide.animationDuration || 500}ms`,
    '--transition-duration': `${slide.animationDuration || 500}ms`,
  } as React.CSSProperties;

  // Layout-specific rendering
  const renderLayout = () => {
    switch (slide.layout) {
      case 'title':
        return (
          <div className="slide-layout slide-layout-title">
            {slide.title && <h1 className="slide-main-title">{slide.title}</h1>}
            {slide.elements.map((element) => (
              <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
            ))}
          </div>
        );

      case 'two-column':
        return (
          <div className="slide-layout slide-layout-two-column">
            {slide.title && <h2 className="slide-title">{slide.title}</h2>}
            <div className="slide-columns">
              <div className="slide-column slide-column-left">
                {slide.elements
                  .filter((_, i) => i % 2 === 0)
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
                  ))}
              </div>
              <div className="slide-column slide-column-right">
                {slide.elements
                  .filter((_, i) => i % 2 === 1)
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
                  ))}
              </div>
            </div>
          </div>
        );

      case 'image-left':
        return (
          <div className="slide-layout slide-layout-image-left">
            {slide.title && <h2 className="slide-title">{slide.title}</h2>}
            <div className="slide-content-split">
              <div className="slide-image-area">
                {slide.elements
                  .filter((e) => e.type === 'image')
                  .slice(0, 1)
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
                  ))}
              </div>
              <div className="slide-text-area">
                {slide.elements
                  .filter((e) => e.type !== 'image')
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
                  ))}
              </div>
            </div>
          </div>
        );

      case 'image-right':
        return (
          <div className="slide-layout slide-layout-image-right">
            {slide.title && <h2 className="slide-title">{slide.title}</h2>}
            <div className="slide-content-split">
              <div className="slide-text-area">
                {slide.elements
                  .filter((e) => e.type !== 'image')
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
                  ))}
              </div>
              <div className="slide-image-area">
                {slide.elements
                  .filter((e) => e.type === 'image')
                  .slice(0, 1)
                  .map((element) => (
                    <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
                  ))}
              </div>
            </div>
          </div>
        );

      case 'full-media':
        return (
          <div className="slide-layout slide-layout-full-media">
            {slide.elements.map((element) => (
              <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
            ))}
          </div>
        );

      case 'content':
      default:
        return (
          <div className="slide-layout slide-layout-content">
            {slide.title && <h2 className="slide-title">{slide.title}</h2>}
            <div className="slide-body">
              {slide.elements.map((element) => (
                <ElementRenderer key={element.id} element={element} showFurigana={showFurigana} />
              ))}
            </div>
          </div>
        );
    }
  };

  // Build class names for animations
  const transitionClass = isAnimating ? getTransitionClass(slide.transition) : '';
  const animationClass = isAnimating ? getAnimationClass(slide.animation) : '';

  return (
    <div
      className={`slide-container ${isPresenting ? 'presenting' : ''} ${transitionClass}`}
      style={containerStyle}
      key={slideKey}
    >
      <div className={`slide-content-wrapper ${animationClass}`}>
        {renderLayout()}
      </div>
    </div>
  );
}
