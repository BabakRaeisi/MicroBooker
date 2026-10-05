using MicroBooker.Domain;
using MongoDB.Driver;

namespace MicroBooker.Infrastructure;

public sealed class MongoRestaurantTableRepository : IRestaurantTableRepository
{
    private readonly IMongoCollection<RestaurantTable> _tables;

    public MongoRestaurantTableRepository(IMongoDatabase database)
    {
        _tables = database.GetCollection<RestaurantTable>("restaurantTables");
    }

    public async Task CreateAsync(
        RestaurantTable table,
        CancellationToken cancellationToken = default)
    {
        await _tables.InsertOneAsync(
            table,
            cancellationToken: cancellationToken);
    }
public async Task<RestaurantTable?> GetByIdAsync(
    Guid tableId,
    CancellationToken cancellationToken = default)
{
    return await _tables
        .Find(t => t.Id == tableId)
        .FirstOrDefaultAsync(cancellationToken);
}
    public async Task<IReadOnlyList<RestaurantTable>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default)
    {
        return await _tables
            .Find(t => t.RestaurantId == restaurantId)
            .ToListAsync(cancellationToken);
    }
}