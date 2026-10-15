import { Fragment, type ReactNode } from "react";
import { Rich } from "@/lib/markup";
import type { Entry, FontId, Resume, Section } from "@/lib/types";

export const FONT_STACKS: Record<FontId, string> = {
  arial: 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif',
  times: '"Times New Roman", Times, "Liberation Serif", serif',
  garamond: 'var(--font-garamond), Garamond, "Times New Roman", serif',
};

export const PAGE_MM = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
} as const;

const joinDot = (parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(" · ");

function hrefFor(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  return `https://${u}`;
}

function MaybeLink({ url, children }: { url: string; children: ReactNode }) {
  const href = hrefFor(url);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <>{children}</>
  );
}

function EntryBlock({ e }: { e: Entry }) {
  const meta = joinDot([e.date, e.place]);
  const bullets = e.bullets.filter((b) => b.text.trim());
  return (
    <div className="cv-entry" data-block="avoid">
      <div className="cv-row">
        <span className="cv-entry-title">
          <MaybeLink url={e.url}>{e.title}</MaybeLink>
        </span>
        {meta && <span className="cv-meta">{meta}</span>}
      </div>
      {e.subtitle.trim() && <div className="cv-sub">{e.subtitle}</div>}
      {bullets.length > 0 && (
        <ul className="cv-bullets">
          {bullets.map((b) => (
            <li key={b.id}>
              <Rich text={b.text} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionBody({ s }: { s: Section }) {
  switch (s.kind) {
    case "text":
      return s.body.trim() ? (
        <p className="cv-text" data-block="text">
          <Rich text={s.body} />
        </p>
      ) : null;
    case "entries":
      return (
        <>
          {s.items
            .filter((e) => !e.hidden)
            .map((e) => (
              <EntryBlock key={e.id} e={e} />
            ))}
        </>
      );
    case "skills":
      return (
        <div className="cv-lines">
          {s.items
            .filter((k) => k.label.trim() || k.value.trim())
            .map((k) => (
              <div key={k.id} data-block="avoid">
                {k.label.trim() && <strong>{k.label.trim()}: </strong>}
                <Rich text={k.value} />
              </div>
            ))}
        </div>
      );
    case "list":
      return (
        <div className="cv-lines">
          {s.items
            .filter((b) => b.text.trim())
            .map((b) => (
              <div key={b.id} data-block="avoid">
                <Rich text={b.text} />
              </div>
            ))}
        </div>
      );
  }
}

function isEmpty(s: Section): boolean {
  switch (s.kind) {
    case "text":
      return !s.body.trim();
    case "entries":
      return !s.items.some((e) => !e.hidden);
    case "skills":
      return !s.items.some((k) => k.label.trim() || k.value.trim());
    case "list":
      return !s.items.some((b) => b.text.trim());
  }
}

/** The CV itself, in Harvard layout. Pure render: used by both the preview and print. */
export function CvDocument({ resume }: { resume: Resume }) {
  const { header: h, style } = resume;
  const contact = [
    h.location.trim() && { text: h.location.trim(), href: "" },
    h.email.trim() && { text: h.email.trim(), href: `mailto:${h.email.trim()}` },
    h.phone.trim() && { text: h.phone.trim(), href: `tel:${h.phone.replace(/[^\d+]/g, "")}` },
  ].filter(Boolean) as { text: string; href: string }[];
  const links = h.links.filter((l) => l.label.trim() || l.url.trim());

  return (
    <article
      className="cv"
      style={{ fontFamily: FONT_STACKS[style.font], fontSize: `${style.fontSize}pt`, lineHeight: style.lineHeight }}
    >
      <header className="cv-header" data-block="avoid">
        {h.name.trim() && <h1 className="cv-name">{h.name}</h1>}
        {h.headline.trim() && <div className="cv-headline">{h.headline}</div>}
        {contact.length > 0 && (
          <div className="cv-contact">
            {contact.map((c, i) => (
              <Fragment key={c.text}>
                {i > 0 && <span className="cv-dot"> · </span>}
                {c.href ? <a href={c.href}>{c.text}</a> : c.text}
              </Fragment>
            ))}
          </div>
        )}
        {links.length > 0 && (
          <div className="cv-contact">
            {links.map((l, i) => (
              <Fragment key={l.id}>
                {i > 0 && <span className="cv-dot"> · </span>}
                <MaybeLink url={l.url}>{l.label.trim() || l.url.trim()}</MaybeLink>
              </Fragment>
            ))}
          </div>
        )}
      </header>

      {resume.sections
        .filter((s) => !s.hidden && !isEmpty(s))
        .map((s) => (
          <section key={s.id} className="cv-section">
            <h2 className="cv-h" data-block="heading">
              <span>{s.title}</span>
            </h2>
            <SectionBody s={s} />
          </section>
        ))}
    </article>
  );
}
