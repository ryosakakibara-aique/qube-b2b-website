"use client";

import { useActionState } from "react";
import { submitContactEnquiry } from "@/lib/leads/actions";
import {
  EMPTY_CONTACT_STATE,
  type ContactActionState,
} from "@/lib/leads/types";

type FieldProps = {
  state: ContactActionState;
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "email";
  autoComplete?: string;
  required?: boolean;
};

function Field({
  state,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  required,
}: FieldProps) {
  const error = state.status === "error" ? state.fieldErrors?.[name] : undefined;
  const errorId = `${name}-error`;

  return (
    <div>
      {/* The Figma frames use placeholder-only inputs, so the visible label is hidden from view
          while remaining available to assistive technology. */}
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="landing-input"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-[10px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ContactForm({ sourcePath }: { sourcePath: string }) {
  const [state, formAction, pending] = useActionState(
    submitContactEnquiry,
    EMPTY_CONTACT_STATE,
  );

  return (
    <div className="rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)] p-6">
      <h2 className="text-lg font-semibold">
        Talk to a QUBE Smart Solution Expert
      </h2>

      {state.status === "success" ? (
        <p role="status" className="mt-5 text-sm">
          Thank you. Your message has been received and a QUBE Smart Solution
          Expert will reach out shortly.
        </p>
      ) : (
        <form action={formAction} className="mt-5">
          <input type="hidden" name="sourcePath" value={sourcePath} />
          <div className="sr-only">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              state={state}
              name="name"
              label="Your name"
              placeholder="Your name"
              autoComplete="name"
              required
            />
            <Field
              state={state}
              name="email"
              label="Work email"
              placeholder="Work email"
              type="email"
              autoComplete="email"
              required
            />
            <Field
              state={state}
              name="company"
              label="Company name"
              placeholder="Company name"
              autoComplete="organization"
            />
            <Field
              state={state}
              name="location"
              label="Your location"
              placeholder="Your location"
              autoComplete="address-level2"
            />
            <div className="sm:col-span-2">
              <label htmlFor="message" className="sr-only">
                Business needs
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us about your business pain-points and goals"
                className="landing-input min-h-24"
              />
            </div>
          </div>

          {state.status === "error" && state.error ? (
            <p role="alert" className="mt-3 text-xs text-red-700">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="cta-gradient mt-5 rounded-[var(--radius-control)] px-5 py-2 text-xs font-bold text-[var(--brand-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
          >
            {pending ? "Sending..." : "Talk to an Expert"}
          </button>
        </form>
      )}
    </div>
  );
}
