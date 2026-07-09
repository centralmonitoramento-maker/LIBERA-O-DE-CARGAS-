import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

let cachedAccessToken: string | null = null;
let googleUser: any = null;

// Helper to base64url encode a string safely supporting UTF-8 characters
function base64urlEncode(str: string): string {
  const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Compiles a proper MIME message for Gmail REST API send action
const makeEmail = (to: string, subject: string, htmlBody: string) => {
  // Use UTF-8 base64 encoding for subject to ensure accents work correctly
  const utf8Subject = `=?utf-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}?=`;
  const str = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlBody
  ].join('\r\n');
  return base64urlEncode(str);
};

export const getGmailToken = () => cachedAccessToken;
export const getGmailUser = () => googleUser;

export const setGmailTokenAndUser = (token: string | null, user: any) => {
  cachedAccessToken = token;
  googleUser = user;
  window.dispatchEvent(new CustomEvent('gmail-auth-changed'));
};

export const signInWithGmail = async () => {
  const provider = new GoogleAuthProvider();
  // Request required Gmail scopes
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.addScope('https://www.googleapis.com/auth/gmail.modify');
  provider.addScope('https://www.googleapis.com/auth/gmail.compose');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Gmail.');
    }
    cachedAccessToken = credential.accessToken;
    googleUser = result.user;
    window.dispatchEvent(new CustomEvent('gmail-auth-changed'));
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    if (error && (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed-by-user'))) {
      console.warn('Autenticação do Gmail cancelada pelo usuário (popup fechado).');
    } else {
      console.error('Erro na autenticação do Gmail:', error);
    }
    throw error;
  }
};

export const logoutGmail = () => {
  cachedAccessToken = null;
  googleUser = null;
  window.dispatchEvent(new CustomEvent('gmail-auth-changed'));
};

export const fetchGmailProfile = async () => {
  if (!cachedAccessToken) throw new Error('Não autenticado no Gmail.');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${cachedAccessToken}` }
  });
  if (!response.ok) {
    throw new Error('Falha ao obter perfil do Gmail.');
  }
  return response.json();
};

export const sendGmailEmail = async (to: string, subject: string, htmlBody: string) => {
  if (!cachedAccessToken) throw new Error('Não autenticado no Gmail.');
  
  const rawEmail = makeEmail(to, subject, htmlBody);
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawEmail })
  });
  
  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    console.error('Erro ao enviar e-mail via Gmail API:', errorDetails);
    throw new Error('Falha ao enviar e-mail via Gmail API.');
  }
  
  return response.json();
};

export const fetchGmailSentMessages = async (maxResults = 5) => {
  if (!cachedAccessToken) throw new Error('Não autenticado no Gmail.');
  
  // List messages from user's mailbox (limiting to 10 to filter the sent ones)
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults * 2}`, {
    headers: { Authorization: `Bearer ${cachedAccessToken}` }
  });
  if (!response.ok) {
    throw new Error('Falha ao obter lista de e-mails.');
  }
  const data = await response.json();
  if (!data.messages) return [];
  
  // Fetch details to find out if they are actually sent emails or are in inbox
  const detailedMessages = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${cachedAccessToken}` }
        });
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sem Assunto)';
          const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '(Desconhecido)';
          const dateStr = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          
          return {
            id: msg.id,
            to,
            subject,
            date: dateStr ? new Date(dateStr).toLocaleString('pt-BR') : '',
            snippet: detail.snippet || '',
            labelIds: detail.labelIds || []
          };
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes da mensagem:', err);
      }
      return null;
    })
  );
  
  // Filter for messages that have 'SENT' label
  return detailedMessages
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .filter(m => m.labelIds.includes('SENT'))
    .slice(0, maxResults);
};
