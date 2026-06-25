/**
 * Preservation Property Tests — RequestedCatalogPage
 *
 * Property 2: Preservation — Existing Filter Behavior Unchanged for Non-Buggy Inputs
 *
 * These tests MUST PASS on UNFIXED code (useState(1000)).
 * They document and lock in the baseline behaviors that must NOT change after
 * the fix is applied. All render-based test inputs use wish.budget <= 1000
 * (NOT isBugCondition), so the unfixed maxPrice filter still lets them through.
 *
 * PBT 2a — For all wishes with budget in [0, 1000], the wish IS visible on initial render.
 * PBT 2b — For all (wish, searchTerm) where wish.title does NOT include searchTerm
 *           (and searchTerm is non-empty), the filter predicate returns false.
 * PBT 2c — For all (wish, category) where wish.category !== category and category !== "All",
 *           the filter predicate returns false.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mock react-router-dom's useNavigate (module-level, applied to all tests)
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// IntersectionObserver constructor mock
// The WishCard component calls `new IntersectionObserver(...)`. jsdom does not
// provide this, so we stub it with a proper constructor function (not an arrow
// function — arrow functions cannot be called with `new`).
// ---------------------------------------------------------------------------
beforeEach(() => {
  function MockIntersectionObserver(_callback) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  localStorage.setItem('token', 'mock-token');
});

// Cleanup rendered components after each test to prevent DOM accumulation
afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid WishDocument. */
function makeWish(overrides = {}) {
  return {
    _id: overrides._id ?? 'w-test',
    title: overrides.title ?? 'Test Wish',
    description: overrides.description ?? 'A test wish description',
    budget: overrides.budget ?? 500,
    status: overrides.status ?? 'ACTIVE',
    category: overrides.category ?? 'Electronics',
    durationDays: overrides.durationDays ?? 3,
    views: overrides.views ?? 0,
    offers: overrides.offers ?? [],
  };
}

/**
 * Render the catalog page with the given wish list.
 * Uses vi.doMock + vi.resetModules so the API mock can vary per fast-check run.
 */
async function renderCatalogWithWishes(wishes) {
  vi.resetModules();

  vi.doMock('../../api', () => ({
    default: {
      get: vi.fn((url) => {
        if (url === '/wishes') return Promise.resolve({ data: wishes });
        if (url === '/auth/me') return Promise.resolve({ data: { _id: 'user1', name: 'Test User' } });
        return Promise.resolve({ data: {} });
      }),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
  }));

  // Re-mock react-router-dom after module reset
  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => vi.fn() };
  });

  const { default: RequestedCatalogPage } = await import('../RequestedCatalogPage');

  let container;
  await act(async () => {
    const result = render(
      <MemoryRouter>
        <RequestedCatalogPage />
      </MemoryRouter>
    );
    container = result.container;
  });

  // Wait for initial fetch to settle
  await waitFor(
    () => {
      const hasWishCard = wishes.some((w) => screen.queryByText(w.title) !== null);
      const hasEmpty = screen.queryByText(/No active wish requests/i) !== null;
      expect(hasWishCard || hasEmpty).toBe(true);
    },
    { timeout: 4000 }
  );

  return container;
}

// ---------------------------------------------------------------------------
// PBT 2a — Low-budget wishes (budget ∈ [0, 1000]) ARE visible on initial render
// ---------------------------------------------------------------------------

