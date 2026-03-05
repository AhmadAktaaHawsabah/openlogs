using System.Collections.Generic;

namespace OpenLogs.Sdk;

public sealed record OpenLogsEntry(
    string Actor,
    string Tps,
    string Event,
    IDictionary<string, object?>? Data = null,
    IDictionary<string, string>? Indexes = null
);

public sealed record OpenLogsSignature(
    string Alg,
    string PublicKeyHex,
    string ValueHex,
    string? Kid = null
);

public sealed record OpenLogsRecord(
    string Spec,
    string Id,
    OpenLogsEntry Entry,
    string? Prev,
    string Hash,
    OpenLogsSignature? Signature = null
);
