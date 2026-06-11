// ============================================================
// CONTACT — shown at the M.2 SSD stop and on the plain CV.
//
// PRIVACY: phone number and date of birth deliberately do NOT
// appear anywhere on this site or in the exported PDF.
// The email is split into parts and assembled at runtime so
// plain-text scrapers don't harvest it.
// ============================================================

export const contact = {
  // email = user + "@" + domain (assembled in JS, never written whole here)
  emailUser: "max.raulea",
  emailDomain: "gmail.com",

  location: "Amstelveen, Netherlands",

  links: [
    // TODO: replace with your real profiles
    { label: "GitHub", url: "https://github.com/YOUR-USERNAME" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/YOUR-PROFILE" },
  ],
};

export function emailAddress() {
  return contact.emailUser + "\u0040" + contact.emailDomain;
}
