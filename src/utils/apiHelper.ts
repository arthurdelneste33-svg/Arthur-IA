/**
 * Utility helper for safe API requests with friendly diagnostics for external domains (like Vercel).
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (networkError: any) {
    throw new Error(
      `Erreur réseau lors de la communication avec le serveur (${networkError?.message || 'Connexion impossible'}). Vérifiez votre accès internet.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  
  // If the server returned an HTML page (common on Vercel when API routes are missing or redirected to index.html)
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    
    if (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || response.status === 404) {
      throw new Error(
        `L'API a renvoyé une page HTML (code HTTP ${response.status}) au lieu d'une réponse JSON.\n\n` +
        `💡 Si vous êtes sur Vercel : vérifiez que la variable d'environnement GEMINI_API_KEY est bien configurée dans les paramètres de votre projet Vercel (Project Settings > Environment Variables) et que le projet a été redéployé.`
      );
    }
    
    throw new Error(
      `Réponse inattendue du serveur (HTTP ${response.status}): ${rawText.slice(0, 150)}...`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (parseError: any) {
    throw new Error(
      `Erreur de lecture des données JSON du serveur (HTTP ${response.status}). ${parseError?.message || ''}`
    );
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Erreur serveur (HTTP ${response.status})`;
    throw new Error(errorMessage);
  }

  return data as T;
}
