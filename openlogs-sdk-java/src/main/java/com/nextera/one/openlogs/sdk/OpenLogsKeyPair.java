package com.nextera.one.openlogs.sdk;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Objects;

public class OpenLogsKeyPair {
  private final PrivateKey privateKey;
  private final PublicKey publicKey;

  public OpenLogsKeyPair(PrivateKey privateKey, PublicKey publicKey) {
    this.privateKey = Objects.requireNonNull(privateKey, "privateKey is required");
    this.publicKey = Objects.requireNonNull(publicKey, "publicKey is required");
  }

  public PrivateKey getPrivateKey() {
    return privateKey;
  }

  public PublicKey getPublicKey() {
    return publicKey;
  }
}
