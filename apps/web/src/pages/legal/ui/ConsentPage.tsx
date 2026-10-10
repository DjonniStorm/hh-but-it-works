import { ConsentDocument } from "@/pages/legal/ui/ConsentDocument";
import { pageTitle } from "@/shared/router/page-title";
import { ROUTES } from "@/shared/router/routes";
import { Anchor, Center, Paper, Stack } from "@mantine/core";
import { useHead } from "@unhead/react";
import { Link } from "react-router";

export const ConsentPage = () => {
  useHead({ title: pageTitle.consent });

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder p="xl" maw={720} w="100%">
        <Stack>
          <ConsentDocument />
          <Anchor component={Link} to={ROUTES.AUTH.REGISTER}>
            К регистрации
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
};
