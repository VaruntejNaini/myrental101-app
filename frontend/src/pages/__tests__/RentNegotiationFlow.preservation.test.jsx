/**
 * Preservation Property Tests — Rent Negotiation Flow
 *
 * Property 3: Preservation — Non-Bug-Condition Inputs Produce Unchanged Behavior
 *
 * These tests MUST PASS on UNFIXED code.
 * They observe and lock in the baseline behaviors that must NOT change after
 * the fix is applied. All tests use inputs where the bug condition does NOT
 * hold: locked cards, owner cards, second-hand paths, and the RENT "Rent Now"
 * (handleAction) button.
 *
 * PBT 2a — Locked card always shows "Temporarily Unavailable" (no Rent/Negotiate)
 * PBT 2b — Owner card always shows "Your Listing" (SecondHandCatalogPage)
 * Test 2c — Card body navigation preserved: click body → navigate(`/product/:id`)
 * Test 2d — SecondHandCatalogPage Buy+Negotiate layout untouched
 * Test 2e — SECOND_HAND detail page negotiate uses window.prompt
 * Test 2f — RENT handleAction (Rent Now) POSTs at listed price (not prompted)
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// IntersectionObserver + geolocation mocks (applied before each test).
// Geolocation must immediately fire the error callback to prevent act() hangs.
// IntersectionObserver must be a proper constructor function (not arrow fn).
// ---------------------------------------------------------------------------
beforeEach(() => {
  // Constructor-style IntersectionObserver mock
  function MockIntersectionObserver(_callback) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  // Geolocation mock: immediately calls error callback so act() doesn't hang
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: {
      getCurrentPosition: vi.fn((_success, error) => {
        error(new Error('Geolocation not available in test env'));
      }),
    },
  });

  localStorage.setItem('token', 'mock-token');
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid RENT product */
function makeRentProduct(overrides = {}) {
  return {
    _id: 'prod-test',
    title: 'Test Rental Product',
    rentalPrice: 500,
    securityDeposit: 200,
    productType: 'RENT',
    status: 'ACTIVE',
    isRentedOrReserved: false,
    owner: { _id: 'owner-1', name: 'Test Owner' },
    images: [],
    area: 'Test Area',
    category: 'Electronics',
    description: 'A test product',
    location: { coordinates: [0, 0] },
    ...overrides,
  };
}

/** Build a minimal valid SECOND_HAND product */
function makeSecondHandProduct(overrides = {}) {
  return {
    _id: 'sh-test',
    title: 'Test Second-Hand Product',
    rentalPrice: 3000,
    securityDeposit: 0,
    productType: 'SECOND_HAND',
    status: 'ACTIVE',
    isRentedOrReserved: false,
    owner: { _id: 'owner-1', name: 'Test Owner' },
    images: [],
    area: 'Test Area',
    category: 'Electronics',
    description: 'A test product',
    location: { coordinates: [0, 0] },
    ...overrides,
  };
}

/**
 * Render RentCatalogPage with a given product list + currentUser.
 * Uses vi.resetModules + vi.doMock so each test gets fresh module state.
 * Returns { mockNavigate }.
 */
async function renderRentCatalogWithProducts(products, currentUser) {
  vi.resetModules();

  const mockNavigate = vi.fn();

  vi.doMock('../../api', () => ({
    default: {
      get: vi.fn((url) => {
        if (url.includes('/rent/products/bookmarks/ids')) return Promise.resolve({ data: [] });
        if (url === '/rent/transactions') return Promise.resolve({ data: [] });
        if (url === '/auth/me') return Promise.resolve({ data: currentUser });
        if (url.includes('/rent/products')) return Promise.resolve({ data: products });
        return Promise.resolve({ data: [] });
      }),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      isCancel: vi.fn(() => false),
    },
  }));

  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useSearchParams: () => [new URLSearchParams(), vi.fn()],
    };
  });

  vi.doMock('../../components/NotificationBell', () => ({ default: () => null }));
  vi.doMock('../../components/ChatBell', () => ({ default: () => null }));
  vi.doMock('../../components/PostProductModal', () => ({ default: () => null }));

  const { default: RentCatalogPage } = await import('../RentCatalogPage');

  render(
    <MemoryRouter>
      <RentCatalogPage />
    </MemoryRouter>
  );

  // Wait for the product card or some stable content to appear
  await waitFor(
    () => {
      const anyTitle = products.some((p) => screen.queryByText(p.title) !== null);
      const hasUnavailable = screen.queryByText('Temporarily Unavailable') !== null;
      const hasRentBtn = screen.queryByRole('button', { name: /^Rent$/ }) !== null;
      expect(anyTitle || hasUnavailable || hasRentBtn).toBe(true);
    },
    { timeout: 6000 }
  );

  return { mockNavigate };
}

