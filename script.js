/*
PokéBud/script.js

Adds accessible modal behavior for Login / Sign Up and a mobile menu toggle.
This script is defensive (works if some elements are missing) and focuses on:
 - accessible modal (open/close, focus trap, ESC, click-outside)
 - mobile nav toggle (aria-expanded, close on nav link click)
 - basic form submit stub (replace with real auth logic)
*/

(function () {
  "use strict";

  // Helpers
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const isVisible = (el) => !!(el && el.offsetParent !== null);

  // Focusable elements for the focus trap
  const focusableSelectors = [
    "a[href]",
    "area[href]",
    'input:not([disabled]):not([type="hidden"])',
    "select:not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "iframe",
    "object",
    "embed",
    '[tabindex]:not([tabindex="-1"])',
    "[contenteditable]",
  ].join(",");

  // State
  let lastFocusedElement = null;
  let activeFocusTrap = null;

  // Modal logic
  function openModal(mode = "login") {
    const modal = qs("#modal");
    if (!modal) return;

    const panel = qs(".modal-panel", modal);
    const titleEl = qs("#modalTitle", modal);
    const emailInput = qs('input[name="email"]', modal);

    modal.dataset.mode = mode;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");

    if (titleEl) {
      titleEl.textContent = mode === "signup" ? "Sign Up" : "Login";
    }

    lastFocusedElement = document.activeElement;
    // Enable focus trap
    activateFocusTrap(modal);

    // Move focus into modal
    if (emailInput) {
      emailInput.focus();
      emailInput.select && emailInput.select();
    } else if (panel) {
      panel.setAttribute("tabindex", "-1");
      panel.focus();
    }
  }

  function closeModal() {
    const modal = qs("#modal");
    if (!modal) return;

    modal.dataset.mode = "";
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("is-open");

    // Disable focus trap
    deactivateFocusTrap();

    // Restore focus
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function activateFocusTrap(container) {
    if (!container) return;
    const focusable = qsa(focusableSelectors, container).filter(
      (el) =>
        el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length,
    );
    if (focusable.length === 0) return;

    activeFocusTrap = {
      container,
      focusable,
      first: focusable[0],
      last: focusable[focusable.length - 1],
      handleKeydown(e) {
        if (e.key === "Tab") {
          // forward tab
          if (e.shiftKey) {
            if (document.activeElement === this.first) {
              e.preventDefault();
              this.last.focus();
            }
          } else {
            if (document.activeElement === this.last) {
              e.preventDefault();
              this.first.focus();
            }
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          closeModal();
        }
      },
    };

    document.addEventListener("keydown", activeFocusTrap.handleKeydown);
  }

  function deactivateFocusTrap() {
    if (!activeFocusTrap) return;
    document.removeEventListener("keydown", activeFocusTrap.handleKeydown);
    activeFocusTrap = null;
  }

  // Mobile menu logic
  function toggleMobileMenu() {
    const toggle = qs(".mobile-toggle");
    const nav = qs(".nav");
    if (!toggle || !nav) return;

    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open", !expanded);
  }

  // Close mobile menu (used when navigating)
  function closeMobileMenu() {
    const toggle = qs(".mobile-toggle");
    const nav = qs(".nav");
    if (!toggle || !nav) return;

    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  }

  // Init event listeners
  function init() {
    // Modal triggers
    const loginBtn = qs("#loginBtn");
    const signupBtn = qs("#signupBtn");
    const modal = qs("#modal");
    const closeBtn = qs("#closeModal");
    const modalPanel = qs(".modal-panel", modal);
    const authForm = qs("#authForm");

    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("login");
      });
    }

    if (signupBtn) {
      signupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal("signup");
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    }

    // Click outside modal panel closes modal
    if (modal) {
      modal.addEventListener("click", (e) => {
        // If click is on the overlay (modal) but not inside the panel, close
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    // Escape closes modal globally (fallback in case focus trap wasn't set)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const openModalElement = qs("#modal.is-open");
        if (openModalElement) {
          closeModal();
        }
      }
    });

    // Simple auth form handler
    if (authForm) {
      authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const email = data.get("email") || "";
        const password = data.get("password") || "";
        const mode = qs("#modal")?.dataset?.mode || "login";

        // Basic validation as a friendly hint (real validation should happen server-side)
        if (!email || !password) {
          // Try to show inline message
          const existing = qs(".form-error", form);
          if (!existing) {
            const p = document.createElement("p");
            p.className = "form-error";
            p.textContent = "Please provide both email and password.";
            form.appendChild(p);
            setTimeout(() => p.remove(), 3500);
          }
          return;
        }

        // Stub: replace with real API call
        console.info(`Submitting ${mode} for`, email);
        // Fake delay to show feedback
        const submitBtn = qs('button[type="submit"]', form);
        const origText = submitBtn ? submitBtn.textContent : null;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Working...";
        }
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
          // Close modal and pretend success
          closeModal();
          // Show a lightweight success toast (if present, else console)
          showToast(
            `${mode === "signup" ? "Signed up" : "Logged in"} as ${email}`,
          );
        }, 900);
      });
    }

    // Mobile menu toggle
    const mobileToggle = qs(".mobile-toggle");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", (e) => {
        e.preventDefault();
        toggleMobileMenu();
      });

      // Close menu when clicking outside on small screens
      document.addEventListener("click", (e) => {
        const nav = qs(".nav");
        if (!nav) return;
        if (!nav.classList.contains("is-open")) return;
        const isInsideNav =
          nav.contains(e.target) || mobileToggle.contains(e.target);
        // If clicked outside nav and toggle, close it
        if (!isInsideNav) {
          closeMobileMenu();
        }
      });

      // Close mobile menu when any nav link is clicked (common mobile UX)
      const navLinks = qsa(".nav .nav-link");
      navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          // Small delay to allow anchor navigation in-page
          setTimeout(closeMobileMenu, 150);
        });
      });
    }

    // Optional: clicking on canvas could focus it (nice UX)
    const canvas = qs("#canvas");
    if (canvas) {
      canvas.addEventListener("click", () => {
        canvas.focus && canvas.focus();
      });
    }
  }

  // Lightweight toast - ephemeral message at bottom-right
  function showToast(text, timeout = 3000) {
    if (!text) return;
    let toastRoot = qs(".pokedex-toast-root");
    if (!toastRoot) {
      toastRoot = document.createElement("div");
      toastRoot.className = "pokedex-toast-root";
      Object.assign(toastRoot.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-end",
      });
      document.body.appendChild(toastRoot);
    }
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = text;
    Object.assign(node.style, {
      background: "#111",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: "10px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
      fontSize: "13px",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "opacity 220ms ease, transform 220ms ease",
      maxWidth: "320px",
    });
    toastRoot.appendChild(node);
    // Force reflow to animate
    requestAnimationFrame(() => {
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      node.addEventListener("transitionend", () => node.remove(), {
        once: true,
      });
    }, timeout);
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
