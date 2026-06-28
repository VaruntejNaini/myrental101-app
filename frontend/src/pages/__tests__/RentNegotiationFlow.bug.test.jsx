/**
 * Bug Condition Exploration Tests — Rent Negotiation Flow Unification
 *
 * Property 1: Bug Condition — Rent Catalog Card Dead Button & Missing Negotiate Button
 *                           / Detail Page No Prompt
 *
 * CRITICAL: These tests MUST FAIL on unfixed code — failure confirms the bugs exist.
 * DO NOT modify any source files (RentCatalogPage.jsx, ProductDetailPage.jsx).
 *
 * These tests encode the EXPECTED (correct) behavior. They will pass once the
 * fix is applied.
 *
 * Counterexamples documented:
 *   Bug 1.1/1.2: ProductCard renders a single non-wired "Rent" button with no onClick;
 *                no "Negotiate" button exists anywhere in the card.
 *   Bug 1.3: RentCatalogPage has no userNegotiations state — "✓ Negotiation Sent"
 *            disabled state is never reachable.
 *   Bug 1.4: window.prompt is never invoked when the RENT detail-page negotiate button
 *            is clicked; POST fires immediately at product.rentalPrice instead.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Top-level mock for API — use mockImplementation per test
// ---------------------------------------------------------------------------
vi.mock('../../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    isCancel: vi.fn(() => false),
  },
}));

// ---------------------------------------------------------------------------
// Mock react-router-dom — useNavigate, useSearchParams, useParams
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'prod-rent-1' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// ---------------------------------------------------------------------------
// Mock sub-components used by RentCatalogPage
// ---------------------------------------------------------------------------
vi.mock('../../components/NotificationBell', () => ({ default: () => null }));
vi.mock('../../components/ChatBell', () => ({ default: () => null }));
vi.mock('../../components/PostProductModal', () => ({ default: () => null }));

// ---------------------------------------------------------------------------
// IntersectionObserver constructor mock (must be a constructor, not arrow fn)
// ---------------------------------------------------------------------------
beforeEach(() => {
  function MockIntersectionObserver(_callback) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  // Provide a token so components attempt to fetch /auth/me
  localStorage.setItem('token', 'mock-token');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Shared product fixture — non-owner, non-locked RENT product
// ---------------------------------------------------------------------------
const RENT_PRODUCT = {
  _id: 'prod-rent-1',
  title: 'Canon EOS R50 Camera',
  productType: 'RENT',
  status: 'ACTIVE',
  rentalPrice: 500,
  securityDeposit: 2000,
  category: 'Electronics',
  area: 'Hyderabad',
  city: 'Hyderabad',
  images: [],
  isRentedOrReserved: false,
  owner: { _id: 'owner-99', name: 'Some Owner' },
  location: { coordinates: [78.4, 17.4] },
};

// currentUser is different from product owner (non-owner scenario)
const CURRENT_USER = { _id: 'user-42', name: 'Test Buyer' };

// ---------------------------------------------------------------------------
// Helper: configure API mock for RentCatalogPage tests
// ---------------------------------------------------------------------------
function setupCatalogApiMock(API, products = [RENT_PRODUCT], extraTransactions = []) {
  API.get.mockImplementation((url) => {
    if (url.includes('/auth/me')) return Promise.resolve({ data: CURRENT_USER });
    // Must check bookmarks BEFORE generic /rent/products check
    if (url.includes('/rent/products/bookmarks/ids')) return Promise.resolve({ data: [] });
    if (url.includes('/rent/transactions')) return Promise.resolve({ data: extraTransactions });
    // Catalog page fetches: /rent/products?paginated=true&productType=RENT&...
    if (url.includes('/rent/products')) {
      return Promise.resolve({
        data: { products, totalPages: 1, totalCount: products.length }
      });
    }
    return Promise.resolve({ data: {} });
  });
}

// ---------------------------------------------------------------------------
// Helper: configure API mock for ProductDetailPage tests
// ---------------------------------------------------------------------------
function setupDetailApiMock(API, product = RENT_PRODUCT) {
  API.get.mockImplementation((url) => {
    if (url.includes('/auth/me')) return Promise.resolve({ data: CURRENT_USER });
    if (url.includes('/rent/transactions')) return Promise.resolve({ data: [] });
    // Single product fetch (matches /rent/products/prod-rent-1)
    if (url.match(/\/rent\/products\/[^?/]+$/)) {
      return Promise.resolve({ data: { product, auction: null } });
    }
    // Category list fetch (for similar products)
    if (url.includes('/rent/products')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: {} });
  });
}

// ---------------------------------------------------------------------------
// Test 1a — Dead Rent button
// ---------------------------------------------------------------------------

describe('Test 1a — Dead Rent button: ProductCard renders no wired onClick handlers', () => {
  /**
   * Render RentCatalogPage for a non-owner, non-locked RENT product
   * WITHOUT handleRentClick / handleNegotiationClick / userNegotiations being
   * passed to ProductCard (current unfixed state — no action props defined).
   *
   * Expected (correct) behavior: two buttons with onClick handlers exist.
   *
   * On UNFIXED code:
   *   - Only one "Rent" button is rendered (no onClick)
   *   - No "Negotiate" button exists
   *   → test FAILS confirming bugs 1.1 and 1.2
   *
   * Counterexample: { _id: 'prod-rent-1', rentalPrice: 500 } renders 1 button with
   * no onClick handler; 0 "Negotiate" buttons.
   */
  it('should render two action buttons (Rent + Negotiate) with onClick handlers for a non-owner non-locked product', async () => {
    const API = (await import('../../api')).default;
    setupCatalogApiMock(API);

    const { default: RentCatalogPage } = await import('../RentCatalogPage');

    await act(async () => {
      render(
        <MemoryRouter>
          <RentCatalogPage />
        </MemoryRouter>
      );
    });

    // Wait for product card to appear
    await waitFor(
      () => expect(screen.queryByText('Canon EOS R50 Camera')).not.toBeNull(),
      { timeout: 8000 }
    );

    // Find the Rent button in the card action area
    const rentButtons = screen.getAllByRole('button', { name: /^Rent$/i });
    expect(rentButtons.length, 'Expected at least one "Rent" button').toBeGreaterThan(0);
    const rentButton = rentButtons[0];

    // ASSERTION: Rent button must have an onClick handler (wired)
    // On unfixed code, the onClick property is null → test FAILS (Bug 1.1)
    expect(
      rentButton.onclick !== null && rentButton.onclick !== undefined,
      'Bug 1.1: "Rent" button has no onClick handler (dead button) — ' +
      'counterexample: { _id: "prod-rent-1", rentalPrice: 500 } renders dead Rent button'
    ).toBe(true);

    // ASSERTION: A "Negotiate" button must exist
    // On unfixed code, no Negotiate button → test FAILS (Bug 1.2)
    const negotiateButton = screen.queryByRole('button', { name: /^Negotiate$/i });
    expect(
      negotiateButton,
      'Bug 1.2: No "Negotiate" button rendered for a non-owner, non-locked RENT product — ' +
      'counterexample: { _id: "prod-rent-1", rentalPrice: 500 } has 0 Negotiate buttons'
    ).not.toBeNull();
  }, 20000);
});

