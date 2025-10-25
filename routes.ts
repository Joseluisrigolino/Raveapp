export const ROUTES = {
  MAIN: {
    EVENTS: {
      MENU: "/main/eventos/MenuPantalla",
      CREATE: "/main/eventos/CrearEventoPantalla",
      EVENT: "/main/eventos/EventoPantalla",
      FAV: "/main/eventos/EventoLikeadoPantalla",
    },
    ARTISTS: {
      LIST: "/main/artistas/ArtistasPantalla",
      ITEM: "/main/artistas/ArtistaPantalla",
    },
    NEWS: {
      LIST: "/main/noticias/NewsScreen",
      ITEM: "/main/noticias/NewScreen",
    },
    TICKETS: {
      MENU: "/main/tickets/TicketPurchasedMenu",
      FINALIZED: "/main/tickets/TicketFinalizedScreen",
      PURCHASED: "/main/tickets/TicketPurchasedScreen",
      BUY: "/main/tickets/BuyTicketScreen",
      RETURN: "/main/tickets/VueltaCompraPantalla",
    },
    USER: {
      // The physical file is named `PerfilDeUsuarioPantalla.tsx` (exports UserProfileEditScreen),
      // so point PROFILE_EDIT to that path so expo-router can resolve it.
      PROFILE_EDIT: "/main/usuario/PerfilDeUsuarioPantalla",
      PROFILE: "/main/usuario/PerfilDeUsuarioPantalla",
    },
  },
  ADMIN: {
    ARTISTS: {
      MANAGE: "/admin/artistas-admin/AdministrarArtistasPantalla",
      EDIT: "/admin/artistas-admin/EditarArtistaPantalla",
      NEW: "/admin/artistas-admin/NuevoArtistaPantalla",
    },
    NEWS: {
      MANAGE: "/admin/NewsScreens/ManageNewScreen",
      CREATE: "/admin/NewsScreens/CreateNewScreen",
      EDIT: "/admin/NewsScreens/EditNewScreen",
    },
    EVENTS_VALIDATE: {
      LIST: "/admin/EventsValidateScreens/EventsToValidateScreen",
      VALIDATE: "/admin/EventsValidateScreens/ValidateEventScreen",
    },
    TYC: "/admin/Tyc",
  },
  OWNER: {
    PARTY_RATINGS: "/owner/PartyRatingsScreen",
  PARTYS: "/owner/FiestasPantalla",
    MANAGE_EVENTS: "/owner/AdministrarEventosPantalla",
    TICKET_SOLD: "/owner/TicketSoldScreen",
    MODIFY_EVENT: "/owner/ModifyEventScreen",
  CANCEL_EVENT: "/owner/CancelarEventoPantalla",
  },
  LOGIN: {
    LOGIN: "/login/login",
    REGISTER: "/login/RegistroUsuario",
  },
  NOT_FOUND: "/+not-found",
} as const;

export default ROUTES;
