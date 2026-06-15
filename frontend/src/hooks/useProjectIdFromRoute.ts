import { useMatch } from 'react-router-dom';

/**
 * Resolves project id from the URL for routes that include `:projectId`.
 * `useParams()` from a layout/header only sees the parent route segment, so it
 * misses nested params — matching full paths avoids that.
 */
export function useProjectIdFromRoute(): string | undefined {
  const profileMatch = useMatch('/profile/:projectId');
  const chatLibraryMatch = useMatch('/chat/:projectId/conversations');
  const chatProjectMatch = useMatch('/chat/:projectId/:chatId');
  return (
    profileMatch?.params.projectId ??
    chatLibraryMatch?.params.projectId ??
    chatProjectMatch?.params.projectId
  );
}
