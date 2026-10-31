import { store } from '../services/store.js';
import { apiCall } from '../services/apiClient.js';
import { icon } from '../utils/ui.js';
import { User } from '../types.js';

export function renderAuthView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#090d16] px-4 py-10 text-slate-100';

  let isSignup = false;
  let isSubmitting = false;
  let message = '';
  let isError = false;
  let showPassword = false;

  const render = () => {
    container.innerHTML = `
      <div class="pointer-events-none absolute inset-x-0 top-0 mx-auto h-80 max-w-3xl bg-gradient-to-b from-violet-600/15 via-cyan-500/10 to-transparent blur-3xl"></div>
      <section class="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0e1424]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div class="mb-6 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-800/40 bg-violet-950/60 text-violet-400">
            ${icon('brain', 'h-6 w-6')}
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">${isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p class="mt-2 text-sm text-slate-400">${isSignup ? 'Start learning smarter with Learnova Tutor.' : 'Sign in to continue learning with Learnova Tutor.'}</p>
        </div>

        <form id="auth-form" class="space-y-4" novalidate>
          ${isSignup ? `
            <label class="block text-sm text-slate-300">
              Name
              <input name="name" type="text" autocomplete="name" required minlength="2" maxlength="100" class="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-violet-500" />
            </label>
          ` : ''}
          <label class="block text-sm text-slate-300">
            Email
            <input name="email" type="email" autocomplete="email" required maxlength="255" class="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-violet-500" />
          </label>
          <label class="block text-sm text-slate-300">
            Password
            <span class="relative mt-1.5 block">
              <input name="password" type="${showPassword ? 'text' : 'password'}" autocomplete="${isSignup ? 'new-password' : 'current-password'}" required minlength="8" maxlength="128" class="w-full rounded-lg border border-white/[0.1] bg-black/30 px-3.5 py-2.5 pr-16 text-sm text-white outline-none transition focus:border-violet-500" />
              <button id="auth-toggle-password" type="button" class="absolute inset-y-0 right-0 px-3 text-xs text-slate-400 hover:text-white" aria-label="${showPassword ? 'Hide password' : 'Show password'}">${showPassword ? 'Hide' : 'Show'}</button>
            </span>
          </label>
          <p id="auth-message" role="alert" class="min-h-5 text-sm ${isError ? 'text-rose-300' : 'text-emerald-300'}"></p>
          <button type="submit" ${isSubmitting ? 'disabled' : ''} class="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60">
            ${isSubmitting ? icon('clock', 'h-4 w-4 animate-spin') : ''}
            ${isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        ${!isSignup ? `
          <div class="my-4 flex items-center gap-3 text-xs text-slate-500">
            <span class="h-px flex-1 bg-white/[0.08]"></span><span>OR</span><span class="h-px flex-1 bg-white/[0.08]"></span>
          </div>
          <button id="auth-demo-login" type="button" ${isSubmitting ? 'disabled' : ''} class="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-60">Continue with Demo Login</button>
        ` : ''}

        <p class="mt-5 text-center text-sm text-slate-400">
          ${isSignup ? 'Already have an account?' : 'New to Learnova Tutor?'}
          <button id="auth-toggle-mode" type="button" class="ml-1 font-medium text-violet-300 hover:text-violet-200">${isSignup ? 'Sign in' : 'Create an account'}</button>
        </p>
      </section>
    `;
    const messageElement = container.querySelector<HTMLElement>('#auth-message');
    if (messageElement) messageElement.textContent = message;

    container.querySelector('#auth-toggle-password')?.addEventListener('click', () => {
      showPassword = !showPassword;
      const input = container.querySelector<HTMLInputElement>('[name="password"]');
      if (input) input.type = showPassword ? 'text' : 'password';
      const button = container.querySelector<HTMLButtonElement>('#auth-toggle-password');
      if (button) {
        button.textContent = showPassword ? 'Hide' : 'Show';
        button.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
      }
    });

    container.querySelector('#auth-toggle-mode')?.addEventListener('click', () => {
      isSignup = !isSignup;
      message = '';
      render();
    });

    container.querySelector('#auth-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const email = String(data.get('email') || '').trim();
      const password = String(data.get('password') || '');
      const name = String(data.get('name') || '').trim();
      const emailInput = form.querySelector<HTMLInputElement>('[name="email"]');
      const passwordInput = form.querySelector<HTMLInputElement>('[name="password"]');
      const nameInput = form.querySelector<HTMLInputElement>('[name="name"]');

      if (!emailInput?.checkValidity() || !passwordInput?.checkValidity() || (isSignup && !nameInput?.checkValidity())) {
        form.reportValidity();
        return;
      }

      isSubmitting = true;
      message = '';
      render();
      try {
        const response = await apiCall<{ user: User }>(
          'POST',
          isSignup ? '/api/auth/register' : '/api/auth/login',
          isSignup ? { name, email, password } : { email, password },
        );
        store.login(response.user);
        store.setRoute('dashboard');
      } catch (error) {
        message = error instanceof Error ? error.message : 'Unable to authenticate. Please try again.';
        isError = true;
        isSubmitting = false;
        render();
      }
    });

    container.querySelector('#auth-demo-login')?.addEventListener('click', async () => {
      if (isSubmitting) return;
      isSubmitting = true;
      isError = false;
      message = '';
      render();
      try {
        const response = await apiCall<{ user: User }>('POST', '/api/auth/demo');
        store.login(response.user);
        store.setRoute('dashboard');
      } catch (error) {
        message = error instanceof Error ? error.message : 'Demo login is unavailable.';
        isError = true;
        isSubmitting = false;
        render();
      }
    });
  };

  render();
  return container;
}
