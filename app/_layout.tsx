import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext"; // ruta de tu AuthContext

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f4511e",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="RegisterUserScreen" />
        <Stack.Screen name="MenuScreen" />
        <Stack.Screen name="EventScreen" />
        <Stack.Screen name="FavEventScreen" />
        <Stack.Screen name="ArtistsScreen" />
        <Stack.Screen name="ArtistScreen" />
        <Stack.Screen name="NewsScreen" />
        <Stack.Screen name="NewScreen" />
        <Stack.Screen name="TicketFinalizedScreen" />
        <Stack.Screen name="TicketPurchasedMenu" />
        <Stack.Screen name="BuyTicketScreen" />
        <Stack.Screen name="UserProfileEditScreen" />
        <Stack.Screen name="CreateEventScreen" />
        <Stack.Screen name="CreateNewScreen" />
        <Stack.Screen name="EditNewScreen" />
        <Stack.Screen name="ManageNewsScreen" />
        <Stack.Screen name="NewArtistScreen" />
        <Stack.Screen name="EditArtistScreen" />
        <Stack.Screen name="ManageArtistsScreen" />
        <Stack.Screen name="EventsToValidateScreen" />
        <Stack.Screen name="ValidateEventScreen" />
        <Stack.Screen name="ManageEventsScreen" />
        <Stack.Screen name="ModifyEventScreen" />
      </Stack>
    </AuthProvider>
  );
}
