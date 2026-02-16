# Inventory Dashboard - Remix Test Assignment

A resilient inventory management dashboard built with Remix and Shopify Polaris, demonstrating streaming, optimistic UI, and error handling patterns.

## Installation
```bash
npm install
npm run dev
```

Open [http://localhost:5173/dashboard](http://localhost:5173/dashboard)

## Key Implementation Choices

### Task 1: Streaming (Eliminate White Screen)

**Approach:** Used React Router's `Await` component with `Suspense` to stream data.

- Loader returns a promise without awaiting it
- `Suspense` fallback shows skeleton loader immediately
- Main content renders after 3-second delay
- Page shell loads instantly (0ms), data streams in background

**Code:**
```tsx
export async function loader() {
  const inventoryPromise = getInventory(); // Don't await
  return { inventory: inventoryPromise };
}

// In component:
<Suspense fallback={<InventorySkeleton />}>
  <Await resolve={data.inventory}>
    {(items) => <InventoryList items={items} />}
  </Await>
</Suspense>
```

### Task 2: Optimistic UI (Instant Feedback)

**Approach:** Manual optimistic state management with `useFetcher` and local state.

- Used `useState` to track optimistic stock count
- On button click, immediately decrement local state (0ms delay)
- `useFetcher` handles submission without full page reload
- On error, `useEffect` detects failed response and reverts to actual stock
- Button disabled during submission to prevent double-clicks

**Code:**
```tsx
const [optimisticStock, setOptimisticStock] = useState(item.stock);

// Reset on error
useEffect(() => {
  if (fetcher.data && !fetcher.data.success) {
    setOptimisticStock(item.stock); // Rollback
  }
}, [fetcher.data, item.stock]);

const handleClaim = () => {
  setOptimisticStock(optimisticStock - 1); // Immediate update
};
```

**Race Condition Protection:** 
- Button `disabled` when `fetcher.state === "submitting"` or `"loading"`
- Prevents multiple simultaneous requests per item

### Task 3: Error Boundary (Retry Logic)

**Approach:** Route-level `ErrorBoundary` with `useRevalidator` for retry.

- Catches loader errors without crashing entire page
- Uses Polaris `Banner` component to display error message
- `useRevalidator().revalidate()` triggers loader re-execution
- No full page refresh required

**Code:**
```tsx
export function ErrorBoundary() {
  const revalidator = useRevalidator();

  const handleRetry = () => {
    revalidator.revalidate(); // Re-runs loader
  };

  return (
    <Banner 
      title="Failed to load inventory"
      action={{ content: "Retry", onAction: handleRetry }}
    />
  );
}
```

## Architecture Decisions

1. **No `defer()` usage:** React Router v7 handles promise streaming automatically with `Await`
2. **Manual optimistic state:** Used `useState` + `useEffect` instead of experimental `useOptimistic` for better compatibility
3. **Polaris components:** Maintained consistent Shopify design system throughout
4. **Type safety:** Full TypeScript typing for all data structures

## Testing the Application

- **Streaming:** Refresh page - skeleton appears immediately, data loads after 3s
- **Optimistic UI:** Click "Claim One" - stock decreases instantly, reverts on error
- **Error Handling:** Refresh multiple times - ~20% chance of error with retry button

## Project Structure
```
app/
├── models/
│   └── inventory.server.ts   # Mock backend (chaos API)
├── routes/
│   ├── home.tsx              # Landing page
│   └── dashboard.tsx         # Main inventory dashboard
├── root.tsx                  # App shell with Polaris provider
└── routes.ts                 # Route configuration
```

## Technologies

- **Framework:** React Router v7
- **UI Library:** Shopify Polaris
- **Language:** TypeScript
- **Styling:** Polaris CSS