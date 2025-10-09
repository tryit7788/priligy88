## Hydration Mismatch and React #418 – Issues and Fix

### Summary

- **Symptoms**:
  - Dev console showed React hydration mismatch around the cart UI.
  - Production showed **Minified React error #418**.
  - Markup diff pointed to `CartModal` and the cart quantity badge.

- **Root cause**:
  - The cart state is backed by `nanostores` and loaded from `localStorage` on the client.
  - On the server, `items` is empty and `quantity` is `0`, so SSR renders the "empty" branch and no badge.
  - On the client, after hydration, `items` and `quantity` update, causing the initial server HTML to differ from the client-rendered tree.
  - This SSR/CSR divergence triggered hydration mismatch and error #418 in production.

### Files Changed

- `apps/website/src/layouts/functional-components/cart/OpenCart.tsx`
  - Added a client-mount guard to defer rendering of the quantity badge until after the component mounts.

- `apps/website/src/layouts/functional-components/cart/CartModal.tsx`
  - Added a client-mount guard to render only the cart trigger before hydration.
  - After mount, render the correct branch (empty vs items) to avoid server/client tree mismatch.

### Key Code Ideas

1. Defer client-only dynamic UI until after mount:

```tsx
// OpenCart.tsx (concept)
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);
const showBadge = isMounted && Boolean(quantity);
```

2. Keep SSR markup stable for state that only exists client-side:

```tsx
// CartModal.tsx (concept)
if (!isMounted) {
  // Render only the trigger so SSR and initial client HTML match
  return (
    <div onClick={openCart}>
      <OpenCart quantity={quantity} />
    </div>
  );
}
```

### Why This Works

- SSR outputs a stable, minimal tree that does not include client-only state.
- After hydration, the UI updates to reflect real cart contents without violating React's initial hydration expectations.

### How to Verify

1. Local (dev):
   - Hard refresh (Ctrl+Shift+R).
   - Open console: confirm no Hydration Mismatch error.
   - Add/remove items; the badge and modal should update without errors.

2. Production (deployed):
   - Clear site data/cache and hard refresh.
   - If a specific route still errors, check browser extensions (ad blockers, etc.) that may mutate DOM before React loads.
   - Confirm cart opens, lists items, and subtotal renders with no error #418.

### Additional Guidance (Future Changes)

- For any component that depends on `window`, `localStorage`, time, random values, or user locale formatting, either:
  - Render a stable SSR placeholder and update after mount; or
  - Wrap with Astro Client directives (e.g., `client:only="react"`/`client:load`) or a dedicated client-only wrapper.
- Avoid branching SSR vs client with expressions that differ at render time, such as `Date.now()`, `Math.random()`, or data that only exists in the browser.
- When embedding React in Astro, keep the initial SSR tree deterministic and side-effect free.

### Notes

- If you still encounter the error only on one device/profile, try in a fresh Chrome profile with all extensions disabled to rule out DOM mutations by extensions.
