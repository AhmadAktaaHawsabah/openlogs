package com.nextera.one.openlogs.sdk;

import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public final class OpenLogsSigner {
  private static final String ALGORITHM = "Ed25519";

  private OpenLogsSigner() {
  }

  public static OpenLogsKeyPair generateKeyPair() {
    try {
      KeyPairGenerator generator = KeyPairGenerator.getInstance(ALGORITHM);
      KeyPair keyPair = generator.generateKeyPair();
      return new OpenLogsKeyPair(keyPair.getPrivate(), keyPair.getPublic());
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("Failed to generate Ed25519 key pair", e);
    }
  }

  public static OpenLogsRecord signRecord(OpenLogsRecord record, PrivateKey privateKey, PublicKey publicKey, String kid) {
    Objects.requireNonNull(record, "record is required");
    Objects.requireNonNull(privateKey, "privateKey is required");
    Objects.requireNonNull(publicKey, "publicKey is required");

    String payload = signingPayload(record);
    String signatureHex = signHex(payload, privateKey);
    String publicKeyHex = HexFormat.of().formatHex(publicKey.getEncoded());

    return record.withSignature(new OpenLogsSignature(ALGORITHM, publicKeyHex, signatureHex, kid));
  }

  public static boolean verifySignature(OpenLogsRecord record, PublicKey publicKey) {
    Objects.requireNonNull(record, "record is required");
    Objects.requireNonNull(publicKey, "publicKey is required");
    if (record.getSignature() == null) {
      return false;
    }

    String payload = signingPayload(record);
    byte[] signature = HexFormat.of().parseHex(record.getSignature().getValueHex());

    try {
      Signature verifier = Signature.getInstance(ALGORITHM);
      verifier.initVerify(publicKey);
      verifier.update(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return verifier.verify(signature);
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("Failed to verify signature", e);
    }
  }

  private static String signHex(String payload, PrivateKey privateKey) {
    try {
      Signature signer = Signature.getInstance(ALGORITHM);
      signer.initSign(privateKey);
      signer.update(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(signer.sign());
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException("Failed to sign payload", e);
    }
  }

  private static String signingPayload(OpenLogsRecord record) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("spec", record.getSpec());
    payload.put("id", record.getId());
    payload.put("prev", record.getPrev());
    payload.put("hash", record.getHash());

    Map<String, Object> entry = new LinkedHashMap<>();
    entry.put("actor", record.getEntry().getActor());
    entry.put("tps", record.getEntry().getTps());
    entry.put("event", record.getEntry().getEvent());
    entry.put("data", record.getEntry().getData());
    entry.put("indexes", record.getEntry().getIndexes());
    payload.put("entry", entry);

    return CanonicalJson.stringify(payload);
  }
}
