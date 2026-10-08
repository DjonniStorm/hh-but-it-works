import { useStore } from "@/app/store/store-context";
import { StoreKey } from "@/app/store/store-key";
import { waitingInvitations } from "@/pages/invitations/model/answer";
import { formatSalary } from "@/shared/lib/format";
import { ROUTES } from "@/shared/router/routes";
import { surfaceColor } from "@/shared/theme";
import { Anchor, Box, Stack, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";

export const HomeOffer = observer(() => {
  const invitations = useStore(StoreKey.CandidateInvitations);
  const waiting = waitingInvitations(invitations.items);
  const offer = waiting[0];
  if (!offer) {
    return null;
  }
  const rest = waiting.length - 1;

  return (
    <Box p="lg" style={{ background: surfaceColor }}>
      <Stack gap="xs">
        <Text>{offer.companyName}</Text>
        <Text fz={48} lh={1}>
          {formatSalary(offer.salaryFrom, offer.salaryTo)}
        </Text>
        <Text lineClamp={1}>{offer.message}</Text>
        <Anchor component={Link} to={ROUTES.INVITATIONS}>
          Открыть приглашение
        </Anchor>
        {rest > 0 ? (
          <Anchor component={Link} to={ROUTES.INVITATIONS}>
            Ещё {rest}
          </Anchor>
        ) : null}
      </Stack>
    </Box>
  );
});
