import AR from "country-flag-icons/react/3x2/AR";
import BR from "country-flag-icons/react/3x2/BR";
import CL from "country-flag-icons/react/3x2/CL";
import CO from "country-flag-icons/react/3x2/CO";
import ES from "country-flag-icons/react/3x2/ES";
import MX from "country-flag-icons/react/3x2/MX";
import PT from "country-flag-icons/react/3x2/PT";
import PY from "country-flag-icons/react/3x2/PY";
import US from "country-flag-icons/react/3x2/US";
import UY from "country-flag-icons/react/3x2/UY";

// Bandeiras SVG inline (country-flag-icons, sem CDN), só dos DDIs do form.
// Emoji de bandeira não renderiza no Windows (vira "BR"); o SVG sai igual em todo lugar.
export const SVG_FLAGS: Record<string, typeof BR> = { AR, BR, CL, CO, ES, MX, PT, PY, US, UY };

export const FlagBR = BR;
