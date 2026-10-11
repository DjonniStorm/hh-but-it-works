import { ConsentDocument } from "@/pages/legal/ui/ConsentDocument";
import { ROUTES } from "@/shared/router/routes";
import { pageSeo } from "@/shared/seo/pages";
import { usePageSeo } from "@/shared/seo/use-page-seo";
import { Anchor, Center, Paper, Stack } from "@mantine/core";
import { Link } from "react-router";

export const ConsentPage = () => {
  usePageSeo(pageSeo.consent);

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
