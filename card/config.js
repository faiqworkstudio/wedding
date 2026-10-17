/*
 * ───────────────────────────────────────────────────────────────
 *  The invitation card. Everything a guest reads lives here.
 *
 *  Personal links: add ?to=Name to the URL and it is written on
 *  that guest's envelope, e.g.  /card?to=Uncle%20Rashid%20%26%20family
 * ───────────────────────────────────────────────────────────────
 */

export const CARD = {
  bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  hosts: 'Together with their families',
  names: ['Afreen', 'Faiq'],
  invite: 'invite you to celebrate their Nikah',

  // Shown on the envelope when no ?to= is given.
  defaultGuest: 'you & your family',

  // Times are 24h local time. Venues and addresses are placeholders: replace them.
  events: [
    {
      name: 'Nikah',
      date: '2026-12-12',
      start: '16:00',
      end: '19:00',
      venue: 'Venue name',
      address: 'Street, City',
    },
    {
      name: 'Walima',
      date: '2026-12-13',
      start: '19:30',
      end: '23:00',
      venue: 'Venue name',
      address: 'Street, City',
    },
  ],

  verse: {
    arabic: 'وَخَلَقْنَاكُمْ أَزْوَاجًا',
    english: 'and We created you in pairs · An-Naba 78:8',
  },

  rsvp: {
    // WhatsApp number with country code, digits only (e.g. '923001234567').
    // Leave empty to hide the RSVP button.
    whatsapp: '',
    by: '2026-11-30',
  },
};
