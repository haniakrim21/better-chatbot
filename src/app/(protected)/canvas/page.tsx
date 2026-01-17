"use client";

import { CanvasEditor } from "@/components/canvas/canvas-editor";
import { Suspense } from "react";

export default function CanvasPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading canvas...</div>}>
        <CanvasEditor />
      </Suspense>
    </div>
  );
}