/**
 * Render SecondHandCatalogPage with a given product list + currentUser.
 * Returns { mockNavigate }.
 */
async function renderSecondHandCatalogWithProducts(products, currentUser) {
  vi.resetModules();

  const mockNavigate = vi.fn();

  vi.doMock('../../api', () => ({
    default: {
      get: vi.fn((url) => {
        if (url.includes('/rent/products/bookmarks/ids')) return Promise.resolve({ data: [] });
        if (url === '/rent/transactions') return Promise.resolve({ data: [] });
        if (url === '/auth/me') return Promise.resolve({ data: currentUser });
        if (url.includes('/rent/products')) return Promise.resolve({ data: products });
        return Promise.resolve({ data: [] });
      }),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      isCancel: vi.fn(() => false),
    },
  }));

  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useSearchParams: () => [new URLSearchParams(), vi.fn()],
    };
  });

  vi.doMock('../../components/NotificationBell', () => ({ default: () => null }));
  vi.doMock('../../components/ChatBell', () => ({ default: () => null }));
  vi.doMock('../../components/PostProductModal', () => ({ default: () => null }));

  const { default: SecondHandCatalogPage } = await import('../SecondHandCatalogPage');

  render(
    <MemoryRouter>
      <SecondHandCatalogPage />
    </MemoryRouter>
  );

  await waitFor(
    () => {
      const anyTitle = products.some((p) => screen.queryByText(p.title) !== null);
      const hasUnavailable = screen.queryByText('Temporarily Unavailable') !== null;
      const hasBuyBtn = screen.queryByRole('button', { name: /^Buy$/ }) !== null;
      const hasYourListing = screen.queryByText('Your Listing') !== null;
      expect(anyTitle || hasUnavailable || hasBuyBtn || hasYourListing).toBe(true);
    },
    { timeout: 6000 }
  );

  return { mockNavigate };
}

/**
 * Render ProductDetailPage for a given product.
 * Returns { mockNavigate, apiPost }.
 */
async function renderProductDetailPage(product, currentUser) {
  vi.resetModules();

  const mockNavigate = vi.fn();
  const mockApiPost = vi.fn(() => Promise.resolve({ data: {} }));

  vi.doMock('../../api', () => ({
    default: {
      get: vi.fn((url) => {
        if (url.includes(`/rent/products/${product._id}`)) {
          return Promise.resolve({ data: { product, auction: null } });
        }
        if (url === '/auth/me') return Promise.resolve({ data: currentUser });
        if (url === '/rent/transactions') return Promise.resolve({ data: [] });
        if (url.includes('/rent/products')) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      }),
      post: mockApiPost,
      isCancel: vi.fn(() => false),
    },
  }));

  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useParams: () => ({ id: product._id }),
    };
  });

  const { default: ProductDetailPage } = await import('../ProductDetailPage');

  render(
    <MemoryRouter>
      <ProductDetailPage />
    </MemoryRouter>
  );

  // Wait for the product title to appear
  await waitFor(
    () => {
      expect(screen.queryByText(product.title)).not.toBeNull();
    },
    { timeout: 6000 }
  );

  return { mockNavigate, apiPost: mockApiPost };
}

