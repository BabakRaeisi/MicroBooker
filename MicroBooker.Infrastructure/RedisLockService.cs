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
    public async Task<bool> AcquireLockAsync(string tableId, string timeSlot, TimeSpan duration)
    {
      string lockkey = $"lock:table:{tableId}:slot:{timeSlot}";

        // Atomically sets a lock key with value "locked" in Redis for the specified duration,
        // but only if the key does not already exist (prevents overwriting an active lock)
        return await _redisDb.StringSetAsync(lockkey, "locked", duration, When.NotExists) ; 
        
    }
}