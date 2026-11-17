// Herdr's exec returns CRLF line endings on Windows.
export function readCurlReport(stdout: string) {
  const [type = "", size = ""] = stdout.trim().split(/\r?\n/);
  return { type, size: Number(size) };
}
