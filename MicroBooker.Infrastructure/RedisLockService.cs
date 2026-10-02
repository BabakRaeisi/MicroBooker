using MicroBooker.Domain ; 
using StackExchange.Redis;

namespace MicroBooker.Infrastructure;

public class RedisLockService : ILockService
{
    private readonly IDatabase _redisDb;

    public RedisLockService(IConnectionMultiplexer redis)
    {
        _redisDb = redis.GetDatabase();
    }
    

public async Task<bool> AcquireLockAsync(
    Guid tableId,
    string timeSlot,
    TimeSpan duration)
{
    var key = $"lock:{tableId}:{timeSlot}";

    return await _redisDb.StringSetAsync(
        key,
        "locked",
        duration,
        When.NotExists);
}
}