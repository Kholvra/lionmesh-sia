const PAGE_SIZE = 1000;

export async function readAllPages(
  readPage: (from: number, to: number) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
): Promise<{ data: unknown[]; error: string | null }> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await readPage(from, from + PAGE_SIZE - 1);
    if (result.error) return { data: [], error: result.error.message };
    if (!Array.isArray(result.data)) return { data: [], error: "Respons data tidak valid." };
    rows.push(...result.data);
    if (result.data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}
