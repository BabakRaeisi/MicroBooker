using System.Text.Json;
using Confluent.Kafka;
using MicroBooker.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MicroBooker.Infrastructure;

public class KafkaEventPublisher : IEventPublisher
{
    private readonly IProducer<Null, string> _producer;
    private readonly ILogger<KafkaEventPublisher> _logger;
    private const string Topic = "reservations";

    public KafkaEventPublisher(
        IConfiguration configuration,
        ILogger<KafkaEventPublisher> logger)
    {
        _logger = logger;

        var bootstrapServers =
            configuration.GetConnectionString("Kafka") ??
            configuration["Kafka:BootstrapServers"] ??
            "localhost:9092";

        var config = new ProducerConfig
        {
            BootstrapServers = bootstrapServers
        };

        _producer =
            new ProducerBuilder<Null, string>(config).Build();
    }

    public async Task PublishReservationCreatedAsync(
        Reservation reservation,
        CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(reservation);

        await _producer.ProduceAsync(
            Topic,
            new Message<Null, string>
            {
                Value = payload
            },
            ct);
    }
}
