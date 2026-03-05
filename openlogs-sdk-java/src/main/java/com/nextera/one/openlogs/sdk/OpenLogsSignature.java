package com.nextera.one.openlogs.sdk;

import java.util.Objects;

public class OpenLogsSignature {
  private final String alg;
  private final String publicKeyHex;
  private final String valueHex;
  private final String kid;

  public OpenLogsSignature(String alg, String publicKeyHex, String valueHex, String kid) {
    this.alg = Objects.requireNonNull(alg, "alg is required");
    this.publicKeyHex = Objects.requireNonNull(publicKeyHex, "publicKeyHex is required");
    this.valueHex = Objects.requireNonNull(valueHex, "valueHex is required");
    this.kid = kid;
  }

  public String getAlg() {
    return alg;
  }

  public String getPublicKeyHex() {
    return publicKeyHex;
  }

  public String getValueHex() {
    return valueHex;
  }

  public String getKid() {
    return kid;
  }
}
