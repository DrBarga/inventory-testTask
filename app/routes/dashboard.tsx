import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { Await, useLoaderData, useRouteError, useRevalidator, useFetcher } from "react-router";
import { Suspense, useState, useEffect } from "react";
import {
  Page,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Button,
  Banner,
  SkeletonBodyText,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { getInventory, claimStock } from "../models/inventory.server";

// ============================================
// LOADER (Task 1: Streaming with defer)
// ============================================
export async function loader({ request }: LoaderFunctionArgs) {
  // Return the promise directly for streaming
  const inventoryPromise = getInventory();
  
  return {
    inventory: inventoryPromise,
  };
}

// ============================================
// ACTION (Task 2: Handle stock claims)
// ============================================
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const itemId = formData.get("itemId") as string;
  
  try {
    const updatedItem = await claimStock(itemId);
    return { success: true, item: updatedItem };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="Inventory Dashboard">
      <Card>
        <Suspense fallback={<InventorySkeleton />}>
          <Await resolve={data.inventory}>
            {(items) => <InventoryList items={items} />}
          </Await>
        </Suspense>
      </Card>
    </Page>
  );
}

// ============================================
// SKELETON LOADER (Task 1: Loading state)
// ============================================
function InventorySkeleton() {
  return (
    <BlockStack gap="400">
      <SkeletonBodyText lines={3} />
      <SkeletonBodyText lines={3} />
      <SkeletonBodyText lines={3} />
      <SkeletonBodyText lines={3} />
    </BlockStack>
  );
}

// ============================================
// INVENTORY LIST (Task 2: Optimistic UI)
// ============================================
type Item = { id: string; name: string; stock: number };

function InventoryList({ items }: { items: Item[] }) {
  return (
    <ResourceList
      resourceName={{ singular: "item", plural: "items" }}
      items={items}
      renderItem={(item) => <InventoryItem item={item} />}
    />
  );
}

// ============================================
// INVENTORY ITEM (Task 2: Optimistic Updates)
// ============================================
function InventoryItem({ item }: { item: Item }) {
  const fetcher = useFetcher();
  
  // Manual optimistic state management
  const [optimisticStock, setOptimisticStock] = useState(item.stock);

  // Update optimistic stock when actual item changes
  useEffect(() => {
    setOptimisticStock(item.stock);
  }, [item.stock]);

  // Reset on error
  useEffect(() => {
    if (fetcher.data && !fetcher.data.success) {
      setOptimisticStock(item.stock);
    }
  }, [fetcher.data, item.stock]);

  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";
  const hasError = fetcher.data && !fetcher.data.success;

  const handleClaim = () => {
    if (optimisticStock > 0) {
      // Optimistically update the UI immediately
      setOptimisticStock(optimisticStock - 1);
    }
  };

  return (
    <ResourceItem id={item.id} url="" onClick={() => {}}>
      <InlineStack align="space-between" blockAlign="center">
        <BlockStack gap="100">
          <Text as="h3" variant="bodyMd" fontWeight="bold">
            {item.name}
          </Text>
          <Text as="p" variant="bodySm" tone={optimisticStock === 0 ? "critical" : undefined}>
            Stock: {optimisticStock}
          </Text>
          {hasError && (
            <Text as="p" variant="bodySm" tone="critical">
              Error: {fetcher.data.error}
            </Text>
          )}
        </BlockStack>
        
        <fetcher.Form method="post" onSubmit={handleClaim}>
          <input type="hidden" name="itemId" value={item.id} />
          <Button
            submit
            disabled={isSubmitting || optimisticStock <= 0}
            loading={isSubmitting}
          >
            Claim One
          </Button>
        </fetcher.Form>
      </InlineStack>
    </ResourceItem>
  );
}

// ============================================
// ERROR BOUNDARY (Task 3: Error Containment)
// ============================================
export function ErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();

  const handleRetry = () => {
    revalidator.revalidate();
  };

  return (
    <Page title="Inventory Dashboard">
      <Card>
        <BlockStack gap="400">
          <Banner
            title="Failed to load inventory"
            tone="critical"
            action={{ content: "Retry", onAction: handleRetry }}
          >
            <p>
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </Banner>
        </BlockStack>
      </Card>
    </Page>
  );
}