// ===========================================================================
// PBT 2a — Locked card always shows "Temporarily Unavailable" (no Rent/Negotiate)
// ===========================================================================

describe('PBT 2a — Locked card shows "Temporarily Unavailable" (no Rent/Negotiate buttons)', () => {
  /**
   * **Validates: Requirements 3.4**
   *
   * For any product with isRentedOrReserved=true rendered by a non-owner viewer,
   * the ProductCard in RentCatalogPage must show "Temporarily Unavailable"
   * and must NOT show "Rent" or "Negotiate" action buttons.
   * This behavior exists on unfixed code and must remain unchanged after the fix.
   */
  it('property: locked card always renders "Temporarily Unavailable" and no Rent/Negotiate buttons', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          rentalPrice: fc.integer({ min: 100, max: 50000 }),
          securityDeposit: fc.integer({ min: 0, max: 10000 }),
        }),
        async ({ rentalPrice, securityDeposit }) => {
          const lockedProduct = makeRentProduct({
            _id: `locked-${rentalPrice}`,
            rentalPrice,
            securityDeposit,
            title: `Locked Product ${rentalPrice}`,
            isRentedOrReserved: true,
            owner: { _id: 'owner-locked', name: 'Owner' },
          });
          const viewer = { _id: 'viewer-other', name: 'Viewer' };

          await renderRentCatalogWithProducts([lockedProduct], viewer);

          expect(
            screen.getByText('Temporarily Unavailable'),
            `Locked card should show "Temporarily Unavailable" for rentalPrice=${rentalPrice}`
          ).toBeInTheDocument();

          expect(
            screen.queryByRole('button', { name: /^Rent$/ }),
            `Locked card must NOT show a "Rent" button`
          ).toBeNull();

          expect(
            screen.queryByRole('button', { name: /^Negotiate$/ }),
            `Locked card must NOT show a "Negotiate" button`
          ).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 5, seed: 42 }
    );
  }, 90000);

  it('concrete: locked card shows "Temporarily Unavailable" and no Rent button', async () => {
    const locked = makeRentProduct({
      _id: 'prod-locked-concrete',
      title: 'Locked Concrete Product',
      isRentedOrReserved: true,
      owner: { _id: 'owner-X', name: 'Owner X' },
    });
    await renderRentCatalogWithProducts([locked], { _id: 'user-other', name: 'Viewer' });

    expect(screen.getByText('Temporarily Unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Rent$/ })).toBeNull();
  }, 20000);
});

// ===========================================================================
// PBT 2b — Owner card shows "Your Listing" (SecondHandCatalogPage reference impl)
// ===========================================================================

describe('PBT 2b — Owner card shows "Your Listing" (SecondHandCatalogPage)', () => {
  /**
   * **Validates: Requirements 3.5**
   *
   * SecondHandCatalogPage.ProductCard already has the correct three-way layout.
   * For any product where currentUser._id matches p.owner._id, the card must
   * show "Your Listing" and no Buy/Negotiate buttons.
   * This file is the reference — it must not be touched by the fix.
   */
  it('property: owner card always shows "Your Listing" and no Buy/Negotiate buttons', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          rentalPrice: fc.integer({ min: 100, max: 50000 }),
        }),
        async ({ rentalPrice }) => {
          const ownerId = `owner-${rentalPrice}`;
          const ownerProduct = makeSecondHandProduct({
            _id: `sh-owner-${rentalPrice}`,
            rentalPrice,
            title: `My SH Item ${rentalPrice}`,
            isRentedOrReserved: false,
            owner: { _id: ownerId, name: 'Product Owner' },
          });
          const ownerUser = { _id: ownerId, name: 'Product Owner' };

          await renderSecondHandCatalogWithProducts([ownerProduct], ownerUser);

          expect(
            screen.getByText('Your Listing'),
            `Owner card should show "Your Listing" for rentalPrice=${rentalPrice}`
          ).toBeInTheDocument();

          expect(
            screen.queryByRole('button', { name: /^Buy$/ }),
            `Owner card must NOT show a "Buy" button`
          ).toBeNull();

          expect(
            screen.queryByRole('button', { name: /^Negotiate$/ }),
            `Owner card must NOT show a "Negotiate" button`
          ).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 5, seed: 99 }
    );
  }, 90000);

  it('concrete: owner card shows "Your Listing" and hides Buy/Negotiate', async () => {
    const ownerId = 'owner-concrete-1';
    const product = makeSecondHandProduct({
      _id: 'sh-owner-concrete',
      title: 'My Own Item',
      isRentedOrReserved: false,
      owner: { _id: ownerId, name: 'Concrete Owner' },
    });
    await renderSecondHandCatalogWithProducts([product], { _id: ownerId, name: 'Concrete Owner' });

    expect(screen.getByText('Your Listing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Buy$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Negotiate$/ })).toBeNull();
  }, 20000);
});

