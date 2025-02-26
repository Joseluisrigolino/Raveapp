import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
    </Stack>
  );
}
