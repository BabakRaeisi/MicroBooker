using MicroBooker.Domain;
using MongoDB.Driver;

namespace MicroBooker.Infrastructure;

public sealed class MongoReservationRepository : IReservationRepository
{
    private readonly IMongoCollection<Reservation> _reservations;

    public MongoReservationRepository(IMongoDatabase database)
    {
        _reservations = database.GetCollection<Reservation>("reservations");
    }

    public async Task<IReadOnlyList<Reservation>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default)
    {
        return await _reservations
            .Find(r => r.RestaurantId == restaurantId)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> TryCreateAsync(
        Reservation reservation,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _reservations.InsertOneAsync(
                reservation,
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
}
