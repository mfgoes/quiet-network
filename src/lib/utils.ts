import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createElement, Fragment } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const URL_RE = /(https?:\/\/[^\s]+)/g

export function linkifyText(text: string) {
  const parts = text.split(URL_RE)
  if (parts.length === 1) return text
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) =>
      URL_RE.test(part)
        ? createElement(
            "a",
            {
              key: i,
              href: part,
              target: "_blank",
              rel: "noopener noreferrer",
              className:
                "text-quiet-accent hover:text-quiet-slate transition-colors underline break-all",
            },
            part.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          )
        : part,
    ),
  )
}
