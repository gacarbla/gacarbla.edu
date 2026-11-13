import { Aes128Gcm, CipherSuite, DhkemX25519HkdfSha256, HkdfSha256 } from '@hpke/core';
import { concatBytes, fromBase64, toBase64Url } from './base64';

export const HPKE_INFO_USERS = 'gacarbla.users.v1.credentials';
export const HPKE_INFO_EDU = 'gacarbla.edu.v1.credentials';

const suite = new CipherSuite({
  kem: new DhkemX25519HkdfSha256(),
  kdf: new HkdfSha256(),
  aead: new Aes128Gcm(),
});

/**
 * El servidor entrega `serverHpkePubB64` en base64 estándar en cada hello.
 * El bundle resultante va en base64url(enc || ciphertext).
 */
export async function sealCredentials(
  serverHpkePubB64: string,
  payload: Record<string, unknown>,
  info: string,
): Promise<string> {
  const recipientPublicKey = await suite.kem.deserializePublicKey(fromBase64(serverHpkePubB64));
  const sender = await suite.createSenderContext({
    recipientPublicKey,
    info: new TextEncoder().encode(info),
  });
  const ciphertext = await sender.seal(new TextEncoder().encode(JSON.stringify(payload)));
  return toBase64Url(concatBytes(new Uint8Array(sender.enc), new Uint8Array(ciphertext)));
}
