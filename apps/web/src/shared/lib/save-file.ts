// Отдаёт браузеру файл из ответа API: ссылка с download и клик по ней.
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  // Сразу revoke обрывает загрузку в Firefox и Safari.
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}
