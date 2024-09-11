import { html, signal, effect } from "uhtml/signal";
import { push } from "@/router";
import { db } from "@/db";

const title = "Sign in";

const email = signal("");
const code = signal("");
const error = signal("");
const emailSent = signal(false);
const isLoading = signal(false);
async function handleSigninSubmit(e: Event) {
  e.preventDefault();
  if (!email.value || emailSent.value) {
    return;
  }
  emailSent.value = true;
  error.value = "";
  try {
    await db.auth.sendMagicCode({ email: email.value });
    emailSent.value = true;
  } catch (err) {
    //@ts-ignore TODO!
    error.value = err?.body?.message || "Unknown error.";
    emailSent.value = false;
  }
}
async function handleCodeSubmit(e: Event) {
  e.preventDefault();
  if (!code.value || isLoading.value) {
    return;
  }
  emailSent.value = true;
  error.value = "";
  isLoading.value = true;
  try {
    await db.auth.signInWithMagicCode({ email: email.value, code: code.value });
    emailSent.value = true;
  } catch (err) {
    //@ts-ignore TODO!
    error.value = err?.body?.message || "Unknown error.";
    code.value = "";
    isLoading.value = false;
  }
}

const alertError = {} as { current?: HTMLDivElement };
effect(() => {
  if (error.value && alertError.current) {
    alertError.current?.scrollIntoView();
  }
});

const { user } = db.useAuth();

function step1() {
  return html`<form class="flex flex-col gap-4" @submit=${handleSigninSubmit}>
    <span>Let's log you in!</span>
    <label class="input input-bordered flex items-center gap-2">
      <span aria-hidden="true" class="icon-[mdi--email-outline]"></span>
      <input
        value=${email.value}
        @change=${(e: Event) => {
          const target = e.target as HTMLInputElement;
          email.value = target.value;
        }}
        type="email"
        class="grow"
        placeholder="Email"
        required
      />
    </label>
    <button type="submit" class="self-end btn">${title}</button>
  </form>`;
}

function step2() {
  return html`<form class="flex flex-col gap-4" @submit=${handleCodeSubmit}>
    <span>Okay, we sent you an email at ${email}!</span
    ><span>What was the code?</span>
    <label class="input input-bordered flex items-center gap-2">
      <span aria-hidden="true" class="icon-[mdi--key-variant]"></span>
      <input
        value=${code.value}
        @change=${(e: Event) => {
          const target = e.target as HTMLInputElement;
          code.value = target.value;
        }}
        type="text"
        class="grow"
        placeholder="Code"
        required
      />
    </label>
    <button type="submit" class="self-end btn">
      ${isLoading.value
        ? html`<span class="loading loading-spinner"></span>`
        : ""}Verify
    </button>
  </form>`;
}

export default function () {
  effect(() => {
    if (user.value) {
      push("/");
    }
  });
  return html`<div class="flex flex-col items-center pt-4 pb-8 px-2 gap-4">
    <h1 class="text-4xl">${title}</h1>
    <div class="card card-bordered">
      <div class="card-body">${!emailSent.value ? step1() : step2()}</div>
      ${error.value
        ? html`<div
            ref=${alertError}
            role="alert"
            class="alert alert-error rounded-lg rounded-tl-none rounded-tr-none"
          >
            <span
              aria-hidden="true"
              class="icon-[mdi--error-outline] text-2xl"
            ></span>

            <span>Error! ${error || "unknown error."}</span>
          </div>`
        : ""}
    </div>
  </div>`;
}
