import { useEffect, useState } from "react";

// Список учебных заведений большой (~1000 названий), поэтому тянем его отдельным
// чанком — когда человек открыл раздел «Образование», а не вместе с основным бандлом.
export function useSchools(): string[] {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    void import("@/pages/profile/model/schools")
      .then((module) => {
        if (alive) {
          setNames(module.schoolNames);
        }
      })
      .catch(() => {
        // Подсказки не критичны: при сбое поле остаётся обычным вводом.
      });
    return () => {
      alive = false;
    };
  }, []);

  return names;
}
