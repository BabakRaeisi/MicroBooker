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

    public async Task<bool> TryCreateAsync(
        RestaurantTable table,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _tables.InsertOneAsync(
                table,
                cancellationToken: cancellationToken);

            return true;
        }
        catch (MongoWriteException exception)
            when (exception.WriteError?.Category ==
                  ServerErrorCategory.DuplicateKey)
        {
            return false;
        }
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
            .SortBy(t => t.TableNumber)
            .ToListAsync(cancellationToken);
    }
}
