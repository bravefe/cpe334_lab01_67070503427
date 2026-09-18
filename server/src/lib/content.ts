export function validateContent(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const content = value.trim();
  if (!content || content.length > 2000) return null;
  return content;
}

export function createCommentOrNote(
  input: { content?: unknown; authorId?: unknown; createdAt?: unknown },
  context: { authorId: number; now: number },
) {
  const content = validateContent(input.content);
  if (!content) {
    throw new Error("Content must be between 1 and 2000 characters.");
  }

  return {
    content,
    authorId: context.authorId,
    createdAt: context.now,
  };
}
