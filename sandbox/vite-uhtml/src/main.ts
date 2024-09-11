import "./style.css";
import { html, render, effect } from "uhtml/signal";
import { RouteView } from "./router";
import { chatRoomoom } from "./db";
import { useUserPresenceValue } from "./db/composables";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const root = document.getElementById("app")!;

const userPresenceValue = useUserPresenceValue();

const {
  peers,
  publishPresence,
  isLoading: isLoadingPresence,
} = chatRoomoom.usePresence();

effect(() => {
  const presence = userPresenceValue.value;
  if (isLoadingPresence.value) {
    return;
  }
  publishPresence(presence);
});

render(
  root,
  () => html`${Header()}
    <main class="pb-24 lg:pb-0">
      ${RouteView()}
      <div class="w-full flex justify-center">
        <div role="alert" class="alert max-w-prose mx-2 my-4">
          <span class="icon-[mdi--information-outline] text-xl"></span>
          <div>
            <h3 class="font-bold">This is a realtime app!</h3>
            ${!Object.values(peers.value).length
              ? html`<span
                  >Open this page in another tab or browser to see the realtime
                  interactions</span
                >`
              : html`<span>
                  <span class="lg:hidden"
                    >You can see how many people are live on a page in the
                    bottom navigation</span
                  >
                  <span class="hidden lg:block"
                    >You can see how many people are live on a page in the top
                    header</span
                  >
                </span>`}
          </div>
        </div>
      </div>
    </main>
    ${BottomNav()}`
);
