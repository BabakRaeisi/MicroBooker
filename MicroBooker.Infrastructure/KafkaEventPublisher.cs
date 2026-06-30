using System.Text.Json;
using Confluent.Kafka;
using MicroBooker.Domain;

namespace MicroBooker.Infrastructure;

public class KafkaEventPublisher : IEventPublisher
{
    private readonly IProducer<Null, string> _producer;
    private const string Topic = "reservations";

    public KafkaEventPublisher()
    {
        
        var config = new ProducerConfig { BootstrapServers = "localhost:9092" }; //shoud be moved to environment variables
        _producer = new ProducerBuilder<Null, string>(config).Build();
    }

    public async Task PublishReservationCreatedAsync(Reservation reservation, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(reservation);
        await _producer.ProduceAsync(Topic, new Message<Null, string> { Value = payload }, ct);
    }
}