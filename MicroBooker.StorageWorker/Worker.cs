using System.Text.Json;
using Confluent.Kafka;
using MongoDB.Driver;
using MicroBooker.Domain;
using StackExchange.Redis;

namespace MicroBooker.StorageWorker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IMongoCollection<Reservation>? _mongoCollection;
    private readonly IDatabase? _redisDb;
    private readonly string _bootstrapServers;

    public Worker(ILogger<Worker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _bootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092";

        try
        {
            var mongoConnectionString = configuration["ConnectionStrings:Mongo"];
            if (!string.IsNullOrEmpty(mongoConnectionString))
            {
                var mongoClient = new MongoClient(mongoConnectionString);
                var database = mongoClient.GetDatabase("BookerDb");
                _mongoCollection = database.GetCollection<Reservation>("reservations");
                _logger.LogInformation("MongoDB connected successfully");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to MongoDB");
        }

        try
        {
            var redisConnectionString = configuration["ConnectionStrings:Redis"];
            if (!string.IsNullOrEmpty(redisConnectionString))
            {
                var redis = ConnectionMultiplexer.Connect(redisConnectionString);
                _redisDb = redis.GetDatabase();
                _logger.LogInformation("Redis connected successfully");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Redis");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Storage Worker started - consuming from Kafka...");

        var config = new ConsumerConfig
        {
            BootstrapServers = _bootstrapServers,
            GroupId = "storage-worker-group",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
        consumer.Subscribe("reservations");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(TimeSpan.FromSeconds(5));
                if (result == null) continue;

                _logger.LogInformation("Consumed message from Kafka: {Message}", result.Message.Value);

                var reservation = JsonSerializer.Deserialize<Reservation>(result.Message.Value);
                if (reservation == null) continue;

                if (_mongoCollection != null)
                {
                    await _mongoCollection.ReplaceOneAsync(
                        Builders<Reservation>.Filter.Eq(r => r.Id, reservation.Id),
                        reservation,
                        new ReplaceOptions { IsUpsert = true },
                        stoppingToken
                    );
                    _logger.LogInformation("Saved reservation {Id} to MongoDB", reservation.Id);
                }

                if (_redisDb != null)
                {
                    var json = JsonSerializer.Serialize(reservation);
                    await _redisDb.StringSetAsync(
                        $"reservation:{reservation.Id}",
                        json,
                        TimeSpan.FromHours(24)
                    );
                    _logger.LogInformation("Cached reservation {Id} in Redis", reservation.Id);
                }

                consumer.Commit(result);
            }
            catch (ConsumeException ex)
            {
                _logger.LogError(ex, "Kafka consume error");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message");
                await Task.Delay(5000, stoppingToken);
            }
        }

        consumer.Close();
        _logger.LogInformation("Storage Worker stopped");
    }   
}