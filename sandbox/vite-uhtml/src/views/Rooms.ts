import { html, effect, signal } from "uhtml/signal";
import { push, useRoute } from "@/router";
import { db } from "@/db";

const allRooms = ["room1", "room2"];
const query = new URLSearchParams(location.hash.split("?")[1]);

const roomId = signal((query.get("id") as string | undefined) || allRooms[0]);

const room = db.room("chat", roomId);
const { error, isLoading, peers } = db.rooms.usePresence(room);

const route = signal<ReturnType<typeof useRoute>["value"] | null>(null);

effect(() => {
  const id = roomId.value;
  if (route.value?.name !== "rooms") {
    return;
  }

  push(`/rooms?id=${id || ""}`);
});

const roomForm = {} as { current?: HTMLFormElement };

const alertError = {} as { current?: HTMLDivElement };

effect(() => {
  if (error?.value) {
    alertError.current?.scrollIntoView();
  }
});

export default function () {
  const r = useRoute();
  route.value = r.value;

  return html`<div class="flex flex-col items-center pt-4 pb-8 px-2 gap-4">
    <h1 class="text-4xl">Dynamic Rooms</h1>
    <div class="card card-bordered rounded-lg bg-base-100 sm:min-w-96">
      <div class="card-body">
        <form class="form-control" ref=${roomForm}>
          ${allRooms.map((r) => {
            return html`<label class="label cursor-pointer">
              <span class="label-text">${r}</span>
              <input
                type="radio"
                name="radio-room"
                class="radio"
                value=${r}
                ?checked=${roomId.value === r}
                @change=${(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  roomId.value = target.value;
                  roomForm.current?.reset();
                }}
              />
            </label>`;
          })}
        </form>
      </div>
      <div class="overflow-x-auto w-full">
        <table
          class=${`table rounded-t-none rounded-b-lg ${
            isLoading.value ? "skeleton" : ""
          }`}
        >
          <!-- head -->
          <thead>
            <tr>
              <th></th>
              <th>Peers</th>
            </tr>
          </thead>
          <tbody>
            ${isLoading.value
              ? html`<tr>
                  <th aria-hidden="true" class="opacity-0">0</th>
                  <td aria-hidden="true" class="opacity-0">
                    -d73a6a1-368b-4081-a06a-45d86404bdf-
                  </td>
                </tr>`
              : html`${!Object.keys(peers.value).length
                  ? html`<tr>
                      <th aria-hidden="true" class="opacity-0">0</th>
                      <td>No peers in this room, try another one.</td>
                    </tr>`
                  : html``}${Object.values(peers.value).map((peer, n) => {
                  return html`<tr>
                    <th>${n + 1}</th>
                    <td>${peer.peerId}</td>
                  </tr>`;
                })}`}
          </tbody>
        </table>
      </div>
      ${error?.value
        ? html`<div
            ref=${alertError}
            role="alert"
            class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
          >
            <span
              aria-hidden="true"
              class="icon-[mdi--error-outline] text-2xl"
            ></span>

            <span>Error! ${error.value || "unknown error."}</span>
          </div>`
        : ""}
    </div>
  </div>`;
}
