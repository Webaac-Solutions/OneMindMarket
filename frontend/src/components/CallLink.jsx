"use client";

import { trackCall } from "@/lib/trackCall";

const CallLink = ({ shopId, phone, source = "profile", children, ...rest }) => (
  <a href={`tel:${phone}`} onClick={() => trackCall(shopId, source)} {...rest}>
    {children}
  </a>
);

export default CallLink;
