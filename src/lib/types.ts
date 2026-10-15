export type Id = string;

export interface Bullet {
  id: Id;
  text: string;
}

export interface Link {
  id: Id;
  label: string;
  url: string;
}

export interface Header {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  links: Link[];
}

/** One block inside an "entries" section: a job, a project, a paper, a degree. */
export interface Entry {
  id: Id;
  hidden?: boolean;
  title: string;
  url: string;
  subtitle: string;
  date: string;
  place: string;
  bullets: Bullet[];
}

export interface Skill {
  id: Id;
  label: string;
  value: string;
}

interface SectionBase {
  id: Id;
  title: string;
  hidden?: boolean;
}

export interface TextSection extends SectionBase {
  kind: "text";
  body: string;
}

export interface EntriesSection extends SectionBase {
  kind: "entries";
  items: Entry[];
}

export interface SkillsSection extends SectionBase {
  kind: "skills";
  items: Skill[];
}

export interface ListSection extends SectionBase {
  kind: "list";
  items: Bullet[];
}

export type Section = TextSection | EntriesSection | SkillsSection | ListSection;
export type SectionKind = Section["kind"];

export type FontId = "arial" | "times" | "garamond";
export type PageSize = "A4" | "Letter";

export interface ResumeStyle {
  font: FontId;
  /** Body font size in pt. */
  fontSize: number;
  /** Unitless line height. */
  lineHeight: number;
  /** Left/right page margin in mm. */
  marginX: number;
  /** Top/bottom page margin in mm. */
  marginY: number;
  page: PageSize;
}

export interface Resume {
  id: Id;
  /** Name of the document in the CV switcher, not the person's name. */
  name: string;
  updatedAt: number;
  header: Header;
  sections: Section[];
  style: ResumeStyle;
}
