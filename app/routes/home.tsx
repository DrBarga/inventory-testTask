import { Page, Text } from "@shopify/polaris";
import { Link } from "react-router";

export default function Home() {
  return (
    <Page title="Welcome">
      <Text as="p" variant="bodyLg">
        Welcome to Inventory Management System.
      </Text>
      <br />
      <Link to="/dashboard">
        <Text as="span" variant="bodyMd" fontWeight="bold">
          Go to Dashboard →
        </Text>
      </Link>
    </Page>
  );
}