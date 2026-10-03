import React, { useRef, useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

/**
 * Accessible, MANUAL hero image carousel (no auto-play, no library).
 *
 * The slide changes only when the user:
 *   - clicks the previous/next buttons,
 *   - clicks a dot,
 *   - swipes horizontally on touch (threshold 40px), or
 *   - presses Left/Right while the carousel has focus.
 * Navigation loops: next on the last slide wraps to the first (and vice-versa).
 *
 * With a single slide it renders exactly like the original static hero figure
 * (no arrows, no dots).
 */
export default function HeroCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);

  const count = slides.length;

  // Single slide (or none): behave exactly like the original static figure.
  if (count <= 1) {
    const only = slides[0];
    if (!only) return null;
    return (
      <figure className="sf-hero__figure">
        <img className="sf-hero__img" src={only.src} alt={only.alt} />
        <figcaption className="sf-hero__caption">{only.caption}</figcaption>
      </figure>
    );
  }

  const goTo = (i) => setIndex(((i % count) + count) % count);
  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    // Only treat it as a swipe when it is clearly horizontal and past 40px.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  return (
    <figure
      className="sf-hero__figure sf-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Population Office programs and community activities"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className="sf-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={`${slide.src}-${i}`}
            className={`sf-carousel__slide${i === index ? ' is-active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index || undefined}
          >
            <img
              className="sf-carousel__img"
              src={slide.src}
              alt={slide.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        <button
          type="button"
          className="sf-carousel__nav sf-carousel__nav--prev"
          aria-label="Previous slide"
          onClick={goPrev}
        >
          <IconChevronLeft size={24} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="sf-carousel__nav sf-carousel__nav--next"
          aria-label="Next slide"
          onClick={goNext}
        >
          <IconChevronRight size={24} aria-hidden="true" />
        </button>
      </div>

      <div className="sf-carousel__dots">
        {slides.map((slide, i) => (
          <button
            key={`dot-${i}`}
            type="button"
            className={`sf-carousel__dot${i === index ? ' is-active' : ''}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </figure>
  );
}
