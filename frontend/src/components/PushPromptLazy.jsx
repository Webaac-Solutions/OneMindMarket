"use client";

import dynamic from "next/dynamic";

const PushPrompt = dynamic(() => import("@/components/PushPrompt"), {
  ssr: false,
});

export default function PushPromptLazy() {
  return <PushPrompt />;
}
