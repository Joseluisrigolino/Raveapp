export const ROUTES = {
  MAIN: {
    EVENTS: {
      MENU: "/events/screens/MenuPantalla",
      CREATE: "/events/screens/CrearEventoPantalla",
      EVENT: "/events/screens/EventoPantalla",
      FAV: "/events/screens/EventoLikeadoPantalla",
    },
    ARTISTS: {
      LIST: "/artists/screens/ArtistasPantalla",
      ITEM: "/artists/screens/ArtistaPantalla",
    },
    NEWS: {
      LIST: "/news/screens/NewsScreen",
      ITEM: "/news/screens/NewScreen",
    },
    TICKETS: {
      MENU: "/tickets/screens/TicketPurchasedMenu",
      FINALIZED: "/tickets/screens/TicketFinalizedScreen",
      PURCHASED: "/tickets/screens/TicketPurchasedScreen",
      BUY: "/tickets/screens/BuyTicketScreen",
      RETURN: "/tickets/screens/VueltaCompraPantalla",
    },
    USER: {
      PROFILE_EDIT: "/auth/screens/PerfilDeUsuarioPantalla",
      PROFILE: "/auth/screens/PerfilDeUsuarioPantalla",
    },
  },
  ADMIN: {
    ARTISTS: {
      MANAGE: "/artists/screens/AdministrarArtistasPantalla",
      EDIT: "/artists/screens/EditarArtistaPantalla",
      NEW: "/artists/screens/NuevoArtistaPantalla",
    },
    NEWS: {
      MANAGE: "/news/screens/ManageNewScreen",
      CREATE: "/news/screens/CreateNewScreen",
      EDIT: "/news/screens/EditNewScreen",
    },
    EVENTS_VALIDATE: {
      LIST: "/events/screens/AdminEventsToValidateScreen",
      VALIDATE: "/events/screens/ValidateEventScreen",
    },
    REPORT_SALES: {
      MENU: "/sales/screens/ReporteVentaEntradaMenu",
    },
    TYC: "/tyc/screens/Tyc",
  },
  OWNER: {
    PARTY_RATINGS: "/reviews/screens/PartyRatingsScreen",
    PARTYS: "/party/screens/FiestasPantalla",
    MANAGE_EVENTS: "/events/screens/EventsAdminScreen",
    // Apunta al menú de reporte de ventas (pantalla administrativa/menu)
    TICKET_SOLD: "/sales/screens/ReporteVentaEntradaMenu",
    MODIFY_EVENT: "/events/screens/OwnerEventModifyScreen",
    CANCEL_EVENT: "/events/screens/CancelarEventoPantalla",
  },
  CONTROLLER: {
    SCANNER: "/scanner/screens/scannerScreen",
    CREATE_USER: "/auth/screens/CreateUserController",
  },
  LOGIN: {
    LOGIN: "/auth/screens/login",
    REGISTER: "/auth/screens/RegistroUsuario",
    CONTROLLER: "/auth/screens/UserControllerLoginScreen",
  },
  NOT_FOUND: "/+not-found",
} as const;

export default ROUTES;