// ---------------------------------------------------------------------------
// Test 1b — PBT: No onClick and no Negotiate for any valid RENT product
// ---------------------------------------------------------------------------

describe('Test 1b — PBT: For any valid RENT product, two wired action buttons must exist', () => {
  /**
   * **Validates: Requirements 1.1, 1.2**
   *
   * Using fast-check, generate random { rentalPrice, securityDeposit, title } objects.
   * For each, render RentCatalogPage (mocked API) without action props wired.
   * Assert two buttons with onClick handlers are present.
   *
   * On UNFIXED code: only one dead "Rent" button rendered — test FAILS for every input.
   *
   * Counterexample: { rentalPrice: 500, securityDeposit: 200, title: "Camera" }
   *   → renders 1 button with no onClick, 0 "Negotiate" buttons
   */
  it('property: for all valid RENT products, ProductCard renders two wired action buttons', async () => {
    const API = (await import('../../api')).default;
    const { default: RentCatalogPage } = await import('../RentCatalogPage');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          rentalPrice: fc.integer({ min: 100, max: 50000 }),
          securityDeposit: fc.integer({ min: 0, max: 20000 }),
          // Use simple alphanumeric titles to avoid rendering edge cases
          title: fc.constantFrom(
            'Canon Camera Rent',
            'Honda Scooter',
            'Gaming Console',
            'Power Drill Set',
            'Travel Guitar'
          ),
        }),
        async ({ rentalPrice, securityDeposit, title }) => {
          const product = {
            ...RENT_PRODUCT,
            _id: `prod-pbt-${rentalPrice}`,
            title,
            rentalPrice,
            securityDeposit,
          };

          setupCatalogApiMock(API, [product]);

          await act(async () => {
            render(
              <MemoryRouter>
                <RentCatalogPage />
              </MemoryRouter>
            );
          });

          await waitFor(
            () => expect(screen.queryByText(title)).not.toBeNull(),
            { timeout: 8000 }
          );

          // Assert: "Rent" button with onClick handler exists
          const rentButtons = screen.getAllByRole('button', { name: /^Rent$/i });
          const rentButton = rentButtons[0];
          const hasRentOnClick = rentButton.onclick !== null && rentButton.onclick !== undefined;

          expect(
            hasRentOnClick,
            `Bug 1.1 counterexample: { rentalPrice: ${rentalPrice}, securityDeposit: ${securityDeposit}, title: "${title}" } — "Rent" button has no onClick handler`
          ).toBe(true);

          // Assert: "Negotiate" button exists
          const negotiateButton = screen.queryByRole('button', { name: /^Negotiate$/i });
          expect(
            negotiateButton,
            `Bug 1.2 counterexample: { rentalPrice: ${rentalPrice}, securityDeposit: ${securityDeposit}, title: "${title}" } — no "Negotiate" button rendered`
          ).not.toBeNull();

          cleanup();
          vi.clearAllMocks();
        }
      ),
      { numRuns: 3, seed: 42 }
    );
  }, 120000);
});