// ===========================================================================
// Test 2c — Card body navigation preserved
// ===========================================================================

describe('Test 2c — Card body click navigates to /product/:id', () => {
  /**
   * **Validates: Requirements 3.3**
   *
   * Clicking the card body (not a button) on a non-locked RentCatalogPage card
   * must call navigate(`/product/${p._id}`).
   * This must not be broken by the fix.
   */
  it('clicking a non-locked card body calls navigate with /product/:id', async () => {
    const product = makeRentProduct({
      _id: 'prod-nav-test',
      title: 'Nav Test Product',
      isRentedOrReserved: false,
      owner: { _id: 'owner-nav', name: 'Nav Owner' },
    });

    const { mockNavigate } = await renderRentCatalogWithProducts(
      [product],
      { _id: 'viewer-nav', name: 'Viewer' }
    );

    const title = await screen.findByText('Nav Test Product', {}, { timeout: 5000 });
    expect(title).toBeInTheDocument();

    // Click the product title element (inside the card body div, not a button)
    fireEvent.click(title);

    expect(mockNavigate).toHaveBeenCalledWith('/product/prod-nav-test');
  }, 20000);
});

// ===========================================================================
// Test 2d — SecondHandCatalogPage Buy+Negotiate layout untouched
// ===========================================================================

describe('Test 2d — SecondHandCatalogPage Buy+Negotiate layout untouched', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * SecondHandCatalogPage must render both "Buy" and "Negotiate" buttons for a
   * non-owner, non-locked SECOND_HAND product. This file is never modified by
   * the fix.
   */
  it('renders Buy and Negotiate buttons for a non-owner non-locked SECOND_HAND product', async () => {
    const product = makeSecondHandProduct({
      _id: 'sh-2d-test',
      title: 'Second Hand Item For Sale',
      isRentedOrReserved: false,
      owner: { _id: 'owner-sh', name: 'SH Owner' },
    });

    await renderSecondHandCatalogWithProducts([product], { _id: 'viewer-sh', name: 'Viewer' });

    await waitFor(() => {
      expect(screen.queryByText('Second Hand Item For Sale')).not.toBeNull();
    }, { timeout: 5000 });

    expect(screen.getByRole('button', { name: /^Buy$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Negotiate$/ })).toBeInTheDocument();
  }, 20000);

  it('owner of a SECOND_HAND product sees "Your Listing" and no Buy/Negotiate buttons', async () => {
    const ownerId = 'owner-sh-2d';
    const product = makeSecondHandProduct({
      _id: 'sh-2d-owned',
      title: 'My Second Hand Listing',
      isRentedOrReserved: false,
      owner: { _id: ownerId, name: 'Owner' },
    });

    await renderSecondHandCatalogWithProducts([product], { _id: ownerId, name: 'Owner' });

    await waitFor(() => {
      expect(screen.queryByText('My Second Hand Listing')).not.toBeNull();
    }, { timeout: 5000 });

    expect(screen.getByText('Your Listing')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Buy$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Negotiate$/ })).toBeNull();
  }, 20000);
});

