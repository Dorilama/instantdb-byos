import { html } from "uhtml/signal";
import { db } from "@/db";

export default function UserSample() {
  const user = db.useUser();
  return html`<p>user: ${user.value.id}</p>`;
}
