/**
 * Bug Condition Exploration Test — RequestedCatalogPage
 *
 * Property 1: Bug Condition — High-Budget Wish Excluded on Initial Load
 *
 * CRITICAL: This test MUST FAIL on unfixed code (useState(1000)).
 * Failure here confirms the bug exists: wishes with budget > 1000 are
 * silently excluded by the hardcoded maxPrice filter on initial render.
 *
 * This test encodes the EXPECTED (correct) behavior. It will pass once
 * the fix is applied (useState(Infinity)).
 *
 * Counterexample documented:
 *   "Wish { _id: 'w1', budget: 2500 } missing from catalog on initial render"
 *   "Wish { _id: 'w2', budget: 1001 } missing from catalog on initial render"
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock the API module — intercept all API.get / API.post / API.delete calls
// ---------------------------------------------------------------------------
vi.mock('../../api', () => {
  const mockWishes = [
    {
      _id: 'w1',
      title: 'Professional Camera',
      description: 'Need a DSLR for a shoot',
      budget: 2500,
      status: 'ACTIVE',
      category: 'Electronics',
      durationDays: 3,
      views: 0,
      offers: [],
    },
    {
      _id: 'w2',
      title: 'Edge Case Lens',
      description: 'Excluded by exactly one rupee on unfixed code',
      budget: 1001,
      status: 'ACTIVE',
      category: 'Electronics',
      durationDays: 2,
      views: 0,
      offers: [],
    },
  ];

  return {
    default: {
      get: vi.fn((url) => {
        if (url === '/wishes') return Promise.resolve({ data: mockWishes });
        if (url === '/auth/me') return Promise.resolve({ data: { _id: 'user1', name: 'Test User' } });
        return Promise.resolve({ data: {} });
      }),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock react-router-dom's useNavigate (called inside the component)
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock IntersectionObserver (not available in jsdom)
// ---------------------------------------------------------------------------
beforeEach(() => {
  function MockIntersectionObserver(_callback) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  // Provide a token so the component attempts to fetch /auth/me
  localStorage.setItem('token', 'mock-token');
});

// ---------------------------------------------------------------------------
// Helper: render the component inside a MemoryRouter and wait for data
// ---------------------------------------------------------------------------
async function renderCatalogPage() {
  const { default: RequestedCatalogPage } = await import('../RequestedCatalogPage');
  render(
    <MemoryRouter>
      <RequestedCatalogPage />
    </MemoryRouter>
  );

  // Wait for the async /wishes fetch to complete and DOM to update
  await waitFor(() => {
    // The component shows "No active wish requests match your filters." when
    // filteredRequests is empty — OR it renders wish cards.
    // Either way, the loading phase is done once the initial fetch settles.
    expect(screen.queryByText(/No active wish requests|Professional Camera|Edge Case Lens/i)).not.toBeNull();
  }, { timeout: 3000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Bug Condition: High-Budget Wish Excluded on Initial Load', () => {
  /**
   * Property 1a — Wish with budget: 2500 IS visible in the catalog on initial render.
   *
   * On UNFIXED code (useState(1000)):
   *   matchesPrice = 2500 <= 1000 = false → wish excluded → test FAILS ✗
   *
   * Counterexample: "Wish { _id: 'w1', budget: 2500 } missing from catalog on initial render"
   */
  it('wish with budget 2500 should be visible in the catalog on initial render', async () => {
    await renderCatalogPage();

    expect(
      screen.getByText('Professional Camera'),
      'Wish { _id: "w1", budget: 2500 } missing from catalog on initial render'
    ).toBeInTheDocument();
  });

  /**
   * Property 1b — Wish with budget: 1001 IS visible in the catalog on initial render.
   * (Edge case — excluded by exactly one rupee on unfixed code)
   *
   * On UNFIXED code (useState(1000)):
   *   matchesPrice = 1001 <= 1000 = false → wish excluded → test FAILS ✗
   *
   * Counterexample: "Wish { _id: 'w2', budget: 1001 } missing from catalog on initial render"
   */
  it('wish with budget 1001 (edge case) should be visible in the catalog on initial render', async () => {
    await renderCatalogPage();

    expect(
      screen.getByText('Edge Case Lens'),
      'Wish { _id: "w2", budget: 1001 } missing from catalog on initial render'
    ).toBeInTheDocument();
  });
});
