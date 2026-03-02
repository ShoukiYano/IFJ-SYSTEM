/**
 * Replace placeholders in template content
 * This utility can be used on both client and server.
 */
export function renderTemplate(content: string, variables: Record<string, string>) {
    let rendered = content;
    Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replaceAll(`{{${key}}}`, value || "");
    });
    return rendered;
}
