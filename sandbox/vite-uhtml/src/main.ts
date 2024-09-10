import "./style.css";
import { html, render, effect } from "uhtml/signal";
import { RouteView } from "./router";
import BottomNav from "@/components/BottomNav";
import { chatRoomoom } from "./db";
import { useUserPresenceValue } from "./db/composables";

const root = document.getElementById("app")!;

render(root, () => html`${RouteView()}${BottomNav()}`);

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
