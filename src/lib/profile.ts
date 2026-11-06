/** The signed-in member's account details, shown on Profile and Receive. */
export const account = {
  firstName: "Eddie",
  fullName: "Eddie Walsh",
  tag: "@eddie",
  photo: "/profile/eddie.jpg",
  portrait: "/profile/eddie-portrait.jpg",
  email: "eddie.walsh@mail.com",
  phone: "+353 87 412 6630",
  address: "14 Fitzwilliam Square, Dublin 2",
  memberSince: "March 2024",
  plan: "Metal",
  iban: "IE64 NVLE 9900 1734 2286 51",
  bic: "NVLEIE2D",
  /** short link anyone can pay through */
  payLink: "nobby.me/eddie",
};

export const payUrl = (amount?: number) => `https://${account.payLink}${amount ? `/${amount}` : ""}`;
