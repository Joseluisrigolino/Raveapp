export interface GenericEmailRequest {
  to: string;
  titulo: string;
  cuerpo: string;
  botonUrl?: string;
  botonTexto?: string;
}
