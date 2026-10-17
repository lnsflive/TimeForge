import { constants, createHash, generateKeyPairSync, privateEncrypt, sign } from 'node:crypto'
import forge from 'node-forge'
import { describe, expect, test } from 'vitest'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicPem = publicKey.export({ type: 'pkcs1', format: 'pem' })
if (typeof publicPem !== 'string') throw new Error('Expected a PEM string')
const verifier = forge.pki.publicKeyFromPem(publicPem)
const message = Buffer.from('TimeForge dependency security regression')

describe('node-forge security patch', () => {
  test('rejects extra children inside DigestAlgorithm (CVE-2026-85393)', () => {
    const asn1 = forge.asn1
    const node = (type: number, value: forge.asn1.Asn1['value'], constructed = false) =>
      asn1.create(asn1.Class.UNIVERSAL, type, constructed, value)
    const digest = createHash('sha256').update(message).digest()
    const digestInfo = node(asn1.Type.SEQUENCE, [
      node(asn1.Type.SEQUENCE, [
        node(asn1.Type.OID, asn1.oidToDer(forge.pki.oids.sha256).getBytes()),
        node(asn1.Type.NULL, ''),
        node(asn1.Type.OCTETSTRING, 'unexpected nested data'),
      ], true),
      node(asn1.Type.OCTETSTRING, digest.toString('binary')),
    ], true)
    const encoded = Buffer.from(asn1.toDer(digestInfo).getBytes(), 'binary')
    const padded = Buffer.concat([
      Buffer.from([0, 1]),
      Buffer.alloc(256 - encoded.length - 3, 0xff),
      Buffer.from([0]),
      encoded,
    ])
    const signature = privateEncrypt({ key: privateKey, padding: constants.RSA_NO_PADDING }, padded)
    expect(() => verifier.verify(digest.toString('binary'), signature.toString('binary'))).toThrow(/DigestInfo/)
  })

  test('accepts valid SHA-256 and SHA-512 signatures', () => {
    for (const algorithm of ['sha256', 'sha512']) {
      const signature = sign(algorithm, message, privateKey)
      const digest = createHash(algorithm).update(message).digest('binary')
      expect(verifier.verify(digest, signature.toString('binary'))).toBe(true)
    }
  })
})
