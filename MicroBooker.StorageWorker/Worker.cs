using System.Text.Json;
using Confluent.Kafka;
using MongoDB.Driver;
using MicroBooker.Domain;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;

namespace MicroBooker.StorageWorker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IConsumer<Null, string> _consumer;
    private readonly IMongoCollection<Reservation> _mongoCollection;

    public Worker(ILogger<Worker> logger)
    {
        _logger = logger;

    // FIX: Tell MongoDB explicitly to handle GUIDs using the standard modern format
        #pragma warning disable CS0618 // Type or member is obsolete (Suppresses old legacy warning)
        BsonSerializer.RegisterSerializer(new GuidSerializer(MongoDB.Bson.GuidRepresentation.Standard));
        #pragma warning restore CS0618
        // 1. Configure the Kafka Consumer
        var kafkaConfig = new ConsumerConfig
        {
            BootstrapServers = "localhost:9092",
            GroupId = "storage-worker-group", // Identifies this service cluster to Kafka
            AutoOffsetReset = AutoOffsetReset.Earliest // Read from the beginning if new group
        };
        _consumer = new ConsumerBuilder<Null, string>(kafkaConfig).Build();

        // 2. Configure the MongoDB Client
        var mongoClient = new MongoClient("mongodb://localhost:27017");
        var database = mongoClient.GetDatabase("BookerDb");
        _mongoCollection = database.GetCollection<Reservation>("reservations"); // changed from "Reservations"
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Subscribe to the same "reservations" channel our API publishes to
        _consumer.Subscribe("reservations");
        _logger.LogInformation("Storage Worker successfully subscribed to Kafka 'reservations' topic.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Pull a message out of the Kafka queue (blocking call until a message arrives)
                var consumeResult = _consumer.Consume(stoppingToken);
                
                if (consumeResult != null)
                {
                    _logger.LogInformation("Event intercepted from Kafka: {Message}", consumeResult.Message.Value);

                    // Deserialize the JSON back into our Domain entity
                    var reservation = JsonSerializer.Deserialize<Reservation>(consumeResult.Message.Value);

                    if (reservation != null)
                    {
                        // Safely persist the record into MongoDB asynchronously
                        await _mongoCollection.InsertOneAsync(reservation, cancellationToken: stoppingToken);
                        _logger.LogInformation("Successfully persisted Reservation {Id} into MongoDB!", reservation.Id);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break; // Graceful shutdown when stoppingToken triggers
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while processing a reservation event.");
            }
        }
    }

    public override void Dispose()
    {
        _consumer.Close(); // Safely commit offsets and leave the consumer group
        _consumer.Dispose();
        base.Dispose();
    }
}