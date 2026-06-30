export default async function handler(req: any, res: any) {
  // Return a simple HTML page that posts the code back to the parent window and closes itself
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authenticating...</title>
      </head>
      <body style="background-color: #050816; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <div style="border: 4px solid rgba(255,255,255,0.1); border-left-color: #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Authentication Successful</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Completing your secure login. This window will close automatically.</p>
        </div>
        <script>
          // Send auth code and parameters back to the parent iframe window
          if (window.opener) {
            window.opener.postMessage({
              type: 'SUPABASE_OAUTH_SUCCESS',
              hash: window.location.hash,
              search: window.location.search
            }, '*');
            // Close after a brief delay to ensure the message was posted
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // Fallback: If not in popup, redirect back home
            const hash = window.location.hash;
            const search = window.location.search;
            window.location.href = "/" + search + hash;
          }
        </script>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </body>
    </html>
  `);
}
