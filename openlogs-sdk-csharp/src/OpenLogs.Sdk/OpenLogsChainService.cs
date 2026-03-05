using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace OpenLogs.Sdk;

public sealed class OpenLogsChainService
{
    public const string Spec = "openlogs.v2";

    private readonly List<OpenLogsRecord> _records = [];
    private string? _latestHash;

    public OpenLogsRecord Log(OpenLogsEntry entry)
    {
        var id = Guid.NewGuid().ToString();
        var prev = _latestHash;
        var hash = OpenLogsSigner.ComputeHash(Spec, id, entry, prev);

        var record = new OpenLogsRecord(Spec, id, entry, prev, hash, null);
        _records.Add(record);
        _latestHash = record.Hash;
        return record;
    }

    public OpenLogsRecord LogSigned(OpenLogsEntry entry, byte[] privateKey, byte[] publicKey, string? kid = null)
    {
        var unsigned = Log(entry);
        var signed = OpenLogsSigner.SignRecord(unsigned, privateKey, publicKey, kid);

        _records[^1] = signed;
        _latestHash = signed.Hash;
        return signed;
    }

    public IReadOnlyList<OpenLogsRecord> GetChain() => _records.ToList();

    public string? GetLatestHash() => _latestHash;

    public bool VerifyChain()
    {
        string? expectedPrev = null;
        foreach (var record in _records)
        {
            if (record.Prev != expectedPrev)
            {
                return false;
            }

            var recomputed = OpenLogsSigner.ComputeHash(record.Spec, record.Id, record.Entry, record.Prev);
            if (recomputed != record.Hash)
            {
                return false;
            }
            expectedPrev = record.Hash;
        }
        return true;
    }

    public bool VerifySignatures(byte[] publicKey)
    {
        foreach (var record in _records)
        {
            if (record.Signature is null)
            {
                continue;
            }
            if (!OpenLogsSigner.VerifyRecordSignature(record, publicKey))
            {
                return false;
            }
        }
        return true;
    }
}

public static class OpenLogsSigner
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
    };

    public static (byte[] PrivateKey, byte[] PublicKey) GenerateEd25519Keypair()
    {
        var privateKey = new byte[32];
        RandomNumberGenerator.Fill(privateKey);
        var publicKey = new byte[32];
        Ed25519.PublicKeyFromSeed(privateKey, publicKey);
        return (privateKey, publicKey);
    }

    public static string ComputeHash(string spec, string id, OpenLogsEntry entry, string? prev)
    {
        var canonical = SigningPayload(spec, id, entry, prev, null);
        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexString(digest).ToLowerInvariant();
    }

    public static OpenLogsRecord SignRecord(OpenLogsRecord record, byte[] privateKey, byte[] publicKey, string? kid = null)
    {
        var payload = SigningPayload(record.Spec, record.Id, record.Entry, record.Prev, record.Hash);
        var data = Encoding.UTF8.GetBytes(payload);

        var signature = new byte[64];
        Ed25519.Sign(data, privateKey, signature);

        return record with
        {
            Signature = new OpenLogsSignature(
                Alg: "Ed25519",
                PublicKeyHex: Convert.ToHexString(publicKey).ToLowerInvariant(),
                ValueHex: Convert.ToHexString(signature).ToLowerInvariant(),
                Kid: kid
            )
        };
    }

    public static bool VerifyRecordSignature(OpenLogsRecord record, byte[] publicKey)
    {
        if (record.Signature is null)
        {
            return false;
        }

        var payload = SigningPayload(record.Spec, record.Id, record.Entry, record.Prev, record.Hash);
        var data = Encoding.UTF8.GetBytes(payload);
        var sig = Convert.FromHexString(record.Signature.ValueHex);
        return Ed25519.Verify(sig, data, publicKey);
    }

    private static string SigningPayload(string spec, string id, OpenLogsEntry entry, string? prev, string? hash)
    {
        var dataSorted = entry.Data is null
            ? new SortedDictionary<string, object?>()
            : new SortedDictionary<string, object?>(entry.Data);

        var indexesSorted = entry.Indexes is null
            ? new SortedDictionary<string, string>()
            : new SortedDictionary<string, string>(entry.Indexes);

        var payload = new Dictionary<string, object?>
        {
            ["spec"] = spec,
            ["id"] = id,
            ["prev"] = prev,
            ["entry"] = new Dictionary<string, object?>
            {
                ["actor"] = entry.Actor,
                ["tps"] = entry.Tps,
                ["event"] = entry.Event,
                ["data"] = dataSorted,
                ["indexes"] = indexesSorted,
            },
        };

        if (hash is not null)
        {
            payload["hash"] = hash;
        }

        return JsonSerializer.Serialize(payload, JsonOptions);
    }
}
