export const ROUTES = {
  MAIN: {
    EVENTS: {
      MENU: "/events/screens/MenuPantalla",
      CREATE: "/events/screens/CrearEventoPantalla",
      EVENT: "/events/screens/EventoPantalla",
      FAV: "/events/screens/EventoLikeadoPantalla",
    },
    ARTISTS: {
      LIST: "/artists/screens/ArtistsScreen",
      ITEM: "/artists/screens/ArtistScreen",
    },
    NEWS: {
      LIST: "/news/screens/NewsScreen",
      ITEM: "/news/screens/NewScreen",
    },
    TICKETS: {
      MENU: "/tickets/screens/TicketPurchasedMenu",
      PURCHASED: "/tickets/screens/TicketPurchasedScreen",
      BUY: "/tickets/screens/BuyTicketScreen",
      RETURN: "/tickets/screens/BackBuyScreen",
    },
    USER: {
      PROFILE_EDIT: "/auth/screens/PerfilDeUsuarioPantalla",
      PROFILE: "/auth/screens/PerfilDeUsuarioPantalla",
    },
  },
  ADMIN: {
    ARTISTS: {
      MANAGE: "/artists/screens/AdminArtistScreen",
      EDIT: "/artists/screens/EditArtistScreen",
      NEW: "/artists/screens/NewArtistScreen",
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
      MENU: "/sales/screens/EventTicketSalesMenuScreen",
    },
    TYC: "/tyc/screens/Tyc",
  },
  OWNER: {
    PARTY_RATINGS: "/reviews/screens/PartyRatingsScreen",
    PARTYS: "/party/screens/PartysScreen",
    MANAGE_EVENTS: "/events/screens/EventsAdminScreen",
    // Menú de selección de evento para ver reportes
    TICKET_SOLD: "/sales/screens/TicketSoldScreen",
    // Pantalla de reporte de ventas por evento específico
    TICKET_SOLD_EVENT: "/sales/screens/EventTicketSalesReportScreen",
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
    RECOVER: "/auth/screens/RecuperarContrasena",
    CONTROLLER: "/auth/screens/UserControllerLoginScreen",
  },
  NOT_FOUND: "/+not-found",
} as const;

export default ROUTES;
