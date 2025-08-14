import { html } from "uhtml/signal";
import { type InstantByosWebDatabase, init } from "@dorilama/instantdb-byos";

export default function SignedIn(props: {
  db: ReturnType<typeof init>;
  child;
}) {
  const user = props.db.useUser();
  return html`<p>user: ${user.value.id}</p>`;
}