// ---------------------------------------------------------------------------
// Test 1c — No userNegotiations tracking
// ---------------------------------------------------------------------------

describe('Test 1c — No userNegotiations state: disabled "✓ Negotiation Sent" state is unreachable', () => {
  /**
   * **Validates: Requirement 1.3**
   *
   * Render RentCatalogPage with /rent/transactions returning a PENDING_NEGOTIATION
   * transaction for the displayed product. Assert that a disabled
   * "✓ Negotiation Sent" button state is reachable.
   *
   * On UNFIXED code: RentCatalogPage has no userNegotiations state and never
   * fetches /rent/transactions, so the "✓ Negotiation Sent" button never appears
   * — test FAILS confirming bug 1.3.
   *
   * Counterexample: After /rent/transactions returns { product: 'prod-rent-1',
   * borrower: 'user-42', status: 'PENDING_NEGOTIATION' }, the "Negotiate" button
   * should read "✓ Negotiation Sent" (disabled) — but never does in unfixed code.
   */
  it('should show a disabled "✓ Negotiation Sent" button when user has an active negotiation for a product', async () => {
    const API = (await import('../../api')).default;

    const mockTransaction = {
      _id: 'tx-1',
      product: { _id: 'prod-rent-1' },
      borrower: { _id: 'user-42' },
      status: 'PENDING_NEGOTIATION',
    };

    setupCatalogApiMock(API, [RENT_PRODUCT], [mockTransaction]);

    const { default: RentCatalogPage } = await import('../RentCatalogPage');

    await act(async () => {
      render(
        <MemoryRouter>
          <RentCatalogPage />
        </MemoryRouter>
      );
    });

    // Wait for product card to appear
    await waitFor(
      () => expect(screen.queryByText('Canon EOS R50 Camera')).not.toBeNull(),
      { timeout: 8000 }
    );

    // Allow time for async /rent/transactions to resolve and state to update
    await act(async () => {
      await new Promise((r) => setTimeout(r, 500));
    });

    // ASSERTION: "✓ Negotiation Sent" disabled button should be visible
    // On UNFIXED code: userNegotiations state doesn't exist → button never shown → FAILS
    const negotiationSentButton = screen.queryByRole('button', { name: /✓ Negotiation Sent/i });
    expect(
      negotiationSentButton,
      'Bug 1.3: "✓ Negotiation Sent" disabled state unreachable — ' +
      'userNegotiations state does not exist in RentCatalogPage; ' +
      '/rent/transactions is never fetched to populate it'
    ).not.toBeNull();

    // Also assert it's disabled when found
    if (negotiationSentButton) {
      expect(negotiationSentButton).toBeDisabled();
    }
  }, 20000);
});

// ---------------------------------------------------------------------------
// Test 1d — Detail page: window.prompt NOT called on negotiate click
// ---------------------------------------------------------------------------

describe('Test 1d — Detail page: window.prompt IS called when RENT negotiate button is clicked', () => {
  /**
   * **Validates: Requirement 1.4**
   *
   * Render ProductDetailPage for a RENT product. Spy on window.prompt.
   * Simulate a click on "💬 Propose Custom Price Negotiation".
   * Assert window.prompt WAS called (this encodes expected behavior).
   *
   * On UNFIXED code:
   *   handleNegotiateClick POSTs directly at product.rentalPrice with no prompt.
   *   window.prompt is never called → test FAILS confirming bug 1.4.
   *
   * Counterexample: "window.prompt not invoked; POST fired immediately with
   * listed rentalPrice (500) instead of a user-entered custom rate"
   */
  it('should call window.prompt when the RENT negotiate button is clicked', async () => {
    const API = (await import('../../api')).default;
    setupDetailApiMock(API);

    // Spy on window.prompt — return a value so handleNegotiateClick doesn't short-circuit
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('350');

    const { default: ProductDetailPage } = await import('../ProductDetailPage');

    await act(async () => {
      render(
        <MemoryRouter>
          <ProductDetailPage />
        </MemoryRouter>
      );
    });

    // Wait for the product to load and the negotiate button to appear
    await waitFor(
      () => expect(screen.queryByText(/Propose Custom Price Negotiation/i)).not.toBeNull(),
      { timeout: 8000 }
    );

    const negotiateButton = screen.getByText(/💬 Propose Custom Price Negotiation/i);

    // Click the negotiate button
    await act(async () => {
      fireEvent.click(negotiateButton);
    });

    // ASSERTION: window.prompt MUST have been called
    // On UNFIXED code: prompt is never called → test FAILS confirming bug 1.4
    expect(
      promptSpy,
      'Bug 1.4 counterexample: window.prompt not invoked; ' +
      'POST fired immediately with listed rentalPrice (500) instead of user-entered custom rate. ' +
      'handleNegotiateClick in ProductDetailPage calls API.post directly without window.prompt'
    ).toHaveBeenCalled();

    promptSpy.mockRestore();
  }, 20000);
});
