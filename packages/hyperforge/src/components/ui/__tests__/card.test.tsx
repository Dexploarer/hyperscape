/**
 * Card Component Tests
 *
 * Tests for the card component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "../card";

describe("Card", () => {
  it("renders without crashing", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Card content</CardContent>
      </Card>,
    );
    expect(document.body).toBeTruthy();
  });
});
