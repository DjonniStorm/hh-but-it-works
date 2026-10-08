import { formatGradeRange } from "@/pages/employer/model/grade-range";
import { SkillList } from "@/pages/employer/ui/SkillList";
import { SummaryItem } from "@/pages/employer/ui/SummaryItem";
import { specializationLabel, workFormatLabel } from "@/shared/lib/labels";
import { Group, Paper } from "@mantine/core";

import { type HiringNeed, formatSalary } from "@hh/contracts";

export const NeedSummary = ({ need }: { need: HiringNeed }) => {
  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="xl" align="flex-start">
        <SummaryItem label="Категория">
          {specializationLabel[need.specialization]} ·{" "}
          {formatGradeRange(need.gradeFrom, need.gradeTo)}
        </SummaryItem>
        <SummaryItem label="Вилка">
          {formatSalary(need.salaryFrom, need.salaryTo)}
        </SummaryItem>
        <SummaryItem label="Формат">
          {workFormatLabel[need.workFormat]}
        </SummaryItem>
        <SkillList label="Обязательные навыки" skills={need.mustSkills} />
        {need.niceSkills.length > 0 ? (
          <SkillList
            label="Желательные"
            skills={need.niceSkills}
            variant="outline"
          />
        ) : null}
      </Group>
    </Paper>
  );
};
