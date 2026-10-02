using MicroBooker.Domain ; 
using MongoDB.Driver ; 


namespace MicroBooker.Infrastructure;

public sealed class MongoRestaurantRepository : IRestaurantRepository
{
   private readonly IMongoCollection<Restaurant> _restaurants;

    public MongoRestaurantRepository(IMongoDatabase database)
    {
        _restaurants = database.GetCollection<Restaurant>("restaurants");
    }

    public async Task CreateAsync(Restaurant restaurant, CancellationToken ct = default)
    {
        await _restaurants.InsertOneAsync(restaurant ,cancellationToken: ct ) ; 
         
    }

    public async Task<Restaurant?> GetByIdAsync(Guid guid, CancellationToken ct = default)
    {
       return await _restaurants.Find(r=>r.Id == guid ).FirstOrDefaultAsync(ct) ; 
    }

    public async Task<Restaurant?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
       return await _restaurants.Find(r =>r.Slug == slug).FirstOrDefaultAsync(ct) ; 
    }
}