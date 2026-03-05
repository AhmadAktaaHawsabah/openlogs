using OpenLogs.Sdk;

namespace OpenLogs.Sdk.Tests;

public class OpenLogsChainServiceTests
{
    [Fact]
    public void LinksChainAndVerifies()
    {
        var svc = new OpenLogsChainService();

        var r1 = svc.Log(new OpenLogsEntry("system:test", "tps://node:test@T:unix.1700000000", "event.a"));
        var r2 = svc.Log(new OpenLogsEntry("system:test", "tps://node:test@T:unix.1700000010", "event.b"));

        Assert.Null(r1.Prev);
        Assert.Equal(r1.Hash, r2.Prev);
        Assert.True(svc.VerifyChain());
    }

    [Fact]
    public void SignsAndVerifies()
    {
        var svc = new OpenLogsChainService();
        var (privateKey, publicKey) = OpenLogsSigner.GenerateEd25519Keypair();

        var rec = svc.LogSigned(
            new OpenLogsEntry("system:test", "tps://node:test@T:unix.1700000000", "event.a"),
            privateKey,
            publicKey,
            "k1"
        );

        Assert.NotNull(rec.Signature);
        Assert.Equal("Ed25519", rec.Signature!.Alg);
        Assert.True(svc.VerifySignatures(publicKey));
    }
}
