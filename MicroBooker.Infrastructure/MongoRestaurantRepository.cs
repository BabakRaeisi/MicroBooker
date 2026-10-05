using MicroBooker.Domain;
using MongoDB.Driver;

namespace MicroBooker.Infrastructure;

public sealed class MongoRestaurantRepository : IRestaurantRepository
{
    private readonly IMongoCollection<Restaurant> _restaurants;

    public MongoRestaurantRepository(IMongoDatabase database)
    {
        _restaurants = database.GetCollection<Restaurant>("restaurants");
    }

    public async Task<bool> TryCreateAsync(
        Restaurant restaurant,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _restaurants.InsertOneAsync(
                restaurant,
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

    public async Task<Restaurant?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _restaurants
            .Find(r => r.Id == id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Restaurant?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var normalizedSlug = slug.Trim().ToLowerInvariant();

        return await _restaurants
            .Find(r => r.Slug == normalizedSlug)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
