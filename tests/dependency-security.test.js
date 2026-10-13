import test from 'node:test'
import assert from 'node:assert/strict'
import { constants, createHash, generateKeyPairSync, privateEncrypt, sign } from 'node:crypto'
import forge from 'node-forge'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const verifier = forge.pki.publicKeyFromPem(publicKey.export({ type: 'pkcs1', format: 'pem' }))
const message = Buffer.from('TimeForge dependency security regression')

test('RSA verification rejects extra children inside DigestAlgorithm (CVE-2026-85393)', () => {
  const asn1 = forge.asn1
  const node = (type, value, constructed = false) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value)
  const digest = createHash('sha256').update(message).digest()
  const digestInfo = node(asn1.Type.SEQUENCE, [
    node(asn1.Type.SEQUENCE, [
      node(asn1.Type.OID, asn1.oidToDer(forge.oids.sha256).getBytes()),
      node(asn1.Type.NULL, ''),
      node(asn1.Type.OCTETSTRING, 'unexpected nested data')
    ], true),
    node(asn1.Type.OCTETSTRING, digest.toString('binary'))
  ], true)
  const encoded = Buffer.from(asn1.toDer(digestInfo).getBytes(), 'binary')
  const padded = Buffer.concat([Buffer.from([0, 1]), Buffer.alloc(256 - encoded.length - 3, 0xff), Buffer.from([0]), encoded])
  const signature = privateEncrypt({ key: privateKey, padding: constants.RSA_NO_PADDING }, padded)
  assert.throws(() => verifier.verify(digest.toString('binary'), signature.toString('binary')), /DigestInfo/)
})

test('RSA verification still accepts valid SHA-256 and SHA-512 signatures', () => {
  for (const algorithm of ['sha256', 'sha512']) {
    const signature = sign(algorithm, message, privateKey)
    const digest = createHash(algorithm).update(message).digest('binary')
    assert.equal(verifier.verify(digest, signature.toString('binary')), true)
  }
})
