/**
 * Content model for a Tai Chi form (chiêu thức).
 *
 * A form's detailed guidance is expressed as an ordered list of ContentSection.
 * The renderer maps each section type to a React Native component.
 */

export type ContentSection =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string } // supports **bold** and `code`
  | { type: 'list'; ordered: boolean; items: string[] }
  | {
      type: 'image';
      /** Local bundled SVG illustration key (see src/assets/poseIllustrations). */
      illustration: string;
      alt: string;
      caption?: string;
    }
  | {
      type: 'video';
      provider: 'youtube';
      videoId: string;
      title: string;
      /** Optional start time (seconds) to jump to this form within a full-form video. */
      start?: number;
      source?: { name: string; url: string };
    }
  | { type: 'callout'; variant: 'safety' | 'tip'; text: string };

export interface TaiChiForm {
  /** Stable id, e.g. "01". */
  id: string;
  /** 1..24 sequence order. */
  order: number;
  nameHanViet: string;
  nameVi: string;
  namePinyin: string;
  nameEn: string;
  /** Short summary shown in the list row. */
  summary: string;
  /** Illustration key for the list thumbnail. */
  thumbnail: string;
  hasSafetyNote: boolean;
  sections: ContentSection[];
}
