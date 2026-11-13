import { randomBytes, sha256, toBase64Url } from './base64';

export interface DpopProofInput {
  keyPair: CryptoKeyPair;
  publicJwk: JsonWebKey;
  htu: string;
  htm: string;
  nonce: string;
  accessToken?: string;
}

export async function createDpopProof(input: DpopProofInput): Promise<string> {
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk: input.publicJwk,
  };

  const payload: Record<string, string | number> = {
    htu: input.htu,
    htm: input.htm,
    jti: toBase64Url(randomBytes(12)),
    iat: Math.floor(Date.now() / 1000),
    nonce: input.nonce,
  };

  if (input.accessToken) {
    payload.ath = toBase64Url(await sha256(input.accessToken));
  }

  const encoder = new TextEncoder();
  const signingInput = `${toBase64Url(encoder.encode(JSON.stringify(header)))}.${toBase64Url(
    encoder.encode(JSON.stringify(payload)),
  )}`;

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    input.keyPair.privateKey,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}
