type Theme = {
  bg: string; card: string; ink: string; sub: string;
  brand: string; brand2: string; line: string; muted: string; accent: string;
};

// Light (default) – polished whites/greens to match Alpine logo.
export const defaultTheme: Theme = {
  bg:    "#FFFFFF",
  card:  "#FFFFFF",
  ink:   "#10231D",
  sub:   "#52776A",
  brand: "#2E6A4F",
  brand2:"#6FA083",
  line:  "#DCE9E2",
  muted: "#F4F8F6",
  accent:"#2E6A4F",
};

// Optional dark, if you want to flip via ?theme=dark
export const darkTheme: Theme = {
  bg:    "#062426",
  card:  "#0E1614",
  ink:   "#FDFDFD",
  sub:   "#98AAA2",
  brand: "#4B735B",
  brand2:"#98AAA2",
  line:  "#34554B",
  muted: "#658972",
  accent:"#B3C5B9",
};

export function setTheme(vars?: Partial<Theme>) {
  const root = document.documentElement;
  const t = { ...(vars ? { ...defaultTheme, ...vars } : defaultTheme) };
  (Object.keys(t) as (keyof Theme)[]).forEach((k) => {
    root.style.setProperty(`--${k}`, t[k]);
  });
}

// Default to light; allow ?theme=dark to switch.
export function setThemeFromQuery() {
  try {
    const u = new URL(window.location.href);
    const mode = u.searchParams.get("theme");
    if (mode === "dark") {
      const root = document.documentElement;
      (Object.keys(darkTheme) as (keyof Theme)[]).forEach((k) => {
        root.style.setProperty(`--${k}`, darkTheme[k]);
      });
      return;
    }
  } catch {}
  setTheme(defaultTheme);
}
