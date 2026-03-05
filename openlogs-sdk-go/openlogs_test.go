package openlogssdk

import "testing"

func TestChainLinksAndVerifies(t *testing.T) {
    svc := NewChainService()

    r1, err := svc.Log(Entry{Actor: "system:test", TPS: "tps://node:test@T:unix.1700000000", Event: "event.a"})
    if err != nil {
        t.Fatalf("log r1: %v", err)
    }

    r2, err := svc.Log(Entry{Actor: "system:test", TPS: "tps://node:test@T:unix.1700000010", Event: "event.b"})
    if err != nil {
        t.Fatalf("log r2: %v", err)
    }

    if r1.Prev != "" {
        t.Fatalf("expected empty prev for first record")
    }
    if r2.Prev != r1.Hash {
        t.Fatalf("expected chain prev hash match")
    }
    if !svc.VerifyChain() {
        t.Fatalf("expected chain verify true")
    }
}

func TestSignAndVerify(t *testing.T) {
    svc := NewChainService()
    priv, pub, err := GenerateEd25519Keypair()
    if err != nil {
        t.Fatalf("generate keypair: %v", err)
    }

    rec, err := svc.LogSigned(
        Entry{Actor: "system:test", TPS: "tps://node:test@T:unix.1700000000", Event: "event.a"},
        priv,
        pub,
        "k1",
    )
    if err != nil {
        t.Fatalf("log signed: %v", err)
    }

    if rec.Signature == nil || rec.Signature.Alg != "Ed25519" {
        t.Fatalf("expected ed25519 signature")
    }
    if !svc.VerifySignatures(pub) {
        t.Fatalf("expected signature verification true")
    }
}
