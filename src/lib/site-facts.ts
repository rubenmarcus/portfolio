/**
 * Public facts reused across human pages, agent endpoints and structured data.
 * Update measured values here so marketing copy cannot drift between routes.
 */
export const CAREER_YEARS = 14;
export const AEO_TOTAL_SCANS = 4_569;
export const AEO_UNIQUE_SITES = 2_259;
export const CALENDLY_URL = "https://calendly.com/rubenmarcus-dev/project-intro";

export const formatFact = (value: number, locale: "en-US" | "pt-BR") =>
  value.toLocaleString(locale);
