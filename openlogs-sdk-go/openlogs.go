package openlogssdk

import (
    "crypto/ed25519"
    "crypto/rand"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "sync"

    "github.com/google/uuid"
)

const Spec = "openlogs.v2"

type Entry struct {
    Actor   string                 `json:"actor"`
    TPS     string                 `json:"tps"`
    Event   string                 `json:"event"`
    Data    map[string]interface{} `json:"data,omitempty"`
    Indexes map[string]string      `json:"indexes,omitempty"`
}

type Signature struct {
    Alg          string `json:"alg"`
    PublicKeyHex string `json:"publicKeyHex"`
    ValueHex     string `json:"valueHex"`
    KID          string `json:"kid,omitempty"`
}

type Record struct {
    Spec      string     `json:"spec"`
    ID        string     `json:"id"`
    Entry     Entry      `json:"entry"`
    Prev      string     `json:"prev,omitempty"`
    Hash      string     `json:"hash"`
    Signature *Signature `json:"signature,omitempty"`
}

type ChainService struct {
    mu         sync.Mutex
    records    []Record
    latestHash string
}

func NewChainService() *ChainService {
    return &ChainService{}
}

func (c *ChainService) Log(entry Entry) (Record, error) {
    c.mu.Lock()
    defer c.mu.Unlock()

    recordID := uuid.NewString()
    prev := c.latestHash
    hash, err := ComputeHash(Spec, recordID, entry, prev)
    if err != nil {
        return Record{}, err
    }

    record := Record{
        Spec:  Spec,
        ID:    recordID,
        Entry: entry,
        Prev:  prev,
        Hash:  hash,
    }

    c.records = append(c.records, record)
    c.latestHash = record.Hash
    return record, nil
}

func (c *ChainService) LogSigned(entry Entry, privateKey ed25519.PrivateKey, publicKey ed25519.PublicKey, kid string) (Record, error) {
    unsigned, err := c.Log(entry)
    if err != nil {
        return Record{}, err
    }

    signed, err := SignRecord(unsigned, privateKey, publicKey, kid)
    if err != nil {
        return Record{}, err
    }

    c.mu.Lock()
    c.records[len(c.records)-1] = signed
    c.mu.Unlock()

    return signed, nil
}

func (c *ChainService) GetChain() []Record {
    c.mu.Lock()
    defer c.mu.Unlock()

    cp := make([]Record, len(c.records))
    copy(cp, c.records)
    return cp
}

func (c *ChainService) GetLatestHash() string {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.latestHash
}

func (c *ChainService) VerifyChain() bool {
    c.mu.Lock()
    defer c.mu.Unlock()

    expectedPrev := ""
    for _, record := range c.records {
        if record.Prev != expectedPrev {
            return false
        }

        recomputed, err := ComputeHash(record.Spec, record.ID, record.Entry, record.Prev)
        if err != nil || recomputed != record.Hash {
            return false
        }
        expectedPrev = record.Hash
    }
    return true
}

func (c *ChainService) VerifySignatures(publicKey ed25519.PublicKey) bool {
    c.mu.Lock()
    defer c.mu.Unlock()

    for _, record := range c.records {
        if record.Signature == nil {
            continue
        }
        if !VerifyRecordSignature(record, publicKey) {
            return false
        }
    }
    return true
}

func ComputeHash(spec, recordID string, entry Entry, prev string) (string, error) {
    payload := map[string]interface{}{
        "spec": spec,
        "id":   recordID,
        "prev": prev,
        "entry": map[string]interface{}{
            "actor":   entry.Actor,
            "tps":     entry.TPS,
            "event":   entry.Event,
            "data":    entry.Data,
            "indexes": entry.Indexes,
        },
    }

    canonical, err := json.Marshal(payload)
    if err != nil {
        return "", fmt.Errorf("marshal payload: %w", err)
    }

    digest := sha256.Sum256(canonical)
    return hex.EncodeToString(digest[:]), nil
}

func GenerateEd25519Keypair() (ed25519.PrivateKey, ed25519.PublicKey, error) {
    pub, priv, err := ed25519.GenerateKey(rand.Reader)
    if err != nil {
        return nil, nil, err
    }
    return priv, pub, nil
}

func SignRecord(record Record, privateKey ed25519.PrivateKey, publicKey ed25519.PublicKey, kid string) (Record, error) {
    payload, err := signingPayload(record)
    if err != nil {
        return Record{}, err
    }

    signature := ed25519.Sign(privateKey, payload)
    record.Signature = &Signature{
        Alg:          "Ed25519",
        PublicKeyHex: hex.EncodeToString(publicKey),
        ValueHex:     hex.EncodeToString(signature),
        KID:          kid,
    }
    return record, nil
}

func VerifyRecordSignature(record Record, publicKey ed25519.PublicKey) bool {
    if record.Signature == nil {
        return false
    }

    payload, err := signingPayload(record)
    if err != nil {
        return false
    }

    signatureBytes, err := hex.DecodeString(record.Signature.ValueHex)
    if err != nil {
        return false
    }

    return ed25519.Verify(publicKey, payload, signatureBytes)
}

func signingPayload(record Record) ([]byte, error) {
    payload := map[string]interface{}{
        "spec": record.Spec,
        "id":   record.ID,
        "prev": record.Prev,
        "hash": record.Hash,
        "entry": map[string]interface{}{
            "actor":   record.Entry.Actor,
            "tps":     record.Entry.TPS,
            "event":   record.Entry.Event,
            "data":    record.Entry.Data,
            "indexes": record.Entry.Indexes,
        },
    }
    return json.Marshal(payload)
}
