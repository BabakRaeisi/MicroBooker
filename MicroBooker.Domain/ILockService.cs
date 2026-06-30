namespace MicroBooker.Domain;

public interface ILockService
{
    /// <summary>
    /// Attempts to acquire an exclusive lock on a specific restaurant table for a designated time slot.
    /// </summary>
    /// <returns>True if the lock was successfully acquired; false if it is already locked by someone else.</returns>
    Task<bool> AcquireLockAsync(string tableId, string timeSlot, TimeSpan duration);
}