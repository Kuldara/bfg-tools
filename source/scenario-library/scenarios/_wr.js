/* Shared helpers for the Warp Rift scenario files. Issue dates from horizon's
   Warp Rift index (tulosteet/ref/warp_rift/warp_rift_index.xlsx). */
const WR_DATES = {
  1: "April 2004", 2: "June 2004", 3: "August 2004", 4: "October 2004", 5: "December 2004", 6: "February 2005", 7: "April 2005", 8: "August 2005", 9: "October 2005", 10: "March 2006",
  11: "March 2007", 12: "May 2007", 13: "July 2007", 14: "September 2007", 15: "November 2007", 16: "January 2008", 17: "March 2008", 18: "May 2008", 19: "July 2008", 20: "September 2008",
  21: "November 2008", 22: "January 2009", 23: "April 2009", 24: "June 2009", 25: "August 2009", 26: "October 2009", 27: "January 2010", 28: "May 2010", 29: "September 2010",
  31: "March 2011", 32: "May 2011", 33: "January 2012", 34: "February 2022", 35: "May 2022", 36: "October 2022", 37: "January 2023", 38: "March 2023", 39: "May 2023", 40: "July 2023",
  41: "October 2023", 42: "December 2023", 43: "March 2024", 44: "June 2024", 45: "October 2024", 46: "March 2025", 47: "October 2025", 48: "February 2026", 49: "June 2026"
};
function wrCredit(n, author) { return author + " — Warp Rift " + n + (WR_DATES[n] ? " (" + WR_DATES[n] + ")" : "") + "."; }
/* the long edge entry ticks used by several scenarios */
function entryTicks(fromRight, W) { return [30, 60, 90].map((d, i) => [fromRight ? W - d : d, "T" + (i + 2)]).filter(t => t[0] > 4 && t[0] < W - 4); }