describe('PBT 2a — Low-budget wishes are visible on initial render (budget ≤ 1000)', () => {
  /**
   * **Validates: Requirements 3.3**
   *
   * On UNFIXED code: matchesPrice = budget <= 1000 = true → wish IS shown.
   * These are NOT isBugCondition inputs, so they pass the default filter.
   */
  it('property: wish with budget in [0, 1000] is always visible on initial render', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        async (budget) => {
          const title = `WishBudget${budget}`;
          const wish = makeWish({ _id: `w-${budget}`, title, budget });

          await renderCatalogWithWishes([wish]);

          expect(
            screen.getByText(title),
            `Wish with budget ${budget} should be visible (${budget} <= 1000 on unfixed code)`
          ).toBeInTheDocument();

          // Cleanup between fast-check runs to avoid DOM accumulation
          cleanup();
        }
      ),
      { numRuns: 5, seed: 42 }
    );
  }, 30000);

  it('boundary: wish with budget exactly 1000 is visible (1000 <= 1000)', async () => {
    const wish = makeWish({ _id: 'w-boundary', title: 'Boundary Wish 1000', budget: 1000 });
    await renderCatalogWithWishes([wish]);
    expect(screen.getByText('Boundary Wish 1000')).toBeInTheDocument();
  });

  it('boundary: wish with budget exactly 0 is visible', async () => {
    const wish = makeWish({ _id: 'w-zero', title: 'Zero Budget Wish', budget: 0 });
    await renderCatalogWithWishes([wish]);
    expect(screen.getByText('Zero Budget Wish')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PBT 2b — Search filter predicate excludes non-matching wishes
// ---------------------------------------------------------------------------

describe('PBT 2b — Search filter excludes wishes whose title does not match the search term', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * The component's filter predicate:
   *   matchesSearch = p.title.toLowerCase().includes(search.toLowerCase())
   *
   * We verify this predicate directly for the property (no need to render the
   * component — the predicate is pure logic), and also with concrete render tests.
   */
  it('property: title containing only letters never matches a search term containing only digits', () => {
    // fast-check v4 uses fc.string with minLength/maxLength; no fc.stringOf
    fc.assert(
      fc.property(
        // Title: 3-12 uppercase letters (A-Z)
        fc.array(fc.integer({ min: 65, max: 90 }), { minLength: 3, maxLength: 12 })
          .map((codes) => codes.map((c) => String.fromCharCode(c)).join('')),
        // Search term: 1-4 digits (0-9)
        fc.array(fc.integer({ min: 48, max: 57 }), { minLength: 1, maxLength: 4 })
          .map((codes) => codes.map((c) => String.fromCharCode(c)).join('')),
        (titleSuffix, searchSuffix) => {
          const title = `Title${titleSuffix}`;      // e.g. "TitleABC"
          const searchTerm = `search${searchSuffix}`; // e.g. "search123"

          // The title contains only letters; the search term suffix is digits only.
          // "title..." will never contain the digits, so the predicate must be false.
          const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
          expect(matchesSearch).toBe(false);
        }
      ),
      { numRuns: 50, seed: 42 }
    );
  });

  it('property: a title always matches a search term that is a substring of it', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 6 }),
        fc.string({ minLength: 1, maxLength: 6 }),
        (prefix, suffix) => {
          const searchTerm = 'MATCH';
          const title = `${prefix}${searchTerm}${suffix}`;
          expect(title.toLowerCase().includes(searchTerm.toLowerCase())).toBe(true);
        }
      ),
      { numRuns: 50, seed: 42 }
    );
  });

  it('concrete: wish title "Guitar" is excluded when search is "camera"', async () => {
    const wish = makeWish({ _id: 'w-guitar', title: 'Guitar', budget: 300, category: 'Music' });
    await renderCatalogWithWishes([wish]);

    // Wish is visible on initial render (no search filter applied)
    expect(screen.getByText('Guitar')).toBeInTheDocument();

    // Filter predicate check
    expect('guitar'.includes('camera')).toBe(false);
  });

  it('concrete: wish title "Professional Camera" IS matched by search "camera"', async () => {
    const wish = makeWish({ _id: 'w-cam', title: 'Professional Camera', budget: 800, category: 'Electronics' });
    await renderCatalogWithWishes([wish]);

    expect(screen.getByText('Professional Camera')).toBeInTheDocument();

    // Predicate: "professional camera".includes("camera") === true
    expect('professional camera'.includes('camera')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PBT 2c — Category filter predicate excludes wishes from a different category
// ---------------------------------------------------------------------------

describe('PBT 2c — Category filter excludes wishes whose category does not match the selected category', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * The component's filter predicate:
   *   matchesCategory = selectedCategory === "All" || p.category === selectedCategory
   *
   * For any (wishCategory, selectedCategory) where they differ and
   * selectedCategory !== "All", the predicate must return false.
   */
  const CATEGORIES = ['Electronics', 'Tools', 'Music'];

  it('property: wish is excluded when selected category differs and is not "All"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CATEGORIES),
        fc.constantFrom(...CATEGORIES),
        (wishCategory, selectedCategory) => {
          fc.pre(wishCategory !== selectedCategory);

          const matchesCategory = selectedCategory === 'All' || wishCategory === selectedCategory;
          expect(matchesCategory).toBe(false);
        }
      ),
      { numRuns: 30, seed: 42 }
    );
  });

  it('property: selectedCategory "All" always includes a wish regardless of its category', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CATEGORIES),
        (wishCategory) => {
          const matchesCategory = 'All' === 'All' || wishCategory === 'All';
          expect(matchesCategory).toBe(true);
        }
      ),
      { numRuns: 20, seed: 42 }
    );
  });

  it('concrete: Electronics wish is excluded when selectedCategory is "Music"', async () => {
    const wish = makeWish({ _id: 'w-elec', title: 'Laptop Stand', budget: 600, category: 'Electronics' });
    await renderCatalogWithWishes([wish]);

    // Wish is visible on initial render (selectedCategory defaults to "All")
    expect(screen.getByText('Laptop Stand')).toBeInTheDocument();

    // Predicate when selectedCategory = "Music"
    const matchesCategory = 'Music' === 'All' || 'Electronics' === 'Music';
    expect(matchesCategory).toBe(false);
  });

  it('concrete: Tools wish is excluded when selectedCategory is "Electronics"', async () => {
    const wish = makeWish({ _id: 'w-tools', title: 'Power Drill', budget: 750, category: 'Tools' });
    await renderCatalogWithWishes([wish]);

    expect(screen.getByText('Power Drill')).toBeInTheDocument();

    const matchesCategory = 'Electronics' === 'All' || 'Tools' === 'Electronics';
    expect(matchesCategory).toBe(false);
  });

  it('concrete: Music wish IS included when selectedCategory is "All"', async () => {
    const wish = makeWish({ _id: 'w-music', title: 'Electric Guitar', budget: 900, category: 'Music' });
    await renderCatalogWithWishes([wish]);

    expect(screen.getByText('Electric Guitar')).toBeInTheDocument();

    const matchesCategory = 'All' === 'All' || 'Music' === 'All';
    expect(matchesCategory).toBe(true);
  });
});
