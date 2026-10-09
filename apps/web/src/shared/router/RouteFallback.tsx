import { Center, Loader } from "@mantine/core";

// Пока браузер догружает чанк страницы. Оболочка в это время уже на экране.
export const RouteFallback = ({
  fullScreen = false,
}: {
  fullScreen?: boolean;
}) => {
  return (
    <Center mih={fullScreen ? "100vh" : 240}>
      <Loader color="fsp" />
    </Center>
  );
};
