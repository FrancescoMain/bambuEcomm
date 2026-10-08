/** Unisce classi CSS ignorando i valori falsy */
export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
