import { attr, Hole, html, effect, Signal, computed } from "uhtml/signal";
import { useCursors } from "@dorilama/instantdb-byos";
import { db, chatRoom } from "@/db";

function Cursor(props: { color?: string } = {}) {
  const size = 35;
  const fill = props.color || "black";
  return html`<svg
    style=${`width: ${size}px; height: ${size}px`}
    viewBox=${`0 0 ${size} ${size}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g
      fill="rgba(0,0,0,.2)"
      transform="matrix(1, 0, 0, 1, -11.999999046325684, -8.406899452209473)"
    >
      <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
      <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
    </g>
    <g
      fill="white"
      transform="matrix(1, 0, 0, 1, -11.999999046325684, -8.406899452209473)"
    >
      <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
      <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
    </g>
    <g
      fill=${fill}
      transform="matrix(1, 0, 0, 1, -11.999999046325684, -8.406899452209473)"
    >
      <path d="m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" />
      <path d="m13 10.814v11.188l2.969-2.866.428-.139h4.768z" />
    </g>
  </svg>`;
}

export default function Cursors(
  props: Signal<{
    spaceId?: string;
    userCursorColor?: string;
    propagate?: boolean;
  }>,
  children?: () => Hole,
  attrs: {
    class?: string;
    onTouchMove?: (e: TouchEvent) => void;
    onTouchEnd?: (e: TouchEvent) => void;
  } = {}
) {
  const options = computed(() => {
    return {
      spaceId: props.value.spaceId,
      userCursorColor: props.value.userCursorColor,
      propagate: props.value.propagate,
    };
  });

  const {
    spaceId,
    cursorsPresence,
    fullPresence,
    getCursor,
    onMouseMove,
    onMouseOut,
    onTouchMove,
    onTouchEnd,
    clearPresence,
    stop,
    getGlobalWrapperStyles,
    getWrapperStyles,
    getCursorStyles,
  } = useCursors(chatRoom, options);

  return (
    customCursor?: (props: { color: string; presence: any }) => Hole
  ) => html`<div
    class=${attrs.class}
    style=${getGlobalWrapperStyles()}
    @mousemove=${onMouseMove}
    @mouseleave=${onMouseOut}
    @touchmove=${(e: TouchEvent) => {
      onTouchMove(e);
      attrs.onTouchMove?.(e);
    }}
    @touchend=${(e: TouchEvent) => {
      onTouchEnd(e);
      attrs.onTouchEnd?.(e);
    }}
  >
    ${children ? children() : html``}
    <div style=${getWrapperStyles()}>
      ${Object.entries(cursorsPresence.peers.value).map(([id, presence]) => {
        const cursor = getCursor(presence);

        return cursor
          ? html`<div style=${getCursorStyles(presence)}>
              ${customCursor
                ? customCursor({ color: cursor.color, presence })
                : Cursor({ color: cursor.color })}
            </div>`
          : html``;
      })}
    </div>
  </div>`;
}