// ===========================================================================
// Test 2e — SECOND_HAND detail page negotiate uses window.prompt
// ===========================================================================

describe('Test 2e — SECOND_HAND detail page negotiate uses window.prompt', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * On ProductDetailPage for a SECOND_HAND product, clicking
   * "💬 Propose Buyout Offer Price" must call window.prompt
   * (handleSecondHandNegotiateClick). This path is already correct and
   * must remain unchanged after the fix.
   */
  it('clicking "Propose Buyout Offer Price" on SECOND_HAND detail page calls window.prompt', async () => {
    const product = makeSecondHandProduct({
      _id: 'sh-detail-2e',
      title: 'Second Hand Detail Product',
      rentalPrice: 5000,
      owner: { _id: 'owner-detail-sh', name: 'SH Owner' },
    });

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    await renderProductDetailPage(product, { _id: 'viewer-detail', name: 'Viewer' });

    const negotiateBtn = await screen.findByRole('button', { name: /Propose Buyout Offer Price/i });
    expect(negotiateBtn).toBeInTheDocument();

    fireEvent.click(negotiateBtn);

    expect(promptSpy).toHaveBeenCalled();
    promptSpy.mockRestore();
  }, 20000);
});

// ===========================================================================
// Test 2f — RENT handleAction (Rent Now) POSTs at listed price (no prompt)
// ===========================================================================

describe('Test 2f — RENT handleAction (Rent Now) POSTs at listed price', () => {
  /**
   * **Validates: Requirements 3.6**
   *
   * On ProductDetailPage for a RENT product, clicking "Rent Now" (the handleAction
   * path) must POST /rent/negotiate with dailyRate equal to product.rentalPrice
   * (listed price, not a prompted value). window.prompt must NOT be called.
   * The handleAction path must remain unchanged after the fix.
   */
  it('clicking "Rent Now" on RENT detail page POSTs with dailyRate = listed rentalPrice', async () => {
    const LISTED_PRICE = 800;
    const product = makeRentProduct({
      _id: 'rent-detail-2f',
      title: 'Rent Now Product',
      rentalPrice: LISTED_PRICE,
      securityDeposit: 300,
      owner: { _id: 'owner-rent-detail', name: 'Rent Owner' },
    });

    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);

    const { apiPost } = await renderProductDetailPage(
      product,
      { _id: 'viewer-rent', name: 'Viewer' }
    );

    const rentNowBtn = await screen.findByRole('button', { name: /Rent Now/i });
    expect(rentNowBtn).toBeInTheDocument();

    fireEvent.click(rentNowBtn);

    // window.prompt must NOT have been called for the Rent Now path
    expect(promptSpy).not.toHaveBeenCalled();

    // API.post must have been called with dailyRate = listed price
    expect(apiPost).toHaveBeenCalledWith(
      '/rent/negotiate',
      expect.objectContaining({ dailyRate: LISTED_PRICE })
    );

    promptSpy.mockRestore();
  }, 20000);

  it('concrete: "Rent Now" POST payload includes productId, dailyRate=rentalPrice, securityDeposit', async () => {
    const LISTED_PRICE = 1200;
    const SECURITY = 500;
    const product = makeRentProduct({
      _id: 'rent-2f-concrete',
      title: 'Concrete Rent Now Product',
      rentalPrice: LISTED_PRICE,
      securityDeposit: SECURITY,
      owner: { _id: 'owner-concrete-rent', name: 'Owner' },
    });

    const { apiPost } = await renderProductDetailPage(
      product,
      { _id: 'viewer-concrete', name: 'Viewer' }
    );

    const rentNowBtn = await screen.findByRole('button', { name: /Rent Now/i });

    fireEvent.click(rentNowBtn);

    expect(apiPost).toHaveBeenCalledWith(
      '/rent/negotiate',
      expect.objectContaining({
        productId: 'rent-2f-concrete',
        dailyRate: LISTED_PRICE,
        securityDeposit: SECURITY,
      })
    );
  }, 20000);
});
