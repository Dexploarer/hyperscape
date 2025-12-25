import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MeshStatistics } from "../MeshStatistics";
import type { MeshStats } from "../types";

describe("MeshStatistics", () => {
  it("returns null when meshStats is null and not loading", () => {
    const { container } = render(
      <MeshStatistics meshStats={null} isLoading={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state", () => {
    render(<MeshStatistics meshStats={null} isLoading={true} />);
    expect(screen.getByText("Loading mesh stats...")).toBeTruthy();
  });

  it("displays triangle count", () => {
    const meshStats: MeshStats = {
      triangles: 1000,
      vertices: 500,
      polycount: 1000,
    };
    
    render(<MeshStatistics meshStats={meshStats} isLoading={false} />);
    expect(screen.getByText("Triangles")).toBeTruthy();
    expect(screen.getByText("1,000")).toBeTruthy();
  });

  it("displays vertex count", () => {
    const meshStats: MeshStats = {
      triangles: 1000,
      vertices: 500,
      polycount: 1000,
    };
    
    render(<MeshStatistics meshStats={meshStats} isLoading={false} />);
    expect(screen.getByText("Vertices")).toBeTruthy();
    expect(screen.getByText("500")).toBeTruthy();
  });

  it("displays polycount", () => {
    const meshStats: MeshStats = {
      triangles: 1000,
      vertices: 500,
      polycount: 2000,
    };
    
    render(<MeshStatistics meshStats={meshStats} isLoading={false} />);
    expect(screen.getByText("Polycount")).toBeTruthy();
    expect(screen.getByText("2,000")).toBeTruthy();
  });

  it("displays mesh count when present", () => {
    const meshStats: MeshStats = {
      triangles: 1000,
      vertices: 500,
      polycount: 1000,
      meshCount: 3,
    };
    
    render(<MeshStatistics meshStats={meshStats} isLoading={false} />);
    expect(screen.getByText("Meshes")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("displays topology when present", () => {
    const meshStats: MeshStats = {
      triangles: 1000,
      vertices: 500,
      polycount: 1000,
      topology: "triangle",
    };
    
    render(<MeshStatistics meshStats={meshStats} isLoading={false} />);
    expect(screen.getByText("Topology")).toBeTruthy();
    expect(screen.getByText("triangles")).toBeTruthy();
  });
});
