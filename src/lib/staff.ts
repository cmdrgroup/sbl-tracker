// Canonical staff list used for action-item ownership dropdowns.
// Mirrors the SBL Solutions Services org chart.
export const STAFF_MEMBERS: string[] = [
  "Brett Poole",
  "Curtis Tofa",
  "Ryan Christensen",
  "Katie McInnes",
  "Drew Priddice",
  "Rob Romancz",
  "Matt Auchettl",
  "Aaron Poole",
  "Barry van der Merwe",
  "Fiona McNamara",
  "Monique Noble",
  "Mick Walker",
  "Nathan Jackson",
  "Chris Bush",
];

export const DEPARTMENT_LEADS: Record<string, string> = {
  compliance: "Rob Romancz",
  quality: "Aaron Poole",
};

export function resolveWorkstreamOwner(name: string, ownerName: string | null): string | null {
  const normalizedDept = name.trim().toLowerCase();
  const normalizedOwner = ownerName?.trim().toLowerCase() ?? "";
  const fallback = DEPARTMENT_LEADS[normalizedDept];

  if (!ownerName || normalizedOwner === normalizedDept) {
    return fallback ?? ownerName;
  }

  return ownerName;
}
