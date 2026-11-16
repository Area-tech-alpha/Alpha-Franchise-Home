import type { TitlePart } from "@/lib/content";

import { Fragment } from "react";

// Renderiza um título/texto em partes; { em: true } vira o destaque itálico
// amarelo e { br: true } força quebra de linha depois da parte.
export function Rich({ parts, emClassName = "em" }: { parts: readonly TitlePart[]; emClassName?: string }) {
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          <span className={part.em ? emClassName : undefined}>{part.text}</span>
          {part.br && <br />}
        </Fragment>
      ))}
    </>
  );
}
